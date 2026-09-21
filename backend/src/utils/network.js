// ─── Network Utility ─────────────────────────────────────────────────────────
// Detects local network IP for ESP32 development convenience.

const os = require('os');

/**
 * Returns the first non-internal IPv4 address found on any network interface.
 * Used to display the URL that the ESP32 should target on the local network.
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

module.exports = { getLocalIP };
