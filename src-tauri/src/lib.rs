#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Database migrations
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_tasks_and_messages_tables",
            sql: r#"
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY NOT NULL,
                    prompt TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'running',
                    cost REAL,
                    duration INTEGER,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT,
                    tool_name TEXT,
                    tool_input TEXT,
                    subtype TEXT,
                    error_message TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_tool_result_fields",
            sql: r#"
                ALTER TABLE messages ADD COLUMN tool_output TEXT;
                ALTER TABLE messages ADD COLUMN tool_use_id TEXT;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_files_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS files (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    path TEXT NOT NULL,
                    preview TEXT,
                    thumbnail TEXT,
                    is_favorite INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_files_task_id ON files(task_id);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_settings_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY NOT NULL,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_sessions_table_and_update_tasks",
            sql: r#"
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY NOT NULL,
                    prompt TEXT NOT NULL,
                    task_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                ALTER TABLE tasks ADD COLUMN session_id TEXT;
                ALTER TABLE tasks ADD COLUMN task_index INTEGER DEFAULT 1;

                CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
            "#,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:workany.db", migrations)
                .build(),
        )
        .setup(|app| {
            // In development mode (tauri dev), skip sidecar and use external API server
            // Run `pnpm dev:api` separately for hot-reload support
            // In production, spawn the bundled API sidecar
            #[cfg(not(debug_assertions))]
            {
                let sidecar_command = app.shell().sidecar("workany-api")
                    .unwrap()
                    .env("PORT", "2620")
                    .env("NODE_ENV", "production");
                let (mut _rx, mut _child) = sidecar_command.spawn().expect("Failed to spawn API sidecar");

                // Log sidecar output
                tauri::async_runtime::spawn(async move {
                    use tauri_plugin_shell::process::CommandEvent;
                    while let Some(event) = _rx.recv().await {
                        match event {
                            CommandEvent::Stdout(line) => {
                                println!("[API] {}", String::from_utf8_lossy(&line));
                            }
                            CommandEvent::Stderr(line) => {
                                eprintln!("[API Error] {}", String::from_utf8_lossy(&line));
                            }
                            CommandEvent::Error(error) => {
                                eprintln!("[API Spawn Error] {}", error);
                            }
                            CommandEvent::Terminated(status) => {
                                println!("[API] Process terminated with status: {:?}", status);
                                break;
                            }
                            _ => {}
                        }
                    }
                });
            }

            #[cfg(debug_assertions)]
            {
                // Suppress unused variable warning in debug mode
                let _ = app;
                println!("[Tauri Dev] API sidecar disabled. Run `pnpm dev:api` for the API server on port 2026.");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
