const path = require('node:path');
const fs = require('fs-extra');

/**
 * Generates the /scope command for IDE installations
 * This command allows users to set/check scope for parallel-safe execution
 */
class ScopeCommandGenerator {
  constructor(bmadFolderName = 'bmad') {
    this.templatePath = path.join(__dirname, '../templates/scope-command-template.md');
    this.bmadFolderName = bmadFolderName;
  }

  /**
   * Generate scope command content
   * @returns {Promise<string>} Command content
   */
  async generateCommandContent() {
    let template;
    try {
      template = await fs.readFile(this.templatePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read scope command template from ${this.templatePath}: ${error.message}`);
    }

    // Replace template variables
    // Note: {output_folder} is left as-is for runtime resolution by the AI
    return template.replaceAll('_bmad', this.bmadFolderName);
  }

  /**
   * Collect scope command artifact for IDE installation
   * @returns {Promise<Object>} Artifact object
   */
  async collectScopeArtifact() {
    const content = await this.generateCommandContent();

    return {
      type: 'scope-command',
      module: 'core',
      relativePath: 'bmad-scope.md',
      content,
      sourcePath: this.templatePath,
    };
  }

  /**
   * Write scope command to IDE commands directory
   * @param {string} commandsDir - Base commands directory (e.g., .claude/commands/bmad)
   * @returns {Promise<string>} Path to written command
   */
  async writeScopeCommand(commandsDir) {
    const content = await this.generateCommandContent();
    // Use bmad- prefix for consistent cleanup (all BMAD files start with bmad)
    const commandPath = path.join(commandsDir, 'bmad-scope.md');

    await fs.ensureDir(commandsDir);
    await fs.writeFile(commandPath, content);

    return commandPath;
  }
}

module.exports = { ScopeCommandGenerator };
