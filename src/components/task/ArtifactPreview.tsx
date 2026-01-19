import { useEffect, useMemo, useRef, useState } from 'react';
import type { PreviewStatus } from '@/shared/hooks/useVitePreview';
import { cn } from '@/shared/lib/utils';
import { useLanguage } from '@/shared/providers/language-provider';
import { useTheme } from '@/shared/providers/theme-provider';
import { readFile } from '@tauri-apps/plugin-fs';
import {
  Check,
  Code,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Maximize2,
  Monitor,
  Presentation,
  Radio,
  RefreshCw,
  X,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { Artifact } from './RightSidebar';
import { VitePreview } from './VitePreview';

interface ArtifactPreviewProps {
  artifact: Artifact | null;
  onClose?: () => void;
  // All artifacts for resolving relative imports
  allArtifacts?: Artifact[];
  // Live preview props
  livePreviewUrl?: string | null;
  livePreviewStatus?: PreviewStatus;
  livePreviewError?: string | null;
  onStartLivePreview?: () => void;
  onStopLivePreview?: () => void;
}

type PreviewMode = 'static' | 'live';

type ViewMode = 'preview' | 'code';

// Get file extension from artifact name
function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

// Get language hint for syntax highlighting
function getLanguageHint(artifact: Artifact): string {
  const ext = getFileExtension(artifact.name);
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    htm: 'html',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    toml: 'toml',
  };
  return langMap[ext] || 'plaintext';
}

// Get app name for "Open with" button based on file type
function getOpenWithApp(
  artifact: Artifact
): { name: string; icon: typeof Monitor } | null {
  switch (artifact.type) {
    case 'html':
      return { name: 'Google Chrome', icon: Monitor };
    case 'presentation':
      return { name: 'Microsoft PowerPoint', icon: Presentation };
    case 'document':
      return { name: 'Microsoft Word', icon: FileText };
    case 'spreadsheet':
    case 'csv':
      return { name: 'Microsoft Excel', icon: FileSpreadsheet };
    case 'pdf':
      return { name: 'Preview', icon: FileText };
    default:
      return null;
  }
}

// Parse CSV content to 2D array
function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n');
  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\s*[-*+] (.*$)/gim, '<li>$1</li>');

  // Ordered lists
  html = html.replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}$/gim, '<hr />');

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr \/>)/g, '$1');

  return html;
}

// Check if a path is a URL (remote file)
function isRemoteUrl(path: string): boolean {
  return (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('//')
  );
}

// PDF Preview Component with async file loading
function PdfPreviewContent({ artifact }: { artifact: Artifact }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let blobUrl: string | null = null;

    async function loadPdf() {
      if (!artifact.path) {
        setError('No PDF file path available');
        setLoading(false);
        return;
      }

      console.log('[PDF Preview] Loading PDF from path:', artifact.path);

      try {
        let blob: Blob;

        if (isRemoteUrl(artifact.path)) {
          // Remote URL - fetch the PDF
          console.log('[PDF Preview] Fetching remote PDF...');
          const url = artifact.path.startsWith('//')
            ? `https:${artifact.path}`
            : artifact.path;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch PDF: ${response.status} ${response.statusText}`
            );
          }
          blob = await response.blob();
        } else {
          // Local file - use Tauri fs plugin
          console.log('[PDF Preview] Reading local PDF file...');
          const data = await readFile(artifact.path);
          blob = new Blob([data], { type: 'application/pdf' });
        }

        console.log('[PDF Preview] Loaded', blob.size, 'bytes');
        blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setError(null);
      } catch (err) {
        console.error('[PDF Preview] Failed to load PDF:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [artifact.path]);

  if (loading) {
    return (
      <div className="bg-muted/20 flex h-full flex-col items-center justify-center p-8">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">Loading PDF...</p>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="bg-muted/20 flex h-full flex-col items-center justify-center p-8">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="border-border bg-background mb-4 flex size-20 items-center justify-center rounded-xl border">
            <FileText className="size-10 text-red-500" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-medium">
            {artifact.name}
          </h3>
          <p className="text-muted-foreground text-sm break-all whitespace-pre-wrap">
            {error || 'No PDF file path available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/20 h-full">
      <iframe
        src={pdfUrl}
        className="h-full w-full border-0"
        title={artifact.name}
      />
    </div>
  );
}

// Inline CSS and JS into HTML content
function inlineAssets(html: string, allArtifacts: Artifact[]): string {
  let result = html;

  // Find and inline CSS files
  // Match <link rel="stylesheet" href="filename.css"> or <link href="filename.css" rel="stylesheet">
  const cssRegex = /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
  result = result.replace(cssRegex, (match, filename) => {
    // Only handle relative paths
    if (filename.startsWith('http') || filename.startsWith('//')) return match;

    // Find the CSS artifact
    const cssArtifact = allArtifacts.find(
      (a) => a.name === filename || a.name.endsWith(`/${filename}`)
    );

    if (cssArtifact?.content) {
      console.log('[ArtifactPreview] Inlining CSS:', filename);
      return `<style>/* Inlined from ${filename} */\n${cssArtifact.content}</style>`;
    }
    return match;
  });

  // Find and inline JS files
  // Match <script src="filename.js"></script>
  const jsRegex = /<script[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi;
  result = result.replace(jsRegex, (match, filename) => {
    // Only handle relative paths
    if (filename.startsWith('http') || filename.startsWith('//')) return match;

    // Find the JS artifact
    const jsArtifact = allArtifacts.find(
      (a) => a.name === filename || a.name.endsWith(`/${filename}`)
    );

    if (jsArtifact?.content) {
      console.log('[ArtifactPreview] Inlining JS:', filename);
      return `<script>/* Inlined from ${filename} */\n${jsArtifact.content}</script>`;
    }
    return match;
  });

  return result;
}

export function ArtifactPreview({
  artifact,
  onClose,
  allArtifacts = [],
  livePreviewUrl,
  livePreviewStatus = 'idle',
  livePreviewError,
  onStartLivePreview,
  onStopLivePreview,
}: ArtifactPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('static');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { t } = useLanguage();

  // Check if live preview is available for this artifact
  const canUseLivePreview = useMemo(() => {
    if (!artifact) return false;
    // Live preview is available for HTML artifacts when we have the handlers
    return artifact.type === 'html' && onStartLivePreview !== undefined;
  }, [artifact, onStartLivePreview]);

  // Auto-switch to live mode if live preview is already running
  useEffect(() => {
    if (livePreviewStatus === 'running' && canUseLivePreview) {
      setPreviewMode('live');
    }
  }, [livePreviewStatus, canUseLivePreview]);

  // Reset view mode and slide when artifact changes
  useEffect(() => {
    if (!artifact) {
      setViewMode('preview');
      setCurrentSlide(0);
      return;
    }

    // For code-only types, default to code view
    const codeOnlyTypes = ['code', 'jsx', 'css', 'json', 'text'];
    if (codeOnlyTypes.includes(artifact.type)) {
      setViewMode('code');
    } else {
      setViewMode('preview');
    }
    setCurrentSlide(0);
  }, [artifact?.id, artifact?.type]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!artifact?.content) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!artifact?.content) return;
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle open in external app
  const handleOpenExternal = () => {
    if (!artifact?.content) return;

    if (artifact.type === 'html') {
      const blob = new Blob([artifact.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
    // For other file types, trigger download since we can't directly open desktop apps from browser
    else {
      handleDownload();
    }
  };

  // Handle refresh iframe
  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Generate iframe content for HTML with inlined assets
  const iframeSrc = useMemo(() => {
    if (!artifact?.content || artifact.type !== 'html') return null;

    // Inline CSS and JS from other artifacts
    const enhancedHtml =
      allArtifacts.length > 0
        ? inlineAssets(artifact.content, allArtifacts)
        : artifact.content;

    const blob = new Blob([enhancedHtml], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [artifact?.content, artifact?.type, allArtifacts]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (iframeSrc) {
        URL.revokeObjectURL(iframeSrc);
      }
    };
  }, [iframeSrc]);

  // Parse CSV data
  const csvData = useMemo(() => {
    if (artifact?.type === 'csv' && artifact.content) {
      return parseCSV(artifact.content);
    }
    if (artifact?.data) {
      return artifact.data;
    }
    return null;
  }, [artifact?.type, artifact?.content, artifact?.data]);

  // Get slides for presentation
  const slides = useMemo(() => {
    if (artifact?.type === 'presentation' && artifact.slides) {
      return artifact.slides;
    }
    return null;
  }, [artifact?.type, artifact?.slides]);

  // Get open with app info
  const openWithApp = artifact ? getOpenWithApp(artifact) : null;

  // Check if preview is available
  const hasPreview = useMemo(() => {
    if (!artifact) return false;
    switch (artifact.type) {
      case 'html':
        return true;
      case 'image':
        return !!artifact.content;
      case 'markdown':
        return !!artifact.content;
      case 'csv':
        return !!csvData;
      case 'presentation':
        return !!slides;
      case 'pdf':
        return !!artifact.content || !!artifact.path;
      default:
        return false;
    }
  }, [artifact, csvData, slides]);

  // Check if code view is available (has text content)
  const hasCodeView = useMemo(() => {
    if (!artifact) return false;
    // Binary types don't have code view
    if (
      ['image', 'pdf', 'document', 'spreadsheet', 'presentation'].includes(
        artifact.type
      )
    ) {
      return false;
    }
    return !!artifact.content;
  }, [artifact]);

  // Empty state
  if (!artifact) {
    return (
      <div className="bg-background flex h-full flex-col">
        <div className="border-border/50 bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Eye className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm font-medium">
              {t.task.artifacts}
            </span>
          </div>
        </div>
        <div className="bg-muted/20 flex flex-1 flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="border-border bg-background mb-4 flex size-16 items-center justify-center rounded-xl border">
              <FileText className="text-muted-foreground/50 size-8" />
            </div>
            <h3 className="text-muted-foreground text-sm font-medium">
              {t.library.noFiles}
            </h3>
            <p className="text-muted-foreground/70 mt-1 text-xs">
              Select an artifact from the right panel to preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background flex h-full flex-col',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* Header - Title on left, actions on right */}
      <div className="border-border/50 bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
        {/* Left: File name and badge */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">
            {artifact.name}
          </span>
          <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase">
            {getFileExtension(artifact.name) || artifact.type}
          </span>
        </div>

        {/* Right: Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Open with external app - prominent button */}
          {openWithApp && (
            <button
              onClick={handleOpenExternal}
              className="bg-accent/50 text-foreground hover:bg-accent flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              title={`Open in ${openWithApp.name}`}
            >
              <openWithApp.icon className="size-4" />
              <span className="hidden sm:inline">
                Open in {openWithApp.name}
              </span>
            </button>
          )}

          {/* Refresh - for HTML */}
          {artifact.type === 'html' && (
            <button
              onClick={handleRefresh}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className="size-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="size-4" />
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors"
              title="Close"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* View mode toggle - show when preview or code view is available */}
      {(hasPreview || hasCodeView) && (
        <div className="bg-muted/20 border-border/30 flex shrink-0 items-center gap-2 border-b px-4 py-2">
          {/* Only show toggle if both preview and code are available */}
          {hasPreview && hasCodeView && (
            <div className="bg-muted flex items-center gap-1 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'preview'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="size-3.5" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'code'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Code className="size-3.5" />
                Code
              </button>
            </div>
          )}

          {/* Live/Static toggle for HTML artifacts */}
          {canUseLivePreview && viewMode === 'preview' && (
            <div className="bg-muted flex items-center gap-1 rounded-lg p-0.5">
              <button
                onClick={() => setPreviewMode('static')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  previewMode === 'static'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="size-3.5" />
                Static
              </button>
              <button
                onClick={() => {
                  setPreviewMode('live');
                  // Auto-start live preview if not already running
                  if (livePreviewStatus === 'idle' && onStartLivePreview) {
                    onStartLivePreview();
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  previewMode === 'live'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Radio
                  className={cn(
                    'size-3.5',
                    livePreviewStatus === 'running' && 'text-green-500'
                  )}
                />
                Live
                {livePreviewStatus === 'running' && (
                  <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
                )}
              </button>
            </div>
          )}

          {/* Show code indicator for code-only files */}
          {!hasPreview && hasCodeView && (
            <div className="bg-muted text-foreground flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
              <Code className="size-3.5" />
              Code
            </div>
          )}

          {/* Copy button for code view */}
          {hasCodeView && viewMode === 'code' && (
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:bg-accent hover:text-foreground ml-auto flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {/* Download button */}
          {artifact.content && (
            <button
              onClick={handleDownload}
              className={cn(
                'text-muted-foreground hover:bg-accent hover:text-foreground flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
                !(hasCodeView && viewMode === 'code') && 'ml-auto'
              )}
              title="Download"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          previewMode === 'live' && canUseLivePreview ? (
            <VitePreview
              previewUrl={livePreviewUrl || null}
              status={livePreviewStatus}
              error={livePreviewError || null}
              onStart={onStartLivePreview}
              onStop={onStopLivePreview}
            />
          ) : (
            <PreviewContent
              artifact={artifact}
              iframeSrc={iframeSrc}
              iframeRef={iframeRef}
              csvData={csvData}
              slides={slides}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />
          )
        ) : (
          <CodeContent artifact={artifact} />
        )}
      </div>
    </div>
  );
}

// Preview content component
function PreviewContent({
  artifact,
  iframeSrc,
  iframeRef,
  csvData,
  slides,
  currentSlide,
  onSlideChange,
}: {
  artifact: Artifact;
  iframeSrc: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  csvData: string[][] | null;
  slides: string[] | null;
  currentSlide: number;
  onSlideChange: (slide: number) => void;
}) {
  // HTML Preview
  if (artifact.type === 'html' && iframeSrc) {
    return (
      <div className="h-full bg-white">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title={artifact.name}
        />
      </div>
    );
  }

  // Image Preview
  if (artifact.type === 'image' && artifact.content) {
    return (
      <div className="bg-muted/20 flex h-full items-center justify-center p-4">
        <img
          src={artifact.content}
          alt={artifact.name}
          className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
        />
      </div>
    );
  }

  // Markdown Preview
  if (artifact.type === 'markdown' && artifact.content) {
    const htmlContent = markdownToHtml(artifact.content);
    return (
      <div className="bg-background h-full overflow-auto">
        <div
          className="prose prose-sm dark:prose-invert max-w-none p-6"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    );
  }

  // CSV/Spreadsheet Preview
  if ((artifact.type === 'csv' || artifact.type === 'spreadsheet') && csvData) {
    return (
      <div className="bg-background h-full overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted sticky top-0">
            {csvData.length > 0 && (
              <tr>
                {csvData[0].map((cell, i) => (
                  <th
                    key={i}
                    className="border-border text-foreground border px-3 py-2 text-left font-medium"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {csvData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-border text-foreground border px-3 py-2"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Presentation Preview (slides)
  if (artifact.type === 'presentation' && slides) {
    return (
      <div className="bg-muted/30 flex h-full flex-col overflow-hidden">
        {/* Main slide display */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
          <div className="relative aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
            {slides[currentSlide]?.startsWith('<') ? (
              // HTML slide content
              <iframe
                srcDoc={slides[currentSlide]}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title={`Slide ${currentSlide + 1}`}
              />
            ) : slides[currentSlide]?.startsWith('data:') ||
              slides[currentSlide]?.startsWith('http') ? (
              // Image slide
              <img
                src={slides[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="h-full w-full object-contain"
              />
            ) : (
              // Text slide content
              <div className="flex h-full w-full items-center justify-center p-8">
                <div className="text-center whitespace-pre-wrap text-gray-800">
                  {slides[currentSlide]}
                </div>
              </div>
            )}
            {/* Page indicator */}
            <div className="absolute right-4 bottom-4 rounded-md bg-black/60 px-3 py-1.5 text-xs text-white">
              Page {currentSlide + 1} / {slides.length}
            </div>
          </div>
        </div>

        {/* Slide thumbnails */}
        <div className="border-border bg-background shrink-0 border-t">
          <div className="flex gap-2 overflow-x-auto p-3">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => onSlideChange(index)}
                className={cn(
                  'aspect-[16/9] w-24 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all',
                  index === currentSlide
                    ? 'border-primary shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {slide.startsWith('<') ? (
                  <iframe
                    srcDoc={slide}
                    className="pointer-events-none h-full w-full origin-top-left scale-[0.2] border-0"
                    style={{ width: '500%', height: '500%' }}
                    title={`Thumbnail ${index + 1}`}
                  />
                ) : slide.startsWith('data:') || slide.startsWith('http') ? (
                  <img
                    src={slide}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 p-1 text-[8px] text-gray-500">
                    {slide.slice(0, 50)}...
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PDF Preview - use separate component for async loading
  if (artifact.type === 'pdf') {
    return <PdfPreviewContent artifact={artifact} />;
  }

  // Document Preview (docx) - show placeholder with info
  if (artifact.type === 'document') {
    return (
      <div className="bg-muted/20 flex h-full flex-col items-center justify-center p-8">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="border-border bg-background mb-4 flex size-20 items-center justify-center rounded-xl border">
            <FileText className="size-10 text-blue-500" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-medium">
            {artifact.name}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Document files can be opened with Microsoft Word or other compatible
            applications.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!artifact.content) return;
                const blob = new Blob([artifact.content], {
                  type: 'application/octet-stream',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = artifact.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Download className="size-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: show prompt to switch to code view
  return (
    <div className="bg-muted/20 flex h-full flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center text-center">
        <div className="border-border bg-background mb-4 flex size-16 items-center justify-center rounded-xl border">
          <Code className="text-muted-foreground/50 size-8" />
        </div>
        <h3 className="text-muted-foreground text-sm font-medium">
          Preview not available
        </h3>
        <p className="text-muted-foreground/70 mt-1 text-xs">
          Switch to Code view to see the content
        </p>
      </div>
    </div>
  );
}

// Code content component with syntax highlighting
function CodeContent({ artifact }: { artifact: Artifact }) {
  const { theme } = useTheme();

  if (!artifact.content) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">No content available</p>
      </div>
    );
  }

  const language = getLanguageHint(artifact);
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="h-full overflow-auto">
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        showLineNumbers
        wrapLines
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '13px',
          lineHeight: '1.5',
          background: 'transparent',
          minHeight: '100%',
        }}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          color: isDark ? '#636d83' : '#9ca3af',
          userSelect: 'none',
        }}
      >
        {artifact.content}
      </SyntaxHighlighter>
    </div>
  );
}
