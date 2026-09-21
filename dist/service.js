// ─── ATLAS-001 Service Layer ────────────────────────────────────────────────
// Connects frontend to ATLAS-001 backend. Transport-independent.
// Consumes backend REST API for telemetry, events, logs, and devices.

import * as api from './api.js';
import { POLL_INTERVAL } from './config.js';

export const metrics = {
  temperature: ['Temperature', '°C', 'environment'],
  humidity: ['Humidity', '% RH', 'environment'],
  pressure: ['Pressure', 'hPa', 'environment'],
  voltage: ['Voltage', 'V', 'power'],
  current: ['Current', 'A', 'power'],
  power: ['Power', 'W', 'power'],
  ax: ['Acceleration X', 'm/s²', 'motion'],
  ay: ['Acceleration Y', 'm/s²', 'motion'],
  az: ['Acceleration Z', 'm/s²', 'motion'],
  gx: ['Gyroscope X', '°/s', 'motion'],
  gy: ['Gyroscope Y', '°/s', 'motion'],
  gz: ['Gyroscope Z', '°/s', 'motion']
};

export const sensors = [
  ['BMP280', 'Temperature & pressure', ['temperature', 'pressure']],
  ['DHT22', 'Temperature & humidity', ['temperature', 'humidity']],
  ['MPU6050 #1', 'Primary motion sensing', ['ax', 'ay', 'az', 'gx', 'gy', 'gz']],
  ['MPU6050 #2', 'Secondary motion sensing', ['ax', 'ay', 'az', 'gx', 'gy', 'gz']],
  ['INA219', 'Power monitoring', ['voltage', 'current', 'power']]
];

export const scenarios = [
  'Normal operation',
  'Warning',
  'Critical event',
  'Sensor failure',
  'Communication loss',
  'Recovery'
];

export function transformPacket(raw) {
  if (!raw) return null;
  const ts = typeof raw.timestamp === 'number'
    ? raw.timestamp
    : new Date(raw.timestamp || Date.now()).getTime();

  const getVal = (v) => (v !== null && typeof v === 'object' && 'value' in v) ? v.value : v;

  const rawEnv = raw.environment || {};
  const rawMotion = raw.motion || {};
  const rawAccel = rawMotion.accelerometer || {};
  const rawGyro = rawMotion.gyroscope || {};
  const rawPower = raw.power || {};

  const vVal = getVal(rawPower.voltage);
  const cVal = getVal(rawPower.current);
  let pVal = getVal(rawPower.power);
  if (pVal === undefined || pVal === null) {
    if (vVal != null && cVal != null) pVal = +(vVal * cVal).toFixed(4);
    else pVal = null;
  }

  const map = {
    temperature: getVal(rawEnv.temperature),
    humidity: getVal(rawEnv.humidity),
    pressure: getVal(rawEnv.pressure),
    voltage: vVal,
    current: cVal,
    power: pVal,
    ax: getVal(rawAccel.x),
    ay: getVal(rawAccel.y),
    az: getVal(rawAccel.z),
    gx: getVal(rawGyro.x),
    gy: getVal(rawGyro.y),
    gz: getVal(rawGyro.z)
  };

  const defaultQ = raw.dataQuality || 'VALID';
  const readings = {};
  for (const [k, val] of Object.entries(map)) {
    readings[k] = {
      value: (val === undefined || val === null || isNaN(val)) ? null : Number(val),
      unit: metrics[k][1],
      timestamp: ts,
      quality: (val === null || val === undefined || isNaN(val)) ? 'UNAVAILABLE' : defaultQ,
      source: raw.mode || 'SIMULATION'
    };
  }

  return {
    deviceId: raw.deviceId || 'ATLAS-001',
    timestamp: ts,
    sequence: raw.sequence ?? 0,
    mode: raw.mode || 'SIMULATION',
    transport: raw.transport || 'SIMULATION',
    systemHealth: raw.systemHealth || 'NORMAL',
    dataQuality: defaultQ,
    readings,
    environment: rawEnv,
    motion: rawMotion,
    power: rawPower,
    communication: raw.communication || { state: 'CONNECTED', lastPacket: ts }
  };
}

export class AtlasService {
  constructor() {
    this.scenario = 'Normal operation';
    this.sequence = 1800;
    this.listeners = new Set();
    this.events = [];
    this.logs = [];
    this.history = [];
    this.devices = [];
    this.interval = POLL_INTERVAL || 2000;
    this.last = Date.now();
    this.started = this.last;
    this.mode = 'SIMULATION';
    this.transport = 'SIMULATION';
    this.backendOnline = true;

    // Provide initial synchronous state so views render immediately
    this.current = this.transformPacket(this.generateSimPacket(this.last, this.sequence));
    this.history.push(this.current);

    // Initial async bootstrap and start background loops
    this.init();
  }

  generateSimPacket(t, seq) {
    const phase = t / 65000;
    const v = 5.04 + Math.sin(phase * 0.32) * 0.035;
    const c = 0.236 + Math.sin(phase * 0.9) * 0.012;
    const warning = this.scenario === 'Warning';
    const sensorFail = this.scenario === 'Sensor failure';
    const critical = this.scenario === 'Critical event';

    let sysHealth = 'NORMAL';
    if (critical) sysHealth = 'CRITICAL';
    else if (warning || sensorFail) sysHealth = 'WARNING';
    else if (this.scenario === 'Recovery') sysHealth = 'RECOVERING';

    return {
      deviceId: 'ATLAS-001',
      timestamp: new Date(t).toISOString(),
      sequence: seq,
      mode: 'SIMULATION',
      transport: 'SIMULATION',
      systemHealth: sysHealth,
      dataQuality: 'VALID',
      environment: {
        temperature: +(26.4 + Math.sin(phase) * 0.45 + (warning ? 6 : 0)).toFixed(2),
        humidity: sensorFail ? null : +(48.2 + Math.cos(phase * 0.6) * 1.8).toFixed(2),
        pressure: +(1013.2 + Math.sin(phase * 0.18) * 0.8).toFixed(2)
      },
      motion: {
        accelerometer: {
          x: +(Math.sin(phase * 2) * 0.12).toFixed(3),
          y: +(Math.cos(phase * 1.7) * 0.09).toFixed(3),
          z: +(9.81 + Math.sin(phase) * 0.025).toFixed(3)
        },
        gyroscope: {
          x: +(Math.sin(phase * 0.3)).toFixed(3),
          y: +(Math.cos(phase * 0.2)).toFixed(3),
          z: +(Math.sin(phase * 0.7) * 0.15).toFixed(3)
        }
      },
      power: {
        voltage: +v.toFixed(3),
        current: +c.toFixed(3),
        power: +(v * c).toFixed(4)
      },
      communication: {
        state: 'CONNECTED',
        lastPacket: new Date(t).toISOString()
      }
    };
  }

  transformPacket(raw) {
    return transformPacket(raw);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.listeners.forEach(fn => {
      try { fn(this.current); } catch (err) { console.error('Listener error:', err); }
    });
  }

  async init() {
    // Check initial health
    const healthRes = await api.getHealth();
    this.backendOnline = healthRes.ok;

    if (this.backendOnline) {
      // Check existing history
      const histRes = await api.getHistory({ limit: 50 });
      if (!histRes.ok || !histRes.data || histRes.data.length === 0) {
        // Seed initial history into backend so charts are rich from the first second
        const seedTime = Date.now();
        for (let i = 24; i >= 0; i--) {
          const t = seedTime - i * 60000;
          const pkt = this.generateSimPacket(t, this.sequence - i);
          await api.postTelemetry(pkt);
        }
      }
      await this.syncFromBackend();
    }

    // Start ticker
    this.timer = setInterval(() => this.tick(), this.interval);
  }

  async tick() {
    // Only post simulation packet if not in Communication loss and not in REAL mode
    if (this.scenario !== 'Communication loss' && this.mode !== 'REAL') {
      this.sequence++;
      this.last = Date.now();
      const packet = this.generateSimPacket(this.last, this.sequence);
      await api.postTelemetry(packet);
    }

    await this.syncFromBackend();
  }

  async syncFromBackend() {
    const [latestRes, histRes, eventsRes, logsRes, devRes] = await Promise.all([
      api.getLatest('ATLAS-001'),
      api.getHistory({ limit: 200 }),
      api.getEvents({ limit: 50 }),
      api.getLogs({ limit: 100 }),
      api.getDevices()
    ]);

    // Backend connectivity status
    if (!latestRes.ok && latestRes.status === 0) {
      this.backendOnline = false;
      this.emit();
      return;
    }

    this.backendOnline = true;

    if (latestRes.ok && latestRes.data) {
      this.current = this.transformPacket(latestRes.data);
      this.last = this.current.timestamp;
      this.sequence = this.current.sequence;
      this.mode = this.current.mode;
      this.transport = this.current.transport;
    }

    if (histRes.ok && Array.isArray(histRes.data)) {
      // backend returns newest first, reverse for chronological order (oldest to newest)
      const transformed = histRes.data
        .map(p => this.transformPacket(p))
        .sort((a, b) => a.timestamp - b.timestamp);
      if (transformed.length > 0) {
        this.history = transformed;
      }
    }

    if (eventsRes.ok && Array.isArray(eventsRes.data)) {
      this.events = eventsRes.data.map(e => ({
        id: e.eventId || e.id,
        timestamp: new Date(e.timestamp).getTime(),
        device: e.deviceId || 'ATLAS-001',
        type: e.type,
        subsystem: e.subsystem || 'System',
        severity: e.severity || 'INFO',
        state: e.state || 'ACTIVE',
        description: e.description || ''
      }));
    }

    if (logsRes.ok && Array.isArray(logsRes.data)) {
      this.logs = logsRes.data.map(l => ({
        timestamp: new Date(l.timestamp).getTime(),
        source: l.source,
        level: l.level,
        message: l.message
      }));
    }

    if (devRes.ok && Array.isArray(devRes.data)) {
      this.devices = devRes.data;
    }

    this.emit();
  }

  health() {
    if (!this.backendOnline) return 'OFFLINE';
    const age = Date.now() - this.last;
    if (age > 12000) return 'OFFLINE';
    if (age > 6000) return 'STALE';
    if (this.scenario === 'Critical event') return 'CRITICAL';
    if (this.scenario === 'Recovery') return 'RECOVERING';
    if (['Warning', 'Sensor failure'].includes(this.scenario)) return 'WARNING';
    return this.current?.systemHealth || 'NORMAL';
  }

  reading(k) {
    if (!this.current || !this.current.readings || !this.current.readings[k]) {
      return {
        value: null,
        unit: metrics[k] ? metrics[k][1] : '',
        timestamp: this.last,
        quality: 'UNAVAILABLE',
        source: this.mode
      };
    }
    const r = this.current.readings[k];
    const age = Date.now() - r.timestamp;
    const isStale = age > 6000 && r.quality === 'VALID';
    const isOffline = !this.backendOnline || age > 12000;
    return {
      ...r,
      quality: isOffline ? 'UNAVAILABLE' : isStale ? 'STALE' : r.quality
    };
  }

  async setScenario(s) {
    if (!scenarios.includes(s)) throw Error('Unknown scenario: ' + s);
    clearTimeout(this.recovery);
    this.scenario = s;
    if (s !== 'Communication loss') {
      this.mode = 'SIMULATION';
    }

    const severity = s === 'Critical event'
      ? 'CRITICAL'
      : ['Warning', 'Sensor failure', 'Communication loss'].includes(s)
        ? 'WARNING'
        : 'INFO';

    const descriptions = {
      'Normal operation': 'All subsystems operating normally.',
      'Warning': 'Simulated environmental warning. Demonstration condition; not a calibrated threshold.',
      'Critical event': 'Simulated controller fault detected.',
      'Sensor failure': 'DHT22 humidity reading unavailable.',
      'Communication loss': 'Telemetry interrupted. Freshness will degrade after 6 seconds and go offline after 12 seconds.',
      'Recovery': 'Communication restored. Subsystems are recovering.'
    };

    // Post event to backend
    await api.postEvent({
      deviceId: 'ATLAS-001',
      type: s,
      subsystem: s.includes('Communication') ? 'Communication' : s.includes('Sensor') ? 'Environment' : 'System',
      severity,
      state: s === 'Normal operation' ? 'RESOLVED' : 'ACTIVE',
      description: descriptions[s]
    });

    // Post log to backend
    await api.postLog({
      deviceId: 'ATLAS-001',
      source: 'SIMULATION',
      level: severity === 'CRITICAL' ? 'ERROR' : severity,
      message: descriptions[s]
    });

    // Immediate tick
    await this.tick();

    if (s === 'Recovery') {
      this.recovery = setTimeout(() => this.setScenario('Normal operation'), 5000);
    }
  }

  async acknowledge(id) {
    const e = this.events.find(ev => ev.id === id);
    if (e && e.state === 'ACTIVE') {
      e.state = 'ACKNOWLEDGED';
      await api.postLog({
        deviceId: 'ATLAS-001',
        source: 'EVENT_ENGINE',
        level: 'INFO',
        message: `${id} acknowledged`
      });
      this.emit();
    }
  }

  async log(source, level, message) {
    const safeSource = source === 'EVENT ENGINE' ? 'EVENT_ENGINE' : source;
    await api.postLog({
      deviceId: 'ATLAS-001',
      source: safeSource,
      level,
      message
    });
    this.logs.unshift({ timestamp: Date.now(), source: safeSource, level, message });
    if (this.logs.length > 200) this.logs.pop();
    this.emit();
  }

  setRefresh(ms) {
    this.interval = ms;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), ms);
    this.emit();
  }
}

export const service = new AtlasService();
