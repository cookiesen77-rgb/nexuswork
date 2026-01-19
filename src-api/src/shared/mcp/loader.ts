/**
 * MCP Config Loader
 *
 * Loads MCP server configuration from ~/.workany/mcp.json
 * and converts it to SDK-compatible format.
 */

import fs from 'fs/promises';
import { homedir } from 'os';
import path from 'path';

// MCP Server Config Types (matching SDK types)
export interface McpStdioServerConfig {
  type?: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpHttpServerConfig {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig;

// WorkAny MCP Config file format
interface WorkAnyMcpConfig {
  mcpServers: Record<
    string,
    {
      // Stdio config
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      // HTTP config
      url?: string;
      headers?: Record<string, string>;
    }
  >;
}

/**
 * Get the path to the MCP config file
 */
export function getMcpConfigPath(): string {
  return path.join(homedir(), '.workany', 'mcp.json');
}

/**
 * Load MCP servers configuration from ~/.workany/mcp.json
 *
 * @returns Record of server name to config, or empty object if file doesn't exist
 */
export async function loadMcpServers(): Promise<
  Record<string, McpServerConfig>
> {
  const configPath = getMcpConfigPath();

  try {
    // Check if file exists
    await fs.access(configPath);

    // Read and parse config
    const content = await fs.readFile(configPath, 'utf-8');
    const config: WorkAnyMcpConfig = JSON.parse(content);

    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      console.log('[MCP] No mcpServers found in config');
      return {};
    }

    // Convert to SDK-compatible format
    const servers: Record<string, McpServerConfig> = {};

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      if (serverConfig.url) {
        // HTTP server
        servers[name] = {
          type: 'http',
          url: serverConfig.url,
          headers: serverConfig.headers,
        };
        console.log(`[MCP] Loaded HTTP server: ${name}`);
      } else if (serverConfig.command) {
        // Stdio server
        servers[name] = {
          type: 'stdio',
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
        };
        console.log(`[MCP] Loaded stdio server: ${name}`);
      } else {
        console.warn(`[MCP] Invalid server config for "${name}": missing command or url`);
      }
    }

    const serverCount = Object.keys(servers).length;
    if (serverCount > 0) {
      console.log(`[MCP] Loaded ${serverCount} MCP server(s) from ${configPath}`);
    }

    return servers;
  } catch (error) {
    // File doesn't exist or is invalid - this is expected in fresh installs
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[MCP] No mcp.json found, skipping MCP servers');
    } else {
      console.warn('[MCP] Failed to load MCP config:', error);
    }
    return {};
  }
}
