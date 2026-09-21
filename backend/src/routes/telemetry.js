// ─── Telemetry Routes ────────────────────────────────────────────────────────
// POST /api/telemetry         — ingest telemetry (any transport)
// GET  /api/telemetry/latest  — most recent packet
// GET  /api/telemetry/history — filtered history

const express = require('express');
const router = express.Router();
const { validateTelemetry } = require('../validators/telemetryValidator');
const telemetryService = require('../services/telemetryService');
const logService = require('../services/logService');

// ── POST /api/telemetry ──────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const result = validateTelemetry(req.body);

  if (!result.valid) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Error',
      messages: result.errors
    });
  }

  const packet = telemetryService.ingest(result.normalized);

  // Log the ingestion
  logService.create({
    timestamp: new Date().toISOString(),
    deviceId: packet.deviceId,
    source: 'API',
    level: 'INFO',
    message: `Telemetry ingested from ${packet.deviceId} via ${packet.transport} [seq: ${packet.sequence}]`
  });

  res.status(201).json({
    status: 201,
    message: 'Telemetry ingested successfully.',
    data: packet
  });
});

// ── GET /api/telemetry/latest ────────────────────────────────────────────────
router.get('/latest', (req, res) => {
  const { device } = req.query;
  const latest = telemetryService.getLatest(device);

  if (!latest) {
    return res.status(404).json({
      status: 404,
      error: 'Not Found',
      message: 'No telemetry data available.'
    });
  }

  res.json({
    status: 200,
    data: latest
  });
});

// ── GET /api/telemetry/history ───────────────────────────────────────────────
router.get('/history', (req, res) => {
  const { device, metric, from, to, limit } = req.query;
  const history = telemetryService.getHistory({ device, metric, from, to, limit });

  res.json({
    status: 200,
    count: history.length,
    data: history
  });
});

module.exports = router;
