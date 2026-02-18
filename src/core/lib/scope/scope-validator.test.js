const { ScopeValidator } = require('./scope-validator');

describe('ScopeValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ScopeValidator();
  });

  describe('validateScopeId', () => {
    describe('valid IDs', () => {
      test('accepts lowercase alphanumeric with hyphens', () => {
        const result = validator.validateScopeId('auth-service');
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
      });

      test('accepts minimum length ID (2 chars)', () => {
        const result = validator.validateScopeId('ab');
        expect(result.valid).toBe(true);
      });

      test('accepts maximum length ID (50 chars)', () => {
        const result = validator.validateScopeId('a'.repeat(50));
        expect(result.valid).toBe(true);
      });

      test('accepts ID starting with letter', () => {
        const result = validator.validateScopeId('a123-456');
        expect(result.valid).toBe(true);
      });

      test('accepts ID ending with number', () => {
        const result = validator.validateScopeId('service-123');
        expect(result.valid).toBe(true);
      });

      test('accepts "default" (not reserved anymore)', () => {
        const result = validator.validateScopeId('default');
        expect(result.valid).toBe(true);
      });
    });

    describe('invalid IDs', () => {
      test('rejects null/undefined', () => {
        expect(validator.validateScopeId(null).valid).toBe(false);
        expect(validator.validateScopeId().valid).toBe(false);
      });

      test('rejects non-string types', () => {
        expect(validator.validateScopeId(123).valid).toBe(false);
        expect(validator.validateScopeId({}).valid).toBe(false);
      });

      test('rejects too short (< 2 chars)', () => {
        const result = validator.validateScopeId('a');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('2 and 50 characters');
      });

      test('rejects too long (> 50 chars)', () => {
        const result = validator.validateScopeId('a'.repeat(51));
        expect(result.valid).toBe(false);
        expect(result.error).toContain('2 and 50 characters');
      });

      test('rejects uppercase letters', () => {
        const result = validator.validateScopeId('Auth');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('lowercase');
      });

      test('rejects starting with hyphen', () => {
        const result = validator.validateScopeId('-auth');
        expect(result.valid).toBe(false);
      });

      test('rejects ending with hyphen', () => {
        const result = validator.validateScopeId('auth-');
        expect(result.valid).toBe(false);
      });

      test('rejects starting with number', () => {
        const result = validator.validateScopeId('123-auth');
        expect(result.valid).toBe(false);
      });

      test('rejects special characters', () => {
        expect(validator.validateScopeId('auth_service').valid).toBe(false);
        expect(validator.validateScopeId('auth.service').valid).toBe(false);
        expect(validator.validateScopeId('auth/service').valid).toBe(false);
      });

      test('rejects reserved IDs', () => {
        expect(validator.validateScopeId('_shared').valid).toBe(false);
        expect(validator.validateScopeId('_events').valid).toBe(false);
        expect(validator.validateScopeId('_config').valid).toBe(false);
        expect(validator.validateScopeId('_backup').valid).toBe(false);
        expect(validator.validateScopeId('global').valid).toBe(false);
      });
    });
  });

  describe('validateScope', () => {
    test('validates complete scope object', () => {
      const scope = {
        id: 'auth',
        name: 'Authentication',
        description: 'Auth service',
        status: 'active',
        dependencies: [],
        created: new Date().toISOString(),
        _meta: {
          last_activity: new Date().toISOString(),
          artifact_count: 5,
        },
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid scope ID', () => {
      const scope = {
        id: 'Invalid-ID',
        name: 'Test',
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('lowercase'))).toBe(true);
    });

    test('rejects missing name', () => {
      const scope = {
        id: 'test',
        name: '',
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name is required'))).toBe(true);
    });

    test('rejects invalid status', () => {
      const scope = {
        id: 'test',
        name: 'Test',
        status: 'invalid',
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid status'))).toBe(true);
    });

    test('rejects non-array dependencies', () => {
      const scope = {
        id: 'test',
        name: 'Test',
        dependencies: 'not-array',
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be an array'))).toBe(true);
    });

    test('rejects self-dependency', () => {
      const scope = {
        id: 'test',
        name: 'Test',
        dependencies: ['test'],
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('depend on itself'))).toBe(true);
    });

    test('rejects non-existent dependency', () => {
      const scope = {
        id: 'test',
        name: 'Test',
        dependencies: ['nonexistent'],
      };

      const allScopes = {
        test: scope,
      };

      const result = validator.validateScope(scope, allScopes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('does not exist'))).toBe(true);
    });

    test('rejects invalid timestamp', () => {
      const scope = {
        id: 'test',
        name: 'Test',
        created: 'invalid-date',
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('timestamp'))).toBe(true);
    });

    test('rejects negative artifact_count', () => {
      const scope = {
        id: 'test',
        name: 'Test',
        _meta: {
          artifact_count: -5,
        },
      };

      const result = validator.validateScope(scope);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('non-negative integer'))).toBe(true);
    });
  });

  describe('detectCircularDependencies', () => {
    test('detects simple circular dependency (A -> B -> A)', () => {
      const allScopes = {
        a: { id: 'a', name: 'A', dependencies: ['b'] },
        b: { id: 'b', name: 'B', dependencies: ['a'] },
      };

      const result = validator.detectCircularDependencies('a', ['b'], allScopes);
      expect(result.hasCircular).toBe(true);
      expect(result.chain).toContain('a');
      expect(result.chain).toContain('b');
    });

    test('detects complex circular dependency (A -> B -> C -> A)', () => {
      const allScopes = {
        a: { id: 'a', name: 'A', dependencies: ['b'] },
        b: { id: 'b', name: 'B', dependencies: ['c'] },
        c: { id: 'c', name: 'C', dependencies: ['a'] },
      };

      const result = validator.detectCircularDependencies('a', ['b'], allScopes);
      expect(result.hasCircular).toBe(true);
      expect(result.chain.length).toBeGreaterThan(2);
    });

    test('allows valid dependency chain (A -> B -> C)', () => {
      const allScopes = {
        a: { id: 'a', name: 'A', dependencies: ['b'] },
        b: { id: 'b', name: 'B', dependencies: ['c'] },
        c: { id: 'c', name: 'C', dependencies: [] },
      };

      const result = validator.detectCircularDependencies('a', ['b'], allScopes);
      expect(result.hasCircular).toBe(false);
    });

    test('handles empty dependencies', () => {
      const result = validator.detectCircularDependencies('a', [], {});
      expect(result.hasCircular).toBe(false);
    });

    test('handles missing scope in dependency chain', () => {
      const allScopes = {
        a: { id: 'a', name: 'A', dependencies: ['missing'] },
      };

      const result = validator.detectCircularDependencies('a', ['missing'], allScopes);
      expect(result.hasCircular).toBe(false);
    });
  });

  describe('validateConfig', () => {
    test('validates complete config', () => {
      const config = {
        version: 1,
        settings: {
          allow_adhoc_scopes: true,
          isolation_mode: 'strict',
          default_output_base: '_bmad-output',
          default_shared_path: '_bmad-output/_shared',
        },
        scopes: {
          auth: {
            id: 'auth',
            name: 'Authentication',
            status: 'active',
            dependencies: [],
            created: new Date().toISOString(),
            _meta: {
              last_activity: new Date().toISOString(),
              artifact_count: 0,
            },
          },
        },
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects null/undefined config', () => {
      expect(validator.validateConfig(null).valid).toBe(false);
      expect(validator.validateConfig().valid).toBe(false);
    });

    test('rejects missing version', () => {
      const config = {
        settings: {},
        scopes: {},
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('version'))).toBe(true);
    });

    test('rejects invalid isolation_mode', () => {
      const config = {
        version: 1,
        settings: {
          isolation_mode: 'invalid',
        },
        scopes: {},
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('isolation_mode'))).toBe(true);
    });

    test('rejects scope ID mismatch', () => {
      const config = {
        version: 1,
        scopes: {
          auth: {
            id: 'wrong-id',
            name: 'Auth',
          },
        },
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('does not match'))).toBe(true);
    });

    test('validates all scopes in config', () => {
      const config = {
        version: 1,
        scopes: {
          auth: {
            id: 'auth',
            name: 'Auth',
            status: 'invalid-status',
          },
        },
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid status'))).toBe(true);
    });
  });

  describe('createDefaultConfig', () => {
    test('creates valid default config', () => {
      const config = validator.createDefaultConfig();

      expect(config.version).toBe(1);
      expect(config.settings.isolation_mode).toBe('strict');
      expect(config.settings.allow_adhoc_scopes).toBe(true);
      expect(config.scopes).toEqual({});

      const validation = validator.validateConfig(config);
      expect(validation.valid).toBe(true);
    });
  });
});
