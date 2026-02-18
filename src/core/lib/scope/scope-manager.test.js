const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');
const yaml = require('yaml');
const { ScopeManager } = require('./scope-manager');

describe('ScopeManager', () => {
  let tempDir;
  let manager;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scope-manager-test-'));
    manager = new ScopeManager({ projectRoot: tempDir });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('initialize', () => {
    test('creates scopes.yaml if it does not exist', async () => {
      const result = await manager.initialize();
      expect(result).toBe(true);

      const scopesFile = path.join(tempDir, '_bmad', '_config', 'scopes.yaml');
      expect(await fs.pathExists(scopesFile)).toBe(true);

      const content = await fs.readFile(scopesFile, 'utf8');
      const config = yaml.parse(content);
      expect(config.version).toBe(1);
      expect(config.scopes).toEqual({});
    });

    test('does not overwrite existing scopes.yaml', async () => {
      await manager.initialize();

      // Add a scope
      await manager.createScope('test', { name: 'Test' });

      // Re-initialize
      await manager.initialize();

      // Scope should still exist
      const scope = await manager.getScope('test');
      expect(scope).toBeTruthy();
      expect(scope.name).toBe('Test');
    });

    test('validates existing configuration', async () => {
      const configPath = path.join(tempDir, '_bmad', '_config');
      await fs.ensureDir(configPath);

      // Write invalid config
      const invalidConfig = {
        version: 'invalid',
        scopes: 'not-object',
      };
      await fs.writeFile(path.join(configPath, 'scopes.yaml'), yaml.stringify(invalidConfig));

      await expect(manager.initialize()).rejects.toThrow('Invalid scopes.yaml');
    });
  });

  describe('createScope', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('creates a new scope with minimal options', async () => {
      const scope = await manager.createScope('auth');

      expect(scope.id).toBe('auth');
      expect(scope.name).toBe('auth');
      expect(scope.status).toBe('active');
      expect(scope.dependencies).toEqual([]);
      expect(scope.created).toBeTruthy();
      expect(scope._meta.last_activity).toBeTruthy();
    });

    test('creates a scope with full options', async () => {
      const scope = await manager.createScope('payments', {
        name: 'Payment Service',
        description: 'Handles payments',
        status: 'active',
        dependencies: [],
      });

      expect(scope.id).toBe('payments');
      expect(scope.name).toBe('Payment Service');
      expect(scope.description).toBe('Handles payments');
    });

    test('rejects invalid scope ID', async () => {
      await expect(manager.createScope('Invalid-ID')).rejects.toThrow();
    });

    test('rejects duplicate scope ID', async () => {
      await manager.createScope('auth');
      await expect(manager.createScope('auth')).rejects.toThrow('already exists');
    });

    test('creates scope directory structure', async () => {
      await manager.createScope('auth');

      const scopeDir = path.join(tempDir, '_bmad-output', 'auth');
      expect(await fs.pathExists(path.join(scopeDir, 'planning-artifacts'))).toBe(true);
      expect(await fs.pathExists(path.join(scopeDir, 'implementation-artifacts'))).toBe(true);
      expect(await fs.pathExists(path.join(scopeDir, 'tests'))).toBe(true);
      expect(await fs.pathExists(path.join(scopeDir, '.scope-meta.yaml'))).toBe(true);
    });

    test('persists scope to scopes.yaml', async () => {
      await manager.createScope('auth', { name: 'Authentication' });

      const scopesFile = path.join(tempDir, '_bmad', '_config', 'scopes.yaml');
      const content = await fs.readFile(scopesFile, 'utf8');
      const config = yaml.parse(content);

      expect(config.scopes.auth).toBeTruthy();
      expect(config.scopes.auth.name).toBe('Authentication');
    });
  });

  describe('listScopes', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('auth', { name: 'Auth', status: 'active' });
      await manager.createScope('payments', { name: 'Payments', status: 'active' });
      await manager.createScope('archived', { name: 'Archived', status: 'archived' });
    });

    test('lists all scopes', async () => {
      const scopes = await manager.listScopes();
      expect(scopes).toHaveLength(3);
    });

    test('filters by status', async () => {
      const activeScopes = await manager.listScopes({ status: 'active' });
      expect(activeScopes).toHaveLength(2);
      expect(activeScopes.every((s) => s.status === 'active')).toBe(true);

      const archivedScopes = await manager.listScopes({ status: 'archived' });
      expect(archivedScopes).toHaveLength(1);
      expect(archivedScopes[0].id).toBe('archived');
    });

    test('sorts scopes by created date (newest first)', async () => {
      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      await manager.createScope('newest', { name: 'Newest' });

      const scopes = await manager.listScopes();
      expect(scopes[0].id).toBe('newest');
    });
  });

  describe('getScope', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('auth', { name: 'Authentication' });
    });

    test('retrieves existing scope', async () => {
      const scope = await manager.getScope('auth');
      expect(scope).toBeTruthy();
      expect(scope.id).toBe('auth');
      expect(scope.name).toBe('Authentication');
    });

    test('returns null for non-existent scope', async () => {
      const scope = await manager.getScope('nonexistent');
      expect(scope).toBeNull();
    });
  });

  describe('updateScope', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('auth', { name: 'Auth', description: 'Old description' });
    });

    test('updates scope properties', async () => {
      const updated = await manager.updateScope('auth', {
        name: 'Authentication Service',
        description: 'New description',
      });

      expect(updated.name).toBe('Authentication Service');
      expect(updated.description).toBe('New description');
    });

    test('prevents changing scope ID', async () => {
      const updated = await manager.updateScope('auth', {
        id: 'different-id',
        name: 'New Name',
      });

      expect(updated.id).toBe('auth'); // ID should remain unchanged
    });

    test('updates last_activity timestamp', async () => {
      const original = await manager.getScope('auth');
      const originalActivity = original._meta.last_activity;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await manager.updateScope('auth', { name: 'Updated' });
      expect(updated._meta.last_activity).not.toBe(originalActivity);
    });

    test('rejects update to non-existent scope', async () => {
      await expect(manager.updateScope('nonexistent', { name: 'Test' })).rejects.toThrow('does not exist');
    });

    test('validates updated scope', async () => {
      await expect(
        manager.updateScope('auth', {
          status: 'invalid-status',
        }),
      ).rejects.toThrow('Invalid scope update');
    });
  });

  describe('removeScope', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('auth', { name: 'Auth' });
      await manager.createScope('payments', { name: 'Payments', dependencies: ['auth'] });
    });

    test('removes scope from configuration', async () => {
      await manager.removeScope('auth', { force: true });

      const scope = await manager.getScope('auth');
      expect(scope).toBeNull();
    });

    test('rejects removal when other scopes depend on it', async () => {
      await expect(manager.removeScope('auth')).rejects.toThrow('depend on it');
    });

    test('allows forced removal with dependent scopes', async () => {
      const result = await manager.removeScope('auth', { force: true });
      expect(result).toBe(true);

      // Check that dependency was removed from payments
      const payments = await manager.getScope('payments');
      expect(payments.dependencies).not.toContain('auth');
    });

    test('rejects removal of non-existent scope', async () => {
      await expect(manager.removeScope('nonexistent')).rejects.toThrow('does not exist');
    });
  });

  describe('archiveScope and activateScope', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('auth', { name: 'Auth', status: 'active' });
    });

    test('archives an active scope', async () => {
      const archived = await manager.archiveScope('auth');
      expect(archived.status).toBe('archived');
    });

    test('activates an archived scope', async () => {
      await manager.archiveScope('auth');
      const activated = await manager.activateScope('auth');
      expect(activated.status).toBe('active');
    });
  });

  describe('getScopePaths', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('auth');
    });

    test('returns correct paths for scope', async () => {
      const paths = await manager.getScopePaths('auth');

      expect(paths.root).toBe(path.join(tempDir, '_bmad-output', 'auth'));
      expect(paths.planning).toBe(path.join(tempDir, '_bmad-output', 'auth', 'planning-artifacts'));
      expect(paths.implementation).toBe(path.join(tempDir, '_bmad-output', 'auth', 'implementation-artifacts'));
      expect(paths.tests).toBe(path.join(tempDir, '_bmad-output', 'auth', 'tests'));
      expect(paths.meta).toBe(path.join(tempDir, '_bmad-output', 'auth', '.scope-meta.yaml'));
    });

    test('throws error for non-existent scope', async () => {
      await expect(manager.getScopePaths('nonexistent')).rejects.toThrow('does not exist');
    });
  });

  describe('getDependencyTree', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('core', { name: 'Core' });
      await manager.createScope('auth', { name: 'Auth', dependencies: ['core'] });
      await manager.createScope('payments', { name: 'Payments', dependencies: ['auth', 'core'] });
    });

    test('returns dependency tree with dependencies and dependents', async () => {
      const tree = await manager.getDependencyTree('auth');

      expect(tree.scope).toBe('auth');
      expect(tree.dependencies).toHaveLength(1);
      expect(tree.dependencies[0].scope).toBe('core');
      expect(tree.dependents).toContain('payments');
    });

    test('handles scope with no dependencies', async () => {
      const tree = await manager.getDependencyTree('core');

      expect(tree.dependencies).toHaveLength(0);
      expect(tree.dependents).toEqual(expect.arrayContaining(['auth', 'payments']));
    });

    test('throws error for non-existent scope', async () => {
      await expect(manager.getDependencyTree('nonexistent')).rejects.toThrow('does not exist');
    });
  });

  describe('findDependentScopes', () => {
    beforeEach(async () => {
      await manager.initialize();
      await manager.createScope('core', { name: 'Core' });
      await manager.createScope('auth', { name: 'Auth', dependencies: ['core'] });
      await manager.createScope('payments', { name: 'Payments', dependencies: ['core'] });
    });

    test('finds all scopes that depend on target', async () => {
      const config = await manager.loadConfig();
      const dependents = manager.findDependentScopes('core', config.scopes);

      expect(dependents).toHaveLength(2);
      expect(dependents).toEqual(expect.arrayContaining(['auth', 'payments']));
    });

    test('returns empty array when no dependents', async () => {
      const config = await manager.loadConfig();
      const dependents = manager.findDependentScopes('auth', config.scopes);

      expect(dependents).toHaveLength(0);
    });

    test('handles null/undefined allScopes parameter', () => {
      expect(manager.findDependentScopes('test', null)).toEqual([]);
      expect(manager.findDependentScopes('test')).toEqual([]);
    });
  });

  describe('config caching', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    test('caches loaded configuration', async () => {
      const config1 = await manager.loadConfig();
      const config2 = await manager.loadConfig();

      expect(config1).toBe(config2); // Same object reference
    });

    test('forceReload bypasses cache', async () => {
      const config1 = await manager.loadConfig();

      // Modify config file directly
      const scopesFile = path.join(tempDir, '_bmad', '_config', 'scopes.yaml');
      const content = await fs.readFile(scopesFile, 'utf8');
      const config = yaml.parse(content);
      config.test_field = 'test_value';
      await fs.writeFile(scopesFile, yaml.stringify(config));

      const config2 = await manager.loadConfig(true); // Force reload

      expect(config2).not.toBe(config1);
      expect(config2.test_field).toBe('test_value');
    });
  });

  describe('setProjectRoot', () => {
    test('updates all paths when project root changes', async () => {
      const newRoot = path.join(tempDir, 'new-root');
      await fs.ensureDir(newRoot);

      manager.setProjectRoot(newRoot);

      expect(manager.projectRoot).toBe(newRoot);
      expect(manager.bmadPath).toBe(path.join(newRoot, '_bmad'));
      expect(manager.configPath).toBe(path.join(newRoot, '_bmad', '_config'));
    });

    test('clears cache when project root changes', async () => {
      await manager.initialize();
      const config1 = await manager.loadConfig();

      manager.setProjectRoot(tempDir); // Set to same root to test cache clear

      // Cache should be cleared
      expect(manager._config).toBeNull();
    });
  });
});
