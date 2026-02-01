// src/routes/setupRoutes.js
// Safe setup endpoints (disabled by default in production).
//
// These routes are helpful during local installation and initial VPS provisioning.
// They are disabled unless explicitly enabled.

const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = express.Router();

function isSetupEnabled() {
  const enabled = String(process.env.SETUP_ENABLED || '').toLowerCase() === 'true';
  const isProd = process.env.NODE_ENV === 'production';
  // In production: require explicit flag
  if (isProd) return enabled;
  // In non-prod: enabled by default
  return true;
}

/**
 * GET /api/setup/status
 */
router.get('/status', async (req, res) => {
  const [branchCount, userCount] = await Promise.all([
    prisma.branch.count(),
    prisma.user.count(),
  ]);

  res.json({
    success: true,
    data: {
      setupEnabled: isSetupEnabled(),
      branchCount,
      userCount,
      isInitialized: branchCount > 0 && userCount > 0,
    },
  });
});

/**
 * POST /api/setup/run
 * Creates: Main Branch + Admin user.
 *
 * SECURITY:
 * - In production, requires SETUP_ENABLED=true.
 * - If system already initialized (users exist), it refuses.
 */
router.post('/run', async (req, res) => {
  if (!isSetupEnabled()) {
    return res.status(403).json({
      success: false,
      error: 'Setup is disabled. Set SETUP_ENABLED=true to enable temporarily.',
    });
  }

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return res.status(409).json({
      success: false,
      error: 'Setup already completed (users exist).',
    });
  }

  const { branchName, branchCode, adminEmail, adminPassword, adminFullName } = req.body || {};

  const bName = String(branchName || 'Main Branch');
  const bCode = String(branchCode || 'MAIN').toUpperCase();
  const email = String(adminEmail || 'admin@tanisha.com').toLowerCase();
  const password = String(adminPassword || 'Admin@12345');
  const fullName = String(adminFullName || 'Administrator');

  // Create branch
  const branch = await prisma.branch.create({
    data: {
      name: bName,
      code: bCode,
      isActive: true,
    },
  });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      email,
      password: hashed,
      fullName,
      role: 'admin',
      designation: 'System Admin',
      branchId: branch.id,
      isActive: true,
      emailVerified: true,
      profileImage: 'default-avatar.png',
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      branchId: true,
      isActive: true,
      createdAt: true,
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Setup completed successfully',
    data: { branch, user },
  });
});

module.exports = router;
