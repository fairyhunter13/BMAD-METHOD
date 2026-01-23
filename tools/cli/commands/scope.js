const chalk = require('chalk');
const path = require('node:path');
const fs = require('fs-extra');
const { select, text, confirm, isCancel } = require('../lib/prompts');

// Import help functions from separate module
const { showHelp, showSubcommandHelp, configureCommand, getHelpText } = require('../lib/scope-help');

// Import scope management classes from core lib
// Note: These will be available after installation in _bmad/core/lib/scope/
// For CLI, we use them from src during development
const { ScopeManager } = require('../../../src/core/lib/scope/scope-manager');
const { ScopeInitializer } = require('../../../src/core/lib/scope/scope-initializer');
const { ScopeValidator } = require('../../../src/core/lib/scope/scope-validator');
const { ScopeMigrator } = require('../../../src/core/lib/scope/scope-migrator');
const { ScopeSync } = require('../../../src/core/lib/scope/scope-sync');
const { EventLogger } = require('../../../src/core/lib/scope/event-logger');

/**
 * Format a date string for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Write the .bmad-scope file to set active scope
 * @param {string} projectRoot - Project root directory
 * @param {string} scopeId - Scope ID to set as active
 */
async function writeScopeFile(projectRoot, scopeId) {
  const scopeFilePath = path.join(projectRoot, '.bmad-scope');
  const scopeContent = `# BMAD Active Scope Configuration
# This file is auto-generated. Do not edit manually.
# To change: npx bmad-fh scope set <scope-id>

active_scope: ${scopeId}
set_at: "${new Date().toISOString()}"
`;
  await fs.writeFile(scopeFilePath, scopeContent, 'utf8');
}

/**
 * Display scope list in a formatted table
 * @param {object[]} scopes - Array of scope objects
 */
function displayScopeList(scopes) {
  if (scopes.length === 0) {
    console.log(chalk.yellow('\nNo scopes found. Create one with: npx bmad-fh scope create <id>\n'));
    return;
  }

  console.log(chalk.bold('\n  Scopes:\n'));

  // Calculate column widths
  const idWidth = Math.max(10, ...scopes.map((s) => s.id.length)) + 2;
  const nameWidth = Math.max(15, ...scopes.map((s) => (s.name || '').length)) + 2;

  // Header
  console.log(
    chalk.dim('  ') +
      chalk.bold('ID'.padEnd(idWidth)) +
      chalk.bold('Name'.padEnd(nameWidth)) +
      chalk.bold('Status'.padEnd(10)) +
      chalk.bold('Created'),
  );
  console.log(chalk.dim('  ' + '─'.repeat(idWidth + nameWidth + 10 + 20)));

  // Rows
  for (const scope of scopes) {
    const statusColor = scope.status === 'active' ? chalk.green : chalk.dim;
    console.log(
      '  ' +
        chalk.cyan(scope.id.padEnd(idWidth)) +
        (scope.name || scope.id).padEnd(nameWidth) +
        statusColor(scope.status.padEnd(10)) +
        chalk.dim(formatDate(scope.created).split(' ')[0]),
    );
  }
  console.log();
}

/**
 * Display detailed scope info
 * @param {object} scope - Scope object
 * @param {object} paths - Scope paths
 * @param {object} tree - Dependency tree
 */
function displayScopeInfo(scope, paths, tree) {
  console.log(chalk.bold(`\n  Scope: ${scope.name || scope.id}\n`));

  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(`  ${chalk.bold('ID:')}           ${chalk.cyan(scope.id)}`);
  console.log(`  ${chalk.bold('Name:')}         ${scope.name || 'N/A'}`);
  console.log(`  ${chalk.bold('Description:')}  ${scope.description || 'No description'}`);
  console.log(`  ${chalk.bold('Status:')}       ${scope.status === 'active' ? chalk.green('active') : chalk.dim('archived')}`);
  console.log(`  ${chalk.bold('Created:')}      ${formatDate(scope.created)}`);
  console.log(`  ${chalk.bold('Last Active:')}  ${formatDate(scope._meta?.last_activity)}`);
  console.log(`  ${chalk.bold('Artifacts:')}    ${scope._meta?.artifact_count || 0}`);

  console.log(chalk.dim('\n  ─────────────────────────────────────'));
  console.log(chalk.bold('  Paths:'));
  console.log(`    Planning:       ${chalk.dim(paths.planning)}`);
  console.log(`    Implementation: ${chalk.dim(paths.implementation)}`);
  console.log(`    Tests:          ${chalk.dim(paths.tests)}`);

  console.log(chalk.dim('\n  ─────────────────────────────────────'));
  console.log(chalk.bold('  Dependencies:'));
  if (tree.dependencies.length > 0) {
    for (const dep of tree.dependencies) {
      const statusIcon = dep.status === 'active' ? chalk.green('●') : chalk.dim('○');
      console.log(`    ${statusIcon} ${dep.scope} (${dep.name})`);
    }
  } else {
    console.log(chalk.dim('    None'));
  }

  console.log(chalk.bold('\n  Dependents (scopes that depend on this):'));
  if (tree.dependents.length > 0) {
    for (const dep of tree.dependents) {
      console.log(`    ← ${chalk.cyan(dep)}`);
    }
  } else {
    console.log(chalk.dim('    None'));
  }

  console.log();
}

/**
 * Handle 'list' subcommand
 */
async function handleList(projectRoot, options) {
  const manager = new ScopeManager({ projectRoot });
  const initializer = new ScopeInitializer({ projectRoot });

  // Check if system is initialized before trying to list
  const isInitialized = await initializer.isSystemInitialized();
  const configExists = await fs.pathExists(path.join(projectRoot, '_bmad', '_config', 'scopes.yaml'));

  if (!isInitialized || !configExists) {
    console.log(chalk.yellow('\nScope system not initialized. Run: npx bmad-fh scope init\n'));
    return;
  }

  try {
    await manager.initialize();
    const scopes = await manager.listScopes(options.status ? { status: options.status } : {});
    displayScopeList(scopes);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log(chalk.yellow('\nScope system not initialized. Run: npx bmad-fh scope init\n'));
    } else {
      throw error;
    }
  }
}

/**
 * Handle 'create' subcommand
 */
async function handleCreate(projectRoot, scopeId, options) {
  const manager = new ScopeManager({ projectRoot });
  const initializer = new ScopeInitializer({ projectRoot });
  const validator = new ScopeValidator();

  // If no scopeId provided, prompt for it
  if (!scopeId) {
    const inputId = await text({
      message: 'Enter scope ID (lowercase, letters/numbers/hyphens):',
      placeholder: 'e.g., auth, payments, user-service',
      validate: (value) => {
        const result = validator.validateScopeId(value);
        return result.valid ? undefined : result.error;
      },
    });

    if (isCancel(inputId)) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
    scopeId = inputId;
  }

  // Validate scope ID
  const idValidation = validator.validateScopeId(scopeId);
  if (!idValidation.valid) {
    console.error(chalk.red(`Error: ${idValidation.error}`));
    process.exit(1);
  }

  // Get scope name if not provided
  let name = options.name;
  if (!name) {
    const inputName = await text({
      message: 'Enter scope name (human-readable):',
      placeholder: `e.g., Authentication Service`,
      initialValue: scopeId.charAt(0).toUpperCase() + scopeId.slice(1).replaceAll('-', ' '),
    });

    if (isCancel(inputName)) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
    name = inputName;
  }

  // Get description if not provided (check for undefined specifically since empty string is valid)
  let description = options.description;
  if (description === undefined) {
    const inputDesc = await text({
      message: 'Enter scope description (optional):',
      placeholder: 'Brief description of this scope',
    });

    if (isCancel(inputDesc)) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
    description = inputDesc || '';
  }

  console.log(chalk.blue('\nCreating scope...'));

  // Initialize scope system if needed
  await manager.initialize();

  // Check if system is initialized
  const systemInit = await initializer.isSystemInitialized();
  if (!systemInit) {
    console.log(chalk.blue('Initializing scope system...'));
    await initializer.initializeScopeSystem();
  }

  // Create scope in configuration and directory structure
  // Note: manager.createScope() now also calls initializer.initializeScope() internally
  const scope = await manager.createScope(scopeId, {
    name,
    description,
    dependencies: options.dependencies ? options.dependencies.split(',').map((d) => d.trim()) : [],
    createContext: options.context,
  });

  // Get paths for display
  const paths = initializer.getScopePaths(scopeId);

  console.log(chalk.green(`\n✓ Scope '${scopeId}' created successfully!\n`));
  console.log(chalk.dim('  Directories created:'));
  console.log(`    ${paths.planning}`);
  console.log(`    ${paths.implementation}`);
  console.log(`    ${paths.tests}`);
  console.log();

  // Prompt to set as active scope (critical UX improvement)
  const setActive = await confirm({
    message: `Set '${scopeId}' as your active scope for this session?`,
    initialValue: true,
  });

  if (!isCancel(setActive) && setActive) {
    await writeScopeFile(projectRoot, scopeId);
    console.log(chalk.green(`\n✓ Active scope set to '${scopeId}'`));
    console.log(chalk.dim('  Workflows will now use this scope automatically.\n'));
  } else {
    console.log(chalk.dim(`\n  To activate later, run: npx bmad-fh scope set ${scopeId}\n`));
  }
}

/**
 * Handle 'info' subcommand
 */
async function handleInfo(projectRoot, scopeId) {
  if (!scopeId) {
    console.error(chalk.red('Error: Scope ID is required. Usage: npx bmad-fh scope info <scope-id>'));
    process.exit(1);
  }

  const manager = new ScopeManager({ projectRoot });

  await manager.initialize();
  const scope = await manager.getScope(scopeId);

  if (!scope) {
    console.error(chalk.red(`Error: Scope '${scopeId}' not found.`));
    process.exit(1);
  }

  const paths = await manager.getScopePaths(scopeId);
  const tree = await manager.getDependencyTree(scopeId);

  displayScopeInfo(scope, paths, tree);
}

/**
 * Handle 'remove' subcommand
 */
async function handleRemove(projectRoot, scopeId, options) {
  if (!scopeId) {
    console.error(chalk.red('Error: Scope ID is required. Usage: npx bmad-fh scope remove <scope-id>'));
    process.exit(1);
  }

  const manager = new ScopeManager({ projectRoot });
  const initializer = new ScopeInitializer({ projectRoot });

  await manager.initialize();

  const scope = await manager.getScope(scopeId);
  if (!scope) {
    console.error(chalk.red(`Error: Scope '${scopeId}' not found.`));
    process.exit(1);
  }

  // Confirm removal unless --force
  if (!options.force) {
    const confirmed = await confirm({
      message: `Are you sure you want to remove scope '${scopeId}'? This will delete all scope artifacts!`,
      initialValue: false,
    });

    if (isCancel(confirmed) || !confirmed) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
  }

  console.log(chalk.blue('\nRemoving scope...'));

  // Remove scope directory (with backup)
  // Note: Commander.js sets options.backup to false when --no-backup is passed
  const shouldBackup = options.backup !== false;
  await initializer.removeScope(scopeId, { backup: shouldBackup });

  // Remove from configuration
  await manager.removeScope(scopeId, { force: true });

  // Clean up .bmad-scope if this was the active scope
  const scopeFilePath = path.join(projectRoot, '.bmad-scope');
  if (await fs.pathExists(scopeFilePath)) {
    try {
      const content = await fs.readFile(scopeFilePath, 'utf8');
      const match = content.match(/active_scope:\s*(\S+)/);
      if (match && match[1] === scopeId) {
        await fs.remove(scopeFilePath);
        console.log(chalk.yellow(`\n  Note: Cleared active scope (was set to '${scopeId}')`));
      }
    } catch {
      // Ignore errors reading .bmad-scope
    }
  }

  console.log(chalk.green(`\n✓ Scope '${scopeId}' removed successfully!`));
  if (shouldBackup) {
    console.log(chalk.dim('  A backup was created in _bmad-output/'));
  }
  console.log();
}

/**
 * Handle 'init' subcommand - Initialize scope system
 */
async function handleInit(projectRoot) {
  const manager = new ScopeManager({ projectRoot });
  const initializer = new ScopeInitializer({ projectRoot });

  console.log(chalk.blue('\nInitializing scope system...'));

  await manager.initialize();
  await initializer.initializeScopeSystem();

  console.log(chalk.green('\n✓ Scope system initialized successfully!\n'));
  console.log(chalk.dim('  Created:'));
  console.log(`    ${chalk.cyan('_bmad/_config/scopes.yaml')} - Scope configuration`);
  console.log(`    ${chalk.cyan('_bmad-output/_shared/')} - Shared knowledge layer`);
  console.log(`    ${chalk.cyan('_bmad/_events/')} - Event system`);
  console.log();
  console.log(chalk.cyan('  Next: npx bmad-fh scope create <scope-id>'));
  console.log();
}

/**
 * Handle 'archive' subcommand
 */
async function handleArchive(projectRoot, scopeId) {
  if (!scopeId) {
    console.error(chalk.red('Error: Scope ID is required. Usage: npx bmad-fh scope archive <scope-id>'));
    process.exit(1);
  }

  const manager = new ScopeManager({ projectRoot });

  await manager.initialize();
  await manager.archiveScope(scopeId);

  console.log(chalk.green(`\n✓ Scope '${scopeId}' archived.\n`));
}

/**
 * Handle 'activate' subcommand
 */
async function handleActivate(projectRoot, scopeId) {
  if (!scopeId) {
    console.error(chalk.red('Error: Scope ID is required. Usage: npx bmad-fh scope activate <scope-id>'));
    process.exit(1);
  }

  const manager = new ScopeManager({ projectRoot });

  await manager.initialize();
  await manager.activateScope(scopeId);

  console.log(chalk.green(`\n✓ Scope '${scopeId}' activated.\n`));
}

/**
 * Handle 'migrate' subcommand - Migrate legacy artifacts to scoped structure
 */
async function handleMigrate(projectRoot, scopeId, options) {
  const migrator = new ScopeMigrator({ projectRoot });
  const manager = new ScopeManager({ projectRoot });

  // Check if migration is needed
  const needsMigration = await migrator.needsMigration();

  if (!needsMigration) {
    console.log(chalk.green('\n✓ No migration needed. Your project is already using scoped structure.\n'));
    return;
  }

  // Analyze existing artifacts
  console.log(chalk.blue('\nAnalyzing existing artifacts...'));
  const analysis = await migrator.analyzeExisting();

  console.log(chalk.dim(`\n  Found legacy artifacts:`));
  console.log(chalk.dim(`    Directories: ${analysis.directories.join(', ') || 'none'}`));
  console.log(chalk.dim(`    Files: ${analysis.files.length}`));
  console.log(chalk.dim(`    Total size: ${(analysis.totalSize / 1024).toFixed(1)} KB`));

  // Determine target scope
  const targetScope = scopeId || analysis.suggestedScope;

  // Handle dry-run mode
  if (options.dryRun) {
    console.log(chalk.yellow(`\n[Dry Run] Would migrate artifacts to scope '${targetScope}'`));
    console.log(chalk.dim('\n  Migration plan:'));
    console.log(chalk.dim(`    - Create scope directory: _bmad-output/${targetScope}/`));
    console.log(chalk.dim(`    - Move planning-artifacts/ → ${targetScope}/planning-artifacts/`));
    console.log(chalk.dim(`    - Move implementation-artifacts/ → ${targetScope}/implementation-artifacts/`));
    console.log(chalk.dim(`    - Move tests/ → ${targetScope}/tests/`));
    if (options.backup !== false) {
      console.log(chalk.dim(`    - Create backup before migration`));
    }
    console.log(chalk.dim('\n  Run without --dry-run to execute.\n'));
    return;
  }

  // Confirm migration unless --force
  if (!options.force) {
    const confirmed = await confirm({
      message: `Migrate legacy artifacts to scope '${targetScope}'? A backup will be created.`,
      initialValue: true,
    });

    if (isCancel(confirmed) || !confirmed) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
  }

  console.log(chalk.blue(`\nMigrating artifacts to scope '${targetScope}'...`));

  // Initialize scope system first
  await manager.initialize();

  // Perform migration
  const result = await migrator.migrate({
    scopeId: targetScope,
    backup: options.backup !== false,
  });

  if (result.success) {
    console.log(chalk.green(`\n✓ Migration complete!\n`));
    console.log(chalk.dim(`  Migrated ${result.migratedFiles.length} items to scope '${targetScope}'`));

    if (result.backupPath) {
      console.log(chalk.dim(`  Backup created at: ${path.relative(projectRoot, result.backupPath)}`));
    }

    if (result.errors.length > 0) {
      console.log(chalk.yellow('\n  Some items were skipped:'));
      for (const err of result.errors) {
        console.log(`    ${chalk.yellow('○')} ${err}`);
      }
    }

    // Register the scope in scopes.yaml if not already registered
    const existingScope = await manager.getScope(targetScope);
    if (!existingScope) {
      try {
        await manager.createScope(targetScope, {
          name: targetScope.charAt(0).toUpperCase() + targetScope.slice(1).replaceAll('-', ' '),
          description: 'Migrated from legacy structure',
        });
        console.log(chalk.dim(`  Registered scope '${targetScope}' in scopes.yaml`));
      } catch {
        // Scope directory already exists from migration, that's ok
      }
    }

    // Prompt to set as active scope
    const setActive = await confirm({
      message: `Set '${targetScope}' as your active scope?`,
      initialValue: true,
    });

    if (!isCancel(setActive) && setActive) {
      await writeScopeFile(projectRoot, targetScope);
      console.log(chalk.green(`\n✓ Active scope set to '${targetScope}'`));
    }

    console.log(chalk.cyan(`\n  Next steps:`));
    console.log(chalk.dim(`    1. Review migrated artifacts in _bmad-output/${targetScope}/`));
    console.log(chalk.dim(`    2. Run workflows with: npx bmad-fh workflow --scope ${targetScope}`));
    console.log(chalk.dim(`    3. Create additional scopes: npx bmad-fh scope create <name>\n`));
  } else {
    console.log(chalk.red('\n✗ Migration failed.\n'));
    for (const err of result.errors) {
      console.log(`  ${chalk.red('•')} ${err}`);
    }
    process.exit(1);
  }
}

/**
 * Handle 'rollback' subcommand - Restore from a migration or removal backup
 */
async function handleRollback(projectRoot, backupName, options) {
  const migrator = new ScopeMigrator({ projectRoot });

  // List available backups
  console.log(chalk.blue('\nScanning for available backups...'));
  const backups = await migrator.listBackups();

  if (backups.length === 0) {
    console.log(chalk.yellow('\nNo backups found in _bmad-output/\n'));
    console.log(chalk.dim('  Backups are created when you:'));
    console.log(chalk.dim('    - Run: npx bmad-fh scope migrate'));
    console.log(chalk.dim('    - Run: npx bmad-fh scope remove <scope-id>\n'));
    return;
  }

  // If --list flag, just show backups
  if (options.list) {
    console.log(chalk.bold('\n  Available Backups:\n'));
    displayBackupList(backups);
    console.log(chalk.dim('\n  To restore: npx bmad-fh scope rollback <backup-name>\n'));
    return;
  }

  // Find or prompt for backup selection
  let selectedBackup;
  if (backupName) {
    selectedBackup = backups.find((b) => b.name === backupName);
    if (!selectedBackup) {
      console.error(chalk.red(`\nError: Backup '${backupName}' not found.\n`));
      console.log(chalk.dim('  Available backups:'));
      for (const b of backups) {
        console.log(`    ${chalk.cyan(b.name)}`);
      }
      console.log();
      process.exit(1);
    }
  } else {
    // Interactive selection
    const choices = backups.map((b) => ({
      value: b.name,
      label: `${b.name} (${b.type}, ${formatDate(b.createdAt)})`,
    }));

    const selected = await select({
      message: 'Select backup to restore:',
      options: choices,
    });

    if (isCancel(selected)) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }

    selectedBackup = backups.find((b) => b.name === selected);
  }

  // Show what will be restored
  console.log(chalk.blue(`\n  Backup: ${chalk.cyan(selectedBackup.name)}`));
  console.log(chalk.dim(`  Type: ${selectedBackup.type}`));
  console.log(chalk.dim(`  Created: ${formatDate(selectedBackup.createdAt)}`));
  console.log(chalk.dim(`  Contents: ${selectedBackup.contents.join(', ')}\n`));

  // Confirm unless --force
  if (!options.force) {
    const confirmed = await confirm({
      message: 'Restore files from this backup? Existing files may be overwritten.',
      initialValue: false,
    });

    if (isCancel(confirmed) || !confirmed) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }
  }

  console.log(chalk.blue('\nRestoring from backup...'));

  const result = await migrator.rollback(selectedBackup.path, {
    force: options.force,
    keepBackup: options.keepBackup,
  });

  if (result.success) {
    console.log(chalk.green('\n✓ Rollback complete!\n'));

    if (result.restored.length > 0) {
      console.log(chalk.dim('  Restored:'));
      for (const item of result.restored) {
        console.log(`    ${chalk.cyan('←')} ${item}`);
      }
    }

    if (result.backupRemoved) {
      console.log(chalk.dim('\n  Backup removed after successful restore.'));
      console.log(chalk.dim('  Use --keep-backup to preserve backup after rollback.'));
    }
  } else {
    console.log(chalk.yellow('\n⚠ Rollback completed with issues.\n'));
  }

  if (result.errors.length > 0) {
    console.log(chalk.yellow('\n  Issues:'));
    for (const err of result.errors) {
      console.log(`    ${chalk.yellow('○')} ${err}`);
    }
  }

  console.log();
}

/**
 * Display backup list in formatted table
 * @param {object[]} backups - Array of backup objects
 */
function displayBackupList(backups) {
  const nameWidth = Math.max(30, ...backups.map((b) => b.name.length)) + 2;

  console.log(chalk.dim('  ') + chalk.bold('Name'.padEnd(nameWidth)) + chalk.bold('Type'.padEnd(15)) + chalk.bold('Created'));
  console.log(chalk.dim('  ' + '─'.repeat(nameWidth + 15 + 25)));

  for (const backup of backups) {
    const typeColor = backup.type === 'migration' ? chalk.blue : chalk.yellow;
    console.log(
      '  ' + chalk.cyan(backup.name.padEnd(nameWidth)) + typeColor(backup.type.padEnd(15)) + chalk.dim(formatDate(backup.createdAt)),
    );
  }
}

/**
 * Handle 'sync-up' subcommand - Promote scope artifacts to shared layer
 */
async function handleSyncUp(projectRoot, scopeId, options) {
  if (!scopeId) {
    console.error(chalk.red('Error: Scope ID is required. Usage: npx bmad-fh scope sync-up <scope-id>'));
    process.exit(1);
  }

  const manager = new ScopeManager({ projectRoot });
  const sync = new ScopeSync({ projectRoot });
  const eventLogger = new EventLogger({ projectRoot });

  await manager.initialize();

  // Verify scope exists
  const scope = await manager.getScope(scopeId);
  if (!scope) {
    console.error(chalk.red(`Error: Scope '${scopeId}' not found.`));
    process.exit(1);
  }

  // Handle dry-run mode
  if (options.dryRun) {
    console.log(chalk.blue(`\n[Dry Run] Analyzing artifacts in '${scopeId}' for promotion...`));

    const promotablePatterns = ['architecture/*.md', 'contracts/*.md', 'principles/*.md', 'project-context.md'];

    console.log(chalk.yellow('\n  Would promote files matching these patterns:\n'));
    for (const pattern of promotablePatterns) {
      console.log(`    ${chalk.cyan('•')} ${pattern}`);
    }

    try {
      const status = await sync.getSyncStatus(scopeId);
      if (status.promotedCount > 0) {
        console.log(chalk.dim(`\n  Previously promoted: ${status.promotedCount} files`));
        for (const file of status.promotedFiles) {
          console.log(`    ${chalk.dim('✓')} ${file}`);
        }
      }
    } catch {
      // Ignore errors getting status
    }

    console.log(chalk.dim('\n  Run without --dry-run to execute.\n'));
    return;
  }

  console.log(chalk.blue(`\nPromoting artifacts from '${scopeId}' to shared layer...`));

  try {
    const syncOptions = {
      force: options.resolution === 'keep-local' ? false : true,
    };
    const result = await sync.syncUp(scopeId, null, syncOptions);

    if (result.success) {
      console.log(chalk.green('\n✓ Sync-up complete!\n'));
    } else {
      console.log(chalk.yellow('\n⚠ Sync-up completed with issues.\n'));
    }

    if (result.promoted && result.promoted.length > 0) {
      console.log(chalk.dim('  Promoted files:'));
      for (const item of result.promoted) {
        const displayFile = typeof item === 'string' ? item : item.file;
        console.log(`    ${chalk.cyan('→')} ${displayFile}`);
      }
    } else {
      console.log(chalk.dim('  No files to promote (already in sync or no promotable artifacts).'));
    }

    if (result.skipped && result.skipped.length > 0) {
      console.log(chalk.dim('\n  Skipped files:'));
      for (const item of result.skipped) {
        const file = typeof item === 'string' ? item : item.file;
        const reason = typeof item === 'object' ? item.reason : 'unknown';
        console.log(`    ${chalk.yellow('○')} ${file} - ${reason}`);
      }
    }

    if (result.conflicts && result.conflicts.length > 0) {
      console.log(chalk.yellow('\n  Conflicts detected:'));
      for (const conflict of result.conflicts) {
        const file = typeof conflict === 'string' ? conflict : conflict.file;
        console.log(`    ${chalk.yellow('!')} ${file}`);
        console.log(`      ${chalk.dim('Use --resolution to auto-resolve')}`);
      }
    }

    if (result.errors && result.errors.length > 0) {
      console.log(chalk.red('\n  Errors:'));
      for (const err of result.errors) {
        if (err.file) {
          console.log(`    ${chalk.red('✗')} ${err.file}: ${err.error}`);
        } else {
          console.log(`    ${chalk.red('✗')} ${err.error}`);
        }
      }
    }

    // Log sync event
    try {
      await eventLogger.logSync('up', scopeId, result);
    } catch {
      // Non-fatal
    }

    console.log();
  } catch (error) {
    console.error(chalk.red(`\nSync-up failed: ${error.message}`));
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Handle 'sync-down' subcommand - Pull shared layer updates into scope
 */
async function handleSyncDown(projectRoot, scopeId, options) {
  if (!scopeId) {
    console.error(chalk.red('Error: Scope ID is required. Usage: npx bmad-fh scope sync-down <scope-id>'));
    process.exit(1);
  }

  const manager = new ScopeManager({ projectRoot });
  const sync = new ScopeSync({ projectRoot });
  const eventLogger = new EventLogger({ projectRoot });

  await manager.initialize();

  // Verify scope exists
  const scope = await manager.getScope(scopeId);
  if (!scope) {
    console.error(chalk.red(`Error: Scope '${scopeId}' not found.`));
    process.exit(1);
  }

  // Handle dry-run mode
  if (options.dryRun) {
    console.log(chalk.blue(`\n[Dry Run] Analyzing shared layer for updates to '${scopeId}'...`));

    try {
      const status = await sync.getSyncStatus(scopeId);
      console.log(chalk.dim(`\n  Last sync-down: ${status.lastSyncDown || 'Never'}`));
      if (status.pulledCount > 0) {
        console.log(chalk.dim(`  Previously pulled: ${status.pulledCount} files`));
        for (const file of status.pulledFiles) {
          console.log(`    ${chalk.dim('✓')} ${file}`);
        }
      }
    } catch {
      // Ignore errors getting status
    }

    console.log(chalk.dim('\n  Run without --dry-run to execute.\n'));
    return;
  }

  console.log(chalk.blue(`\nPulling shared layer updates into '${scopeId}'...`));

  try {
    const syncOptions = {
      force: options.resolution === 'keep-shared',
      resolution: options.resolution || 'keep-local',
    };
    const result = await sync.syncDown(scopeId, syncOptions);

    if (result.success) {
      console.log(chalk.green('\n✓ Sync-down complete!\n'));
    } else {
      console.log(chalk.yellow('\n⚠ Sync-down completed with issues.\n'));
    }

    if (result.pulled && result.pulled.length > 0) {
      console.log(chalk.dim('  Pulled files:'));
      for (const item of result.pulled) {
        const displayFile = typeof item === 'string' ? item : `${item.scope}/${item.file}`;
        console.log(`    ${chalk.cyan('←')} ${displayFile}`);
      }
    } else {
      console.log(chalk.dim('  No new files to pull.'));
    }

    if (result.upToDate && result.upToDate.length > 0) {
      console.log(chalk.dim('\n  Already up-to-date:'));
      for (const item of result.upToDate) {
        const displayFile = typeof item === 'string' ? item : `${item.scope}/${item.file}`;
        console.log(`    ${chalk.green('✓')} ${displayFile}`);
      }
    }

    if (result.conflicts && result.conflicts.length > 0) {
      console.log(chalk.yellow('\n  Conflicts detected:'));
      for (const conflict of result.conflicts) {
        const file = typeof conflict === 'string' ? conflict : `${conflict.scope}/${conflict.file}`;
        console.log(`    ${chalk.yellow('!')} ${file}`);
        console.log(`      ${chalk.dim('Use --resolution to auto-resolve')}`);
      }
    }

    if (result.errors && result.errors.length > 0) {
      console.log(chalk.red('\n  Errors:'));
      for (const err of result.errors) {
        if (err.file) {
          console.log(`    ${chalk.red('✗')} ${err.file}: ${err.error}`);
        } else {
          console.log(`    ${chalk.red('✗')} ${err.error}`);
        }
      }
    }

    // Log sync event
    try {
      await eventLogger.logSync('down', scopeId, result);
    } catch {
      // Non-fatal
    }

    console.log();
  } catch (error) {
    console.error(chalk.red(`\nSync-down failed: ${error.message}`));
    if (process.env.DEBUG) {
      console.error(chalk.dim(error.stack));
    }
    process.exit(1);
  }
}

/**
 * Handle 'set' subcommand - Set the active scope for the session
 */
async function handleSet(projectRoot, scopeId, options) {
  const manager = new ScopeManager({ projectRoot });
  const scopeFilePath = path.join(projectRoot, '.bmad-scope');

  // If no scopeId provided, show current scope or prompt
  if (!scopeId) {
    // Check if there's a current scope
    try {
      if (await fs.pathExists(scopeFilePath)) {
        const content = await fs.readFile(scopeFilePath, 'utf8');
        const match = content.match(/active_scope:\s*(\S+)/);
        if (match) {
          console.log(chalk.blue(`\nCurrent active scope: ${chalk.cyan(match[1])}\n`));

          // Offer to change
          const scopes = await manager.listScopes({ status: 'active' });
          if (scopes.length === 0) {
            console.log(chalk.yellow('No active scopes available. Create one with: npx bmad-fh scope create <id>\n'));
            return;
          }

          const choices = scopes.map((s) => ({ value: s.id, label: `${s.id} - ${s.name || 'No name'}` }));
          choices.push({ value: '__clear__', label: 'Clear active scope' });

          const selected = await select({
            message: 'Select scope to activate:',
            options: choices,
          });

          if (isCancel(selected)) {
            console.log(chalk.yellow('Cancelled.'));
            return;
          }

          if (selected === '__clear__') {
            await fs.remove(scopeFilePath);
            console.log(chalk.green('\n✓ Active scope cleared.\n'));
            return;
          }

          scopeId = selected;
        }
      } else {
        // No current scope, prompt to select
        await manager.initialize();
        const scopes = await manager.listScopes({ status: 'active' });

        if (scopes.length === 0) {
          console.log(chalk.yellow('\nNo scopes available. Create one first:\n'));
          console.log(`  ${chalk.cyan('npx bmad-fh scope create <id>')}\n`);
          return;
        }

        const choices = scopes.map((s) => ({ value: s.id, label: `${s.id} - ${s.name || 'No name'}` }));

        const selected = await select({
          message: 'Select scope to activate:',
          options: choices,
        });

        if (isCancel(selected)) {
          console.log(chalk.yellow('Cancelled.'));
          return;
        }

        scopeId = selected;
      }
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log(chalk.yellow('\nScope system not initialized. Run: npx bmad-fh scope init\n'));
        return;
      }
      throw error;
    }
  }

  // Validate scope exists
  try {
    await manager.initialize();
    const scope = await manager.getScope(scopeId);

    if (!scope) {
      console.error(chalk.red(`\nError: Scope '${scopeId}' not found.`));
      console.log(chalk.dim('Available scopes:'));
      const scopes = await manager.listScopes({ status: 'active' });
      for (const s of scopes) {
        console.log(`  ${chalk.cyan(s.id)} - ${s.name || 'No name'}`);
      }
      console.log();
      process.exit(1);
    }

    if (scope.status === 'archived') {
      console.error(chalk.yellow(`\nWarning: Scope '${scopeId}' is archived. Activate it first with:`));
      console.log(`  ${chalk.cyan(`npx bmad-fh scope activate ${scopeId}`)}\n`);

      const proceed = await confirm({
        message: 'Set as active scope anyway?',
        initialValue: false,
      });

      if (isCancel(proceed) || !proceed) {
        console.log(chalk.yellow('Cancelled.'));
        return;
      }
    }
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log(chalk.yellow('\nScope system not initialized. Run: npx bmad-fh scope init\n'));
      return;
    }
    throw error;
  }

  // Write .bmad-scope file
  await writeScopeFile(projectRoot, scopeId);

  console.log(chalk.green(`\n✓ Active scope set to '${scopeId}'`));
  console.log(chalk.dim(`  File: ${path.join(projectRoot, '.bmad-scope')}`));
  console.log(chalk.dim('\n  Workflows will now use this scope automatically.'));
  console.log(chalk.dim('  You can also use BMAD_SCOPE environment variable to override.\n'));
}

/**
 * Handle 'unset' subcommand - Clear the active scope
 */
async function handleUnset(projectRoot) {
  const scopeFilePath = path.join(projectRoot, '.bmad-scope');

  if (await fs.pathExists(scopeFilePath)) {
    await fs.remove(scopeFilePath);
    console.log(chalk.green('\n✓ Active scope cleared.\n'));
    console.log(chalk.dim('  Workflows will now prompt for scope selection.\n'));
  } else {
    console.log(chalk.yellow('\n  No active scope is set.\n'));
  }
}

module.exports = {
  command: 'scope [subcommand] [id]',
  description: 'Manage scopes for parallel artifact isolation',
  configureCommand,
  options: [
    ['-n, --name <name>', 'Scope name (for create)'],
    ['-d, --description <desc>', 'Scope description'],
    ['--deps, --dependencies <deps>', 'Comma-separated dependency scope IDs'],
    ['-f, --force', 'Force operation without confirmation'],
    ['--no-backup', 'Skip backup on remove'],
    ['--context', 'Create scope-specific project-context.md'],
    ['-s, --status <status>', 'Filter by status (active/archived)'],
    ['--dry-run', 'Show what would be synced without making changes'],
    ['--resolution <strategy>', 'Conflict resolution: keep-local|keep-shared'],
    ['--list', 'List available backups (for rollback)'],
    ['--keep-backup', 'Preserve backup after rollback'],
  ],
  // Export help functions for testing
  showHelp,
  showSubcommandHelp,
  getHelpText,
  action: async (subcommand, id, options) => {
    try {
      // Determine project root
      const projectRoot = process.cwd();

      // Handle subcommands
      switch (subcommand) {
        case 'init': {
          await handleInit(projectRoot);
          break;
        }

        case 'list':
        case 'ls': {
          await handleList(projectRoot, options);
          break;
        }

        case 'create':
        case 'new': {
          await handleCreate(projectRoot, id, options);
          break;
        }

        case 'info':
        case 'show': {
          await handleInfo(projectRoot, id);
          break;
        }

        case 'remove':
        case 'rm':
        case 'delete': {
          await handleRemove(projectRoot, id, options);
          break;
        }

        case 'archive': {
          await handleArchive(projectRoot, id);
          break;
        }

        case 'activate': {
          await handleActivate(projectRoot, id);
          break;
        }

        case 'migrate': {
          await handleMigrate(projectRoot, id, options);
          break;
        }

        case 'rollback':
        case 'restore': {
          await handleRollback(projectRoot, id, options);
          break;
        }

        case 'sync-up':
        case 'syncup': {
          await handleSyncUp(projectRoot, id, options);
          break;
        }

        case 'sync-down':
        case 'syncdown': {
          await handleSyncDown(projectRoot, id, options);
          break;
        }

        case 'set':
        case 'use': {
          await handleSet(projectRoot, id, options);
          break;
        }

        case 'unset':
        case 'clear': {
          await handleUnset(projectRoot);
          break;
        }

        case 'help': {
          // Check if a subcommand was provided for detailed help
          if (id) {
            showSubcommandHelp(id);
          } else {
            showHelp();
          }
          break;
        }

        case undefined: {
          showHelp();
          break;
        }

        default: {
          // If subcommand looks like an ID, show info for it
          if (subcommand && !subcommand.startsWith('-')) {
            await handleInfo(projectRoot, subcommand);
          } else {
            showHelp();
          }
        }
      }

      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(chalk.dim(error.stack));
      }
      process.exit(1);
    }
  },
};
