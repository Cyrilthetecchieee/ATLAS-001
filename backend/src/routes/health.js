// ─── Health Route ────────────────────────────────────────────────────────────
// GET /api/health — returns backend status.

const express = require('express');
const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ATLAS-001 Backend',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
