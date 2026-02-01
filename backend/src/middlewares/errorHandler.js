// backend/src/middlewares/errorHandler.js

/**
 * Global Express error handler middleware
 * Must be mounted as: app.use(errorHandler)
 */
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  const status = Number(err?.statusCode || err?.status || 500);

  const payload = {
    success: false,
    error: err?.message || 'Internal Server Error',
  };

  // Add stack only in development
  if ((process.env.NODE_ENV || 'development') === 'development') {
    payload.stack = err?.stack;
  }

  // Prisma known errors (optional friendly message)
  if (err?.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    payload.error = payload.error || 'Database error';
    payload.prismaCode = err.code;
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
