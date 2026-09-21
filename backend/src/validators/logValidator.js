// ─── Log Validator ───────────────────────────────────────────────────────────
// Validates incoming log entries.

const config = require('../config');

/**
 * Validates and normalizes a log entry.
 * Required: source, level, message.
 */
function validateLog(body) {
  const errors = [];

  if (!body.source || !config.logSources.includes(body.source)) {
    errors.push(`source is required and must be one of: ${config.logSources.join(', ')}`);
  }

  if (!body.level || !config.logLevels.includes(body.level)) {
    errors.push(`level is required and must be one of: ${config.logLevels.join(', ')}`);
  }

  if (!body.message || typeof body.message !== 'string') {
    errors.push('message is required and must be a string.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalized = {
    timestamp: body.timestamp || new Date().toISOString(),
    deviceId: body.deviceId || 'ATLAS-001',
    source: body.source,
    level: body.level,
    message: body.message
  };

  return { valid: true, errors: [], normalized };
}

module.exports = { validateLog };
