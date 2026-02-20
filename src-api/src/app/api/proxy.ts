/**
 * Anthropic-to-OpenAI Format Proxy
 *
 * Translates between Anthropic Messages API format and OpenAI Chat Completions API format.
 * This allows the Claude Code SDK (which only speaks Anthropic format) to work with
 * models that only support OpenAI format through relay services.
 */

import { Hono } from 'hono';

const proxyRoutes = new Hono();

let defaultProxyTarget: { targetBaseUrl: string; apiKey: string } | null = null;

export function setProxyTarget(
  model: string,
  config: { targetBaseUrl: string; apiKey: string }
) {
  defaultProxyTarget = config;
}

// ============================================================================
// Request Translation: Anthropic → OpenAI
// ============================================================================

interface AnthropicContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | AnthropicContentBlock[];
  source?: Record<string, unknown>;
}

interface AnthropicMessage {
  role: string;
  content: string | AnthropicContentBlock[];
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string | Array<{ type: string; text: string; cache_control?: unknown }>;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
    cache_control?: unknown;
  }>;
  tool_choice?: unknown;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
}

function translateRequestToOpenAI(req: AnthropicRequest): Record<string, unknown> {
  const messages: Array<Record<string, unknown>> = [];

  if (req.system) {
    const systemText =
      typeof req.system === 'string'
        ? req.system
        : req.system.map((b) => b.text).join('\n');
    messages.push({ role: 'system', content: systemText });
  }

  for (const msg of req.messages) {
    if (typeof msg.content === 'string') {
      messages.push({ role: msg.role, content: msg.content });
      continue;
    }

    const textParts: string[] = [];
    const toolCalls: Array<Record<string, unknown>> = [];
    const toolResults: Array<{ tool_call_id: string; content: string }> = [];

    for (const block of msg.content) {
      if (block.type === 'text') {
        textParts.push(block.text || '');
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id || `call_${Date.now()}`,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input || {}),
          },
        });
      } else if (block.type === 'tool_result') {
        let resultContent = '';
        if (typeof block.content === 'string') {
          resultContent = block.content;
        } else if (Array.isArray(block.content)) {
          resultContent = block.content
            .filter((b) => b.type === 'text')
            .map((b) => b.text || '')
            .join('\n');
        }
        toolResults.push({
          tool_call_id: block.tool_use_id || '',
          content: resultContent,
        });
      }
    }

    if (toolResults.length > 0) {
      for (const result of toolResults) {
        messages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: result.content,
        });
      }
    } else if (toolCalls.length > 0) {
      const assistantMsg: Record<string, unknown> = {
        role: 'assistant',
        tool_calls: toolCalls,
      };
      assistantMsg.content = textParts.length > 0 ? textParts.join('\n') : null;
      messages.push(assistantMsg);
    } else {
      messages.push({
        role: msg.role,
        content: textParts.join('\n') || '',
      });
    }
  }

  const openaiReq: Record<string, unknown> = {
    model: req.model,
    messages,
    max_tokens: req.max_tokens,
    stream: req.stream ?? false,
  };

  if (req.temperature !== undefined) openaiReq.temperature = req.temperature;
  if (req.top_p !== undefined) openaiReq.top_p = req.top_p;
  if (req.stop_sequences) openaiReq.stop = req.stop_sequences;

  if (req.tools && req.tools.length > 0) {
    openaiReq.tools = req.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  return openaiReq;
}

// ============================================================================
// Response Translation: OpenAI → Anthropic
// ============================================================================

function translateResponseToAnthropic(
  openaiResp: Record<string, unknown>,
  model: string
): Record<string, unknown> {
  const choices = openaiResp.choices as Array<Record<string, unknown>>;
  const choice = choices?.[0];
  const message = choice?.message as Record<string, unknown>;

  const content: Array<Record<string, unknown>> = [];

  if (message?.content) {
    content.push({ type: 'text', text: String(message.content) });
  }

  const toolCalls = message?.tool_calls as Array<Record<string, unknown>>;
  if (toolCalls) {
    for (const tc of toolCalls) {
      const fn = tc.function as Record<string, unknown>;
      let input = {};
      if (fn?.arguments) {
        try {
          input = JSON.parse(String(fn.arguments));
        } catch {
          input = { raw: String(fn.arguments) };
        }
      }
      content.push({
        type: 'tool_use',
        id: tc.id || `toolu_${Date.now()}`,
        name: fn?.name,
        input,
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: 'text', text: '' });
  }

  const finishReason = String(choice?.finish_reason || 'stop');
  let stopReason = 'end_turn';
  if (finishReason === 'tool_calls' || finishReason === 'function_call') {
    stopReason = 'tool_use';
  } else if (finishReason === 'length') {
    stopReason = 'max_tokens';
  }

  const usage = openaiResp.usage as Record<string, number> | undefined;

  return {
    id: openaiResp.id || `msg_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: usage?.prompt_tokens || 0,
      output_tokens: usage?.completion_tokens || 0,
    },
  };
}

// ============================================================================
// Streaming SSE Builders
// ============================================================================

function sseEvent(eventType: string, data: Record<string, unknown>): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ============================================================================
// Proxy Route Handler
// ============================================================================

proxyRoutes.post('/v1/messages', async (c) => {
  const body = (await c.req.json()) as AnthropicRequest;
  const model = body.model;

  const target = defaultProxyTarget;
  if (!target) {
    return c.json(
      {
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'Proxy target not configured',
        },
      },
      400
    );
  }

  const openaiReq = translateRequestToOpenAI(body);
  const targetUrl = `${target.targetBaseUrl}/v1/chat/completions`;

  // Non-streaming
  if (!body.stream) {
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${target.apiKey}`,
      },
      body: JSON.stringify(openaiReq),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return c.json(
        {
          type: 'error',
          error: { type: 'api_error', message: `Upstream error (${resp.status}): ${errorText}` },
        },
        resp.status as 400
      );
    }

    const openaiResp = (await resp.json()) as Record<string, unknown>;
    return c.json(translateResponseToAnthropic(openaiResp, model));
  }

  // Streaming
  openaiReq.stream = true;

  const resp = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${target.apiKey}`,
    },
    body: JSON.stringify(openaiReq),
  });

  if (!resp.ok || !resp.body) {
    const errorText = await resp.text();
    return c.json(
      {
        type: 'error',
        error: { type: 'api_error', message: `Upstream error (${resp.status}): ${errorText}` },
      },
      resp.status as 400
    );
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let started = false;
      let contentBlockIndex = 0;
      let hasTextBlock = false;
      let hasToolBlocks = false;
      const activeToolCalls = new Map<
        number,
        { index: number; id: string; name: string }
      >();
      let msgId = `msg_${Date.now()}`;
      let totalOutputTokens = 0;

      const write = (s: string) => controller.enqueue(encoder.encode(s));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              // Close open content blocks
              if (hasTextBlock) {
                write(sseEvent('content_block_stop', { type: 'content_block_stop', index: 0 }));
              }
              for (const tc of activeToolCalls.values()) {
                write(sseEvent('content_block_stop', { type: 'content_block_stop', index: tc.index }));
              }
              const stopReason = hasToolBlocks ? 'tool_use' : 'end_turn';
              write(sseEvent('message_delta', {
                type: 'message_delta',
                delta: { stop_reason: stopReason, stop_sequence: null },
                usage: { output_tokens: totalOutputTokens },
              }));
              write(sseEvent('message_stop', { type: 'message_stop' }));
              continue;
            }

            let chunk: Record<string, unknown>;
            try {
              chunk = JSON.parse(data);
            } catch {
              continue;
            }

            if (!started) {
              msgId = String(chunk.id || msgId);
              write(sseEvent('message_start', {
                type: 'message_start',
                message: {
                  id: msgId, type: 'message', role: 'assistant', content: [],
                  model, stop_reason: null, stop_sequence: null,
                  usage: { input_tokens: 0, output_tokens: 0 },
                },
              }));
              started = true;
            }

            const choices = chunk.choices as Array<Record<string, unknown>>;
            if (!choices || choices.length === 0) {
              const usage = chunk.usage as Record<string, number> | undefined;
              if (usage?.completion_tokens) totalOutputTokens = usage.completion_tokens;
              continue;
            }

            const delta = choices[0].delta as Record<string, unknown>;
            if (!delta) continue;

            // Text content delta
            if (delta.content) {
              if (!hasTextBlock) {
                write(sseEvent('content_block_start', {
                  type: 'content_block_start', index: contentBlockIndex,
                  content_block: { type: 'text', text: '' },
                }));
                hasTextBlock = true;
              }
              write(sseEvent('content_block_delta', {
                type: 'content_block_delta', index: 0,
                delta: { type: 'text_delta', text: String(delta.content) },
              }));
            }

            // Tool calls delta
            const toolCalls = delta.tool_calls as Array<Record<string, unknown>>;
            if (toolCalls) {
              for (const tc of toolCalls) {
                const tcIdx = (tc.index as number) ?? 0;
                const fn = tc.function as Record<string, unknown>;

                if (!activeToolCalls.has(tcIdx)) {
                  if (hasTextBlock && !hasToolBlocks) {
                    write(sseEvent('content_block_stop', { type: 'content_block_stop', index: 0 }));
                    contentBlockIndex++;
                  }
                  hasToolBlocks = true;

                  const toolCallId = String(tc.id || `toolu_${Date.now()}_${tcIdx}`);
                  const toolName = String(fn?.name || '');
                  activeToolCalls.set(tcIdx, { index: contentBlockIndex, id: toolCallId, name: toolName });

                  write(sseEvent('content_block_start', {
                    type: 'content_block_start', index: contentBlockIndex,
                    content_block: { type: 'tool_use', id: toolCallId, name: toolName, input: {} },
                  }));
                  contentBlockIndex++;
                }

                const tcState = activeToolCalls.get(tcIdx)!;
                if (fn?.arguments) {
                  write(sseEvent('content_block_delta', {
                    type: 'content_block_delta', index: tcState.index,
                    delta: { type: 'input_json_delta', partial_json: String(fn.arguments) },
                  }));
                }
              }
            }

            if (choices[0].finish_reason) {
              const usage = chunk.usage as Record<string, number> | undefined;
              if (usage?.completion_tokens) totalOutputTokens = usage.completion_tokens;
            }
          }
        }

        // If stream ended without [DONE], close gracefully
        if (!started) {
          write(sseEvent('message_start', {
            type: 'message_start',
            message: {
              id: msgId, type: 'message', role: 'assistant', content: [],
              model, stop_reason: null, stop_sequence: null,
              usage: { input_tokens: 0, output_tokens: 0 },
            },
          }));
          write(sseEvent('content_block_start', {
            type: 'content_block_start', index: 0,
            content_block: { type: 'text', text: '' },
          }));
          write(sseEvent('content_block_stop', { type: 'content_block_stop', index: 0 }));
          write(sseEvent('message_delta', {
            type: 'message_delta',
            delta: { stop_reason: 'end_turn', stop_sequence: null },
            usage: { output_tokens: 0 },
          }));
          write(sseEvent('message_stop', { type: 'message_stop' }));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        write(sseEvent('error', {
          type: 'error',
          error: { type: 'api_error', message: errorMsg },
        }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});

export { proxyRoutes };
