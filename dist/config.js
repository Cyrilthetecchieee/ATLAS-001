// ─── ATLAS-001 Frontend Configuration ────────────────────────────────────────
// Change API_BASE before deployment. Do not hard-code production URLs elsewhere.
export const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:5000'
  : 'https://atlas-001.onrender.com';
export const POLL_INTERVAL = 2000; // ms — telemetry polling frequency
