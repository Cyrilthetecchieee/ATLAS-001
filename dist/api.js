// ─── ATLAS-001 Centralized API Client ────────────────────────────────────────
// All backend communication flows through this module.
// Components must NOT make direct fetch calls.

import { API_BASE } from './config.js';

async function request(method, path, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json.data, raw: json };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err.message };
  }
}

// ── Health ───────────────────────────────────────────────────────────────────
export const getHealth = () => request('GET', '/api/health');

// ── Telemetry ────────────────────────────────────────────────────────────────
export const postTelemetry = (body) => request('POST', '/api/telemetry', body);
export const getLatest = (device) =>
  request('GET', `/api/telemetry/latest${device ? `?device=${device}` : ''}`);
export function getHistory(opts = {}) {
  const p = new URLSearchParams();
  if (opts.device) p.set('device', opts.device);
  if (opts.from) p.set('from', opts.from);
  if (opts.to) p.set('to', opts.to);
  if (opts.limit) p.set('limit', opts.limit);
  const qs = p.toString();
  return request('GET', `/api/telemetry/history${qs ? '?' + qs : ''}`);
}

// ── Events ───────────────────────────────────────────────────────────────────
export const postEvent = (body) => request('POST', '/api/events', body);
export function getEvents(opts = {}) {
  const p = new URLSearchParams();
  if (opts.severity) p.set('severity', opts.severity);
  if (opts.state) p.set('state', opts.state);
  if (opts.limit) p.set('limit', opts.limit);
  const qs = p.toString();
  return request('GET', `/api/events${qs ? '?' + qs : ''}`);
}

// ── Logs ─────────────────────────────────────────────────────────────────────
export const postLog = (body) => request('POST', '/api/logs', body);
export function getLogs(opts = {}) {
  const p = new URLSearchParams();
  if (opts.source) p.set('source', opts.source);
  if (opts.level) p.set('level', opts.level);
  if (opts.limit) p.set('limit', opts.limit);
  const qs = p.toString();
  return request('GET', `/api/logs${qs ? '?' + qs : ''}`);
}

// ── Devices ──────────────────────────────────────────────────────────────────
export const getDevices = () => request('GET', '/api/devices');
export const getDevice = (id) => request('GET', `/api/devices/${id}`);
