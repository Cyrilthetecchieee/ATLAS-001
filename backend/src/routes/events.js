// ─── Event Routes ────────────────────────────────────────────────────────────
// POST /api/events  — create an event
// GET  /api/events  — query events with filters

const express = require('express');
const router = express.Router();
const { validateEvent } = require('../validators/eventValidator');
const eventService = require('../services/eventService');

// ── POST /api/events ─────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const result = validateEvent(req.body);

  if (!result.valid) {
    return res.status(400).json({
      status: 400,
      error: 'Validation Error',
      messages: result.errors
    });
  }

  const event = eventService.create(result.normalized);

  res.status(201).json({
    status: 201,
    message: 'Event created successfully.',
    data: event
  });
});

// ── GET /api/events ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { device, severity, state, type, limit } = req.query;
  const events = eventService.query({ device, severity, state, type, limit });

  res.json({
    status: 200,
    count: events.length,
    data: events
  });
});

module.exports = router;
