/**
 * BoxLite Sandbox Provider
 *
 * Provides VM-isolated code execution using BoxLite micro-VMs.
 * Supports macOS Apple Silicon and Linux with KVM.
 */

import * as fs from 'fs';
import * as path from 'path';

import { BOXLITE_METADATA, defineSandboxPlugin } from '@/core/sandbox/plugin';
import type { SandboxPlugin } from '@/core/sandbox/plugin';
import type {
  BoxLiteProviderConfig,
  ISandboxProvider,
  SandboxCapabilities,
  SandboxExecOptions,
  SandboxExecResult,
  SandboxProviderType,
  ScriptOptions,
  VolumeMount,
} from '@/core/sandbox/types';

// Dynamic import for BoxLite to handle platforms where it's not available
let SimpleBox: typeof import('@boxlite-ai/boxlite').SimpleBox | null = null;
let boxliteAvailable = false;

// Try to load BoxLite
async function loadBoxLite(): Promise<boolean> {
  if (boxliteAvailable) {
    return true;
  }

  try {
    const boxlite = await import('@boxlite-ai/boxlite');
    SimpleBox = boxlite.SimpleBox;
    boxliteAvailable = true;
    console.log('[BoxLiteProvider] BoxLite loaded successfully');
    return true;
  } catch (error) {
    console.warn(
      '[BoxLiteProvider] BoxLite not available:',
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

export class BoxLiteProvider implements ISandboxProvider {
  readonly type: SandboxProviderType = 'boxlite';
  readonly name = 'BoxLite VM';
  readonly version = '1.0.0';

  private config: BoxLiteProviderConfig['config'] = {
    memoryMib: 1024,
    cpus: 2,
    workDir: '/workspace',
    autoRemove: true,
  };

  private volumes: VolumeMount[] = [];
  private box: InstanceType<
    typeof import('@boxlite-ai/boxlite').SimpleBox
  > | null = null;
  private currentImage: string = 'node:18-alpine';

  async isAvailable(): Promise<boolean> {
    return loadBoxLite();
  }

  async init(config?: Record<string, unknown>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    const available = await this.isAvailable();
    if (!available) {
      throw new Error('BoxLite is not available on this platform');
    }

    console.log('[BoxLiteProvider] Initialized with config:', this.config);
  }

  private async getOrCreateBox(
    image: string
  ): Promise<InstanceType<typeof import('@boxlite-ai/boxlite').SimpleBox>> {
    // Reuse existing box if same image
    if (this.box && this.currentImage === image) {
      return this.box;
    }

    // Stop existing box if different image
    if (this.box) {
      try {
        await this.box.stop();
      } catch (e) {
        console.warn('[BoxLiteProvider] Error stopping previous box:', e);
      }
    }

    if (!SimpleBox) {
      throw new Error('BoxLite is not loaded');
    }

    console.log(`[BoxLiteProvider] Creating new box with image: ${image}`);

    this.box = new SimpleBox({
      image,
      memoryMib: this.config.memoryMib || 1024,
      cpus: this.config.cpus || 2,
      autoRemove: this.config.autoRemove ?? true,
      workingDir: this.config.workDir || '/workspace',
      volumes: this.volumes.map((v) => ({
        hostPath: v.hostPath,
        guestPath: v.guestPath,
        readOnly: v.readOnly,
      })),
    });

    this.currentImage = image;

    // Wait for box to be ready
    await this.box.exec('echo', 'Box ready');
    console.log('[BoxLiteProvider] Box initialized successfully');

    return this.box;
  }

  async exec(options: SandboxExecOptions): Promise<SandboxExecResult> {
    const startTime = Date.now();
    const { command, args = [], cwd, env, image } = options;

    const workDir = cwd || this.config.workDir || '/workspace';
    const targetImage = image || this.currentImage || 'node:18-alpine';

    try {
      const box = await this.getOrCreateBox(targetImage);

      // Build the full command with cd and environment
      const envString = env
        ? Object.entries(env)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ')
        : '';

      const fullCommand = envString
        ? `cd ${workDir} && ${envString} ${command} ${args.join(' ')}`
        : `cd ${workDir} && ${command} ${args.join(' ')}`;

      console.log(`[BoxLiteProvider] Executing: ${fullCommand}`);

      const result = await box.exec('sh', '-c', fullCommand);

      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode || 0,
        duration: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        exitCode?: number;
      };
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || String(error),
        exitCode: err.exitCode || 1,
        duration: Date.now() - startTime,
      };
    }
  }

  async runScript(
    filePath: string,
    workDir: string,
    options?: ScriptOptions
  ): Promise<SandboxExecResult> {
    const ext = path.extname(filePath).toLowerCase();
    let image = 'node:18-alpine';
    let runtime = 'node';

    switch (ext) {
      case '.py':
        image = 'python:3.11-slim';
        runtime = 'python';
        break;
      case '.ts':
      case '.mts':
        image = 'oven/bun:latest';
        runtime = 'bun';
        break;
      case '.js':
      case '.mjs':
        image = 'node:18-alpine';
        runtime = 'node';
        break;
      default:
        runtime = 'node';
    }

    // Calculate script path inside container
    let scriptPathInContainer = filePath;
    if (filePath.startsWith(workDir)) {
      const relativePath = filePath.slice(workDir.length).replace(/^\//, '');
      scriptPathInContainer = `/workspace/${relativePath}`;
    } else {
      const fileName = path.basename(filePath);
      scriptPathInContainer = `/workspace/${fileName}`;
    }

    console.log(`[BoxLiteProvider] Running script: ${filePath}`);
    console.log(
      `[BoxLiteProvider] Mounting ${workDir} -> ${workDir} (same path in container)`
    );
    console.log(`[BoxLiteProvider] Script path in container: ${filePath}`);

    // Mount workDir to the SAME PATH inside container
    // This way scripts can use the original host paths without modification
    this.setVolumes([
      {
        hostPath: workDir,
        guestPath: workDir, // Mount to same path, not /workspace
        readOnly: false,
      },
    ]);

    // Update scriptPathInContainer to use original path since we mount to same path
    scriptPathInContainer = filePath;

    // Need to create a new box with the volume mount
    if (this.box) {
      try {
        await this.box.stop();
      } catch (e) {
        console.warn('[BoxLiteProvider] Error stopping box:', e);
      }
      this.box = null;
    }

    const box = await this.getOrCreateBox(image);

    // Install packages if specified
    if (
      options?.packages &&
      options.packages.length > 0 &&
      runtime !== 'python'
    ) {
      console.log(
        `[BoxLiteProvider] Installing packages: ${options.packages.join(', ')}`
      );
      await box.exec(
        'sh',
        '-c',
        `cd "${workDir}" && npm install --no-save ${options.packages.join(' ')}`
      );
    }

    // Run the script
    const startTime = Date.now();
    const argsStr = options?.args?.join(' ') || '';
    const result = await box.exec(
      'sh',
      '-c',
      `cd "${workDir}" && ${runtime} "${scriptPathInContainer}" ${argsStr}`
    );

    // Sync files from VM back to host
    // BoxLite VMs may not auto-sync volume mounts like Docker, so we need to explicitly copy files
    const scriptBasename = path.basename(filePath);
    console.log(
      `[BoxLiteProvider] Starting file sync, script: ${scriptBasename}`
    );

    try {
      // List all files in workDir inside the VM
      const listResult = await box.exec(
        'sh',
        '-c',
        `ls -la "${workDir}/" && find "${workDir}" -maxdepth 2 -type f 2>/dev/null`
      );
      console.log(
        `[BoxLiteProvider] Files in ${workDir}:\n${listResult.stdout}`
      );

      if (listResult.stdout) {
        const lines = listResult.stdout.trim().split('\n');
        // Filter only file paths (lines starting with workDir)
        const files = lines.filter(
          (f) => f && f.startsWith(workDir) && !f.endsWith(scriptBasename)
        );

        console.log(
          `[BoxLiteProvider] Files to sync: ${JSON.stringify(files)}`
        );

        for (const containerFile of files) {
          try {
            // Read file content from container using base64
            console.log(`[BoxLiteProvider] Reading file: ${containerFile}`);
            const catResult = await box.exec(
              'sh',
              '-c',
              `base64 "${containerFile}"`
            );

            if (catResult.exitCode === 0 && catResult.stdout) {
              // Decode and write to host - path is already the host path
              const hostFile = containerFile;
              const base64Content = catResult.stdout.replace(/\s/g, ''); // Remove whitespace
              const content = Buffer.from(base64Content, 'base64');

              // Ensure parent directory exists
              const parentDir = path.dirname(hostFile);
              if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
              }

              fs.writeFileSync(hostFile, content);
              console.log(
                `[BoxLiteProvider] ✅ Synced: ${containerFile} -> ${hostFile} (${content.length} bytes)`
              );
            } else {
              console.warn(
                `[BoxLiteProvider] ❌ Failed to read ${containerFile}: exit=${catResult.exitCode}, stderr=${catResult.stderr}`
              );
            }
          } catch (syncError) {
            console.warn(
              `[BoxLiteProvider] ❌ Sync error for ${containerFile}:`,
              syncError
            );
          }
        }
      }
    } catch (syncError) {
      console.warn(`[BoxLiteProvider] File sync error:`, syncError);
    }

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode || 0,
      duration: Date.now() - startTime,
    };
  }

  async stop(): Promise<void> {
    if (this.box) {
      console.log('[BoxLiteProvider] Stopping box');
      try {
        await this.box.stop();
      } catch (e) {
        console.warn('[BoxLiteProvider] Error stopping box:', e);
      }
      this.box = null;
    }
  }

  async shutdown(): Promise<void> {
    return this.stop();
  }

  getCapabilities(): SandboxCapabilities {
    return {
      supportsVolumeMounts: true,
      supportsNetworking: true,
      isolation: 'vm',
      supportedRuntimes: ['node', 'python', 'bun'],
      supportsPooling: true,
    };
  }

  setVolumes(volumes: VolumeMount[]): void {
    this.volumes = volumes;
  }
}

/**
 * Factory function for BoxLiteProvider
 */
export function createBoxLiteProvider(config?: {
  config?: BoxLiteProviderConfig['config'];
}): BoxLiteProvider {
  const provider = new BoxLiteProvider();
  if (config?.config) {
    provider.init(config.config);
  }
  return provider;
}

/**
 * Check if BoxLite is available on this platform
 */
export async function isBoxLiteAvailable(): Promise<boolean> {
  return loadBoxLite();
}

/**
 * BoxLite provider plugin definition
 */
export const boxlitePlugin: SandboxPlugin = defineSandboxPlugin({
  metadata: BOXLITE_METADATA,
  factory: (config) =>
    createBoxLiteProvider(config ? { config: config.config } : undefined),
});
