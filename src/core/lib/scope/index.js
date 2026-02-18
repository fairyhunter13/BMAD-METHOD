/**
 * Scope Management Module
 *
 * Provides multi-scope parallel artifact system for isolated development workflows.
 * Each scope contains its own planning, implementation, and test artifacts.
 *
 * @module scope
 *
 * ## Core Components
 *
 * - **ScopeValidator**: ID and configuration validation
 * - **ScopeManager**: CRUD operations for scopes in scopes.yaml
 * - **ScopeInitializer**: Directory structure creation for new scopes
 * - **ScopeMigrator**: Migrate legacy non-scoped artifacts to scoped structure
 * - **StateLock**: File locking for concurrent access safety
 *
 * ## Directory Structure
 *
 * ```
 * project-root/
 * ├── _bmad/
 * │   └── _config/
 * │       └── scopes.yaml          # Scope registry
 * ├── _bmad-output/
 * │   ├── _shared/                 # Shared artifacts (cross-scope)
 * │   └── {scope}/                 # Individual scope directories
 * │       ├── .scope-meta.yaml     # Scope metadata
 * │       ├── planning-artifacts/
 * │       ├── implementation-artifacts/
 * │       ├── tests/
 * │       └── project-context.md   # Scope-specific context (optional)
 * └── .bmad-scope                  # Active scope marker (gitignored; can be disabled with enabled: false)
 * ```
 *
 * ## Scope Resolution Priority
 *
 * When workflows/agents resolve which scope to use:
 *
 * 1. **--scope flag** (highest): `/workflow --scope auth`
 * 2. **Conversation memory**: Scope set earlier in same conversation
 * 3. **BMAD_SCOPE env var**: `export BMAD_SCOPE=auth`
 * 4. **.bmad-scope file**: Set via `npx bmad-fh scope set auth` (ignored when enabled: false)
 * 5. **Prompt user** (lowest): Ask if scope-required workflow
 *
 * Note: Options 1-3 are parallel-safe for concurrent sessions.
 *
 * ## Usage Example
 *
 * ```javascript
 * const { ScopeManager, ScopeInitializer, ScopeValidator } = require('./scope');
 *
 * // Initialize scope system
 * const initializer = new ScopeInitializer({ projectRoot: '/path/to/project' });
 * await initializer.initializeSystem();
 *
 * // Create a new scope
 * const manager = new ScopeManager({ projectRoot: '/path/to/project' });
 * await manager.createScope('auth', { name: 'Authentication Service' });
 *
 * // Validate scope ID
 * const validator = new ScopeValidator();
 * validator.validateScopeId('my-scope'); // throws if invalid
 * ```
 */

const { ScopeValidator } = require('./scope-validator');
const { ScopeManager } = require('./scope-manager');
const { ScopeInitializer } = require('./scope-initializer');
const { ScopeMigrator } = require('./scope-migrator');
const { ScopeSync } = require('./scope-sync');
const { EventLogger } = require('./event-logger');
const { StateLock } = require('./state-lock');

module.exports = {
  // Core CRUD operations
  ScopeValidator, // ID validation, config schema, circular dependency detection
  ScopeManager, // Create, read, update, delete scopes in scopes.yaml
  ScopeInitializer, // Create directory structure for scopes

  // Migration and sync
  ScopeMigrator, // Migrate legacy non-scoped artifacts to scoped structure
  ScopeSync, // Sync-up (promote) and sync-down (pull) between scopes and shared layer
  EventLogger, // Log cross-scope events for sync tracking

  // Utilities
  StateLock, // File locking for safe concurrent access to state files
};
