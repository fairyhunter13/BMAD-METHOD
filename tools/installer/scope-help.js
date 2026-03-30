/**
 * BMAD Scope Command - Help Text Module
 *
 * Provides detailed, intentional help for the scope command.
 * Explains WHY scopes exist and HOW to use them effectively.
 */

const chalk = require('chalk');

/**
 * Show comprehensive help for scope command
 */
function showHelp() {
  console.log(chalk.bold('\n  BMAD Scope Management'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  WHY SCOPES?\n'));
  console.log('  Scopes enable parallel development by isolating artifacts into separate');
  console.log('  workspaces. Without scopes, all PRDs, architectures, and implementations');
  console.log('  go to a single shared folder, making parallel feature development messy.\n');
  console.log(chalk.dim('  Example: Working on "auth" and "payments" features simultaneously.'));
  console.log(chalk.dim('  Each gets its own isolated PRD, architecture, and implementation.\n'));

  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('  COMMANDS\n'));
  console.log(`    ${chalk.cyan('init')}                   Initialize scope system in project`);
  console.log(`    ${chalk.cyan('create')} ${chalk.dim('<id> [opts]')}    Create a new scope (alias: new)`);
  console.log(`    ${chalk.cyan('list')} ${chalk.dim('[options]')}        List all scopes (alias: ls)`);
  console.log(`    ${chalk.cyan('info')} ${chalk.dim('<id>')}             Show scope details (alias: show)`);
  console.log(`    ${chalk.cyan('set')} ${chalk.dim('[id]')}              Set active scope (alias: use)`);
  console.log(`    ${chalk.cyan('unset')}                  Clear active scope (alias: clear)`);
  console.log(`    ${chalk.cyan('file-disable')}            Disable .bmad-scope without deleting it`);
  console.log(`    ${chalk.cyan('file-enable')}             Re-enable .bmad-scope for resolution`);
  console.log(`    ${chalk.cyan('remove')} ${chalk.dim('<id> [opts]')}    Remove a scope (alias: rm, delete)`);
  console.log(`    ${chalk.cyan('archive')} ${chalk.dim('<id>')}          Archive a scope (hide from list)`);
  console.log(`    ${chalk.cyan('activate')} ${chalk.dim('<id>')}         Reactivate an archived scope`);
  console.log(`    ${chalk.cyan('migrate')} ${chalk.dim('[id] [opts]')}   Migrate existing artifacts to a scope`);
  console.log(`    ${chalk.cyan('rollback')} ${chalk.dim('[name] [opts]')} Restore from a backup (alias: restore)`);
  console.log(`    ${chalk.cyan('sync-up')} ${chalk.dim('<id> [opts]')}   Promote artifacts to shared layer`);
  console.log(`    ${chalk.cyan('sync-down')} ${chalk.dim('<id> [opts]')} Pull shared artifacts into scope`);
  console.log(`    ${chalk.cyan('help')} ${chalk.dim('[cmd]')}            Show detailed help for a command`);
  console.log();

  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('  HOW SCOPE RESOLUTION WORKS\n'));
  console.log('  When running workflows or commands, scope is resolved in this order:\n');
  console.log(`    ${chalk.green('1.')} ${chalk.cyan('--scope flag')}        /workflow --scope auth    ${chalk.green('(parallel-safe)')}`);
  console.log(`    ${chalk.green('2.')} ${chalk.cyan('Conversation')}        Scope set earlier in chat ${chalk.green('(parallel-safe)')}`);
  console.log(`    ${chalk.green('3.')} ${chalk.cyan('BMAD_SCOPE env')}      export BMAD_SCOPE=auth    ${chalk.green('(parallel-safe)')}`);
  console.log(
    `    ${chalk.yellow('4.')} ${chalk.cyan('.bmad-scope file')}    npx bmad-fh scope set     ${chalk.yellow('(NOT parallel-safe)')}`,
  );
  console.log(`    ${chalk.dim('5.')} ${chalk.cyan('Prompt user')}         Ask if scope required\n`);
  console.log(chalk.dim('  Note: .bmad-scope is ignored when enabled: false (use: npx bmad-fh scope file-disable)'));
  console.log(chalk.dim('  For parallel work, use --scope flag or BMAD_SCOPE env var.\n'));

  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('  QUICK START\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope init`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope create auth --name "Authentication"`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope set auth`);
  console.log(`    ${chalk.dim('# Or for parallel work:')}`);
  console.log(`    ${chalk.green('$')} BMAD_SCOPE=auth npx bmad-fh workflow prd\n`);

  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('  DIRECTORY STRUCTURE\n'));
  console.log('    _bmad-output/');
  console.log(`      ├── ${chalk.yellow('_shared/')}          ${chalk.dim('# Cross-scope shared artifacts')}`);
  console.log(`      ├── ${chalk.green('auth/')}             ${chalk.dim('# Auth scope artifacts')}`);
  console.log('      │   ├── planning-artifacts/');
  console.log('      │   ├── implementation-artifacts/');
  console.log('      │   └── tests/');
  console.log(`      └── ${chalk.green('payments/')}         ${chalk.dim('# Payments scope artifacts')}`);
  console.log('          ├── planning-artifacts/');
  console.log('          └── ...\n');

  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────────\n'));

  console.log(chalk.bold('  MORE HELP\n'));
  console.log(`    ${chalk.cyan('npx bmad-fh scope help <command>')}  ${chalk.dim('Get detailed help for any command')}\n`);
}

/**
 * Show detailed help for 'init' subcommand
 */
function showHelpInit() {
  console.log(chalk.bold('\n  npx bmad-fh scope init'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Initialize the scope system in your project. This creates the necessary');
  console.log('  configuration files and directory structure to enable parallel development.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope init\n`);

  console.log(chalk.bold('  WHAT IT CREATES\n'));
  console.log(`    ${chalk.cyan('_bmad/_config/scopes.yaml')}   Registry of all scopes`);
  console.log(`    ${chalk.cyan('_bmad-output/_shared/')}       Shared artifacts directory\n`);

  console.log(chalk.bold('  NOTES\n'));
  console.log('  • Safe to run multiple times (idempotent)');
  console.log('  • Required before creating or using scopes');
  console.log('  • Does not affect existing artifacts\n');
}

/**
 * Show detailed help for 'create' subcommand
 */
function showHelpCreate() {
  console.log(chalk.bold('\n  npx bmad-fh scope create'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Create a new isolated scope for a feature, service, or work stream.');
  console.log('  Each scope gets its own artifact directories for complete isolation.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope create <id> [options]\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('-n, --name')} ${chalk.dim('<name>')}         Human-readable display name`);
  console.log(`    ${chalk.cyan('-d, --description')} ${chalk.dim('<text>')}  Brief description of the scope`);
  console.log(`    ${chalk.cyan('--deps')} ${chalk.dim('<ids>')}              Comma-separated dependency scope IDs`);
  console.log(`    ${chalk.cyan('--context')}                  Create scope-specific project-context.md\n`);

  console.log(chalk.bold('  SCOPE ID RULES\n'));
  console.log('  • Lowercase letters, numbers, and hyphens only');
  console.log('  • Must start with a letter');
  console.log('  • 2-50 characters long');
  console.log('  • Reserved: _shared, _backup, _config, _events\n');

  console.log(chalk.bold('  EXAMPLES\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope create auth`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope create auth --name "Authentication Service"`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope create payments --deps auth,users\n`);

  console.log(chalk.bold('  WHAT IT CREATES\n'));
  console.log('    _bmad-output/<id>/');
  console.log('      ├── planning-artifacts/      # PRDs, specs, designs');
  console.log('      ├── implementation-artifacts/ # Code plans, migrations');
  console.log('      └── tests/                   # Test artifacts\n');
}

/**
 * Show detailed help for 'list' subcommand
 */
function showHelpList() {
  console.log(chalk.bold('\n  npx bmad-fh scope list'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  List all scopes in the project with their status and metadata.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope list [options]\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('-s, --status')} ${chalk.dim('<status>')}    Filter by status: active | archived\n`);

  console.log(chalk.bold('  EXAMPLES\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope list             ${chalk.dim('# All active scopes')}`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope ls               ${chalk.dim('# Alias')}`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope list --status archived\n`);
}

/**
 * Show detailed help for 'info' subcommand
 */
function showHelpInfo() {
  console.log(chalk.bold('\n  npx bmad-fh scope info'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Display detailed information about a specific scope including paths,');
  console.log('  dependencies, and activity timestamps.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope info <id>`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope <id>       ${chalk.dim('# Shorthand')}\n`);

  console.log(chalk.bold('  DISPLAYED INFORMATION\n'));
  console.log('  • ID, name, description, status');
  console.log('  • Creation and last activity timestamps');
  console.log('  • Full artifact paths');
  console.log('  • Dependencies and dependent scopes\n');
}

/**
 * Show detailed help for 'set' subcommand
 */
function showHelpSet() {
  console.log(chalk.bold('\n  npx bmad-fh scope set'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Set the active scope for your terminal session. Creates a .bmad-scope file');
  console.log('  that workflows read to determine where artifacts should go.\n');
  console.log(chalk.yellow('  ⚠  WARNING: .bmad-scope is shared across ALL terminal sessions.'));
  console.log(chalk.yellow('     For parallel work, use --scope flag or BMAD_SCOPE env var instead.\n'));
  console.log(chalk.dim('  Tip: You can keep .bmad-scope but disable it for resolution:'));
  console.log(chalk.dim(`    ${chalk.cyan('npx bmad-fh scope file-disable')}\n`));

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope set <id>`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope set       ${chalk.dim('# Interactive selection')}\n`);

  console.log(chalk.bold('  PARALLEL-SAFE ALTERNATIVES\n'));
  console.log(`    ${chalk.green('$')} BMAD_SCOPE=auth npx bmad-fh workflow prd`);
  console.log(`    ${chalk.green('$')} /workflow-prd --scope auth  ${chalk.dim('# In IDE')}\n`);

  console.log(chalk.bold('  SCOPE RESOLUTION PRIORITY\n'));
  console.log(`    ${chalk.green('1.')} --scope flag         ${chalk.green('(parallel-safe)')}`);
  console.log(`    ${chalk.green('2.')} Conversation memory  ${chalk.green('(parallel-safe)')}`);
  console.log(`    ${chalk.green('3.')} BMAD_SCOPE env var   ${chalk.green('(parallel-safe)')}`);
  console.log(`    ${chalk.yellow('4.')} .bmad-scope file     ${chalk.yellow('(NOT parallel-safe)')}`);
  console.log(`    ${chalk.dim('5.')} Prompt user\n`);
}

/**
 * Show detailed help for 'unset' subcommand
 */
function showHelpUnset() {
  console.log(chalk.bold('\n  npx bmad-fh scope unset'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Clear the active scope by removing the .bmad-scope file.');
  console.log('  After this, workflows will fall back to env var or prompt for scope.\n');
  console.log(chalk.dim('  Alternative: Keep the file but ignore it with:'));
  console.log(chalk.dim(`    ${chalk.cyan('npx bmad-fh scope file-disable')}\n`));

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope unset`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope clear    ${chalk.dim('# Alias')}\n`);
}

/**
 * Show detailed help for 'file-disable' subcommand
 */
function showHelpFileDisable() {
  console.log(chalk.bold('\n  npx bmad-fh scope file-disable'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Disable the .bmad-scope file for scope resolution WITHOUT deleting it.');
  console.log('  This keeps active_scope on disk but makes workflows ignore the file.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope file-disable\n`);

  console.log(chalk.bold('  BEHAVIOR\n'));
  console.log('  • Sets enabled: false in .bmad-scope');
  console.log('  • Preserves active_scope so you can re-enable later');
  console.log('  • Useful when you want to rely on --scope or BMAD_SCOPE temporarily\n');
}

/**
 * Show detailed help for 'file-enable' subcommand
 */
function showHelpFileEnable() {
  console.log(chalk.bold('\n  npx bmad-fh scope file-enable'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Re-enable the .bmad-scope file for scope resolution without changing active_scope.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope file-enable\n`);

  console.log(chalk.bold('  NOTES\n'));
  console.log('  • If active_scope is missing, use: npx bmad-fh scope set <scope-id>');
  console.log('  • For parallel-safe work, prefer --scope flag or BMAD_SCOPE env var\n');
}

/**
 * Show detailed help for 'remove' subcommand
 */
function showHelpRemove() {
  console.log(chalk.bold('\n  npx bmad-fh scope remove'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Permanently remove a scope and optionally its artifacts.');
  console.log('  By default, creates a backup before removal.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope remove <id> [options]\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('--dry-run')}         Preview what would be removed without making changes`);
  console.log(`    ${chalk.cyan('-f, --force')}       Skip confirmation prompt`);
  console.log(`    ${chalk.cyan('--no-backup')}       Don't create backup ${chalk.red('(dangerous)')}\n`);

  console.log(chalk.bold('  EXAMPLES\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope remove old-feature --dry-run`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope remove old-feature`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rm old-feature --force\n`);

  console.log(chalk.bold('  SAFETY\n'));
  console.log('  • Always creates backup by default');
  console.log('  • Requires confirmation unless --force');
  console.log('  • Consider archiving instead if you might need it later\n');
}

/**
 * Show detailed help for 'archive' subcommand
 */
function showHelpArchive() {
  console.log(chalk.bold('\n  npx bmad-fh scope archive'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Archive a scope to hide it from the default list without deleting it.');
  console.log('  Useful for completed features or paused work.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope archive <id>\n`);

  console.log(chalk.bold('  BEHAVIOR\n'));
  console.log('  • Status changes to "archived"');
  console.log('  • Hidden from default list (use --status archived to see)');
  console.log('  • All artifacts remain intact');
  console.log('  • Can be reactivated anytime\n');
}

/**
 * Show detailed help for 'activate' subcommand
 */
function showHelpActivate() {
  console.log(chalk.bold('\n  npx bmad-fh scope activate'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Reactivate an archived scope, making it visible in the default list again.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope activate <id>\n`);
}

/**
 * Show detailed help for 'migrate' subcommand
 */
function showHelpMigrate() {
  console.log(chalk.bold('\n  npx bmad-fh scope migrate'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Migrate existing non-scoped artifacts to a new or existing scope.');
  console.log('  Use this when adopting scopes in an existing project.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope migrate [id] [options]\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('-f, --force')}       Skip confirmation`);
  console.log(`    ${chalk.cyan('--no-backup')}       Skip backup ${chalk.red('(not recommended)')}\n`);

  console.log(chalk.bold('  WHAT GETS MIGRATED\n'));
  console.log('  • planning-artifacts/');
  console.log('  • implementation-artifacts/');
  console.log('  • tests/');
  console.log('  • project-context.md\n');

  console.log(chalk.bold('  EXAMPLE WORKFLOW\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope init`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope migrate default`);
  console.log(`    ${chalk.dim('# Creates "default" scope with your existing artifacts')}\n`);
}

/**
 * Show detailed help for 'rollback' subcommand
 */
function showHelpRollback() {
  console.log(chalk.bold('\n  npx bmad-fh scope rollback'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Restore files from a backup created by migrate or remove commands.');
  console.log('  Use this to undo a migration or recover deleted scope artifacts.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rollback              ${chalk.dim('# Interactive selection')}`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rollback <name>       ${chalk.dim('# Specific backup')}`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rollback --list       ${chalk.dim('# List backups only')}\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('--list')}            List available backups without restoring`);
  console.log(`    ${chalk.cyan('-f, --force')}       Overwrite existing files without confirmation`);
  console.log(`    ${chalk.cyan('--keep-backup')}     Preserve backup after successful restore\n`);

  console.log(chalk.bold('  BACKUP TYPES\n'));
  console.log(`    ${chalk.blue('migration')}         Created when running: npx bmad-fh scope migrate`);
  console.log(`    ${chalk.yellow('scope-removal')}     Created when running: npx bmad-fh scope remove\n`);

  console.log(chalk.bold('  BACKUP LOCATION\n'));
  console.log('  Backups are stored in _bmad-output/ with names like:');
  console.log('    _backup_migration_1234567890');
  console.log('    _backup_auth_1234567890\n');

  console.log(chalk.bold('  EXAMPLES\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rollback --list`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rollback _backup_migration_1234567890`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope rollback --force --keep-backup\n`);

  console.log(chalk.bold('  SAFETY\n'));
  console.log('  • Backups are removed after successful restore (use --keep-backup to preserve)');
  console.log('  • Existing files are not overwritten unless --force is used');
  console.log('  • Always review backup contents before restoring\n');
}

/**
 * Show detailed help for 'sync-up' subcommand
 */
function showHelpSyncUp() {
  console.log(chalk.bold('\n  npx bmad-fh scope sync-up'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Promote artifacts from your scope to the shared layer (_shared/).');
  console.log('  Other scopes can then access these shared artifacts.\n');

  console.log(chalk.bold('  USE CASE\n'));
  console.log('  You\'ve finalized an architecture doc in "auth" scope and want');
  console.log('  other scopes (like "payments") to be able to read it.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope sync-up <id> [options]\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('--dry-run')}             Preview what would be promoted`);
  console.log(`    ${chalk.cyan('--resolution')} ${chalk.dim('<strategy>')}  keep-local | keep-shared\n`);

  console.log(chalk.bold('  WHAT GETS PROMOTED\n'));
  console.log('  • architecture/*.md');
  console.log('  • contracts/*.md');
  console.log('  • principles/*.md');
  console.log('  • project-context.md\n');

  console.log(chalk.bold('  DIRECTORY STRUCTURE\n'));
  console.log('  Files are promoted to: _shared/<source-scope>/<relative-path>');
  console.log('  For example, promoting from "auth" scope:\n');
  console.log('    Source:  _bmad-output/auth/architecture/api.md');
  console.log('    Target:  _bmad-output/_shared/auth/architecture/api.md\n');
  console.log('  Each promoted file gets a .meta file with source scope and version info.\n');

  console.log(chalk.bold('  EXAMPLE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope sync-up auth --dry-run`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope sync-up auth\n`);
}

/**
 * Show detailed help for 'sync-down' subcommand
 */
function showHelpSyncDown() {
  console.log(chalk.bold('\n  npx bmad-fh scope sync-down'));
  console.log(chalk.dim('  ═══════════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.bold('  PURPOSE\n'));
  console.log('  Pull shared artifacts from the _shared/ layer into your scope.');
  console.log("  Creates a local copy in your scope's shared/ directory.\n");

  console.log(chalk.bold('  USE CASE\n'));
  console.log('  You\'re in "payments" scope and want to reference auth\'s');
  console.log('  architecture that was previously synced up.\n');

  console.log(chalk.bold('  USAGE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope sync-down <id> [options]\n`);

  console.log(chalk.bold('  OPTIONS\n'));
  console.log(`    ${chalk.cyan('--dry-run')}             Preview what would be pulled`);
  console.log(`    ${chalk.cyan('--resolution')} ${chalk.dim('<strategy>')}  keep-local | keep-shared\n`);

  console.log(chalk.bold('  DIRECTORY STRUCTURE\n'));
  console.log('  Files are pulled into: <target-scope>/shared/<source-scope>/<relative-path>');
  console.log('  For example, pulling auth artifacts into "payments" scope:\n');
  console.log('    Source:  _bmad-output/_shared/auth/architecture/api.md');
  console.log('    Target:  _bmad-output/payments/shared/auth/architecture/api.md\n');
  console.log('  This creates a "shared/" subdirectory in your scope to isolate');
  console.log('  pulled artifacts from your own scope artifacts.\n');

  console.log(chalk.bold('  EXAMPLE\n'));
  console.log(`    ${chalk.green('$')} npx bmad-fh scope sync-down payments --dry-run`);
  console.log(`    ${chalk.green('$')} npx bmad-fh scope sync-down payments\n`);
}

/**
 * Router for subcommand-specific help
 * @param {string} subcommand - The subcommand to show help for
 */
function showSubcommandHelp(subcommand) {
  const helpFunctions = {
    init: showHelpInit,
    create: showHelpCreate,
    new: showHelpCreate,
    list: showHelpList,
    ls: showHelpList,
    info: showHelpInfo,
    show: showHelpInfo,
    set: showHelpSet,
    use: showHelpSet,
    unset: showHelpUnset,
    clear: showHelpUnset,
    'file-disable': showHelpFileDisable,
    'disable-file': showHelpFileDisable,
    'file-enable': showHelpFileEnable,
    'enable-file': showHelpFileEnable,
    remove: showHelpRemove,
    rm: showHelpRemove,
    delete: showHelpRemove,
    archive: showHelpArchive,
    activate: showHelpActivate,
    migrate: showHelpMigrate,
    rollback: showHelpRollback,
    restore: showHelpRollback,
    'sync-up': showHelpSyncUp,
    syncup: showHelpSyncUp,
    'sync-down': showHelpSyncDown,
    syncdown: showHelpSyncDown,
  };

  if (helpFunctions[subcommand]) {
    helpFunctions[subcommand]();
  } else {
    console.log(chalk.red(`\n  Unknown command: ${subcommand}\n`));
    console.log(`  Run ${chalk.cyan('npx bmad-fh scope help')} for available commands.\n`);
  }
}

/**
 * Generate help text string for Commander.js
 */
function getHelpText() {
  return [
    '',
    chalk.bold('SUBCOMMANDS'),
    '',
    `  ${chalk.cyan('init')}          Initialize scope system`,
    `  ${chalk.cyan('create')}        Create a new scope`,
    `  ${chalk.cyan('list')}          List all scopes`,
    `  ${chalk.cyan('info')}          Show scope details`,
    `  ${chalk.cyan('set')}           Set active scope`,
    `  ${chalk.cyan('unset')}         Clear active scope`,
    `  ${chalk.cyan('file-disable')}   Disable .bmad-scope file`,
    `  ${chalk.cyan('file-enable')}    Enable .bmad-scope file`,
    `  ${chalk.cyan('remove')}        Remove a scope`,
    `  ${chalk.cyan('archive')}       Archive a scope`,
    `  ${chalk.cyan('activate')}      Reactivate archived scope`,
    `  ${chalk.cyan('migrate')}       Migrate existing artifacts`,
    `  ${chalk.cyan('rollback')}      Restore from backup`,
    `  ${chalk.cyan('sync-up')}       Promote to shared layer`,
    `  ${chalk.cyan('sync-down')}     Pull from shared layer`,
    `  ${chalk.cyan('help')}          Show detailed help`,
    '',
    chalk.bold('SCOPE RESOLUTION (in order)'),
    '',
    `  ${chalk.green('1.')} --scope flag        ${chalk.green('parallel-safe')}`,
    `  ${chalk.green('2.')} Conversation memory ${chalk.green('parallel-safe')}`,
    `  ${chalk.green('3.')} BMAD_SCOPE env var  ${chalk.green('parallel-safe')}`,
    `  ${chalk.yellow('4.')} .bmad-scope file    ${chalk.yellow('shared file')}`,
    '',
    chalk.bold('QUICK START'),
    '',
    `  ${chalk.green('$')} npx bmad-fh scope init`,
    `  ${chalk.green('$')} npx bmad-fh scope create auth`,
    `  ${chalk.green('$')} npx bmad-fh scope set auth`,
    '',
  ].join('\n');
}

/**
 * Configure the Commander command with custom help
 * @param {import('commander').Command} command - The Commander command instance
 */
function configureCommand(command) {
  command.addHelpText('after', getHelpText);
  command.showHelpAfterError('(use --help for available subcommands)');
}

module.exports = {
  showHelp,
  showHelpInit,
  showHelpCreate,
  showHelpList,
  showHelpInfo,
  showHelpSet,
  showHelpUnset,
  showHelpFileDisable,
  showHelpFileEnable,
  showHelpRemove,
  showHelpArchive,
  showHelpActivate,
  showHelpMigrate,
  showHelpRollback,
  showHelpSyncUp,
  showHelpSyncDown,
  showSubcommandHelp,
  getHelpText,
  configureCommand,
};
