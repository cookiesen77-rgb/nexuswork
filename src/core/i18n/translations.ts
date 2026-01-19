export type Language = 'en-US' | 'zh-CN';

export const translations = {
  'en-US': {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      reset: 'Reset',
      close: 'Close',
      more: 'more...',
      loading: 'Loading...',
      noData: 'No data',
    },

    // Navigation
    nav: {
      newTask: 'New task',
      allTasks: 'All tasks',
      noTasksYet: 'No tasks yet',
      settings: 'Settings',
      logOut: 'Log out',
    },

    // Home
    home: {
      inputPlaceholder: 'Ask me to do anything for you...',
      reply: 'Reply...',
    },

    // Task
    task: {
      progress: 'Progress',
      artifacts: 'Artifacts',
      context: 'Context',
      showSteps: 'Show {count} steps',
      hideSteps: 'Hide steps',
      running: 'Running',
      completed: 'Completed',
      error: 'Error',
    },

    // Preview
    preview: {
      preview: 'Preview',
      code: 'Code',
      noArtifactSelected: 'No artifact selected',
      selectArtifactHint: 'Select an artifact from the right panel to preview',
      previewNotAvailable: 'Preview not available',
      switchToCodeHint: 'Switch to Code view to see the content',
      download: 'Download',
      copy: 'Copy',
      copied: 'Copied',
      refresh: 'Refresh',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit fullscreen',
      close: 'Close',
      page: 'Page',
      openInBrowser: 'Open in Browser',
      openInApp: 'Open in {app}',
      documentHint:
        'Document files can be opened with Microsoft Word or other compatible applications.',
    },

    // Settings
    settings: {
      title: 'Settings',
      // Categories
      account: 'Account',
      general: 'General',
      workplace: 'Workplace',
      model: 'Model',
      provider: 'Provider',
      mcp: 'MCP',
      connector: 'Connector',
      about: 'About',

      // Account
      manageProfile: 'Manage your profile information',
      avatar: 'Avatar',
      clickToUpload: 'Click to upload a new avatar',
      avatarRecommendation: 'Recommended: Square image, at least 100x100px',
      nickname: 'Nickname',
      enterNickname: 'Enter your nickname',

      // General
      language: 'Language',
      themeColor: 'Theme Color',
      appearance: 'Appearance',
      light: 'Light',
      dark: 'Dark',
      system: 'System',

      // Workplace
      workplaceDescription:
        'Configure your working directory for sessions and outputs',
      workingDirectory: 'Working Directory',
      workingDirectoryDescription:
        'All session outputs and files will be saved in this directory. Each conversation creates a subfolder under sessions/.',
      directoryStructure: 'Structure: {path}/sessions/[task-id]/',

      // Sandbox
      sandbox: 'Sandbox Mode',
      sandboxDescription:
        'Run scripts in isolated containers for better security and dependency management',
      sandboxAutoDetect:
        'Container runtime will be automatically selected based on script type (Node.js, Python, Bun, etc.)',

      // Model / Provider
      modelDescription: 'Configure AI model providers and API keys',
      defaultModel: 'Default Model',
      providers: 'Providers',
      defaultEnv: 'Default (Environment)',
      useEnvModel: 'Use environment variables',
      envHint:
        'Using ANTHROPIC_API_KEY and ANTHROPIC_MODEL from server environment',
      apiKey: 'API Key',
      enterApiKey: 'Enter your API key',
      getApiKey: 'Get API Key',
      baseUrl: 'Base URL',
      apiBaseUrl: 'API base URL',
      availableModels: 'Available Models',
      configured: 'Configured',
      notConfigured: 'Not Configured',
      addProvider: 'Add Provider',
      deleteProvider: 'Delete Provider',
      providerName: 'Name',
      models: 'Models (comma separated)',
      modelsHint: '(comma separated)',
      add: 'Add',
      custom: 'Custom',
      authMethod: 'Auth Method',
      selectProvider: 'Select a provider to configure',

      // Skills
      skills: 'Skills',
      skillsEmpty: 'No skills found',
      skillsAdd: 'Add Skill',
      skillsDelete: 'Delete Skill',
      skillsName: 'Skill Name',
      skillsSource: 'Source Directory',
      skillsFiles: 'Files',
      skillsNoFiles: 'No files',
      skillsSelect: 'Select a skill to view details',
      skillsOpenFolder: 'Open in Finder',

      // MCP
      mcpDescription: 'Configure Model Context Protocol servers',
      mcpType: 'Type',
      mcpTypeStdio: 'Stdio Command',
      mcpTypeHttp: 'HTTP Request',
      mcpName: 'Name',
      mcpNameHint: 'Help identify the tool',
      mcpId: 'ID',
      mcpIdHint: 'Unique ID for model, cannot be duplicated',
      mcpCommand: 'Command',
      mcpArgs: 'Arguments',
      mcpUrl: 'URL',
      mcpAutoExecute: 'Auto Execute Tools',
      mcpHeaders: 'HTTP Headers',
      mcpAddHeader: 'Add Header',
      mcpVerify: 'Verify (View Tools)',
      mcpAddServer: 'Add Server',
      mcpDeleteServer: 'Delete Server',
      mcpSelectServer: 'Select a server to configure',
      mcpNoServers: 'No MCP servers configured',
      mcpLoadError: 'Failed to load MCP config',

      // Connector
      connectorDescription:
        'Configure Skills and MCP servers for extended capabilities',
      skillsPath: 'Skills Path',
      skillsPathDescription:
        'Directory containing skill definition files (.md files)',
      mcpConfig: 'MCP Config',
      mcpConfigDescription:
        'Path to MCP servers configuration file (JSON format)',
      mcpConfigExample: 'Example mcp.json format:',

      // About
      aiPlatform: 'AI-powered task automation platform',
      version: 'Version',
      build: 'Build',
      author: 'Author',
      copyright: 'Copyright',
      license: 'License',
      changelog: 'Changelog',
      initialRelease: 'Initial release',
      changelogItems: {
        aiAgent: 'AI agent task execution with multi-model support',
        realTimeProgress: 'Real-time progress tracking and artifact preview',
        customWorkDir: 'Customizable working directory and session management',
        skillsMcp: 'Skills and MCP server integration',
      },
    },

    // Library
    library: {
      title: 'Library',
      files: 'Files',
      noFiles: 'No files yet',
    },
  },

  'zh-CN': {
    // Common
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      confirm: '确认',
      reset: '重置',
      close: '关闭',
      more: '更多...',
      loading: '加载中...',
      noData: '暂无数据',
    },

    // Navigation
    nav: {
      newTask: '新建任务',
      allTasks: '所有任务',
      noTasksYet: '暂无任务',
      settings: '设置',
      logOut: '退出登录',
    },

    // Home
    home: {
      inputPlaceholder: '让我帮你完成任何事...',
      reply: '回复...',
    },

    // Task
    task: {
      progress: '进度',
      artifacts: '产物',
      context: '上下文',
      showSteps: '显示 {count} 个步骤',
      hideSteps: '隐藏步骤',
      running: '运行中',
      completed: '已完成',
      error: '错误',
    },

    // Preview
    preview: {
      preview: '预览',
      code: '代码',
      noArtifactSelected: '未选择产物',
      selectArtifactHint: '从右侧面板选择一个产物进行预览',
      previewNotAvailable: '预览不可用',
      switchToCodeHint: '切换到代码视图查看内容',
      download: '下载',
      copy: '复制',
      copied: '已复制',
      refresh: '刷新',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      close: '关闭',
      page: '页',
      openInBrowser: '在浏览器中打开',
      openInApp: '在 {app} 中打开',
      documentHint: '文档文件可以使用 Microsoft Word 或其他兼容应用程序打开。',
    },

    // Settings
    settings: {
      title: '设置',
      // Categories
      account: '账号',
      general: '通用',
      workplace: '工作目录',
      model: '模型',
      provider: '供应商',
      mcp: 'MCP',
      connector: '连接器',
      about: '关于',

      // Account
      manageProfile: '管理您的个人资料',
      avatar: '头像',
      clickToUpload: '点击上传新头像',
      avatarRecommendation: '建议: 正方形图片, 至少 100x100 像素',
      nickname: '昵称',
      enterNickname: '输入您的昵称',

      // General
      language: '语言',
      themeColor: '主题色',
      appearance: '外观',
      light: '浅色',
      dark: '深色',
      system: '跟随系统',

      // Workplace
      workplaceDescription: '配置会话和输出文件的工作目录',
      workingDirectory: '工作目录',
      workingDirectoryDescription:
        '所有会话输出和文件将保存在此目录中。每个对话会在 sessions/ 下创建一个子文件夹。',
      directoryStructure: '结构: {path}/sessions/[task-id]/',

      // Sandbox
      sandbox: '沙盒模式',
      sandboxDescription: '在隔离容器中运行脚本，提供更好的安全性和依赖管理',
      sandboxAutoDetect:
        '容器运行时将根据脚本类型自动选择（Node.js、Python、Bun 等）',

      // Model / Provider
      modelDescription: '配置 AI 模型供应商和 API 密钥',
      defaultModel: '默认模型',
      providers: '供应商列表',
      defaultEnv: '默认 (环境变量)',
      useEnvModel: '使用环境变量配置',
      envHint: '使用服务端环境变量 ANTHROPIC_API_KEY 和 ANTHROPIC_MODEL',
      apiKey: 'API 密钥',
      enterApiKey: '输入您的 API 密钥',
      getApiKey: '获取 API 密钥',
      baseUrl: '接口地址',
      apiBaseUrl: 'API 接口地址',
      availableModels: '可用模型',
      configured: '已配置',
      notConfigured: '未配置',
      addProvider: '添加供应商',
      deleteProvider: '删除供应商',
      providerName: '名称',
      models: '模型 (逗号分隔)',
      modelsHint: '(逗号分隔)',
      add: '添加',
      custom: '自定义',
      authMethod: '身份验证方式',
      selectProvider: '选择一个供应商进行配置',

      // Skills
      skills: 'Skills',
      skillsEmpty: '暂无 Skills',
      skillsAdd: '添加 Skill',
      skillsDelete: '删除 Skill',
      skillsName: 'Skill 名称',
      skillsSource: '目录',
      skillsFiles: '文件',
      skillsNoFiles: '暂无文件',
      skillsSelect: '选择一个 Skill 查看详情',
      skillsOpenFolder: '在访达中打开',

      // MCP
      mcpDescription: '配置 Model Context Protocol 服务器',
      mcpType: '类型',
      mcpTypeStdio: '命令行 (stdio)',
      mcpTypeHttp: 'HTTP 请求 (http)',
      mcpName: '名称',
      mcpNameHint: '帮助你识别工具',
      mcpId: 'ID',
      mcpIdHint: '用于模型识别的 ID，不可重复',
      mcpCommand: '命令',
      mcpArgs: '参数',
      mcpUrl: 'URL',
      mcpAutoExecute: '自动执行工具',
      mcpHeaders: 'HTTP 请求头',
      mcpAddHeader: '添加请求头',
      mcpVerify: '验证 (查看工具)',
      mcpAddServer: '添加服务器',
      mcpDeleteServer: '删除服务器',
      mcpSelectServer: '选择一个服务器进行配置',
      mcpNoServers: '暂无 MCP 服务器配置',
      mcpLoadError: '加载 MCP 配置失败',

      // Connector
      connectorDescription: '配置 Skills 和 MCP 服务器以扩展功能',
      skillsPath: 'Skills 路径',
      skillsPathDescription: '包含技能定义文件 (.md 文件) 的目录',
      mcpConfig: 'MCP 配置',
      mcpConfigDescription: 'MCP 服务器配置文件路径 (JSON 格式)',
      mcpConfigExample: 'mcp.json 格式示例:',

      // About
      aiPlatform: 'AI 驱动的任务自动化平台',
      version: '版本',
      build: '构建',
      author: '作者',
      copyright: '版权',
      license: '许可证',
      changelog: '更新日志',
      initialRelease: '首次发布',
      changelogItems: {
        aiAgent: '支持多模型的 AI 智能体任务执行',
        realTimeProgress: '实时进度跟踪和产物预览',
        customWorkDir: '可自定义的工作目录和会话管理',
        skillsMcp: 'Skills 和 MCP 服务器集成',
      },
    },

    // Library
    library: {
      title: '资源库',
      files: '文件',
      noFiles: '暂无文件',
    },
  },
} as const;

// Helper type to convert literal strings to string type recursively
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type TranslationKeys = DeepStringify<(typeof translations)['en-US']>;

// Helper function to get nested translation value
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the path if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

// Get system language
export function getSystemLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en-US';

  const lang =
    navigator.language ||
    (navigator as { userLanguage?: string }).userLanguage ||
    'en-US';

  // Check if Chinese
  if (lang.startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en-US';
}
