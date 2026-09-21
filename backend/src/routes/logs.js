// ─── Log Routes ──────────────────────────────────────────────────────────────
// POST /api/logs  — create a log entry
// GET  /api/logs  — query logs with filters

const express = require('express');
const router = express.Router();
const { validateLog } = require('../validators/logValidator');
const logService = require('../services/logService');

// ── POST /api/logs ───────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const result = validateLog(req.body);

  if (!result.valid) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Error',
      messages: result.errors
    });
  }

  const log = logService.create(result.normalized);

  res.status(201).json({
    status: 201,
    message: 'Log entry created successfully.',
    data: log
  });
});

// ── GET /api/logs ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { device, source, level, limit } = req.query;
  const logs = logService.query({ device, source, level, limit });

  res.json({
    status: 200,
    count: logs.length,
    data: logs
  });
});

module.exports = router;
