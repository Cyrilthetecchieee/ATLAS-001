// ─── Telemetry Validator ─────────────────────────────────────────────────────
// Validates incoming telemetry packets. Transport-independent.
// Does NOT invent scientific thresholds.

const config = require('../config');

/**
 * Validates a telemetry payload and returns { valid, errors, normalized }.
 * Required structural fields: deviceId, mode, transport.
 * Everything else is optional — sensors may temporarily fail.
 */
function validateTelemetry(body) {
  const errors = [];

  // ── Required structural fields ─────────────────────────────────────────────
  if (!body.deviceId || typeof body.deviceId !== 'string') {
    errors.push('deviceId is required and must be a string.');
  }

  if (body.mode && !config.modes.includes(body.mode)) {
    errors.push(`mode must be one of: ${config.modes.join(', ')}`);
  }

  if (body.transport && !config.transports.includes(body.transport)) {
    errors.push(`transport must be one of: ${config.transports.join(', ')}`);
  }

  if (body.systemHealth && !config.systemHealth.includes(body.systemHealth)) {
    errors.push(`systemHealth must be one of: ${config.systemHealth.join(', ')}`);
  }

  if (body.dataQuality && !config.dataQuality.includes(body.dataQuality)) {
    errors.push(`dataQuality must be one of: ${config.dataQuality.join(', ')}`);
  }

  if (body.sequence !== undefined && typeof body.sequence !== 'number') {
    errors.push('sequence must be a number.');
  }

  // ── Optional nested validation (shallow type checks) ───────────────────────
  if (body.environment) {
    if (typeof body.environment !== 'object') {
      errors.push('environment must be an object.');
    }
  }

  if (body.motion) {
    if (typeof body.motion !== 'object') {
      errors.push('motion must be an object.');
    }
  }

  if (body.power) {
    if (typeof body.power !== 'object') {
      errors.push('power must be an object.');
    }
  }

  if (body.communication) {
    if (typeof body.communication !== 'object') {
      errors.push('communication must be an object.');
    }
    if (body.communication && body.communication.state &&
        !config.communicationStates.includes(body.communication.state)) {
      errors.push(`communication.state must be one of: ${config.communicationStates.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── Normalize ──────────────────────────────────────────────────────────────
  const normalized = {
    deviceId: body.deviceId,
    timestamp: body.timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    sequence: body.sequence ?? null,
    mode: body.mode || 'SIMULATION',
    transport: body.transport || 'SIMULATION',
    systemHealth: body.systemHealth || 'NORMAL',
    dataQuality: body.dataQuality || 'VALID',
    environment: body.environment || null,
    motion: body.motion || null,
    power: body.power || null,
    communication: body.communication || null,
    sensorHealth: body.sensorHealth || null
  };

  return { valid: true, errors: [], normalized };
}

module.exports = { validateTelemetry };
