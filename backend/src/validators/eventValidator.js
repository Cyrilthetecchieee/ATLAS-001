// ─── Event Validator ─────────────────────────────────────────────────────────
// Validates incoming event payloads.

const config = require('../config');
const { v4: uuidv4 } = require('uuid');

/**
 * Validates and normalizes an event payload.
 * Required: deviceId, type, severity, description.
 * Auto-generates: eventId, timestamp, state defaults.
 */
function validateEvent(body) {
  const errors = [];

  if (!body.deviceId || typeof body.deviceId !== 'string') {
    errors.push('deviceId is required and must be a string.');
  }

  if (!body.type || typeof body.type !== 'string') {
    errors.push('type is required and must be a string.');
  }

  if (!body.severity || !config.severity.includes(body.severity)) {
    errors.push(`severity is required and must be one of: ${config.severity.join(', ')}`);
  }

  if (!body.description || typeof body.description !== 'string') {
    errors.push('description is required and must be a string.');
  }

  if (body.state && !config.eventStates.includes(body.state)) {
    errors.push(`state must be one of: ${config.eventStates.join(', ')}`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalized = {
    eventId: body.eventId || `EVT-${uuidv4().slice(0, 8).toUpperCase()}`,
    deviceId: body.deviceId,
    timestamp: body.timestamp || new Date().toISOString(),
    type: body.type,
    subsystem: body.subsystem || 'System',
    severity: body.severity,
    state: body.state || 'ACTIVE',
    description: body.description,
    source: body.source || 'API'
  };

  return { valid: true, errors: [], normalized };
}

module.exports = { validateEvent };
