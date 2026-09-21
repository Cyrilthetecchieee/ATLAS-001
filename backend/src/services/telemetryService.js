// ─── Telemetry Service ───────────────────────────────────────────────────────
// Transport-independent telemetry processing layer.
// Handles ingestion from any transport (WIFI, SIMULATION, LORA_GATEWAY).

const Store = require('../models/Store');
const DeviceRegistry = require('../models/DeviceRegistry');
const config = require('../config');

const telemetryStore = new Store(config.maxTelemetry);
const deviceRegistry = new DeviceRegistry();

/**
 * Ingest a normalized telemetry packet.
 * Updates device registry and stores the packet.
 */
function ingest(packet) {
  // Update device registry
  deviceRegistry.upsert(packet.deviceId, {
    status: packet.systemHealth || 'NORMAL',
    mode: packet.mode,
    transport: packet.transport
  });

  // Store the telemetry data
  telemetryStore.add(packet);

  return packet;
}

/**
 * Get the latest telemetry packet, optionally filtered by device.
 */
function getLatest(deviceId) {
  if (deviceId) {
    return telemetryStore.getLatest(p => p.deviceId === deviceId);
  }
  return telemetryStore.getLatest();
}

/**
 * Query telemetry history with optional filters.
 * @param {Object} opts
 * @param {string} [opts.device]  — filter by deviceId
 * @param {string} [opts.metric]  — not used for filtering in Phase 1, just for metadata
 * @param {string} [opts.from]    — ISO timestamp lower bound
 * @param {string} [opts.to]      — ISO timestamp upper bound
 * @param {number} [opts.limit]   — max results
 */
function getHistory({ device, from, to, limit = 100 } = {}) {
  const filter = (p) => {
    if (device && p.deviceId !== device) return false;
    if (from && new Date(p.timestamp) < new Date(from)) return false;
    if (to && new Date(p.timestamp) > new Date(to)) return false;
    return true;
  };

  return telemetryStore.query({ filter, limit: parseInt(limit, 10) || 100 });
}

/** Expose device registry for device routes. */
function getDevices() {
  return deviceRegistry.getAll();
}

function getDevice(deviceId) {
  return deviceRegistry.get(deviceId);
}

module.exports = {
  ingest,
  getLatest,
  getHistory,
  getDevices,
  getDevice,
  telemetryStore,
  deviceRegistry
};
