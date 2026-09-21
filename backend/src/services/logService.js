// ─── Log Service ─────────────────────────────────────────────────────────────
// Manages system log entries — creation and querying.

const Store = require('../models/Store');
const config = require('../config');

const logStore = new Store(config.maxLogs);

/**
 * Create a new log entry.
 */
function create(logEntry) {
  return logStore.add(logEntry);
}

/**
 * Query logs with optional filters.
 */
function query({ device, source, level, limit = 100 } = {}) {
  const filter = (l) => {
    if (device && l.deviceId !== device) return false;
    if (source && l.source !== source) return false;
    if (level && l.level !== level) return false;
    return true;
  };

  return logStore.query({ filter, limit: parseInt(limit, 10) || 100 });
}

module.exports = { create, query, logStore };
