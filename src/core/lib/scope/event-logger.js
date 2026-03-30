const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('fs-extra');
const yaml = require('yaml');
const { StateLock } = require('./state-lock');

/**
 * Logs and tracks events across scopes
 * Handles event logging for sync operations
 *
 * @class EventLogger
 * @requires fs-extra
 * @requires yaml
 * @requires StateLock
 *
 * @example
 * const logger = new EventLogger({ projectRoot: '/path/to/project' });
 * await logger.logSync('up', 'auth', { promoted: [...] });
 */
class EventLogger {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.bmadPath = path.join(this.projectRoot, '_bmad');
    this.eventsPath = path.join(this.bmadPath, '_events');
    this.eventLogPath = path.join(this.eventsPath, 'event-log.yaml');
    this.stateLock = new StateLock();
    this.maxEvents = options.maxEvents || 1000; // Rotate after this many events
  }

  /**
   * Generate unique event ID using cryptographically secure random bytes
   * @returns {string} Event ID
   */
  generateEventId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex');
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Log an event
   * @param {string} type - Event type
   * @param {string} scopeId - Source scope ID
   * @param {object} data - Event data
   * @returns {Promise<object>} Created event
   */
  async logEvent(type, scopeId, data = {}) {
    const event = {
      id: this.generateEventId(),
      type,
      scope: scopeId,
      timestamp: new Date().toISOString(),
      data,
    };

    return this.stateLock.withLock(this.eventLogPath, async () => {
      // Auto-initialize if event log doesn't exist
      let log;
      if (await fs.pathExists(this.eventLogPath)) {
        const content = await fs.readFile(this.eventLogPath, 'utf8');
        try {
          log = yaml.parse(content) || { version: 1, events: [] };
        } catch {
          // If YAML is malformed, reinitialize the log
          log = { version: 1, events: [] };
        }
      } else {
        // Create parent directory and initialize
        await fs.ensureDir(path.dirname(this.eventLogPath));
        log = { version: 1, events: [] };
      }

      // Ensure events array exists
      if (!log.events) {
        log.events = [];
      }

      // Add event
      log.events.push(event);

      // Rotate if needed
      if (log.events.length > this.maxEvents) {
        // Keep only recent events
        log.events = log.events.slice(-this.maxEvents);
      }

      await fs.writeFile(this.eventLogPath, yaml.stringify(log), 'utf8');
      return event;
    });
  }

  /**
   * Get events for a scope
   * @param {string} scopeId - Scope ID
   * @param {object} options - Filter options
   * @returns {Promise<object[]>} Array of events
   */
  async getEvents(scopeId = null, options = {}) {
    try {
      const content = await fs.readFile(this.eventLogPath, 'utf8');
      // Guard against null/undefined from yaml.parse (empty YAML files)
      const log = yaml.parse(content) || {};
      let events = log.events || [];

      // Filter by scope
      if (scopeId) {
        events = events.filter((e) => e.scope === scopeId);
      }

      // Filter by type
      if (options.type) {
        events = events.filter((e) => e.type === options.type);
      }

      // Filter by time range - validate dates before filtering
      if (options.since) {
        const sinceDate = new Date(options.since);
        // Only filter if date is valid
        if (!isNaN(sinceDate.getTime())) {
          events = events.filter((e) => new Date(e.timestamp) >= sinceDate);
        }
      }

      if (options.until) {
        const untilDate = new Date(options.until);
        // Only filter if date is valid
        if (!isNaN(untilDate.getTime())) {
          events = events.filter((e) => new Date(e.timestamp) <= untilDate);
        }
      }

      // Limit results - validate limit is a positive integer
      if (options.limit && Number.isInteger(options.limit) && options.limit > 0) {
        events = events.slice(-options.limit);
      }

      return events;
    } catch {
      return [];
    }
  }

  /**
   * Common event types
   */
  static EventTypes = {
    ARTIFACT_CREATED: 'artifact_created',
    ARTIFACT_UPDATED: 'artifact_updated',
    ARTIFACT_DELETED: 'artifact_deleted',
    ARTIFACT_PROMOTED: 'artifact_promoted',
    SCOPE_CREATED: 'scope_created',
    SCOPE_ARCHIVED: 'scope_archived',
    SCOPE_ACTIVATED: 'scope_activated',
    SYNC_UP: 'sync_up',
    SYNC_DOWN: 'sync_down',
    WORKFLOW_STARTED: 'workflow_started',
    WORKFLOW_COMPLETED: 'workflow_completed',
  };

  /**
   * Log sync operation
   * @param {string} type - 'up' or 'down'
   * @param {string} scopeId - Scope ID
   * @param {object} result - Sync result
   */
  async logSync(type, scopeId, result) {
    const eventType = type === 'up' ? EventLogger.EventTypes.SYNC_UP : EventLogger.EventTypes.SYNC_DOWN;

    return this.logEvent(eventType, scopeId, {
      files_count: result.promoted?.length || result.pulled?.length || 0,
      conflicts_count: result.conflicts?.length || 0,
      errors_count: result.errors?.length || 0,
    });
  }
}

module.exports = { EventLogger };
