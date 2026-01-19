# WorkAny

WorkAny is an AI agent desktop application that allows users to assign tasks to Claude AI using natural language and watch it complete them in real-time through code generation, tool execution, and workspace management.

## Features

### Task Management
- Create tasks using natural language
- Task library with search and filtering
- Task history and status tracking
- Multi-phase task execution (planning → approval → execution)

### Agent Execution
- Real-time streaming responses
- Two-phase planning workflow (plan generation and user approval)
- Tool execution tracking (Bash, Read, Write, Edit, Grep, etc.)
- Permission request handling for sensitive operations
- Multiple agent providers (Claude Agent SDK, DeepAgents, Codex)

### Artifact Management
- Automatic detection and preview of generated files
- Support for HTML/CSS/JavaScript, React applications, code files, etc.
- Live preview of web artifacts via Vite
- Working files display with directory tree view

### Sandbox Execution
- Isolated script execution in containers
- Multiple sandbox providers (BoxLite VM, Native, Codex)
- Auto-detection of runtime (Node.js, Python, Bun)
- Volume mounting for workspace access

### Skills & MCP Integration
- Model Context Protocol (MCP) server support
- Skills management (add, delete, browse)
- Support for ~/.claude/skills and ~/.workany/skills directories

### Other Features
- Multiple AI provider support (OpenRouter, SiliconFlow, OpenAI, Anthropic, etc.)
- Workspace configuration
- Dark/light theme with accent colors
- Multi-language support (English, Chinese)

## Tech Stack

**Frontend:**
- React 19 + React Router v7
- TypeScript
- Vite
- Tailwind CSS 4
- Radix UI

**Backend:**
- Hono (HTTP framework)
- Claude Agent SDK
- Model Context Protocol (MCP) SDK
- BoxLite (VM sandbox)

**Desktop:**
- Tauri 2
- SQLite

## Architecture

### Backend (src-api)

The backend uses a plugin-based architecture for extensibility:

```
src-api/
├── src/
│   ├── app/                    # HTTP layer
│   │   ├── api/                # Route handlers
│   │   │   ├── agent.ts        # Agent execution endpoints
│   │   │   ├── files.ts        # Filesystem operations
│   │   │   ├── health.ts       # Health check
│   │   │   ├── mcp.ts          # MCP config management
│   │   │   ├── preview.ts      # Live preview server
│   │   │   ├── providers.ts    # AI provider management
│   │   │   └── sandbox.ts      # Sandbox execution
│   │   └── middleware/         # HTTP middleware (CORS, etc.)
│   │
│   ├── core/                   # Core abstractions
│   │   ├── agent/              # Agent SDK abstraction
│   │   │   ├── types.ts        # IAgent interface
│   │   │   ├── base.ts         # BaseAgent implementation
│   │   │   ├── registry.ts     # Agent factory registry
│   │   │   └── plugin.ts       # Agent plugin system
│   │   └── sandbox/            # Sandbox abstraction
│   │       ├── types.ts        # ISandboxProvider interface
│   │       ├── registry.ts     # Sandbox factory registry
│   │       ├── pool.ts         # Provider instance pool
│   │       └── plugin.ts       # Sandbox plugin system
│   │
│   ├── extensions/             # Plugin implementations
│   │   ├── agent/              # Agent providers
│   │   │   ├── claude/         # Claude Agent SDK
│   │   │   ├── codex/          # Codex CLI integration
│   │   │   └── deepagents/     # DeepAgents.js
│   │   ├── sandbox/            # Sandbox providers
│   │   │   ├── boxlite.ts      # BoxLite VM provider
│   │   │   ├── native.ts       # Native process provider
│   │   │   └── codex.ts        # Codex sandbox provider
│   │   └── mcp/                # MCP extensions
│   │       └── sandbox-server.ts
│   │
│   ├── shared/                 # Shared modules
│   │   ├── provider/           # AI provider management
│   │   ├── services/           # Business services
│   │   ├── mcp/                # MCP loader
│   │   ├── types/              # Shared types
│   │   └── utils/              # Utilities
│   │
│   ├── config/                 # Configuration
│   │   ├── loader.ts           # Config file loader
│   │   └── constants.ts        # Constants
│   │
│   └── index.ts                # Application entry point
```

### Frontend (src)

```
src/
├── components/                 # React components
│   ├── task/                   # Task-related components
│   │   ├── RightSidebar.tsx    # Working files, artifacts, tools, skills
│   │   └── ...
│   ├── settings-modal.tsx      # Settings with MCP, Skills, Providers
│   └── ui/                     # Base UI components
├── pages/                      # Page components
├── core/                       # Core modules
│   └── i18n/                   # Internationalization
├── shared/                     # Shared modules
│   ├── db/                     # IndexedDB storage
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   └── providers/              # React context providers
└── assets/                     # Static assets
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/agent/run` | POST | Execute agent task (streaming) |
| `/agent/stop` | POST | Stop running task |
| `/sandbox/execute` | POST | Execute script in sandbox |
| `/preview/start` | POST | Start live preview server |
| `/preview/stop` | POST | Stop preview server |
| `/providers` | GET | List AI providers |
| `/providers/:id` | GET/POST | Get/update provider |
| `/files/readdir` | POST | Read directory contents |
| `/files/read` | POST | Read file contents |
| `/files/stat` | POST | Get file info |
| `/files/skills-dir` | GET | Get skills directories |
| `/mcp/config` | GET/POST | Get/save MCP configuration |

## Local Development

### Requirements

- Node.js >= 20
- pnpm >= 9
- Rust >= 1.70
- Bun >= 1.0 (for compiling API sidecar)
- System dependencies (varies by OS):
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev`
  - **Windows**: Microsoft Visual Studio C++ Build Tools

Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/user/workany.git
cd workany
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
# Frontend only
pnpm dev

# Frontend + API service
pnpm dev:all

# Tauri desktop app development mode
pnpm tauri dev
```

### Building

```bash
# Build frontend
pnpm build

# Build Tauri app (current platform)
pnpm tauri:build

# Build for specific platforms
pnpm tauri:build:mac-arm      # macOS Apple Silicon (27MB)
pnpm tauri:build:mac-intel    # macOS Intel (30MB)
pnpm tauri:build:linux        # Linux
pnpm tauri:build:windows      # Windows
```

Or use the build script:

```bash
./scripts/build.sh              # Current platform
./scripts/build.sh mac-arm      # macOS Apple Silicon
./scripts/build.sh --help       # Show help
```

## Configuration

### AI Provider Configuration

Configure AI providers in the app settings:

1. Open settings panel
2. Go to "Provider" section
3. Configure API keys for desired providers (OpenRouter, SiliconFlow, OpenAI, Anthropic, etc.)
4. Custom providers can be added with name, API key, and base URL

### MCP Server Configuration

Configure MCP servers in the app settings:

1. Open settings panel
2. Go to "MCP" section
3. Add servers with:
   - **Stdio**: Command and arguments (e.g., `npx -y @modelcontextprotocol/server-filesystem /tmp`)
   - **HTTP**: URL and optional headers

Or edit the config file directly at `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
    },
    "amap-maps": {
      "url": "https://mcp.amap.com/sse?key=YOUR_KEY"
    }
  }
}
```

### Skills Configuration

Skills are stored in:
- `~/.workany/skills/` - WorkAny-specific skills
- `~/.claude/skills/` - Claude Code compatible skills

Each skill is a folder containing markdown files with instructions and optionally code files.

### Workspace Configuration

- Set working directory for session outputs
- Enable/disable sandbox mode for isolated execution

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 2026 (dev) / 2620 (prod) |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `ANTHROPIC_MODEL` | Default Claude model | claude-sonnet-4-20250514 |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
