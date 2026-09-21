// ─── ATLAS-001 Backend — Express Application ─────────────────────────────────
// Transport-independent telemetry backend for the ATLAS-001 monitoring system.
// Supports: WIFI, SIMULATION, and future LORA_GATEWAY transports.

const express = require('express');
const cors = require('cors');
const config = require('./config');

// ── Route modules ────────────────────────────────────────────────────────────
const healthRoutes = require('./routes/health');
const telemetryRoutes = require('./routes/telemetry');
const deviceRoutes = require('./routes/devices');
const eventRoutes = require('./routes/events');
const logRoutes = require('./routes/logs');

// ── Middleware ────────────────────────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// ── Request logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/logs', logRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: 'The requested endpoint does not exist.'
  });
});

// ── Central error handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
