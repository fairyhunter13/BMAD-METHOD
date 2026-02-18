const path = require('node:path');
const fs = require('fs-extra');
const yaml = require('yaml');
const crypto = require('node:crypto');
const { StateLock } = require('./state-lock');

/**
 * Handles synchronization between scopes and shared layer
 * Implements sync-up (promote to shared) and sync-down (pull from shared)
 *
 * @class ScopeSync
 * @requires fs-extra
 * @requires yaml
 * @requires StateLock
 *
 * @example
 * const sync = new ScopeSync({ projectRoot: '/path/to/project' });
 * await sync.syncUp('auth', ['architecture.md']);
 */
class ScopeSync {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.outputBase = options.outputBase || '_bmad-output';
    this.outputPath = path.join(this.projectRoot, this.outputBase);
    this.sharedPath = path.join(this.outputPath, '_shared');
    this.stateLock = new StateLock();

    // Default patterns for promotable artifacts
    this.promotablePatterns = options.promotablePatterns || [
      'architecture/*.md',
      'contracts/*.md',
      'principles/*.md',
      'project-context.md',
    ];
  }

  /**
   * Compute file hash for change detection
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} MD5 hash
   */
  async computeHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch {
      return null;
    }
  }

  /**
   * Get sync metadata path for a scope
   * @param {string} scopeId - The scope ID
   * @returns {string} Path to sync metadata file
   */
  getSyncMetaPath(scopeId) {
    return path.join(this.outputPath, scopeId, '.sync-meta.yaml');
  }

  /**
   * Load sync metadata for a scope
   * @param {string} scopeId - The scope ID
   * @returns {Promise<object>} Sync metadata
   */
  async loadSyncMeta(scopeId) {
    const metaPath = this.getSyncMetaPath(scopeId);

    try {
      if (await fs.pathExists(metaPath)) {
        const content = await fs.readFile(metaPath, 'utf8');
        // Guard against null/undefined from yaml.parse (empty YAML files)
        const parsed = yaml.parse(content);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }

    return {
      version: 1,
      lastSyncUp: null,
      lastSyncDown: null,
      promotedFiles: {},
      pulledFiles: {},
    };
  }

  /**
   * Save sync metadata for a scope
   * @param {string} scopeId - The scope ID
   * @param {object} meta - Metadata to save
   */
  async saveSyncMeta(scopeId, meta) {
    const metaPath = this.getSyncMetaPath(scopeId);
    meta.updatedAt = new Date().toISOString();
    await fs.writeFile(metaPath, yaml.stringify(meta), 'utf8');
  }

  /**
   * Sync-Up: Promote artifacts from scope to shared layer
   * @param {string} scopeId - The scope ID
   * @param {string[]} files - Specific files to promote (optional)
   * @param {object} options - Sync options
   * @returns {Promise<object>} Sync result
   */
  async syncUp(scopeId, files = null, options = {}) {
    const scopePath = path.join(this.outputPath, scopeId);

    // Verify scope exists (throw before try/catch - this is a fatal error)
    if (!(await fs.pathExists(scopePath))) {
      throw new Error(`Scope '${scopeId}' does not exist`);
    }

    const result = {
      success: false,
      promoted: [],
      conflicts: [],
      errors: [],
      skipped: [],
    };

    try {
      // Load sync metadata
      const meta = await this.loadSyncMeta(scopeId);

      // Determine files to promote
      let filesToPromote = [];

      if (files && files.length > 0) {
        // Use specified files
        filesToPromote = files.map((f) => (path.isAbsolute(f) ? f : path.join(scopePath, f)));
      } else {
        // Find promotable files using patterns
        filesToPromote = await this.findPromotableFiles(scopePath);
      }

      // Process each file
      for (const sourceFile of filesToPromote) {
        try {
          // Verify file exists
          if (!(await fs.pathExists(sourceFile))) {
            result.skipped.push({ file: sourceFile, reason: 'File not found' });
            continue;
          }

          // Calculate relative path from scope
          const relativePath = path.relative(scopePath, sourceFile);
          const targetPath = path.join(this.sharedPath, scopeId, relativePath);

          // Check for conflicts or unchanged files
          if ((await fs.pathExists(targetPath)) && !options.force) {
            const sourceHash = await this.computeHash(sourceFile);
            const targetHash = await this.computeHash(targetPath);

            if (sourceHash === targetHash) {
              // File unchanged — skip it
              result.skipped.push({ file: relativePath, reason: 'No changes' });
              continue;
            }
            // Files differ — conflict
            result.conflicts.push({
              file: relativePath,
              source: sourceFile,
              target: targetPath,
              resolution: 'manual',
            });
            continue;
          }

          // Create target directory
          await fs.ensureDir(path.dirname(targetPath));

          // Copy file to shared
          await fs.copy(sourceFile, targetPath, { overwrite: options.force });

          // Create metadata file
          const metaFilePath = `${targetPath}.meta`;
          const fileMeta = {
            source_scope: scopeId,
            promoted_at: new Date().toISOString(),
            original_path: relativePath,
            original_hash: await this.computeHash(sourceFile),
            version: (meta.promotedFiles[relativePath]?.version || 0) + 1,
          };
          await fs.writeFile(metaFilePath, yaml.stringify(fileMeta), 'utf8');

          // Track promotion
          meta.promotedFiles[relativePath] = {
            promotedAt: fileMeta.promoted_at,
            hash: fileMeta.original_hash,
            version: fileMeta.version,
          };

          result.promoted.push({
            file: relativePath,
            target: targetPath,
          });
        } catch (error) {
          result.errors.push({
            file: sourceFile,
            error: error.message,
          });
        }
      }

      // Update sync metadata
      meta.lastSyncUp = new Date().toISOString();
      await this.saveSyncMeta(scopeId, meta);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push({ error: error.message });
    }

    return result;
  }

  /**
   * Sync-Down: Pull updates from shared layer to scope
   * @param {string} scopeId - The scope ID
   * @param {object} options - Sync options
   * @returns {Promise<object>} Sync result
   */
  async syncDown(scopeId, options = {}) {
    const scopePath = path.join(this.outputPath, scopeId);

    // Verify scope exists (throw before try/catch - this is a fatal error)
    if (!(await fs.pathExists(scopePath))) {
      throw new Error(`Scope '${scopeId}' does not exist`);
    }

    const result = {
      success: false,
      pulled: [],
      conflicts: [],
      errors: [],
      upToDate: [],
    };

    try {
      // Load sync metadata
      const meta = await this.loadSyncMeta(scopeId);

      // Find all shared files from any scope
      // Wrap fs.readdir in try-catch for defensive error handling
      let sharedScopeDirs;
      try {
        sharedScopeDirs = await fs.readdir(this.sharedPath, { withFileTypes: true });
      } catch {
        // If shared directory is inaccessible, return empty result
        sharedScopeDirs = [];
      }

      for (const dir of sharedScopeDirs) {
        if (!dir.isDirectory() || dir.name.startsWith('.')) continue;

        const sharedScopePath = path.join(this.sharedPath, dir.name);
        const files = await this.getAllFiles(sharedScopePath);

        for (const sharedFile of files) {
          // Skip metadata files
          if (sharedFile.endsWith('.meta')) continue;

          try {
            const relativePath = path.relative(sharedScopePath, sharedFile);
            const targetPath = path.join(scopePath, 'shared', dir.name, relativePath);

            // Load shared file metadata
            const metaFilePath = `${sharedFile}.meta`;
            let fileMeta = null;
            if (await fs.pathExists(metaFilePath)) {
              try {
                const metaContent = await fs.readFile(metaFilePath, 'utf8');
                fileMeta = yaml.parse(metaContent);
              } catch {
                // If meta file is malformed, treat as no metadata
                fileMeta = null;
              }
            }

            // Check if we already have this version (skip if force flag is set)
            // Also verify content hasn't changed - shared file may be modified without version bump
            const lastPulled = meta.pulledFiles[`${dir.name}/${relativePath}`];
            const sharedHash = await this.computeHash(sharedFile);
            const isVersionMatch = lastPulled && fileMeta && lastPulled.version === fileMeta.version;
            const isContentUnchanged = lastPulled && lastPulled.hash === sharedHash;

            if (!options.force && isVersionMatch && isContentUnchanged) {
              result.upToDate.push({ file: relativePath, scope: dir.name });
              continue;
            }

            // Check for local conflicts
            if ((await fs.pathExists(targetPath)) && !options.force) {
              const localHash = await this.computeHash(targetPath);
              const hasLocalChanges = lastPulled && lastPulled.hash && localHash !== lastPulled.hash;
              const hasRemoteChanges = localHash !== sharedHash;

              // Conflict: local was modified AND remote differs from local
              if (hasRemoteChanges && hasLocalChanges) {
                result.conflicts.push({
                  file: relativePath,
                  scope: dir.name,
                  local: targetPath,
                  shared: sharedFile,
                  resolution: options.resolution || 'prompt',
                });
                continue;
              }
            }

            // Create target directory
            await fs.ensureDir(path.dirname(targetPath));

            // Copy file to scope
            await fs.copy(sharedFile, targetPath, { overwrite: true });

            // Track pull
            meta.pulledFiles[`${dir.name}/${relativePath}`] = {
              pulledAt: new Date().toISOString(),
              version: fileMeta?.version || 1,
              hash: await this.computeHash(targetPath),
            };

            result.pulled.push({
              file: relativePath,
              scope: dir.name,
              target: targetPath,
            });
          } catch (error) {
            result.errors.push({
              file: sharedFile,
              error: error.message,
            });
          }
        }
      }

      // Update sync metadata
      meta.lastSyncDown = new Date().toISOString();
      await this.saveSyncMeta(scopeId, meta);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push({ error: error.message });
    }

    return result;
  }

  /**
   * Find files matching promotable patterns
   * @param {string} scopePath - Scope directory path
   * @returns {Promise<string[]>} Array of file paths
   */
  async findPromotableFiles(scopePath) {
    const files = [];

    for (const pattern of this.promotablePatterns) {
      // Simple glob-like matching
      const parts = pattern.split('/');
      const dir = parts.slice(0, -1).join('/');
      const filePattern = parts.at(-1);

      const searchDir = path.join(scopePath, dir);

      if (await fs.pathExists(searchDir)) {
        // Wrap fs.readdir in try-catch for defensive error handling (race condition protection)
        let entries;
        try {
          entries = await fs.readdir(searchDir, { withFileTypes: true });
        } catch {
          // If directory becomes inaccessible, skip this pattern
          continue;
        }

        for (const entry of entries) {
          if (entry.isFile() && this.matchPattern(entry.name, filePattern)) {
            files.push(path.join(searchDir, entry.name));
          }
        }
      }
    }

    return files;
  }

  /**
   * Simple glob pattern matching
   * @param {string} filename - Filename to test
   * @param {string} pattern - Pattern with * wildcard
   * @returns {boolean} True if matches
   */
  matchPattern(filename, pattern) {
    if (!filename || typeof filename !== 'string') return false;
    if (!pattern || typeof pattern !== 'string') return false;
    if (pattern === '*') return true;

    // ReDoS protection: limit wildcards to prevent catastrophic backtracking
    const wildcardCount = (pattern.match(/\*/g) || []).length;
    if (wildcardCount > 3) {
      // For patterns with many wildcards, fall back to simple includes check
      const parts = pattern.split('*').filter(Boolean);
      return parts.every((part) => filename.includes(part));
    }

    try {
      const regexPattern = pattern.replaceAll('.', String.raw`\.`).replaceAll('*', '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filename);
    } catch {
      // Invalid regex pattern, fall back to simple includes
      return filename.includes(pattern);
    }
  }

  /**
   * Get all files in a directory recursively
   * @param {string} dir - Directory path
   * @returns {Promise<string[]>} Array of file paths
   */
  async getAllFiles(dir) {
    const files = [];

    async function walk(currentDir) {
      // Wrap fs.readdir in try-catch for defensive error handling
      let entries;
      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
      } catch {
        // If directory is inaccessible, skip it
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await walk(dir);
    return files;
  }

  /**
   * Get sync status for a scope
   * @param {string} scopeId - The scope ID
   * @returns {Promise<object>} Sync status
   */
  async getSyncStatus(scopeId) {
    const meta = await this.loadSyncMeta(scopeId);

    return {
      lastSyncUp: meta.lastSyncUp,
      lastSyncDown: meta.lastSyncDown,
      promotedCount: Object.keys(meta.promotedFiles).length,
      pulledCount: Object.keys(meta.pulledFiles).length,
      promotedFiles: Object.keys(meta.promotedFiles),
      pulledFiles: Object.keys(meta.pulledFiles),
    };
  }
}

module.exports = { ScopeSync };
