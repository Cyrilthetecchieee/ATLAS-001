// ─── ATLAS-001 Backend — Server Entry Point ──────────────────────────────────
// Starts the Express server on 0.0.0.0 for local-network access (ESP32 dev).

const app = require('./app');
const config = require('./config');
const { getLocalIP } = require('./utils/network');

const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
  const localIP = getLocalIP();

  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║          ATLAS-001 — Backend API Server             ║');
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log(`  ║  Local:    http://localhost:${PORT}/api/health`);
  console.log(`  ║  Network:  http://${localIP}:${PORT}/api/health`);
  console.log('  ║                                                      ');
  console.log(`  ║  ESP32 target (Wi-Fi):                               `);
  console.log(`  ║  POST http://${localIP}:${PORT}/api/telemetry`);
  console.log('  ║                                                      ');
  console.log(`  ║  Transport:    ${config.defaultTransport.padEnd(38)}║`);
  const authStatus = config.apiKey ? (config.requireApiKey ? 'ENFORCED (Required)' : 'ENABLED (Optional)') : 'OFF (No key set)';
  console.log(`  ║  API Key Auth: ${authStatus.padEnd(38)}║`);
  console.log('  ║  Storage:     In-memory (Phase 1)                    ');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');
});
