const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const yaml = require('yaml');
const { ScopeSync } = require('./scope-sync');
const { ScopeManager } = require('./scope-manager');

describe('ScopeSync', () => {
  let tempDir;
  let sync;
  let manager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scope-sync-test-'));
    sync = new ScopeSync({ projectRoot: tempDir });
    manager = new ScopeManager({ projectRoot: tempDir });

    // Initialize scope system
    await manager.initialize();
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('computeHash', () => {
    test('computes MD5 hash for file', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const hash = await sync.computeHash(testFile);
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(32); // MD5 is 32 chars
    });

    test('returns same hash for identical content', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1, 'identical content');
      await fs.writeFile(file2, 'identical content');

      const hash1 = await sync.computeHash(file1);
      const hash2 = await sync.computeHash(file2);

      expect(hash1).toBe(hash2);
    });

    test('returns different hash for different content', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1, 'content A');
      await fs.writeFile(file2, 'content B');

      const hash1 = await sync.computeHash(file1);
      const hash2 = await sync.computeHash(file2);

      expect(hash1).not.toBe(hash2);
    });

    test('returns null for non-existent file', async () => {
      const hash = await sync.computeHash('/non/existent/file.txt');
      expect(hash).toBeNull();
    });
  });

  describe('syncUp', () => {
    let scopePath;

    beforeEach(async () => {
      // Create a scope with promotable files
      await manager.createScope('auth');
      scopePath = path.join(tempDir, '_bmad-output', 'auth');

      // Create promotable files
      await fs.ensureDir(path.join(scopePath, 'architecture'));
      await fs.writeFile(path.join(scopePath, 'architecture', 'overview.md'), '# Architecture');

      await fs.ensureDir(path.join(scopePath, 'contracts'));
      await fs.writeFile(path.join(scopePath, 'contracts', 'api.md'), '# API Contract');
    });

    test('promotes files matching promotable patterns', async () => {
      const result = await sync.syncUp('auth');

      expect(result.success).toBe(true);
      expect(result.promoted.length).toBeGreaterThan(0);
    });

    test('creates shared directory with scope subdirectory', async () => {
      await sync.syncUp('auth');

      const sharedAuthPath = path.join(tempDir, '_bmad-output', '_shared', 'auth');
      expect(await fs.pathExists(sharedAuthPath)).toBe(true);
    });

    test('copies file content to shared layer', async () => {
      await sync.syncUp('auth');

      const sharedFile = path.join(tempDir, '_bmad-output', '_shared', 'auth', 'architecture', 'overview.md');
      expect(await fs.pathExists(sharedFile)).toBe(true);

      const content = await fs.readFile(sharedFile, 'utf8');
      expect(content).toBe('# Architecture');
    });

    test('creates metadata file for promoted artifacts', async () => {
      await sync.syncUp('auth');

      const metaFile = path.join(tempDir, '_bmad-output', '_shared', 'auth', 'architecture', 'overview.md.meta');
      expect(await fs.pathExists(metaFile)).toBe(true);

      const content = await fs.readFile(metaFile, 'utf8');
      const meta = yaml.parse(content);

      expect(meta.source_scope).toBe('auth');
      expect(meta.promoted_at).toBeTruthy();
      expect(meta.original_hash).toBeTruthy();
    });

    test('detects conflicts without force flag', async () => {
      // First promotion
      await sync.syncUp('auth');

      // Modify local file
      await fs.writeFile(path.join(scopePath, 'architecture', 'overview.md'), '# Modified Architecture');

      // Second promotion without force
      const result = await sync.syncUp('auth');

      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    test('overwrites with force flag', async () => {
      // First promotion
      await sync.syncUp('auth');

      // Modify local file
      const newContent = '# Modified Architecture';
      await fs.writeFile(path.join(scopePath, 'architecture', 'overview.md'), newContent);

      // Second promotion with force
      const result = await sync.syncUp('auth', null, { force: true });

      expect(result.success).toBe(true);

      const sharedFile = path.join(tempDir, '_bmad-output', '_shared', 'auth', 'architecture', 'overview.md');
      const content = await fs.readFile(sharedFile, 'utf8');
      expect(content).toBe(newContent);
    });

    test('updates sync metadata', async () => {
      await sync.syncUp('auth');

      const meta = await sync.loadSyncMeta('auth');
      expect(meta.lastSyncUp).toBeTruthy();
      expect(Object.keys(meta.promotedFiles).length).toBeGreaterThan(0);
    });

    test('skips files that have not changed', async () => {
      // First sync
      await sync.syncUp('auth');

      // Second sync without changes
      const result = await sync.syncUp('auth', null, { force: false });

      // Files should be skipped (not promoted again)
      expect(result.promoted.length).toBe(0);
    });

    test('throws error for non-existent scope', async () => {
      await expect(sync.syncUp('nonexistent')).rejects.toThrow('does not exist');
    });

    test('promotes specific files when provided', async () => {
      const specificFile = path.join(scopePath, 'architecture', 'overview.md');
      const result = await sync.syncUp('auth', [specificFile]);

      expect(result.promoted.some((p) => p.file.includes('overview.md'))).toBe(true);
    });
  });

  describe('syncDown', () => {
    beforeEach(async () => {
      // Create two scopes
      await manager.createScope('auth');
      await manager.createScope('payments');

      // Promote some files from auth
      const authPath = path.join(tempDir, '_bmad-output', 'auth');
      await fs.ensureDir(path.join(authPath, 'contracts'));
      await fs.writeFile(path.join(authPath, 'contracts', 'api.md'), '# Auth API');

      await sync.syncUp('auth');
    });

    test('pulls shared files into scope', async () => {
      const result = await sync.syncDown('payments');

      expect(result.success).toBe(true);
      expect(result.pulled.length).toBeGreaterThan(0);
    });

    test('creates shared subdirectory in scope', async () => {
      await sync.syncDown('payments');

      const paymentsSharedPath = path.join(tempDir, '_bmad-output', 'payments', 'shared');
      expect(await fs.pathExists(paymentsSharedPath)).toBe(true);
    });

    test('copies file content from shared layer', async () => {
      await sync.syncDown('payments');

      const pulledFile = path.join(tempDir, '_bmad-output', 'payments', 'shared', 'auth', 'contracts', 'api.md');
      expect(await fs.pathExists(pulledFile)).toBe(true);

      const content = await fs.readFile(pulledFile, 'utf8');
      expect(content).toBe('# Auth API');
    });

    test('tracks pulled files in metadata', async () => {
      await sync.syncDown('payments');

      const meta = await sync.loadSyncMeta('payments');
      expect(meta.lastSyncDown).toBeTruthy();
      expect(Object.keys(meta.pulledFiles).length).toBeGreaterThan(0);
    });

    test('marks up-to-date files when no changes', async () => {
      // First pull
      await sync.syncDown('payments');

      // Second pull
      const result = await sync.syncDown('payments');

      expect(result.upToDate.length).toBeGreaterThan(0);
    });

    test('detects local conflicts', async () => {
      // First pull
      await sync.syncDown('payments');

      // Modify local file
      const localFile = path.join(tempDir, '_bmad-output', 'payments', 'shared', 'auth', 'contracts', 'api.md');
      await fs.writeFile(localFile, '# Modified locally');

      // Update shared file
      const sharedFile = path.join(tempDir, '_bmad-output', '_shared', 'auth', 'contracts', 'api.md');
      await fs.writeFile(sharedFile, '# Modified in shared');

      // Pull again
      const result = await sync.syncDown('payments', { force: false });

      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    test('overwrites local files with force flag', async () => {
      // First pull
      await sync.syncDown('payments');

      // Modify local file
      const localFile = path.join(tempDir, '_bmad-output', 'payments', 'shared', 'auth', 'contracts', 'api.md');
      await fs.writeFile(localFile, '# Local version');

      // Pull with force
      const result = await sync.syncDown('payments', { force: true });

      expect(result.success).toBe(true);

      const content = await fs.readFile(localFile, 'utf8');
      expect(content).toBe('# Auth API');
    });

    test('throws error for non-existent scope', async () => {
      await expect(sync.syncDown('nonexistent')).rejects.toThrow('does not exist');
    });
  });

  describe('getSyncStatus', () => {
    beforeEach(async () => {
      await manager.createScope('auth');

      const authPath = path.join(tempDir, '_bmad-output', 'auth');
      await fs.ensureDir(path.join(authPath, 'contracts'));
      await fs.writeFile(path.join(authPath, 'contracts', 'api.md'), '# API');

      await sync.syncUp('auth');
    });

    test('returns sync status for scope', async () => {
      const status = await sync.getSyncStatus('auth');

      expect(status.lastSyncUp).toBeTruthy();
      expect(status.promotedCount).toBeGreaterThan(0);
      expect(status.promotedFiles).toContain('contracts/api.md');
    });

    test('returns empty status for scope with no syncs', async () => {
      await manager.createScope('new-scope');

      const status = await sync.getSyncStatus('new-scope');

      expect(status.lastSyncUp).toBeNull();
      expect(status.promotedCount).toBe(0);
      expect(status.pulledCount).toBe(0);
    });
  });

  describe('matchPattern', () => {
    test('matches exact filename', () => {
      expect(sync.matchPattern('file.md', 'file.md')).toBe(true);
    });

    test('matches wildcard pattern', () => {
      expect(sync.matchPattern('file.md', '*.md')).toBe(true);
      expect(sync.matchPattern('file.txt', '*.md')).toBe(false);
    });

    test('matches pattern with multiple wildcards', () => {
      expect(sync.matchPattern('api-v1.md', 'api*.md')).toBe(true);
      expect(sync.matchPattern('api-v1-docs.md', 'api*.md')).toBe(true);
    });

    test('handles null/undefined gracefully', () => {
      expect(sync.matchPattern(null, '*.md')).toBe(false);
      expect(sync.matchPattern('file.md', null)).toBe(false);
    });

    test('limits wildcards to prevent ReDoS', () => {
      const manyWildcards = '*'.repeat(10);
      const result = sync.matchPattern('test.md', `${manyWildcards}.md`);
      // Should fallback to simple includes check
      expect(typeof result).toBe('boolean');
    });

    test('handles invalid regex patterns gracefully', () => {
      // Pattern that would cause regex error
      const result = sync.matchPattern('file.md', '[invalid');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('findPromotableFiles', () => {
    let scopePath;

    beforeEach(async () => {
      await manager.createScope('auth');
      scopePath = path.join(tempDir, '_bmad-output', 'auth');
    });

    test('finds files matching promotable patterns', async () => {
      await fs.ensureDir(path.join(scopePath, 'architecture'));
      await fs.writeFile(path.join(scopePath, 'architecture', 'overview.md'), '# Arch');
      await fs.writeFile(path.join(scopePath, 'architecture', 'details.md'), '# Details');

      const files = await sync.findPromotableFiles(scopePath);

      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.includes('overview.md'))).toBe(true);
    });

    test('skips non-matching files', async () => {
      await fs.ensureDir(path.join(scopePath, 'architecture'));
      await fs.writeFile(path.join(scopePath, 'architecture', 'notes.txt'), 'Notes');

      const files = await sync.findPromotableFiles(scopePath);

      expect(files.some((f) => f.includes('notes.txt'))).toBe(false);
    });

    test('handles non-existent directories', async () => {
      const files = await sync.findPromotableFiles(scopePath);
      expect(files).toEqual([]);
    });
  });

  describe('getAllFiles', () => {
    test('recursively gets all files', async () => {
      const testDir = path.join(tempDir, 'test-get-all');
      await fs.ensureDir(path.join(testDir, 'sub1', 'sub2'));
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'sub1', 'file2.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'sub1', 'sub2', 'file3.txt'), 'content');

      const files = await sync.getAllFiles(testDir);

      expect(files).toHaveLength(3);
      expect(files.some((f) => f.includes('file1.txt'))).toBe(true);
      expect(files.some((f) => f.includes('file2.txt'))).toBe(true);
      expect(files.some((f) => f.includes('file3.txt'))).toBe(true);
    });

    test('handles empty directories', async () => {
      const testDir = path.join(tempDir, 'empty-dir');
      await fs.ensureDir(testDir);

      const files = await sync.getAllFiles(testDir);
      expect(files).toEqual([]);
    });

    test('handles permission errors gracefully', async () => {
      const files = await sync.getAllFiles('/non/existent/path');
      expect(files).toEqual([]);
    });
  });

  describe('loadSyncMeta and saveSyncMeta', () => {
    test('loads default meta for new scope', async () => {
      await manager.createScope('test');

      const meta = await sync.loadSyncMeta('test');

      expect(meta.version).toBe(1);
      expect(meta.lastSyncUp).toBeNull();
      expect(meta.lastSyncDown).toBeNull();
      expect(meta.promotedFiles).toEqual({});
      expect(meta.pulledFiles).toEqual({});
    });

    test('saves and loads metadata', async () => {
      await manager.createScope('test');

      const meta = {
        version: 1,
        lastSyncUp: new Date().toISOString(),
        lastSyncDown: null,
        promotedFiles: {
          'test.md': {
            promotedAt: new Date().toISOString(),
            hash: 'abc123',
            version: 1,
          },
        },
        pulledFiles: {},
      };

      await sync.saveSyncMeta('test', meta);
      const loaded = await sync.loadSyncMeta('test');

      expect(loaded.lastSyncUp).toBe(meta.lastSyncUp);
      expect(loaded.promotedFiles['test.md'].hash).toBe('abc123');
    });

    test('adds updatedAt timestamp when saving', async () => {
      await manager.createScope('test');

      const meta = {
        version: 1,
        lastSyncUp: null,
        lastSyncDown: null,
        promotedFiles: {},
        pulledFiles: {},
      };

      await sync.saveSyncMeta('test', meta);
      const loaded = await sync.loadSyncMeta('test');

      expect(loaded.updatedAt).toBeTruthy();
    });

    test('handles corrupt YAML gracefully', async () => {
      await manager.createScope('test');

      const metaPath = sync.getSyncMetaPath('test');
      await fs.ensureDir(path.dirname(metaPath));
      await fs.writeFile(metaPath, 'invalid: yaml: content:');

      const meta = await sync.loadSyncMeta('test');

      // Should return default meta
      expect(meta.version).toBe(1);
      expect(meta.promotedFiles).toEqual({});
    });
  });
});
