import { getSandboxRegistry } from '@/core/sandbox/registry';
import { registerBuiltinProviders } from '@/extensions/sandbox/index';

import type {
  ISandboxProvider,
  SandboxExecOptions,
  SandboxExecResult,
  SandboxProviderType,
  ScriptOptions,
} from './types.js';

/**
 * Sandbox Module
 *
 * Provides extensible sandbox functionality for isolated code execution.
 * Supports multiple providers: BoxLite (VM), Native (no isolation), Docker, E2B.
 */

// Export types
export * from '@/core/sandbox/types';

// Export plugin system
export * from '@/core/sandbox/plugin';

// Export pool
export {
  SandboxPool,
  getGlobalSandboxPool,
  initGlobalSandboxPool,
  shutdownGlobalSandboxPool,
  type PooledSandbox,
  type PooledSandboxConfig,
  type PoolStats,
  type IPoolableSandboxProvider,
} from '@/core/sandbox/pool';

// Export registry
export {
  getSandboxRegistry,
  registerSandboxProvider,
  createSandboxProvider,
  getSandboxProvider,
  getAvailableSandboxProviders,
  stopAllSandboxProviders,
} from '@/core/sandbox/registry';

// Export providers
export {
  NativeProvider,
  createNativeProvider,
  nativePlugin,
  BoxLiteProvider,
  createBoxLiteProvider,
  isBoxLiteAvailable,
  boxlitePlugin,
  builtinPlugins,
  registerBuiltinProviders,
  registerSandboxPlugin,
} from '@/extensions/sandbox/index';

// ============================================================================
// Initialization
// ============================================================================

let initialized = false;

/**
 * Initialize the sandbox module with built-in providers
 */
export async function initSandbox(): Promise<void> {
  if (initialized) {
    return;
  }

  registerBuiltinProviders();
  initialized = true;

  console.log('[Sandbox] Module initialized');
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the best available sandbox provider
 * Uses configured provider if available, otherwise falls back to native
 */
export async function getBestProvider(): Promise<ISandboxProvider> {
  await initSandbox();

  const registry = getSandboxRegistry();
  const available = await registry.getAvailable();

  // Try to use the configured provider first
  const { getProvidersConfig } = await import('@/config/loader.js');
  const config = getProvidersConfig();
  const configuredType = config.sandbox?.type as SandboxProviderType;

  if (configuredType && available.includes(configuredType)) {
    console.log(`[Sandbox] Using configured provider: ${configuredType}`);
    return registry.getInstance(configuredType);
  }

  // Fallback priority: native is most stable, then docker, then boxlite
  const priority: SandboxProviderType[] = ['native', 'docker', 'boxlite'];

  for (const type of priority) {
    if (available.includes(type)) {
      console.log(`[Sandbox] Using fallback provider: ${type}`);
      return registry.getInstance(type);
    }
  }

  // Fallback to native (should always be available)
  return registry.getInstance('native');
}

/**
 * Execute a command using the best available sandbox
 */
export async function execInSandbox(
  options: SandboxExecOptions
): Promise<SandboxExecResult> {
  const provider = await getBestProvider();
  return provider.exec(options);
}

/**
 * Run a script using the best available sandbox
 */
export async function runScriptInSandbox(
  filePath: string,
  workDir: string,
  options?: ScriptOptions
): Promise<SandboxExecResult> {
  const provider = await getBestProvider();
  return provider.runScript(filePath, workDir, options);
}

/**
 * Get the current sandbox mode information
 */
export async function getSandboxInfo(): Promise<{
  available: boolean;
  provider: SandboxProviderType;
  isolation: 'vm' | 'container' | 'process' | 'none';
  message: string;
}> {
  await initSandbox();

  try {
    const provider = await getBestProvider();
    const caps = provider.getCapabilities();

    return {
      available: true,
      provider: provider.type,
      isolation: caps.isolation,
      message: `Using ${provider.name} (${caps.isolation} isolation)`,
    };
  } catch {
    return {
      available: false,
      provider: 'native',
      isolation: 'none',
      message: 'No sandbox available, using native execution',
    };
  }
}
