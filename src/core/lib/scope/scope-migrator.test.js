const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const yaml = require('yaml');
const { ScopeMigrator } = require('./scope-migrator');
const { ScopeManager } = require('./scope-manager');

describe('ScopeMigrator', () => {
  let tempDir;
  let migrator;
  let manager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scope-migrator-test-'));
    migrator = new ScopeMigrator({ projectRoot: tempDir });
    manager = new ScopeManager({ projectRoot: tempDir });
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('needsMigration', () => {
    test('returns false when no legacy artifacts exist', async () => {
      const needs = await migrator.needsMigration();
      expect(needs).toBe(false);
    });

    test('returns true when legacy planning-artifacts exists', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));

      const needs = await migrator.needsMigration();
      expect(needs).toBe(true);
    });

    test('returns true when legacy implementation-artifacts exists', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'implementation-artifacts'));

      const needs = await migrator.needsMigration();
      expect(needs).toBe(true);
    });

    test('returns false when scopes already exist', async () => {
      // Create scopes.yaml with a scope
      await manager.initialize();
      await manager.createScope('default');

      const needs = await migrator.needsMigration();
      expect(needs).toBe(false);
    });

    test('returns true when legacy artifacts exist alongside scopes', async () => {
      // Create both scopes and legacy artifacts
      await manager.initialize();
      await manager.createScope('default');

      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));

      const needs = await migrator.needsMigration();
      expect(needs).toBe(true);
    });
  });

  describe('analyzeExisting', () => {
    test('returns empty analysis when no artifacts', async () => {
      const analysis = await migrator.analyzeExisting();

      expect(analysis.hasLegacyArtifacts).toBe(false);
      expect(analysis.directories).toHaveLength(0);
      expect(analysis.files).toHaveLength(0);
      expect(analysis.totalSize).toBe(0);
    });

    test('detects legacy directories', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));
      await fs.ensureDir(path.join(outputPath, 'implementation-artifacts'));
      await fs.ensureDir(path.join(outputPath, 'tests'));

      const analysis = await migrator.analyzeExisting();

      expect(analysis.hasLegacyArtifacts).toBe(true);
      expect(analysis.directories).toContain('planning-artifacts');
      expect(analysis.directories).toContain('implementation-artifacts');
      expect(analysis.directories).toContain('tests');
    });

    test('counts files and calculates size', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      const planningPath = path.join(outputPath, 'planning-artifacts');
      await fs.ensureDir(planningPath);

      const testContent = 'Test content for size calculation';
      await fs.writeFile(path.join(planningPath, 'prd.md'), testContent);

      const analysis = await migrator.analyzeExisting();

      expect(analysis.hasLegacyArtifacts).toBe(true);
      expect(analysis.files).toContain('prd.md');
      expect(analysis.totalSize).toBeGreaterThan(0);
    });

    test('detects root-level artifacts', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(outputPath);
      await fs.writeFile(path.join(outputPath, 'project-context.md'), 'Context');

      const analysis = await migrator.analyzeExisting();

      expect(analysis.hasLegacyArtifacts).toBe(true);
      expect(analysis.files).toContain('project-context.md');
    });
  });

  describe('migrate', () => {
    beforeEach(async () => {
      // Set up legacy structure
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));
      await fs.ensureDir(path.join(outputPath, 'implementation-artifacts'));
      await fs.ensureDir(path.join(outputPath, 'tests'));

      await fs.writeFile(path.join(outputPath, 'planning-artifacts', 'prd.md'), '# PRD');
      await fs.writeFile(path.join(outputPath, 'implementation-artifacts', 'sprint.yaml'), 'sprints: []');
      await fs.writeFile(path.join(outputPath, 'tests', 'test.md'), '# Tests');

      await manager.initialize();
    });

    test('migrates legacy artifacts to default scope', async () => {
      const result = await migrator.migrate({ backup: true });

      expect(result.success).toBe(true);
      expect(result.scopeId).toBe('default');
      expect(result.migratedFiles.length).toBeGreaterThan(0);
    });

    test('creates backup before migration', async () => {
      const result = await migrator.migrate({ backup: true });

      expect(result.backupPath).toBeTruthy();
      expect(await fs.pathExists(result.backupPath)).toBe(true);
    });

    test('skips migration when not needed', async () => {
      // Remove legacy artifacts
      await fs.remove(path.join(tempDir, '_bmad-output', 'planning-artifacts'));
      await fs.remove(path.join(tempDir, '_bmad-output', 'implementation-artifacts'));
      await fs.remove(path.join(tempDir, '_bmad-output', 'tests'));

      const result = await migrator.migrate();

      expect(result.success).toBe(true);
      expect(result.message).toContain('No migration needed');
    });

    test('migrates to custom scope ID', async () => {
      const result = await migrator.migrate({ scopeId: 'custom' });

      expect(result.success).toBe(true);
      expect(result.scopeId).toBe('custom');

      const scopePath = path.join(tempDir, '_bmad-output', 'custom');
      expect(await fs.pathExists(scopePath)).toBe(true);
    });

    test('creates scope metadata file', async () => {
      await migrator.migrate();

      const metaPath = path.join(tempDir, '_bmad-output', 'default', '.scope-meta.yaml');
      expect(await fs.pathExists(metaPath)).toBe(true);

      const content = await fs.readFile(metaPath, 'utf8');
      const meta = yaml.parse(content);

      expect(meta.scope_id).toBe('default');
      expect(meta.migrated).toBe(true);
      expect(meta.migrated_at).toBeTruthy();
    });

    test('removes original directories after migration', async () => {
      await migrator.migrate();

      const outputPath = path.join(tempDir, '_bmad-output');
      expect(await fs.pathExists(path.join(outputPath, 'planning-artifacts'))).toBe(false);
      expect(await fs.pathExists(path.join(outputPath, 'implementation-artifacts'))).toBe(false);
    });

    test('handles migration without backup', async () => {
      const result = await migrator.migrate({ backup: false });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeNull();
    });

    test('reports errors for skipped files', async () => {
      // Create a file that already exists in target
      const targetPath = path.join(tempDir, '_bmad-output', 'default', 'planning-artifacts');
      await fs.ensureDir(targetPath);
      await fs.writeFile(path.join(targetPath, 'prd.md'), 'Existing content');

      const result = await migrator.migrate();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('already exists'))).toBe(true);
    });
  });

  describe('listBackups', () => {
    test('returns empty array when no backups exist', async () => {
      const backups = await migrator.listBackups();
      expect(backups).toHaveLength(0);
    });

    test('lists migration backups', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      const backupName = `_backup_migration_${Date.now()}`;
      await fs.ensureDir(path.join(outputPath, backupName));

      const backups = await migrator.listBackups();

      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0].type).toBe('migration');
      expect(backups[0].name).toBe(backupName);
    });

    test('lists scope removal backups', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');
      const backupName = `_backup_auth_${Date.now()}`;
      await fs.ensureDir(path.join(outputPath, backupName));

      const backups = await migrator.listBackups();

      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0].type).toBe('scope-removal');
      expect(backups[0].scopeId).toBe('auth');
    });

    test('sorts backups by timestamp (newest first)', async () => {
      const outputPath = path.join(tempDir, '_bmad-output');

      const older = Date.now() - 1000;
      const newer = Date.now();

      await fs.ensureDir(path.join(outputPath, `_backup_migration_${older}`));
      await fs.ensureDir(path.join(outputPath, `_backup_migration_${newer}`));

      const backups = await migrator.listBackups();

      expect(backups[0].timestamp).toBe(newer);
      expect(backups[1].timestamp).toBe(older);
    });
  });

  describe('rollback', () => {
    let backupPath;

    beforeEach(async () => {
      // Create a backup
      const outputPath = path.join(tempDir, '_bmad-output');
      backupPath = path.join(outputPath, `_backup_migration_${Date.now()}`);
      await fs.ensureDir(path.join(backupPath, 'planning-artifacts'));
      await fs.writeFile(path.join(backupPath, 'planning-artifacts', 'prd.md'), '# Backup PRD');
    });

    test('restores files from backup', async () => {
      const result = await migrator.rollback(backupPath, { force: true });

      expect(result.success).toBe(true);
      expect(result.restored.length).toBeGreaterThan(0);

      const outputPath = path.join(tempDir, '_bmad-output');
      const restoredFile = path.join(outputPath, 'planning-artifacts', 'prd.md');
      expect(await fs.pathExists(restoredFile)).toBe(true);

      const content = await fs.readFile(restoredFile, 'utf8');
      expect(content).toBe('# Backup PRD');
    });

    test('removes backup after successful restore', async () => {
      const result = await migrator.rollback(backupPath, { force: true });

      expect(result.backupRemoved).toBe(true);
      expect(await fs.pathExists(backupPath)).toBe(false);
    });

    test('keeps backup when keepBackup option is true', async () => {
      const result = await migrator.rollback(backupPath, { force: true, keepBackup: true });

      expect(result.backupRemoved).toBe(false);
      expect(await fs.pathExists(backupPath)).toBe(true);
    });

    test('skips existing files without force flag', async () => {
      // Create an existing file
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));
      await fs.writeFile(path.join(outputPath, 'planning-artifacts', 'prd.md'), 'Existing content');

      const result = await migrator.rollback(backupPath, { force: false });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('already exists'))).toBe(true);
    });

    test('overwrites existing files with force flag', async () => {
      // Create an existing file
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));
      await fs.writeFile(path.join(outputPath, 'planning-artifacts', 'prd.md'), 'Existing content');

      const result = await migrator.rollback(backupPath, { force: true });

      expect(result.success).toBe(true);

      const content = await fs.readFile(path.join(outputPath, 'planning-artifacts', 'prd.md'), 'utf8');
      expect(content).toBe('# Backup PRD');
    });

    test('throws error for non-existent backup', async () => {
      const result = await migrator.rollback('/non/existent/path');

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes('not found'))).toBe(true);
    });
  });

  describe('createBackup', () => {
    beforeEach(async () => {
      // Create legacy structure
      const outputPath = path.join(tempDir, '_bmad-output');
      await fs.ensureDir(path.join(outputPath, 'planning-artifacts'));
      await fs.writeFile(path.join(outputPath, 'planning-artifacts', 'prd.md'), '# PRD');
      await fs.writeFile(path.join(outputPath, 'project-context.md'), '# Context');
    });

    test('creates backup directory', async () => {
      const backupPath = await migrator.createBackup();

      expect(await fs.pathExists(backupPath)).toBe(true);
      expect(backupPath).toContain('_backup_migration_');
    });

    test('copies legacy directories to backup', async () => {
      const backupPath = await migrator.createBackup();

      const backupPrdPath = path.join(backupPath, 'planning-artifacts', 'prd.md');
      expect(await fs.pathExists(backupPrdPath)).toBe(true);

      const content = await fs.readFile(backupPrdPath, 'utf8');
      expect(content).toBe('# PRD');
    });

    test('copies root-level files to backup', async () => {
      const backupPath = await migrator.createBackup();

      const backupContextPath = path.join(backupPath, 'project-context.md');
      expect(await fs.pathExists(backupContextPath)).toBe(true);
    });
  });

  describe('generateMigrationReadme', () => {
    test('generates README with migration details', () => {
      const readme = migrator.generateMigrationReadme('default', 10);

      expect(readme).toContain('default');
      expect(readme).toContain('10');
      expect(readme).toContain('migration');
    });
  });

  describe('getDirStats', () => {
    test('returns stats for directory', async () => {
      const testDir = path.join(tempDir, 'test-stats');
      await fs.ensureDir(testDir);
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');

      const stats = await migrator.getDirStats(testDir);

      expect(stats.files).toContain('file1.txt');
      expect(stats.files).toContain('file2.txt');
      expect(stats.size).toBeGreaterThan(0);
    });

    test('handles nested directories', async () => {
      const testDir = path.join(tempDir, 'test-nested');
      await fs.ensureDir(path.join(testDir, 'subdir'));
      await fs.writeFile(path.join(testDir, 'subdir', 'nested.txt'), 'nested content');

      const stats = await migrator.getDirStats(testDir);

      expect(stats.files.some((f) => f.includes('nested.txt'))).toBe(true);
    });

    test('handles permission errors gracefully', async () => {
      // This test depends on OS permissions, may need adjustment
      const stats = await migrator.getDirStats('/non/existent/path');
      expect(stats.files).toHaveLength(0);
      expect(stats.size).toBe(0);
    });
  });
});
