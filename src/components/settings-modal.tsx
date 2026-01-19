import { useEffect, useRef, useState, type ComponentType } from 'react';
import ImageLogo from '@/assets/logo.png';
import type { Language } from '@/core/i18n/translations';
import {
  accentColors,
  getSettings,
  saveSettings,
  type AccentColor,
  type AIProvider,
  type Settings as SettingsType,
} from '@/shared/db/settings';
import {
  getAppDataDir,
  getDisplayPath,
  getMcpConfigPath,
  getSkillsDir,
} from '@/shared/lib/paths';
import { cn } from '@/shared/lib/utils';
import { useLanguage } from '@/shared/providers/language-provider';
import { useTheme } from '@/shared/providers/theme-provider';
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Cpu,
  ExternalLink,
  File,
  FileCode2,
  FileImage,
  FileText,
  FileType,
  FolderOpen,
  Info,
  Layers,
  Loader2,
  Plug,
  Plus,
  Settings,
  Trash2,
  User,
  X,
} from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// Settings category type
type SettingsCategory =
  | 'account'
  | 'general'
  | 'workplace'
  | 'provider'
  | 'mcp'
  | 'skills'
  | 'connector'
  | 'about';

// MCP icon component
const McpIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

// Category menu items - labels will be translated dynamically
const categoryIcons: Record<
  SettingsCategory,
  ComponentType<{ className?: string }>
> = {
  account: User,
  general: Settings,
  workplace: FolderOpen,
  provider: Cpu,
  mcp: McpIcon,
  skills: Layers,
  connector: Plug,
  about: Info,
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<SettingsType>(getSettings);
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>('account');
  const [defaultPaths, setDefaultPaths] = useState({
    workDir: '',
    mcpConfigPath: '',
    skillsPath: '',
  });
  const { t } = useLanguage();

  // Category list with translated labels
  const categories: SettingsCategory[] = [
    'account',
    'general',
    'workplace',
    'provider',
    'mcp',
    'skills',
    'connector',
    'about',
  ];

  const getCategoryLabel = (id: SettingsCategory): string => {
    return t.settings[id];
  };

  // Load default paths on mount
  useEffect(() => {
    async function loadDefaultPaths() {
      const [workDir, mcpConfigPath, skillsPath] = await Promise.all([
        getAppDataDir().then(getDisplayPath),
        getMcpConfigPath().then(getDisplayPath),
        getSkillsDir().then(getDisplayPath),
      ]);
      setDefaultPaths({ workDir, mcpConfigPath, skillsPath });
    }
    loadDefaultPaths();
  }, []);

  // Load settings on mount
  useEffect(() => {
    if (open) {
      setSettings(getSettings());
    }
  }, [open]);

  // Save settings when changed
  const handleSettingsChange = (newSettings: SettingsType) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[600px] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{t.settings.title}</DialogTitle>

        <div className="flex h-full min-h-0">
          {/* Left Navigation */}
          <div className="border-border bg-muted/30 flex w-56 flex-col border-r">
            {/* Logo Header */}
            <div className="border-border flex items-center gap-2.5 border-b px-4 py-4">
              <img src={ImageLogo} alt="WorkAny" className="size-7" />
              <span className="text-foreground text-base font-semibold">
                WorkAny
              </span>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {categories.map((id) => {
                const Icon = categoryIcons[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                      activeCategory === id
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1 text-left">
                      {getCategoryLabel(id)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Header */}
            <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-4">
              <h2 className="text-foreground text-lg font-semibold">
                {getCategoryLabel(activeCategory)}
              </h2>
            </div>

            {/* Content Area */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {activeCategory === 'account' && (
                <AccountSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              )}

              {activeCategory === 'general' && (
                <GeneralSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              )}

              {activeCategory === 'workplace' && (
                <WorkplaceSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  defaultPaths={defaultPaths}
                />
              )}

              {activeCategory === 'provider' && (
                <ModelSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              )}

              {activeCategory === 'mcp' && (
                <MCPSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              )}

              {activeCategory === 'skills' && (
                <SkillsSettings />
              )}

              {activeCategory === 'connector' && (
                <ConnectorSettings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  defaultPaths={defaultPaths}
                />
              )}

              {activeCategory === 'about' && <AboutSettings />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ Account Settings ============
function AccountSettings({
  settings,
  onSettingsChange,
}: {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSettingsChange({
          ...settings,
          profile: {
            ...settings.profile,
            avatar: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          {t.settings.manageProfile}
        </p>
      </div>

      {/* Avatar */}
      <div className="space-y-3">
        <label className="text-foreground text-sm font-medium">
          {t.settings.avatar}
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAvatarClick}
            className="bg-muted border-border hover:border-primary/50 group relative size-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-colors"
          >
            {settings.profile.avatar ? (
              <img
                src={settings.profile.avatar}
                alt="Avatar"
                className="size-full object-cover"
              />
            ) : (
              <User className="text-muted-foreground absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              {t.settings.clickToUpload}
            </p>
            <p className="text-muted-foreground/70 text-xs">
              {t.settings.avatarRecommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Nickname */}
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">
          {t.settings.nickname}
        </label>
        <input
          type="text"
          value={settings.profile.nickname}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              profile: {
                ...settings.profile,
                nickname: e.target.value,
              },
            })
          }
          placeholder={t.settings.enterNickname}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full max-w-sm rounded-lg border px-3 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ============ General Settings ============
function GeneralSettings({
  settings,
  onSettingsChange,
}: {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}) {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    onSettingsChange({ ...settings, theme: newTheme });
  };

  const handleAccentColorChange = (newColor: AccentColor) => {
    setAccentColor(newColor);
    onSettingsChange({ ...settings, accentColor: newColor });
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    onSettingsChange({ ...settings, language: newLang });
  };

  return (
    <div className="space-y-8">
      {/* Language */}
      <div className="space-y-3">
        <label className="text-foreground text-sm font-medium">
          {t.settings.language}
        </label>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="border-input bg-background text-foreground focus:ring-ring h-10 w-full max-w-xs cursor-pointer rounded-lg border px-3 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
        >
          <option value="en-US">English</option>
          <option value="zh-CN">简体中文</option>
        </select>
      </div>

      {/* Theme Color */}
      <div className="space-y-4">
        <label className="text-foreground text-sm font-medium">
          {t.settings.themeColor}
        </label>
        <div className="flex gap-3">
          {accentColors.map((colorOption) => (
            <button
              key={colorOption.id}
              onClick={() => handleAccentColorChange(colorOption.id)}
              className={cn(
                'group flex cursor-pointer flex-col items-center gap-2'
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full transition-all',
                  accentColor === colorOption.id
                    ? 'ring-offset-background ring-2 ring-offset-2'
                    : 'hover:scale-110'
                )}
                style={{
                  backgroundColor: colorOption.color,
                  // @ts-expect-error CSS custom property
                  '--tw-ring-color':
                    accentColor === colorOption.id
                      ? colorOption.color
                      : undefined,
                }}
              >
                {accentColor === colorOption.id && (
                  <svg
                    className="size-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span
                className={cn(
                  'text-xs',
                  accentColor === colorOption.id
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {colorOption.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <label className="text-foreground text-sm font-medium">
          {t.settings.appearance}
        </label>
        <div className="flex gap-3">
          {/* Light */}
          <button
            onClick={() => handleThemeChange('light')}
            className="group flex cursor-pointer flex-col items-center gap-2"
          >
            <div
              className={cn(
                'flex h-20 w-28 items-center justify-center rounded-lg border-2 bg-white transition-all',
                theme === 'light'
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex h-12 w-20 flex-col gap-1 rounded border border-gray-200 bg-gray-100 p-1.5">
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-sm bg-gray-300" />
                  <div className="h-3 flex-1 rounded-sm bg-gray-200" />
                </div>
                <div className="flex-1 rounded-sm border border-gray-200 bg-white" />
              </div>
            </div>
            <span
              className={cn(
                'text-sm',
                theme === 'light'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {t.settings.light}
            </span>
          </button>

          {/* Dark */}
          <button
            onClick={() => handleThemeChange('dark')}
            className="group flex cursor-pointer flex-col items-center gap-2"
          >
            <div
              className={cn(
                'flex h-20 w-28 items-center justify-center rounded-lg border-2 bg-gray-900 transition-all',
                theme === 'dark'
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'hover:border-primary/50 border-gray-700'
              )}
            >
              <div className="flex h-12 w-20 flex-col gap-1 rounded border border-gray-700 bg-gray-800 p-1.5">
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-sm bg-gray-600" />
                  <div className="h-3 flex-1 rounded-sm bg-gray-700" />
                </div>
                <div className="flex-1 rounded-sm border border-gray-700 bg-gray-900" />
              </div>
            </div>
            <span
              className={cn(
                'text-sm',
                theme === 'dark'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {t.settings.dark}
            </span>
          </button>

          {/* System */}
          <button
            onClick={() => handleThemeChange('system')}
            className="group flex cursor-pointer flex-col items-center gap-2"
          >
            <div
              className={cn(
                'flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border-2 transition-all',
                theme === 'system'
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex h-full w-full">
                {/* Left half - light */}
                <div className="flex h-full w-1/2 items-center justify-center bg-white">
                  <div className="flex h-12 w-10 flex-col gap-0.5 rounded-l border-y border-l border-gray-200 bg-gray-100 p-1">
                    <div className="h-2 w-2 rounded-sm bg-gray-300" />
                    <div className="flex-1 rounded-sm border border-gray-200 bg-white" />
                  </div>
                </div>
                {/* Right half - dark */}
                <div className="flex h-full w-1/2 items-center justify-center bg-gray-900">
                  <div className="flex h-12 w-10 flex-col gap-0.5 rounded-r border-y border-r border-gray-700 bg-gray-800 p-1">
                    <div className="h-2 w-2 rounded-sm bg-gray-600" />
                    <div className="flex-1 rounded-sm border border-gray-700 bg-gray-900" />
                  </div>
                </div>
              </div>
            </div>
            <span
              className={cn(
                'text-sm',
                theme === 'system'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {t.settings.system}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Workplace Settings ============
function WorkplaceSettings({
  settings,
  onSettingsChange,
  defaultPaths,
}: {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  defaultPaths: { workDir: string; mcpConfigPath: string; skillsPath: string };
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          {t.settings.workplaceDescription}
        </p>
      </div>

      {/* Working Directory */}
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">
          {t.settings.workingDirectory}
        </label>
        <p className="text-muted-foreground text-xs">
          {t.settings.workingDirectoryDescription}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative max-w-md flex-1">
            <FolderOpen className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={settings.workDir}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  workDir: e.target.value,
                })
              }
              placeholder={defaultPaths.workDir || 'Loading...'}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border pr-3 pl-10 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              const workDir = await getAppDataDir();
              onSettingsChange({
                ...settings,
                workDir,
              });
            }}
            className="text-muted-foreground hover:text-foreground border-border hover:bg-accent h-10 cursor-pointer rounded-lg border px-3 text-sm transition-colors"
          >
            {t.common.reset}
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          {t.settings.directoryStructure.replace('{path}', settings.workDir)}
        </p>
      </div>

      {/* Sandbox Settings */}
      <div className="border-border space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-foreground text-sm font-medium">
              {t.settings.sandbox || 'Sandbox Mode'}
            </label>
            <p className="text-muted-foreground mt-1 text-xs">
              {t.settings.sandboxDescription ||
                'Run scripts in isolated containers for better security and dependency management'}
            </p>
          </div>
          <Switch
            checked={settings.sandboxEnabled}
            onChange={(checked) =>
              onSettingsChange({
                ...settings,
                sandboxEnabled: checked,
              })
            }
          />
        </div>

        {settings.sandboxEnabled && (
          <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
            {t.settings.sandboxAutoDetect ||
              'Container runtime will be automatically selected based on script type (Node.js, Python, Bun, etc.)'}
          </div>
        )}
      </div>
    </div>
  );
}

// Provider icons mapping
const providerIcons: Record<string, string> = {
  openrouter: '<',
  siliconflow: 'S',
  replicate: 'R',
  fal: 'F',
  openai: 'O',
  anthropic: 'A',
};

// Provider API Key settings URLs
const providerApiKeyUrls: Record<string, string> = {
  openrouter: 'https://openrouter.ai/keys',
  siliconflow: 'https://cloud.siliconflow.cn/account/ak',
  replicate: 'https://replicate.com/account/api-tokens',
  fal: 'https://fal.ai/dashboard/keys',
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
};

// Default provider IDs that cannot be deleted
const defaultProviderIds = [
  'openrouter',
  'siliconflow',
  'replicate',
  'fal',
  'openai',
  'anthropic',
];

// ============ Model Settings (Provider View) ============
function ModelSettings({
  settings,
  onSettingsChange,
}: {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}) {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    settings.providers[0]?.id || null
  );
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    models: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const { t } = useLanguage();

  const selectedProvider = settings.providers.find(
    (p) => p.id === selectedProviderId
  );

  const handleProviderUpdate = (
    providerId: string,
    updates: Partial<AIProvider>
  ) => {
    const newProviders = settings.providers.map((p) =>
      p.id === providerId ? { ...p, ...updates } : p
    );
    onSettingsChange({ ...settings, providers: newProviders });
  };

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.baseUrl) return;

    const id = `custom-${Date.now()}`;
    const models = newProvider.models
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m);

    const provider: AIProvider = {
      id,
      name: newProvider.name,
      apiKey: newProvider.apiKey,
      baseUrl: newProvider.baseUrl,
      enabled: true,
      models: models.length > 0 ? models : ['default'],
    };

    onSettingsChange({
      ...settings,
      providers: [...settings.providers, provider],
    });

    setNewProvider({ name: '', baseUrl: '', apiKey: '', models: '' });
    setShowAddProvider(false);
    setSelectedProviderId(id);
  };

  const handleDeleteProvider = (providerId: string) => {
    const newProviders = settings.providers.filter((p) => p.id !== providerId);

    // If deleting the default provider, switch to another enabled one
    let newSettings = { ...settings, providers: newProviders };
    if (settings.defaultProvider === providerId) {
      const enabledProvider = newProviders.find((p) => p.enabled);
      if (enabledProvider) {
        newSettings.defaultProvider = enabledProvider.id;
        newSettings.defaultModel = enabledProvider.models[0] || '';
      }
    }

    onSettingsChange(newSettings);

    // Select another provider after deletion
    if (selectedProviderId === providerId && newProviders.length > 0) {
      setSelectedProviderId(newProviders[0].id);
    } else if (newProviders.length === 0) {
      setSelectedProviderId(null);
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100%+48px)]">
      {/* Left Panel - Provider List */}
      <div className="border-border flex w-52 flex-col border-r">
        {/* Provider List */}
        <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {settings.providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProviderId(provider.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                selectedProviderId === provider.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <span className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded text-xs font-medium">
                {providerIcons[provider.id] ||
                  provider.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-left">{provider.name}</span>
            </button>
          ))}
        </div>

        {/* Add/Remove Buttons */}
        <div className="border-border flex items-center gap-1 border-t p-2">
          <button
            onClick={() => setShowAddProvider(true)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded transition-colors"
            title={t.settings.addProvider}
          >
            <Plus className="size-4" />
          </button>
          {selectedProviderId &&
            !defaultProviderIds.includes(selectedProviderId) && (
              <button
                onClick={() => handleDeleteProvider(selectedProviderId)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded transition-colors"
                title={t.settings.deleteProvider}
              >
                <Trash2 className="size-4" />
              </button>
            )}
        </div>
      </div>

      {/* Right Panel - Provider Details */}
      <div className="flex-1 overflow-y-auto">
        {showAddProvider ? (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-foreground text-base font-medium">
                {t.settings.addProvider}
              </h3>
              <button
                onClick={() => setShowAddProvider(false)}
                className="hover:bg-muted rounded p-1"
              >
                <X className="text-muted-foreground size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.providerName}
                </label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, name: e.target.value })
                  }
                  placeholder="e.g. DeepSeek"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.apiKey}
                </label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, apiKey: e.target.value })
                  }
                  placeholder={t.settings.enterApiKey}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={newProvider.baseUrl}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, baseUrl: e.target.value })
                  }
                  placeholder="https://api.example.com/v1"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddProvider}
                disabled={!newProvider.name || !newProvider.baseUrl}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 h-10 w-full rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.settings.add}
              </button>
            </div>
          </div>
        ) : selectedProvider ? (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-foreground text-base font-medium">
                {selectedProvider.name}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'size-2 rounded-full',
                      selectedProvider.apiKey ? 'bg-emerald-500' : 'bg-gray-300'
                    )}
                  />
                  <span className="text-muted-foreground text-xs">
                    {selectedProvider.apiKey
                      ? t.settings.configured
                      : t.settings.notConfigured}
                  </span>
                </div>
                <Switch
                  checked={selectedProvider.enabled}
                  onChange={(checked) =>
                    handleProviderUpdate(selectedProvider.id, {
                      enabled: checked,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.apiKey}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={selectedProvider.apiKey}
                    onChange={(e) =>
                      handleProviderUpdate(selectedProvider.id, {
                        apiKey: e.target.value,
                      })
                    }
                    placeholder={t.settings.enterApiKey}
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border pr-10 pl-3 text-sm focus:ring-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showApiKey ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {providerApiKeyUrls[selectedProvider.id] && (
                  <a
                    href={providerApiKeyUrls[selectedProvider.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs"
                  >
                    {t.settings.getApiKey || 'Get API Key'}
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {/* API Base URL */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={selectedProvider.baseUrl}
                  onChange={(e) =>
                    handleProviderUpdate(selectedProvider.id, {
                      baseUrl: e.target.value,
                    })
                  }
                  placeholder={t.settings.apiBaseUrl}
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {t.settings.selectProvider}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MCP Server Config Types ============
interface MCPServerStdio {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPServerHttp {
  url: string;
  headers?: Record<string, string>;
}

type MCPServerConfig = MCPServerStdio | MCPServerHttp;

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

// Internal MCP server representation for UI
interface MCPServerUI {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  enabled: boolean;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  autoExecute?: boolean;
}

// API base URL
const API_PORT = import.meta.env.PROD ? 2620 : 2026;
const API_BASE_URL = `http://localhost:${API_PORT}`;

// ============ MCP Settings ============
function MCPSettings({}: {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}) {
  const [servers, setServers] = useState<MCPServerUI[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newServer, setNewServer] = useState<MCPServerUI>({
    id: '',
    name: '',
    type: 'stdio',
    enabled: true,
    command: '',
    args: [],
    url: '',
    headers: {},
    autoExecute: true,
  });
  const { t } = useLanguage();

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  // Load MCP config from API
  useEffect(() => {
    async function loadMCPConfig() {
      console.log('[MCP] Loading config from API...');
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/mcp/config`);
        const result = await response.json();

        console.log('[MCP] API response:', result);

        if (!result.success) {
          throw new Error(result.error || 'Failed to load config');
        }

        const config: MCPConfig = result.data;

        // Convert to UI format
        const serverList: MCPServerUI[] = Object.entries(
          config.mcpServers || {}
        ).map(([id, serverConfig]) => {
          const isHttp = 'url' in serverConfig;
          return {
            id,
            name: id,
            type: isHttp ? 'http' : 'stdio',
            enabled: true,
            command: isHttp
              ? undefined
              : (serverConfig as MCPServerStdio).command,
            args: isHttp ? undefined : (serverConfig as MCPServerStdio).args,
            url: isHttp ? (serverConfig as MCPServerHttp).url : undefined,
            headers: isHttp
              ? (serverConfig as MCPServerHttp).headers
              : undefined,
            autoExecute: true,
          };
        });

        console.log('[MCP] Server list:', serverList);
        setServers(serverList);
        if (serverList.length > 0 && !selectedServerId) {
          setSelectedServerId(serverList[0].id);
        }
      } catch (err) {
        console.error('[MCP] Failed to load MCP config:', err);
        setError(t.settings.mcpLoadError);
        setServers([]);
      } finally {
        setLoading(false);
      }
    }

    loadMCPConfig();
  }, []);

  // Save MCP config via API
  const saveMCPConfig = async (serverList: MCPServerUI[]) => {
    console.log('[MCP] Saving config via API...', serverList.length, 'servers');

    try {
      // Convert UI format to file format
      const mcpServers: Record<string, MCPServerConfig> = {};
      for (const server of serverList) {
        if (server.type === 'http') {
          mcpServers[server.id] = {
            url: server.url || '',
            headers: server.headers,
          };
        } else {
          mcpServers[server.id] = {
            command: server.command || '',
            args: server.args,
          };
        }
      }

      const config: MCPConfig = { mcpServers };
      console.log('[MCP] Config to save:', config);

      const response = await fetch(`${API_BASE_URL}/mcp/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      console.log('[MCP] Save response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save config');
      }

      console.log('[MCP] Config saved successfully');
    } catch (err) {
      console.error('[MCP] Failed to save MCP config:', err);
    }
  };

  const handleServerUpdate = (serverId: string, updates: Partial<MCPServerUI>) => {
    const newServers = servers.map((s) =>
      s.id === serverId ? { ...s, ...updates } : s
    );
    setServers(newServers);
    saveMCPConfig(newServers);
  };

  const handleAddServer = () => {
    if (!newServer.id) return;

    // Check for duplicate ID
    if (servers.some((s) => s.id === newServer.id)) {
      return;
    }

    const serverToAdd: MCPServerUI = {
      ...newServer,
      name: newServer.name || newServer.id,
    };

    const newServers = [...servers, serverToAdd];
    setServers(newServers);
    saveMCPConfig(newServers);

    setNewServer({
      id: '',
      name: '',
      type: 'stdio',
      enabled: true,
      command: '',
      args: [],
      url: '',
      headers: {},
      autoExecute: true,
    });
    setShowAddServer(false);
    setSelectedServerId(serverToAdd.id);
  };

  const handleDeleteServer = (serverId: string) => {
    const newServers = servers.filter((s) => s.id !== serverId);
    setServers(newServers);
    saveMCPConfig(newServers);

    if (selectedServerId === serverId && newServers.length > 0) {
      setSelectedServerId(newServers[0].id);
    } else if (newServers.length === 0) {
      setSelectedServerId(null);
    }
  };

  const handleHeaderChange = (
    serverId: string,
    key: string,
    value: string,
    oldKey?: string
  ) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    const newHeaders = { ...server.headers };
    if (oldKey && oldKey !== key) {
      delete newHeaders[oldKey];
    }
    if (key) {
      newHeaders[key] = value;
    }
    handleServerUpdate(serverId, { headers: newHeaders });
  };

  const handleRemoveHeader = (serverId: string, key: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    const newHeaders = { ...server.headers };
    delete newHeaders[key];
    handleServerUpdate(serverId, { headers: newHeaders });
  };

  const handleAddHeader = (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return;

    const newHeaders = { ...server.headers, '': '' };
    handleServerUpdate(serverId, { headers: newHeaders });
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        {t.common.loading}
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100%+48px)]">
      {/* Left Panel - Server List */}
      <div className="border-border flex w-52 flex-col border-r">
        {/* Server List */}
        <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {servers.length === 0 && !error ? (
            <div className="text-muted-foreground p-4 text-center text-xs">
              {t.settings.mcpNoServers}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-red-500">{error}</div>
          ) : (
            servers.map((server) => (
              <button
                key={server.id}
                onClick={() => setSelectedServerId(server.id)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                  selectedServerId === server.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <span className="flex-1 truncate text-left">{server.id}</span>
              </button>
            ))
          )}
        </div>

        {/* Add/Remove Buttons */}
        <div className="border-border flex items-center gap-1 border-t p-2">
          <button
            onClick={() => setShowAddServer(true)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded transition-colors"
            title={t.settings.mcpAddServer}
          >
            <Plus className="size-4" />
          </button>
          {selectedServerId && (
            <button
              onClick={() => handleDeleteServer(selectedServerId)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded transition-colors"
              title={t.settings.mcpDeleteServer}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Panel - Server Details */}
      <div className="flex-1 overflow-y-auto">
        {showAddServer ? (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-foreground text-base font-medium">
                {t.settings.mcpAddServer}
              </h3>
              <button
                onClick={() => setShowAddServer(false)}
                className="hover:bg-muted rounded p-1"
              >
                <X className="text-muted-foreground size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.mcpType}
                </label>
                <select
                  value={newServer.type}
                  onChange={(e) =>
                    setNewServer({
                      ...newServer,
                      type: e.target.value as 'stdio' | 'http',
                    })
                  }
                  className="border-input bg-background text-foreground focus:ring-ring h-10 w-full max-w-xs cursor-pointer rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="stdio">{t.settings.mcpTypeStdio}</option>
                  <option value="http">{t.settings.mcpTypeHttp}</option>
                </select>
              </div>

              {/* ID */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.mcpId}
                </label>
                <p className="text-muted-foreground text-xs">
                  {t.settings.mcpIdHint}
                </p>
                <input
                  type="text"
                  value={newServer.id}
                  onChange={(e) =>
                    setNewServer({ ...newServer, id: e.target.value })
                  }
                  placeholder="my-mcp-server"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Stdio fields */}
              {newServer.type === 'stdio' && (
                <>
                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      {t.settings.mcpCommand}
                    </label>
                    <input
                      type="text"
                      value={newServer.command}
                      onChange={(e) =>
                        setNewServer({ ...newServer, command: e.target.value })
                      }
                      placeholder="npx"
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      {t.settings.mcpArgs}
                    </label>
                    <input
                      type="text"
                      value={(newServer.args || []).join(' ')}
                      onChange={(e) =>
                        setNewServer({
                          ...newServer,
                          args: e.target.value.split(' ').filter((a) => a),
                        })
                      }
                      placeholder="-y @modelcontextprotocol/server-filesystem /tmp"
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* HTTP fields */}
              {newServer.type === 'http' && (
                <div className="space-y-2">
                  <label className="text-foreground text-sm font-medium">
                    {t.settings.mcpUrl}
                  </label>
                  <input
                    type="text"
                    value={newServer.url}
                    onChange={(e) =>
                      setNewServer({ ...newServer, url: e.target.value })
                    }
                    placeholder="https://mcprouter.to/my-server"
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>
              )}

              <button
                onClick={handleAddServer}
                disabled={!newServer.id}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 h-10 w-full rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.settings.add}
              </button>
            </div>
          </div>
        ) : selectedServer ? (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-foreground text-base font-medium">
                {selectedServer.id}
              </h3>
              <Switch
                checked={selectedServer.enabled}
                onChange={(checked) =>
                  handleServerUpdate(selectedServer.id, { enabled: checked })
                }
              />
            </div>

            <div className="space-y-6">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.mcpType}
                </label>
                <select
                  value={selectedServer.type}
                  onChange={(e) =>
                    handleServerUpdate(selectedServer.id, {
                      type: e.target.value as 'stdio' | 'http',
                    })
                  }
                  className="border-input bg-background text-foreground focus:ring-ring h-10 w-full max-w-xs cursor-pointer rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="stdio">{t.settings.mcpTypeStdio}</option>
                  <option value="http">{t.settings.mcpTypeHttp}</option>
                </select>
              </div>

              {/* Name and ID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-foreground text-sm font-medium">
                    {t.settings.mcpName}
                  </label>
                  <p className="text-muted-foreground text-xs">
                    {t.settings.mcpNameHint}
                  </p>
                  <input
                    type="text"
                    value={selectedServer.name}
                    onChange={(e) =>
                      handleServerUpdate(selectedServer.id, {
                        name: e.target.value,
                      })
                    }
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-foreground text-sm font-medium">
                    {t.settings.mcpId}
                  </label>
                  <p className="text-muted-foreground text-xs">
                    {t.settings.mcpIdHint}
                  </p>
                  <input
                    type="text"
                    value={selectedServer.id}
                    disabled
                    className="border-input bg-muted text-muted-foreground h-10 w-full cursor-not-allowed rounded-lg border px-3 text-sm"
                  />
                </div>
              </div>

              {/* Stdio fields */}
              {selectedServer.type === 'stdio' && (
                <>
                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      {t.settings.mcpCommand}
                    </label>
                    <input
                      type="text"
                      value={selectedServer.command || ''}
                      onChange={(e) =>
                        handleServerUpdate(selectedServer.id, {
                          command: e.target.value,
                        })
                      }
                      placeholder="npx"
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      {t.settings.mcpArgs}
                    </label>
                    <input
                      type="text"
                      value={(selectedServer.args || []).join(' ')}
                      onChange={(e) =>
                        handleServerUpdate(selectedServer.id, {
                          args: e.target.value.split(' ').filter((a) => a),
                        })
                      }
                      placeholder="-y @modelcontextprotocol/server-filesystem /tmp"
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* HTTP fields */}
              {selectedServer.type === 'http' && (
                <>
                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      {t.settings.mcpUrl}
                    </label>
                    <input
                      type="text"
                      value={selectedServer.url || ''}
                      onChange={(e) =>
                        handleServerUpdate(selectedServer.id, {
                          url: e.target.value,
                        })
                      }
                      placeholder="https://mcprouter.to/my-server"
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Auto Execute */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoExecute"
                      checked={selectedServer.autoExecute ?? true}
                      onChange={(e) =>
                        handleServerUpdate(selectedServer.id, {
                          autoExecute: e.target.checked,
                        })
                      }
                      className="size-4 cursor-pointer rounded border"
                    />
                    <label
                      htmlFor="autoExecute"
                      className="text-foreground cursor-pointer text-sm"
                    >
                      {t.settings.mcpAutoExecute}
                    </label>
                  </div>

                  {/* Headers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-foreground text-sm font-medium">
                        {t.settings.mcpHeaders}
                      </label>
                      <button
                        onClick={() => handleAddHeader(selectedServer.id)}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs"
                      >
                        <Plus className="size-3" />
                        {t.settings.mcpAddHeader}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(selectedServer.headers || {}).map(
                        ([key, value], index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) =>
                                handleHeaderChange(
                                  selectedServer.id,
                                  e.target.value,
                                  value,
                                  key
                                )
                              }
                              placeholder="Header Name"
                              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 w-36 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                            />
                            <span className="text-muted-foreground">=</span>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) =>
                                handleHeaderChange(
                                  selectedServer.id,
                                  key,
                                  e.target.value
                                )
                              }
                              placeholder="Value"
                              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-9 flex-1 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                handleRemoveHeader(selectedServer.id, key)
                              }
                              className="text-muted-foreground hover:text-destructive flex size-9 items-center justify-center rounded-lg transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Verify Button */}
              <button
                onClick={() => {
                  // TODO: Implement MCP verification
                  console.log('Verify MCP server:', selectedServer);
                }}
                className="border-border text-foreground hover:bg-accent h-10 rounded-lg border px-4 text-sm transition-colors"
              >
                {t.settings.mcpVerify}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {t.settings.mcpSelectServer}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Skills Settings ============
interface SkillFile {
  name: string;
  path: string;
  isDir: boolean;
  children?: SkillFile[];
}

interface SkillInfo {
  id: string;
  name: string;
  source: 'claude' | 'workany';
  path: string;
  files: SkillFile[];
}

// Get file icon based on extension
function getSkillFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md':
    case 'markdown':
      return FileType;
    case 'json':
      return FileText;
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
      return FileCode2;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return FileImage;
    default:
      return File;
  }
}

// File tree item component
function SkillFileTreeItem({
  file,
  depth = 0,
}: {
  file: SkillFile;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const IconComponent = file.isDir ? FolderOpen : getSkillFileIcon(file.name);

  return (
    <div>
      <button
        onClick={() => file.isDir && setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center gap-1 rounded-md py-1 text-left transition-colors',
          file.isDir ? 'hover:bg-accent/50 cursor-pointer' : 'cursor-default'
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {file.isDir && (
          <span className="text-muted-foreground shrink-0">
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </span>
        )}
        {!file.isDir && <span className="w-3" />}
        <IconComponent className="text-muted-foreground size-4 shrink-0" />
        <span className="truncate text-sm">{file.name}</span>
      </button>
      {file.isDir && isExpanded && file.children && (
        <div>
          {file.children.map((child) => (
            <SkillFileTreeItem
              key={child.path}
              file={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsSettings() {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState({
    name: '',
    source: 'workany' as 'claude' | 'workany',
  });
  const { t } = useLanguage();

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);

  // Load skills from API
  useEffect(() => {
    async function loadSkills() {
      setLoading(true);
      try {
        // Get skills directories
        const dirsResponse = await fetch(`${API_BASE_URL}/files/skills-dir`);
        const dirsData = await dirsResponse.json();
        const directories = (dirsData.directories || []).filter(
          (d: { exists: boolean }) => d.exists
        );

        const allSkills: SkillInfo[] = [];

        for (const dir of directories) {
          // Read each skills directory
          const filesResponse = await fetch(`${API_BASE_URL}/files/readdir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: dir.path, maxDepth: 3 }),
          });
          const filesData = await filesResponse.json();

          if (filesData.success && filesData.files) {
            // Each top-level folder is a skill
            for (const folder of filesData.files) {
              if (folder.isDir) {
                allSkills.push({
                  id: `${dir.name}-${folder.name}`,
                  name: folder.name,
                  source: dir.name as 'claude' | 'workany',
                  path: folder.path,
                  files: folder.children || [],
                });
              }
            }
          }
        }

        setSkills(allSkills);
        if (allSkills.length > 0 && !selectedSkillId) {
          setSelectedSkillId(allSkills[0].id);
        }
      } catch (err) {
        console.error('[Skills] Failed to load skills:', err);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    }

    loadSkills();
  }, []);

  const handleAddSkill = async () => {
    if (!newSkill.name) return;

    try {
      // Determine the target directory
      const dirsResponse = await fetch(`${API_BASE_URL}/files/skills-dir`);
      const dirsData = await dirsResponse.json();
      const targetDir = dirsData.directories?.find(
        (d: { name: string; exists: boolean }) =>
          d.name === newSkill.source && d.exists
      );

      if (!targetDir) {
        console.error('[Skills] Target directory not found');
        return;
      }

      // Create the skill folder via API
      const skillPath = `${targetDir.path}/${newSkill.name}`;

      // Create folder via bash command through API
      const createResponse = await fetch(`${API_BASE_URL}/sandbox/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `mkdir -p "${skillPath}" && echo '# ${newSkill.name}\n\nSkill description here.' > "${skillPath}/README.md"`,
          workDir: targetDir.path,
        }),
      });

      if (createResponse.ok) {
        // Reload skills
        const newSkillInfo: SkillInfo = {
          id: `${newSkill.source}-${newSkill.name}`,
          name: newSkill.name,
          source: newSkill.source,
          path: skillPath,
          files: [{ name: 'README.md', path: `${skillPath}/README.md`, isDir: false }],
        };

        setSkills([...skills, newSkillInfo]);
        setSelectedSkillId(newSkillInfo.id);
        setNewSkill({ name: '', source: 'workany' });
        setShowAddSkill(false);
      }
    } catch (err) {
      console.error('[Skills] Failed to add skill:', err);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;

    try {
      // Delete the skill folder via API
      await fetch(`${API_BASE_URL}/sandbox/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `rm -rf "${skill.path}"`,
          workDir: skill.path.split('/').slice(0, -1).join('/'),
        }),
      });

      const newSkills = skills.filter((s) => s.id !== skillId);
      setSkills(newSkills);

      if (selectedSkillId === skillId && newSkills.length > 0) {
        setSelectedSkillId(newSkills[0].id);
      } else if (newSkills.length === 0) {
        setSelectedSkillId(null);
      }
    } catch (err) {
      console.error('[Skills] Failed to delete skill:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        {t.common.loading}
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100%+48px)]">
      {/* Left Panel - Skills List */}
      <div className="border-border flex w-52 flex-col border-r">
        <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {skills.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-xs">
              {t.settings.skillsEmpty || 'No skills found'}
            </div>
          ) : (
            skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelectedSkillId(skill.id)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                  selectedSkillId === skill.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Layers className="size-4 shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate">{skill.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {skill.source === 'claude' ? '~/.claude' : '~/.workany'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Add/Remove Buttons */}
        <div className="border-border flex items-center gap-1 border-t p-2">
          <button
            onClick={() => setShowAddSkill(true)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded transition-colors"
            title={t.settings.skillsAdd || 'Add Skill'}
          >
            <Plus className="size-4" />
          </button>
          {selectedSkillId && (
            <button
              onClick={() => handleDeleteSkill(selectedSkillId)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded transition-colors"
              title={t.settings.skillsDelete || 'Delete Skill'}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Panel - Skill Details */}
      <div className="flex-1 overflow-y-auto">
        {showAddSkill ? (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-foreground text-base font-medium">
                {t.settings.skillsAdd || 'Add Skill'}
              </h3>
              <button
                onClick={() => setShowAddSkill(false)}
                className="hover:bg-muted rounded p-1"
              >
                <X className="text-muted-foreground size-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Skill Name */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.skillsName || 'Skill Name'}
                </label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, name: e.target.value })
                  }
                  placeholder="my-skill"
                  className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Source Directory */}
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">
                  {t.settings.skillsSource || 'Source Directory'}
                </label>
                <select
                  value={newSkill.source}
                  onChange={(e) =>
                    setNewSkill({
                      ...newSkill,
                      source: e.target.value as 'claude' | 'workany',
                    })
                  }
                  className="border-input bg-background text-foreground focus:ring-ring h-10 w-full cursor-pointer rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="workany">~/.workany/skills</option>
                  <option value="claude">~/.claude/skills</option>
                </select>
              </div>

              <button
                onClick={handleAddSkill}
                disabled={!newSkill.name}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 h-10 w-full rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.settings.add}
              </button>
            </div>
          </div>
        ) : selectedSkill ? (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-foreground text-base font-medium">
                {selectedSkill.name}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {selectedSkill.path}
              </p>
            </div>

            {/* Files */}
            <div className="space-y-3">
              <label className="text-foreground text-sm font-medium">
                {t.settings.skillsFiles || 'Files'}
              </label>
              <div className="border-border bg-muted/30 max-h-[300px] overflow-y-auto rounded-lg border p-2">
                {selectedSkill.files.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center text-sm">
                    {t.settings.skillsNoFiles || 'No files'}
                  </p>
                ) : (
                  selectedSkill.files.map((file) => (
                    <SkillFileTreeItem key={file.path} file={file} />
                  ))
                )}
              </div>
            </div>

            {/* Open in Finder/Explorer */}
            <button
              onClick={() => {
                // Open the skill folder in system file manager
                window.open(`file://${selectedSkill.path}`, '_blank');
              }}
              className="border-border text-foreground hover:bg-accent mt-6 flex h-10 items-center gap-2 rounded-lg border px-4 text-sm transition-colors"
            >
              <FolderOpen className="size-4" />
              {t.settings.skillsOpenFolder || 'Open in Finder'}
            </button>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {t.settings.skillsSelect || 'Select a skill to view details'}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Connector Settings ============
function ConnectorSettings({
  settings,
  onSettingsChange,
  defaultPaths,
}: {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  defaultPaths: { workDir: string; mcpConfigPath: string; skillsPath: string };
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          {t.settings.connectorDescription}
        </p>
      </div>

      {/* Skills Path */}
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">
          {t.settings.skillsPath}
        </label>
        <p className="text-muted-foreground text-xs">
          {t.settings.skillsPathDescription}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative max-w-md flex-1">
            <FolderOpen className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={settings.skillsPath}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  skillsPath: e.target.value,
                })
              }
              placeholder={defaultPaths.skillsPath || 'Loading...'}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border pr-3 pl-10 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              const skillsPath = await getSkillsDir();
              onSettingsChange({
                ...settings,
                skillsPath,
              });
            }}
            className="text-muted-foreground hover:text-foreground border-border hover:bg-accent h-10 cursor-pointer rounded-lg border px-3 text-sm transition-colors"
          >
            {t.common.reset}
          </button>
        </div>
      </div>

      {/* MCP Config Path */}
      <div className="space-y-2">
        <label className="text-foreground text-sm font-medium">
          {t.settings.mcpConfig}
        </label>
        <p className="text-muted-foreground text-xs">
          {t.settings.mcpConfigDescription}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative max-w-md flex-1">
            <FolderOpen className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={settings.mcpConfigPath}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  mcpConfigPath: e.target.value,
                })
              }
              placeholder={defaultPaths.mcpConfigPath || 'Loading...'}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-10 w-full rounded-lg border pr-3 pl-10 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              const mcpConfigPath = await getMcpConfigPath();
              onSettingsChange({
                ...settings,
                mcpConfigPath,
              });
            }}
            className="text-muted-foreground hover:text-foreground border-border hover:bg-accent h-10 cursor-pointer rounded-lg border px-3 text-sm transition-colors"
          >
            {t.common.reset}
          </button>
        </div>
        <p className="text-muted-foreground/70 mt-2 text-xs">
          {t.settings.mcpConfigExample}
        </p>
        <pre className="text-muted-foreground bg-muted/50 overflow-x-auto rounded-lg p-3 text-xs">
          {`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
}

// ============ About Settings ============
function AboutSettings() {
  const { t } = useLanguage();

  const changelog = [
    {
      version: '1.0.0',
      date: '2025-01-17',
      changes: [
        t.settings.initialRelease,
        t.settings.changelogItems.aiAgent,
        t.settings.changelogItems.realTimeProgress,
        t.settings.changelogItems.customWorkDir,
        t.settings.changelogItems.skillsMcp,
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="flex items-center gap-4">
        <img src={ImageLogo} alt="WorkAny" className="size-16 rounded-xl" />
        <div>
          <h2 className="text-foreground text-xl font-bold">WorkAny</h2>
          <p className="text-muted-foreground text-sm">
            {t.settings.aiPlatform}
          </p>
        </div>
      </div>

      {/* Version & Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-border bg-muted/20 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            {t.settings.version}
          </p>
          <p className="text-foreground mt-1 text-lg font-semibold">1.0.0</p>
        </div>
        <div className="border-border bg-muted/20 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            {t.settings.build}
          </p>
          <p className="text-foreground mt-1 text-lg font-semibold">
            2025.01.17
          </p>
        </div>
      </div>

      {/* Author & Copyright */}
      <div className="space-y-3">
        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">
            {t.settings.author}
          </span>
          <span className="text-foreground text-sm font-medium">User</span>
        </div>
        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">
            {t.settings.copyright}
          </span>
          <span className="text-foreground text-sm font-medium">
            © 2025 WorkAny
          </span>
        </div>
        <div className="border-border flex items-center justify-between rounded-lg border p-3">
          <span className="text-muted-foreground text-sm">
            {t.settings.license}
          </span>
          <span className="text-foreground text-sm font-medium">MIT</span>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3">
        <a
          href="https://github.com/anthropics/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="border-border text-foreground hover:bg-accent flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
        >
          <ExternalLink className="size-4" />
          GitHub
        </a>
        <a
          href="https://workany.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="border-border text-foreground hover:bg-accent flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
        >
          <ExternalLink className="size-4" />
          Website
        </a>
      </div>

      {/* Changelog */}
      <div className="space-y-3">
        <h3 className="text-foreground text-sm font-medium">
          {t.settings.changelog}
        </h3>
        <div className="max-h-48 space-y-4 overflow-y-auto">
          {changelog.map((release) => (
            <div
              key={release.version}
              className="border-border bg-muted/20 rounded-lg border p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-foreground text-sm font-semibold">
                  v{release.version}
                </span>
                <span className="text-muted-foreground text-xs">
                  {release.date}
                </span>
              </div>
              <ul className="space-y-1">
                {release.changes.map((change, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground flex items-start gap-2 text-xs"
                  >
                    <span className="text-primary mt-1">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple Switch component
function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked && 'translate-x-4'
        )}
      />
    </button>
  );
}
