// ─── Device Registry ─────────────────────────────────────────────────────────
// In-memory device registry. ATLAS-001 is pre-registered as the initial device.

class DeviceRegistry {
  constructor() {
    this.devices = new Map();

    // Pre-register default devices
    this.devices.set('Groundstation', {
      deviceId: 'Groundstation',
      name: 'Groundstation Base & Telemetry Receiver',
      status: 'NORMAL',
      mode: 'REAL',
      transport: 'WIFI',
      firmwareVersion: '1.0.0',
      lastSeen: new Date().toISOString(),
      registeredAt: new Date().toISOString()
    });

    this.devices.set('ATLAS-001', {
      deviceId: 'ATLAS-001',
      name: 'ATLAS-001 Embedded Monitoring Unit',
      status: 'NORMAL',
      mode: 'SIMULATION',
      transport: 'SIMULATION',
      firmwareVersion: 'N/A',
      lastSeen: null,
      registeredAt: new Date().toISOString()
    });
  }

  /** Get all registered devices. */
  getAll() {
    return Array.from(this.devices.values());
  }

  /** Get a single device by ID. */
  get(deviceId) {
    return this.devices.get(deviceId) || null;
  }

  /**
   * Update device info (auto-registers if new).
   * Called on every telemetry ingestion.
   */
  upsert(deviceId, fields = {}) {
    const existing = this.devices.get(deviceId) || {
      deviceId,
      name: deviceId,
      status: 'NORMAL',
      mode: 'SIMULATION',
      transport: 'SIMULATION',
      firmwareVersion: 'N/A',
      lastSeen: null,
      registeredAt: new Date().toISOString()
    };

    const updated = {
      ...existing,
      ...fields,
      deviceId, // prevent override
      lastSeen: new Date().toISOString()
    };

    this.devices.set(deviceId, updated);
    return updated;
  }
}

module.exports = DeviceRegistry;
