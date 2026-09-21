// ─── Central Error Handler ───────────────────────────────────────────────────
// Catches all unhandled errors and returns consistent JSON responses.

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${status} — ${message}`);
  if (status === 500) console.error(err.stack);

  res.status(status).json({
    status,
    error: status === 500 ? 'Internal Server Error' : 'Bad Request',
    message
  });
}

module.exports = errorHandler;
