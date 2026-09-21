// ─── Request Body Validator ──────────────────────────────────────────────────
// Factory that creates middleware to validate required fields on req.body.

/**
 * @param {string[]} requiredFields — field names that must be present and non-empty
 * @returns {Function} Express middleware
 */
function validateBody(requiredFields) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Request body must be a JSON object.'
      });
    }

    const missing = requiredFields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || val === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    next();
  };
}

module.exports = validateBody;
