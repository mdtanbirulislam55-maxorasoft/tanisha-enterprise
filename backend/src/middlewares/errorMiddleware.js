// src/middlewares/errorMiddleware.js

/**
 * 404 handler
 */
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Not Found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler (safe response shape)
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const isProd = process.env.NODE_ENV === 'production';

  const payload = {
    success: false,
    error: err.message || 'Server Error',
  };

  if (!isProd) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
