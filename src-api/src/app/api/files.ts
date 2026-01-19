/**
 * Files API Routes
 *
 * Provides HTTP endpoints for file system operations.
 * Uses Node.js fs module for reliable filesystem access.
 */

import { Hono } from 'hono';
import * as fs from 'fs/promises';
import * as path from 'path';

const files = new Hono();

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileEntry[];
}

/**
 * Recursively read a directory
 */
async function readDirRecursive(
  dirPath: string,
  depth: number = 0,
  maxDepth: number = 3
): Promise<FileEntry[]> {
  if (depth > maxDepth) return [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: FileEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files/folders
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const isDirectory = entry.isDirectory();

      const file: FileEntry = {
        name: entry.name,
        path: fullPath,
        isDir: isDirectory,
      };

      // Recursively read subdirectories
      if (isDirectory && depth < maxDepth) {
        try {
          file.children = await readDirRecursive(fullPath, depth + 1, maxDepth);
        } catch {
          file.children = [];
        }
      }

      files.push(file);
    }

    // Sort: directories first, then by name
    return files.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (err) {
    console.error(`[Files API] Failed to read ${dirPath}:`, err);
    return [];
  }
}

/**
 * Read directory contents recursively
 * POST /files/readdir
 * Body: { path: string, maxDepth?: number }
 */
files.post('/readdir', async (c) => {
  try {
    const body = await c.req.json<{
      path: string;
      maxDepth?: number;
    }>();

    const { path: dirPath, maxDepth = 3 } = body;

    if (!dirPath) {
      return c.json({ error: 'Path is required' }, 400);
    }

    // Security check: only allow reading from home directory
    const homedir = process.env.HOME || process.env.USERPROFILE || '';
    if (!dirPath.startsWith(homedir) && !dirPath.startsWith('/tmp')) {
      return c.json({ error: 'Access denied: path must be within home directory' }, 403);
    }

    // Check if directory exists
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        return c.json({ error: 'Path is not a directory' }, 400);
      }
    } catch {
      return c.json({ error: 'Directory does not exist', files: [] }, 200);
    }

    const files = await readDirRecursive(dirPath, 0, maxDepth);

    return c.json({
      success: true,
      path: dirPath,
      files,
    });
  } catch (error) {
    console.error('[Files API] Error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        files: [],
      },
      500
    );
  }
});

/**
 * Check if a path exists and get its type
 * POST /files/stat
 * Body: { path: string }
 */
files.post('/stat', async (c) => {
  try {
    const body = await c.req.json<{ path: string }>();
    const { path: filePath } = body;

    if (!filePath) {
      return c.json({ error: 'Path is required' }, 400);
    }

    try {
      const stat = await fs.stat(filePath);
      return c.json({
        exists: true,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        mtime: stat.mtime.toISOString(),
      });
    } catch {
      return c.json({ exists: false });
    }
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * Read file contents
 * POST /files/read
 * Body: { path: string }
 */
files.post('/read', async (c) => {
  try {
    const body = await c.req.json<{ path: string }>();
    const { path: filePath } = body;

    if (!filePath) {
      return c.json({ error: 'Path is required' }, 400);
    }

    // Security check
    const homedir = process.env.HOME || process.env.USERPROFILE || '';
    if (!filePath.startsWith(homedir) && !filePath.startsWith('/tmp')) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    return c.json({
      success: true,
      content,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * Get all skills directories
 * GET /files/skills-dir
 * Returns paths for both ~/.workany/skills and ~/.claude/skills
 */
files.get('/skills-dir', async (c) => {
  const homedir = process.env.HOME || process.env.USERPROFILE || '';
  const skillsDirs = [
    { name: 'workany', path: path.join(homedir, '.workany', 'skills') },
    { name: 'claude', path: path.join(homedir, '.claude', 'skills') },
  ];

  const results: { name: string; path: string; exists: boolean }[] = [];

  for (const dir of skillsDirs) {
    try {
      const stat = await fs.stat(dir.path);
      if (stat.isDirectory()) {
        results.push({ name: dir.name, path: dir.path, exists: true });
      }
    } catch {
      // Directory doesn't exist
      if (dir.name === 'workany') {
        // Try to create workany skills dir
        try {
          await fs.mkdir(dir.path, { recursive: true });
          results.push({ name: dir.name, path: dir.path, exists: true });
        } catch {
          results.push({ name: dir.name, path: dir.path, exists: false });
        }
      }
    }
  }

  // Return first existing directory for backward compatibility
  const firstExisting = results.find(r => r.exists);
  return c.json({
    path: firstExisting?.path || '',
    exists: !!firstExisting,
    directories: results,
  });
});

export { files as filesRoutes };
