const fs = require('fs-extra');

/**
 * File locking utilities for safe concurrent access to state files
 * Uses file-based locking for cross-process synchronization
 *
 * @class StateLock
 * @requires fs-extra
 *
 * @example
 * const lock = new StateLock();
 * const result = await lock.withLock('/path/to/state.yaml', async () => {
 *   // Safe operations here
 *   return data;
 * });
 */
class StateLock {
  constructor(options = {}) {
    this.staleTimeout = options.staleTimeout || 30_000; // 30 seconds
    this.retries = options.retries || 10;
    this.minTimeout = options.minTimeout || 100;
    this.maxTimeout = options.maxTimeout || 1000;
    this.lockExtension = options.lockExtension || '.lock';
  }

  /**
   * Get lock file path for a given file
   * @param {string} filePath - The file to lock
   * @returns {string} Lock file path
   */
  getLockPath(filePath) {
    return `${filePath}${this.lockExtension}`;
  }

  /**
   * Check if a lock file is stale
   * @param {string} lockPath - Path to lock file
   * @returns {Promise<boolean>} True if lock is stale
   */
  async isLockStale(lockPath) {
    try {
      const stat = await fs.stat(lockPath);
      const age = Date.now() - stat.mtimeMs;
      return age > this.staleTimeout;
    } catch {
      return true; // If we can't stat, consider it stale
    }
  }

  /**
   * Acquire a lock on a file
   * @param {string} filePath - The file to lock
   * @returns {Promise<{success: boolean, lockPath: string}>}
   */
  async acquireLock(filePath) {
    const lockPath = this.getLockPath(filePath);

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        // Check if lock exists
        const lockExists = await fs.pathExists(lockPath);

        if (lockExists) {
          // Check if lock is stale
          const isStale = await this.isLockStale(lockPath);

          if (isStale) {
            // Remove stale lock
            await fs.remove(lockPath);
          } else {
            // Lock is active, wait and retry
            const waitTime = Math.min(this.minTimeout * Math.pow(2, attempt), this.maxTimeout);
            await this.sleep(waitTime);
            continue;
          }
        }

        // Try to create lock file atomically
        const lockContent = {
          pid: process.pid,
          hostname: require('node:os').hostname(),
          created: new Date().toISOString(),
        };

        // Use exclusive flag for atomic creation
        await fs.writeFile(lockPath, JSON.stringify(lockContent), {
          flag: 'wx', // Exclusive create
        });

        return { success: true, lockPath };
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock was created by another process, retry
          const waitTime = Math.min(this.minTimeout * Math.pow(2, attempt), this.maxTimeout);
          await this.sleep(waitTime);
          continue;
        }
        throw error;
      }
    }

    return { success: false, lockPath, reason: 'Max retries exceeded' };
  }

  /**
   * Release a lock on a file
   * @param {string} filePath - The file that was locked
   * @returns {Promise<boolean>} True if lock was released
   */
  async releaseLock(filePath) {
    const lockPath = this.getLockPath(filePath);

    try {
      await fs.remove(lockPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // Lock already gone
      }
      throw error;
    }
  }

  /**
   * Execute operation with file lock
   * @param {string} filePath - File to lock
   * @param {function} operation - Async operation to perform
   * @returns {Promise<any>} Result of operation
   */
  async withLock(filePath, operation) {
    const lockResult = await this.acquireLock(filePath);

    if (!lockResult.success) {
      throw new Error(`Failed to acquire lock on ${filePath}: ${lockResult.reason}`);
    }

    try {
      return await operation();
    } finally {
      await this.releaseLock(filePath);
    }
  }

  /**
   * Sleep helper
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { StateLock };
