// ─── ATLAS-001 Backend Configuration ─────────────────────────────────────────
// Centralized constants and enums for transport-independent telemetry system.

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // ── Transport layer (replaceable without rebuilding) ───────────────────────
  transports: ['WIFI', 'LORA_GATEWAY', 'SIMULATION'],

  // ── Device operating modes ─────────────────────────────────────────────────
  modes: ['REAL', 'SIMULATION'],

  // ── System health states ───────────────────────────────────────────────────
  systemHealth: ['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE', 'STALE', 'RECOVERING'],

  // ── Communication states ───────────────────────────────────────────────────
  communicationStates: ['CONNECTED', 'DEGRADED', 'OFFLINE'],

  // ── Data quality indicators ────────────────────────────────────────────────
  dataQuality: ['VALID', 'INVALID', 'STALE', 'UNAVAILABLE'],

  // ── Event severity levels ──────────────────────────────────────────────────
  severity: ['INFO', 'WARNING', 'CRITICAL'],

  // ── Event states ───────────────────────────────────────────────────────────
  eventStates: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],

  // ── Event types ────────────────────────────────────────────────────────────
  eventTypes: [
    'SENSOR_FAILURE',
    'COMMUNICATION_LOSS',
    'INVALID_READING',
    'TELEMETRY_STALE',
    'SYSTEM_RECOVERY'
  ],

  // ── Log levels ─────────────────────────────────────────────────────────────
  logLevels: ['INFO', 'WARNING', 'ERROR'],

  // ── Log sources ────────────────────────────────────────────────────────────
  logSources: ['SYSTEM', 'SENSOR', 'COMMUNICATION', 'SIMULATION', 'EVENT_ENGINE', 'API'],

  // ── In-memory store limits ─────────────────────────────────────────────────
  maxTelemetry: 5000,
  maxEvents: 1000,
  maxLogs: 2000
};

module.exports = config;
