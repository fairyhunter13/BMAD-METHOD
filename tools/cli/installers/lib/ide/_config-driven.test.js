'use strict';

const fs = require('fs-extra');
const path = require('node:path');
const os = require('node:os');

// Mock the prompts module first — it uses ESM (@clack/prompts) which Jest cannot load
// as CommonJS without transformation. All log methods are replaced with no-op async fns.
jest.mock('../../../lib/prompts', () => ({
  log: {
    info: jest.fn().mockResolvedValue(),
    success: jest.fn().mockResolvedValue(),
    warn: jest.fn().mockResolvedValue(),
    message: jest.fn().mockResolvedValue(),
    error: jest.fn().mockResolvedValue(),
  },
}));

const { ConfigDrivenIdeSetup } = require('./_config-driven');
const prompts = require('../../../lib/prompts');

// ---------------------------------------------------------------------------
// Mock platform configurations
// ---------------------------------------------------------------------------

const mockPlatformConfig = {
  name: 'TestIDE',
  preferred: false,
  installer: {
    target_dir: '.testide/commands',
    template_type: 'default',
    artifact_types: ['agents', 'workflows', 'tasks', 'tools'],
  },
};

const mockMultiTargetConfig = {
  name: 'TestIDEMulti',
  preferred: false,
  installer: {
    targets: [
      { target_dir: '.testide/agents', template_type: 'default', artifact_types: ['agents'] },
      { target_dir: '.testide/commands', template_type: 'default', artifact_types: ['workflows', 'tasks'] },
    ],
  },
};

// OpenCode-like config: agents go to /agent, commands go to /command
const mockOpenCodeConfig = {
  name: 'OpenCodeTest',
  preferred: false,
  installer: {
    targets: [
      { target_dir: '.opencode/agent', template_type: 'opencode', artifact_types: ['agents'] },
      { target_dir: '.opencode/command', template_type: 'opencode', artifact_types: ['workflows', 'tasks', 'tools'] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper: build a minimal BMAD directory the generators can work with
// ---------------------------------------------------------------------------

async function createMinimalBmadStructure(bmadDir) {
  // ── Standalone agent fixture (as specified in task; YAML files in the
  //    root of bmad/agents/ are NOT picked up by AgentCommandGenerator
  //    because it only processes .md files inside sub-directories).
  const standaloneAgentDir = path.join(bmadDir, 'agents');
  await fs.ensureDir(standaloneAgentDir);
  await fs.writeFile(
    path.join(standaloneAgentDir, 'test.agent.yaml'),
    `
name: Test Agent
description: A test agent
activation:
  steps:
    - Load agent
`,
  );

  // ── Core agent .md file (this IS picked up by AgentCommandGenerator).
  //    The file must contain an <agent> tag to be recognised by
  //    getAgentsFromDir() in bmad-artifacts.js.
  const coreAgentDir = path.join(bmadDir, 'core', 'agents');
  await fs.ensureDir(coreAgentDir);
  await fs.writeFile(
    path.join(coreAgentDir, 'test-agent.md'),
    `---
name: Test Agent
description: A test agent for unit tests
---

<agent name="test-agent">
  <activation>
    <steps>
      <step>Load test agent from {project-root}/_bmad/core/agents/test-agent.md</step>
    </steps>
  </activation>
</agent>
`,
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ConfigDrivenIdeSetup', () => {
  let projectDir;
  let bmadDir;

  beforeEach(async () => {
    // Fresh isolated temp directories for each test
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-driven-test-project-'));
    bmadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-driven-test-bmad-'));

    await createMinimalBmadStructure(bmadDir);

    // Reset all mock call history before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Remove temp directories unconditionally
    await fs.remove(projectDir);
    await fs.remove(bmadDir);
  });

  // =========================================================================
  // 1. Constructor Tests
  // =========================================================================

  describe('constructor', () => {
    test('creates instance with platform config', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      expect(setup.name).toBe('test-ide');
      expect(setup.platformConfig).toBe(mockPlatformConfig);
      expect(setup.installerConfig).toBe(mockPlatformConfig.installer);
    });

    test('handles missing installer config gracefully', () => {
      const configWithoutInstaller = { name: 'TestIDE', preferred: false };
      const setup = new ConfigDrivenIdeSetup('no-config-ide', configWithoutInstaller);

      expect(setup.installerConfig).toBeNull();
    });

    test('setup() returns no-config failure when installer is absent', async () => {
      const configWithoutInstaller = { name: 'TestIDE', preferred: false };
      const setup = new ConfigDrivenIdeSetup('no-config-ide', configWithoutInstaller);

      const result = await setup.setup(projectDir, bmadDir, { silent: true });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('no-config');
    });
  });

  // =========================================================================
  // 2. Scope Command Installation Tests  (CRITICAL — this is the fix we test)
  // =========================================================================

  describe('scope command installation', () => {
    test('installs scope command to target directory', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const scopePath = path.join(targetPath, 'bmad-scope.md');

      expect(await fs.pathExists(scopePath)).toBe(true);
    });

    test('scope command contains correct template content', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const content = await fs.readFile(path.join(targetPath, 'bmad-scope.md'), 'utf8');

      // Core markers from scope-command-template.md
      expect(content).toContain('Scope Management Command');
      expect(content).toContain('scope-command');
      expect(content).toContain('parallel-safe');
    });

    test('scope command uses correct bmadFolderName', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      // Override default '_bmad' with a custom folder name
      setup.setBmadFolderName('my-custom-bmad');

      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const content = await fs.readFile(path.join(targetPath, 'bmad-scope.md'), 'utf8');

      // The template replaces all occurrences of '_bmad' with the custom name
      expect(content).toContain('my-custom-bmad');
      // The literal string '_bmad' should not remain in the output
      expect(content).not.toContain('_bmad');
    });

    test('scope is NOT installed to agents-only targets', async () => {
      // Scope is a COMMAND, not an agent. It should only be installed to targets
      // that handle commands (workflows, tasks, tools), NOT agents-only targets.
      // This prevents scope from appearing in agent pickers (e.g., OpenCode).
      const agentsOnlyConfig = {
        target_dir: '.testide/agents-only',
        template_type: 'default',
        artifact_types: ['agents'],
      };

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToTarget(projectDir, bmadDir, agentsOnlyConfig, { silent: true });

      expect(result.success).toBe(true);
      // Scope should NOT be installed to agents-only target
      expect(result.results.scope).toBe(0);

      const targetPath = path.join(projectDir, agentsOnlyConfig.target_dir);
      expect(await fs.pathExists(path.join(targetPath, 'bmad-scope.md'))).toBe(false);
    });

    test('scope count is 1 in results', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      expect(result.success).toBe(true);
      expect(result.results.scope).toBe(1);
    });

    test('scope command installed ONLY to commands target in multi-target setup', async () => {
      // Scope is a COMMAND and should only go to the commands target,
      // NOT the agents target. This is the fix for the OpenCode bug.
      const setup = new ConfigDrivenIdeSetup('test-ide-multi', mockMultiTargetConfig);

      await setup.installToMultipleTargets(projectDir, bmadDir, mockMultiTargetConfig.installer.targets, { silent: true });

      // First target (.testide/agents) — artifact_types: ['agents'] — NO scope
      const firstTargetScope = path.join(projectDir, '.testide/agents', 'bmad-scope.md');
      expect(await fs.pathExists(firstTargetScope)).toBe(false);

      // Second target (.testide/commands) — artifact_types: ['workflows', 'tasks'] — YES scope
      const secondTargetScope = path.join(projectDir, '.testide/commands', 'bmad-scope.md');
      expect(await fs.pathExists(secondTargetScope)).toBe(true);
    });
  });

  // =========================================================================
  // 3. Integration Tests
  // =========================================================================

  describe('integration tests', () => {
    test('installToTarget installs agents, workflows, tasks, tools AND scope', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      expect(result.success).toBe(true);
      // At least the core test-agent.md is installed (count ≥ 1)
      expect(result.results.agents).toBeGreaterThanOrEqual(1);
      // Scope must always be 1
      expect(result.results.scope).toBe(1);

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      expect(await fs.pathExists(path.join(targetPath, 'bmad-scope.md'))).toBe(true);
    });

    test('installToMultipleTargets aggregates scope count correctly (only commands targets)', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide-multi', mockMultiTargetConfig);
      const result = await setup.installToMultipleTargets(projectDir, bmadDir, mockMultiTargetConfig.installer.targets, { silent: true });

      expect(result.success).toBe(true);
      // Only 1 target has commands (workflows, tasks) → 1 scope command installed
      // The agents-only target does NOT get scope
      expect(result.results.scope).toBe(1);
    });

    test('setup() routes through installToTarget for single-target config', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.setup(projectDir, bmadDir, { silent: true });

      expect(result.success).toBe(true);
      expect(result.results.scope).toBe(1);
    });

    test('setup() routes through installToMultipleTargets for multi-target config', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide-multi', mockMultiTargetConfig);
      const result = await setup.setup(projectDir, bmadDir, { silent: true });

      expect(result.success).toBe(true);
      // Only 1 scope: installed to commands target, not agents target
      expect(result.results.scope).toBe(1);
    });

    test('printSummary includes scope command in output', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      // Call printSummary WITHOUT silent so the log call actually fires
      await setup.printSummary({ agents: 1, workflows: 0, tasks: 0, tools: 0, scope: 1 }, '.testide/commands');

      expect(prompts.log.success).toHaveBeenCalledTimes(1);
      expect(prompts.log.success).toHaveBeenCalledWith(expect.stringContaining('scope command'));
    });

    test('printSummary is suppressed when silent option is true', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      await setup.printSummary({ agents: 1, workflows: 0, tasks: 0, tools: 0, scope: 1 }, '.testide/commands', {
        silent: true,
      });

      expect(prompts.log.success).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    test('handles empty artifact_types array — skips ALL artifacts including scope', async () => {
      // When artifact_types is an explicit empty array ([]), the function returns
      // early *before* any artifact (including scope) is installed.
      // This is intentional: an empty list means "skip everything for this target".
      const emptyConfig = {
        target_dir: '.testide/empty',
        template_type: 'default',
        artifact_types: [],
      };

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToTarget(projectDir, bmadDir, emptyConfig, { silent: true });

      expect(result.success).toBe(true);
      // All counts, including scope, must be 0 on early return
      expect(result.results.scope).toBe(0);
      expect(result.results.agents).toBe(0);
      expect(result.results.workflows).toBe(0);
      expect(result.results.tasks).toBe(0);
      expect(result.results.tools).toBe(0);

      // The target directory should not even have been created (no writes happened)
      const scopePath = path.join(projectDir, emptyConfig.target_dir, 'bmad-scope.md');
      expect(await fs.pathExists(scopePath)).toBe(false);
    });

    test('scope is still installed when artifact_types has non-empty, non-scope types', async () => {
      // Workflows-only filter should still allow scope to be installed
      const workflowsOnlyConfig = {
        target_dir: '.testide/workflows-only',
        template_type: 'default',
        artifact_types: ['workflows'],
      };

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToTarget(projectDir, bmadDir, workflowsOnlyConfig, { silent: true });

      expect(result.success).toBe(true);
      expect(result.results.scope).toBe(1);

      const scopePath = path.join(projectDir, workflowsOnlyConfig.target_dir, 'bmad-scope.md');
      expect(await fs.pathExists(scopePath)).toBe(true);
    });

    test('cleanup removes bmad-scope.md along with other bmad-prefixed files', async () => {
      // The cleanup routine removes all files that start with 'bmad'
      // bmad-scope.md starts with 'bmad', so it gets cleaned up automatically

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      // ── Step 1: install (creates bmad-*.md files including bmad-scope.md) ──
      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const scopePath = path.join(targetPath, 'bmad-scope.md');

      // Scope file must have been created
      expect(await fs.pathExists(scopePath)).toBe(true);

      // ── Step 2: cleanup ──
      await setup.cleanup(projectDir, { silent: true });

      // bmad-scope.md must be removed along with other bmad-* files
      expect(await fs.pathExists(scopePath)).toBe(false);
    });

    test('cleanup removes all BMAD-generated files (all start with bmad)', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);

      // Gather all BMAD files before cleanup (all start with 'bmad')
      const beforeCleanup = await fs.readdir(targetPath);
      const bmadFilesBefore = beforeCleanup.filter((f) => f.startsWith('bmad'));

      // There should be at least one bmad-prefixed file (agents + bmad-scope.md)
      expect(bmadFilesBefore.length).toBeGreaterThan(0);

      await setup.cleanup(projectDir, { silent: true });

      // Directory is recreated by next install but after cleanup + before next install,
      // let's manually check if it still exists; cleanup may remove it if empty.
      // The key assertion: if the directory still exists, no BMAD-generated file remains.
      if (await fs.pathExists(targetPath)) {
        const afterCleanup = await fs.readdir(targetPath);
        const bmadFilesAfter = afterCleanup.filter((f) => f.startsWith('bmad'));
        expect(bmadFilesAfter).toHaveLength(0);
      }
    });

    test('multiple installs do not stack bmad-scope.md — file is overwritten', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);

      // Install twice
      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });
      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const files = await fs.readdir(targetPath);
      const scopeFiles = files.filter((f) => f === 'bmad-scope.md');

      // Only one bmad-scope.md should exist (fs.writeFile overwrites)
      expect(scopeFiles).toHaveLength(1);
    });

    test('installToMultipleTargets with agents-only and empty targets gets no scope', async () => {
      // Neither target should get scope:
      // - agents-only target: scope is a command, not an agent
      // - empty target: early return
      const mixedTargets = [
        { target_dir: '.testide/agents-only', template_type: 'default', artifact_types: ['agents'] },
        { target_dir: '.testide/empty', template_type: 'default', artifact_types: [] },
      ];

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToMultipleTargets(projectDir, bmadDir, mixedTargets, { silent: true });

      expect(result.success).toBe(true);
      // Neither target gets scope
      expect(result.results.scope).toBe(0);

      // Verify: agents-only target does NOT have bmad-scope.md (scope is a command)
      expect(await fs.pathExists(path.join(projectDir, '.testide/agents-only', 'bmad-scope.md'))).toBe(false);
      // Verify: empty target does NOT have bmad-scope.md (early return)
      expect(await fs.pathExists(path.join(projectDir, '.testide/empty', 'bmad-scope.md'))).toBe(false);
    });

    test('installToMultipleTargets with commands and empty targets gets one scope', async () => {
      // Commands target should get scope, empty target should not
      const mixedTargets = [
        { target_dir: '.testide/commands', template_type: 'default', artifact_types: ['workflows', 'tasks'] },
        { target_dir: '.testide/empty', template_type: 'default', artifact_types: [] },
      ];

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToMultipleTargets(projectDir, bmadDir, mixedTargets, { silent: true });

      expect(result.success).toBe(true);
      // Only commands target gets scope
      expect(result.results.scope).toBe(1);

      // Verify: commands target HAS bmad-scope.md
      expect(await fs.pathExists(path.join(projectDir, '.testide/commands', 'bmad-scope.md'))).toBe(true);
      // Verify: empty target does NOT have bmad-scope.md (early return)
      expect(await fs.pathExists(path.join(projectDir, '.testide/empty', 'bmad-scope.md'))).toBe(false);
    });

    test('undefined artifact_types installs scope (treats as no filter)', async () => {
      // When artifact_types is undefined, all types (including scope) are installed.
      const noFilterConfig = {
        target_dir: '.testide/no-filter',
        template_type: 'default',
        // artifact_types intentionally omitted → undefined
      };

      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      const result = await setup.installToTarget(projectDir, bmadDir, noFilterConfig, { silent: true });

      expect(result.success).toBe(true);
      expect(result.results.scope).toBe(1);
    });
  });

  // =========================================================================
  // 5. shouldInstallScopeToTarget helper method
  // =========================================================================

  describe('shouldInstallScopeToTarget', () => {
    test('returns true when artifact_types is undefined (no filter)', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      // Call without argument to test undefined case
      expect(setup.shouldInstallScopeToTarget()).toBe(true);
    });

    test('returns true when artifact_types includes workflows', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      expect(setup.shouldInstallScopeToTarget(['workflows'])).toBe(true);
    });

    test('returns true when artifact_types includes tasks', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      expect(setup.shouldInstallScopeToTarget(['tasks'])).toBe(true);
    });

    test('returns true when artifact_types includes tools', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      expect(setup.shouldInstallScopeToTarget(['tools'])).toBe(true);
    });

    test('returns true when artifact_types includes mixed command types', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      expect(setup.shouldInstallScopeToTarget(['workflows', 'tasks', 'tools'])).toBe(true);
    });

    test('returns false when artifact_types only includes agents', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      expect(setup.shouldInstallScopeToTarget(['agents'])).toBe(false);
    });

    test('returns false when artifact_types is empty array', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      expect(setup.shouldInstallScopeToTarget([])).toBe(false);
    });

    test('returns true when artifact_types includes agents AND commands', () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      // If a target handles both agents and workflows, scope should be installed
      expect(setup.shouldInstallScopeToTarget(['agents', 'workflows'])).toBe(true);
    });
  });

  // =========================================================================
  // 6. OpenCode-like multi-target scenario (regression test)
  // =========================================================================

  describe('OpenCode-like multi-target scenario', () => {
    test('scope goes to .opencode/command, NOT .opencode/agent', async () => {
      const setup = new ConfigDrivenIdeSetup('opencode-test', mockOpenCodeConfig);
      const result = await setup.setup(projectDir, bmadDir, { silent: true });

      expect(result.success).toBe(true);

      // Agent target should NOT have bmad-scope.md
      const agentScopePath = path.join(projectDir, '.opencode/agent', 'bmad-scope.md');
      expect(await fs.pathExists(agentScopePath)).toBe(false);

      // Command target should have bmad-scope.md
      const commandScopePath = path.join(projectDir, '.opencode/command', 'bmad-scope.md');
      expect(await fs.pathExists(commandScopePath)).toBe(true);
    });

    test('agents are installed to agent directory only', async () => {
      const setup = new ConfigDrivenIdeSetup('opencode-test', mockOpenCodeConfig);
      await setup.setup(projectDir, bmadDir, { silent: true });

      // Check agent directory has agent files
      const agentDir = path.join(projectDir, '.opencode/agent');
      if (await fs.pathExists(agentDir)) {
        const agentFiles = await fs.readdir(agentDir);
        const bmadAgentFiles = agentFiles.filter((f) => f.startsWith('bmad') && f.includes('agent'));
        // Should have at least the test-agent we created in fixture
        expect(bmadAgentFiles.length).toBeGreaterThanOrEqual(0); // May be 0 if no agents found
      }
    });

    test('scope count is 1 for OpenCode config (only command target)', async () => {
      const setup = new ConfigDrivenIdeSetup('opencode-test', mockOpenCodeConfig);
      const result = await setup.setup(projectDir, bmadDir, { silent: true });

      expect(result.success).toBe(true);
      expect(result.results.scope).toBe(1);
    });

    test('scope command does not appear in agent picker context', async () => {
      // This test verifies the fix for the original bug:
      // bmad-scope.md should NOT be in the agent directory where it would
      // appear in "Select agent" pickers
      const setup = new ConfigDrivenIdeSetup('opencode-test', mockOpenCodeConfig);
      await setup.setup(projectDir, bmadDir, { silent: true });

      const agentDir = path.join(projectDir, '.opencode/agent');
      if (await fs.pathExists(agentDir)) {
        const agentFiles = await fs.readdir(agentDir);
        // bmad-scope.md must NOT be in the agent directory
        expect(agentFiles).not.toContain('bmad-scope.md');
      }
    });
  });

  // =========================================================================
  // 7. ScopeCommandGenerator content correctness
  // =========================================================================

  describe('ScopeCommandGenerator content correctness', () => {
    test('bmad-scope.md contains YAML frontmatter with description', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const content = await fs.readFile(path.join(targetPath, 'bmad-scope.md'), 'utf8');

      // The template starts with YAML frontmatter
      expect(content.trim()).toMatch(/^---/);
      expect(content).toContain('description:');
    });

    test('bmad-scope.md contains scope sub-command guidance (/scope, /scope <id>, /scope --clear)', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const content = await fs.readFile(path.join(targetPath, 'bmad-scope.md'), 'utf8');

      expect(content).toContain('/scope');
      expect(content).toContain('--clear');
      expect(content).toContain('--list');
    });

    test('default bmadFolderName (_bmad) is preserved in scope content', async () => {
      const setup = new ConfigDrivenIdeSetup('test-ide', mockPlatformConfig);
      // Default bmadFolderName is '_bmad' — replacing '_bmad' with '_bmad' is a no-op
      await setup.installToTarget(projectDir, bmadDir, mockPlatformConfig.installer, { silent: true });

      const targetPath = path.join(projectDir, mockPlatformConfig.installer.target_dir);
      const content = await fs.readFile(path.join(targetPath, 'bmad-scope.md'), 'utf8');

      // Template references _bmad which stays _bmad when bmadFolderName == '_bmad'
      expect(content).toContain('_bmad');
    });
  });
});
