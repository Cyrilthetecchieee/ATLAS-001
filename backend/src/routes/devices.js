// ─── Device Routes ───────────────────────────────────────────────────────────
// GET /api/devices            — list all registered devices
// GET /api/devices/:deviceId  — single device info

const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');

// ── GET /api/devices ─────────────────────────────────────────────────────────
router.get('/', (_req, res) => {
  const devices = telemetryService.getDevices();

  res.json({
    status: 200,
    count: devices.length,
    data: devices
  });
});

// ── GET /api/devices/:deviceId ───────────────────────────────────────────────
router.get('/:deviceId', (req, res) => {
  const device = telemetryService.getDevice(req.params.deviceId);

  if (!device) {
    return res.status(404).json({
      status: 404,
      error: 'Not Found',
      message: `Device '${req.params.deviceId}' not found.`
    });
  }

  res.json({
    status: 200,
    data: device
  });
});

module.exports = router;
