// ─── ATLAS-001 API Key Authentication Middleware ────────────────────────────
// Validates incoming API key for Wi-Fi / hardware telemetry connections.
// Checks headers: 'x-api-key' or 'Authorization: Bearer <token>'

const config = require('../config');

function apiKeyAuth(req, res, next) {
  const configuredKey = config.apiKey;
  const isEnforced = config.requireApiKey;

  // Extract key from x-api-key or Authorization Bearer header
  const headerKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  let bearerKey = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerKey = authHeader.slice(7).trim();
  }
  const providedKey = headerKey || bearerKey;

  // If API key is strictly required:
  if (isEnforced) {
    if (!configuredKey) {
      console.warn('[AUTH WARNING] REQUIRE_API_KEY is true, but no API_KEY is set in environment!');
      return res.status(500).json({
        status: 500,
        error: 'Server Configuration Error',
        message: 'API Key requirement is enabled, but no server key is configured in .env'
      });
    }

    if (!providedKey || providedKey !== configuredKey) {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid or missing API key. Please provide a valid key in "x-api-key" or "Authorization: Bearer <key>" header.'
      });
    }

    req.authenticated = true;
    return next();
  }

  // If not strictly required, but an API key is configured and a key was sent:
  if (configuredKey && providedKey) {
    if (providedKey !== configuredKey) {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'The provided API key is invalid.'
      });
    }
    req.authenticated = true;
  }

  next();
}

module.exports = apiKeyAuth;
