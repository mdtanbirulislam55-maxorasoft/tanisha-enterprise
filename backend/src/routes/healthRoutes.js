// src/routes/healthRoutes.js
const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * GET /api/health
 * Lightweight health check.
 * - db.ok indicates DB connectivity
 */
router.get('/', async (req, res) => {
  const now = new Date();
  let dbOk = false;
  let dbError = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbError = e?.message || String(e);
  }

  res.status(dbOk ? 200 : 503).json({
    success: true,
    data: {
      status: 'ok',
      time: now.toISOString(),
      env: process.env.NODE_ENV || 'development',
      db: { ok: dbOk, error: dbError },
    },
  });
});

module.exports = router;
