import { useCallback, useRef, useState } from 'react';
import { useAgent } from '@/shared/hooks/useAgent';
import { cn } from '@/shared/lib/utils';
import {
  ArrowUp,
  FileText,
  Globe,
  Palette,
  Paperclip,
  Plus,
  Smartphone,
  Square,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AgentMessages } from './AgentMessages';

// Attachment type for files and images
export interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'file';
  preview?: string; // Data URL for image preview
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  prompt?: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <FileText className="size-4" />,
    label: 'Create slides',
    prompt: '帮我创建一个演示文稿',
  },
  {
    icon: <Globe className="size-4" />,
    label: 'Build website',
    prompt: '帮我构建一个网站',
  },
  {
    icon: <Smartphone className="size-4" />,
    label: 'Develop apps',
    prompt: '帮我开发一个应用',
  },
  {
    icon: <Palette className="size-4" />,
    label: 'Design',
    prompt: '帮我设计一个界面',
  },
  { icon: null, label: 'More' },
];

export function TaskInput() {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { messages, isRunning, runAgent, stopAgent } = useAgent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate unique ID for attachments
  const generateId = () => `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Check if file is an image
  const isImageFile = (file: File) => file.type.startsWith('image/');

  // Create preview for image files
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Add files to attachments
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newAttachments: Attachment[] = [];

    for (const file of fileArray) {
      const isImage = isImageFile(file);
      const attachment: Attachment = {
        id: generateId(),
        file,
        type: isImage ? 'image' : 'file',
      };

      if (isImage) {
        attachment.preview = await createImagePreview(file);
      }

      newAttachments.push(attachment);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  // Handle paste event for image upload
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault(); // Prevent default paste behavior for images
        await addFiles(imageFiles);
      }
    },
    [addFiles]
  );

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if ((value.trim() || attachments.length > 0) && !isRunning) {
      const prompt = value.trim();
      // TODO: Include attachments in the agent request when backend supports it
      // For now, we'll clear them after submit
      setValue('');
      setAttachments([]);
      await runAgent(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (action.prompt && !isRunning) {
      await runAgent(action.prompt);
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      {/* Title */}
      <h1 className="text-foreground font-serif text-4xl font-medium">
        What can I do for you?
      </h1>

      {/* Input Box */}
      <div className="border-border/50 w-full rounded-2xl border bg-white p-4 shadow-lg">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.xls,.pptx,.ppt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group relative flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="max-w-[120px] truncate text-sm text-foreground">
                  {attachment.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Assign a task or ask anything"
          className="text-foreground placeholder:text-muted-foreground min-h-[24px] w-full resize-none border-0 bg-transparent text-base focus:outline-none"
          rows={1}
          disabled={isRunning}
        />

        {/* Bottom Actions */}
        <div className="mt-3 flex items-center justify-between">
          {/* Add Button with Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              disabled={isRunning}
              className="border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
            >
              <Plus className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className="z-50 w-56">
              <DropdownMenuItem
                onSelect={openFilePicker}
                className="cursor-pointer gap-3 py-2.5"
              >
                <Paperclip className="size-4" />
                <span>Add files or photos</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Submit/Stop Button */}
          {isRunning ? (
            <button
              type="button"
              onClick={stopAgent}
              className="flex size-9 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() && attachments.length === 0}
              className={cn(
                'flex size-9 items-center justify-center rounded-full transition-colors',
                value.trim() || attachments.length > 0
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <ArrowUp className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleQuickAction(action)}
            disabled={isRunning}
            className={cn(
              'border-border bg-background text-muted-foreground flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
              isRunning
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-accent hover:text-foreground'
            )}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Agent Messages */}
      <AgentMessages messages={messages} isRunning={isRunning} />
    </div>
  );
}
