const path = require('path');
const fs = require('fs');

// Load environment variables (.env in backend/ or root workspace)
const envLocations = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env')
];

for (const envPath of envLocations) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // ── Authentication & Security ─────────────────────────────────────────────
  apiKey: process.env.API_KEY || process.env.ATLAS_API_KEY || '',
  requireApiKey: process.env.REQUIRE_API_KEY === 'true',

  // ── Wi-Fi & Device Configuration ──────────────────────────────────────────
  wifiSsid: process.env.WIFI_SSID || '',
  wifiPassword: process.env.WIFI_PASSWORD || '',
  apiBaseUrl: process.env.API_BASE_URL || 'http://192.168.1.42',
  apiEndpoint: process.env.API_ENDPOINT || 'http://192.168.1.42/api/telemetry',
  deviceId: process.env.DEVICE_ID || 'ATLAS-001',
  defaultTransport: process.env.TRANSPORT || 'WIFI',

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
