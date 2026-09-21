// ─── Event Service ───────────────────────────────────────────────────────────
// Manages system events — creation, querying, and state transitions.

const Store = require('../models/Store');
const config = require('../config');

const eventStore = new Store(config.maxEvents);

/**
 * Create a new event.
 */
function create(event) {
  return eventStore.add(event);
}

/**
 * Query events with optional filters.
 */
function query({ device, severity, state, type, limit = 100 } = {}) {
  const filter = (e) => {
    if (device && e.deviceId !== device) return false;
    if (severity && e.severity !== severity) return false;
    if (state && e.state !== state) return false;
    if (type && e.type !== type) return false;
    return true;
  };

  return eventStore.query({ filter, limit: parseInt(limit, 10) || 100 });
}

module.exports = { create, query, eventStore };
