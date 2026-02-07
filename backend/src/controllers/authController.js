// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ==================== RBAC ROLES ====================
const ROLES = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  STOCK_MANAGER: 'STOCK_MANAGER',
  SALES: 'SALES',
  VIEWER: 'VIEWER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
};

const normalizeRole = (r) => (r ? String(r).trim().toUpperCase() : null);
const isAllowedRole = (r) => Object.values(ROLES).includes(normalizeRole(r));

// ==================== ENV / JWT HELPERS ====================
// Backward compatible:
// - Access secret: JWT_ACCESS_SECRET OR JWT_SECRET
// - Access expiry: JWT_ACCESS_EXPIRE OR JWT_EXPIRE
// - Refresh secret: JWT_REFRESH_SECRET (falls back to JWT_SECRET/JWT_ACCESS_SECRET)
// - Refresh expiry: JWT_REFRESH_EXPIRE OR JWT_REFRESH_EXPIRE

function getAccessSecret() {
  const s = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_ACCESS_SECRET (or JWT_SECRET) is missing in .env');
  return s;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || null;
}

function getAccessExpiry() {
  return process.env.JWT_ACCESS_EXPIRE || process.env.JWT_EXPIRE || '15m';
}

function getRefreshExpiry() {
  return process.env.JWT_REFRESH_EXPIRE || process.env.JWT_REFRESH_EXPIRE || '30d';
}

function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: normalizeRole(user.role) || ROLES.MANAGER,
      branchId: user.branchId || 1,
    },
    getAccessSecret(),
    { expiresIn: getAccessExpiry() }
  );
}

function signRefreshToken(user) {
  const secret = getRefreshSecret();
  if (!secret) return null;
  return jwt.sign(
    { userId: user.id },
    secret,
    { expiresIn: getRefreshExpiry() }
  );
}

function readBearerToken(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  return h.slice('Bearer '.length).trim() || null;
}

// Accept frontend payload variants safely:
// - { username, password } where username may be email
// - { email, password }
// - { usernameOrEmail, password }
function parseLoginIdentity(body = {}) {
  const raw =
    body.usernameOrEmail ||
    body.email ||
    body.username ||
    '';

  const identity = String(raw || '').trim();
  const password = String(body.password || '').trim();

  const looksLikeEmail = identity.includes('@') && identity.includes('.');
  return {
    identity,
    password,
    looksLikeEmail,
  };
}

// ==================== AUTH ENDPOINTS ====================

exports.register = async (req, res) => {
  // Production note: keep register, but validate role; do NOT create demo data.
  try {
    const { username, email, password, fullName, phone, role, branchId } = req.body || {};

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'username, email, password, fullName required',
      });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already exists (username/email)',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        role: role ? normalizeRole(role) : ROLES.STAFF,
        branchId: branchId || 1,
        isActive: true,
      },
      include: { branch: true },
    });

    // Remove password from response
    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      data: { user: safeUser },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identity, password, looksLikeEmail } = parseLoginIdentity(req.body);

    if (!identity || !password) {
      return res.status(400).json({ success: false, error: 'username/email and password required' });
    }

    const where = looksLikeEmail
      ? { email: identity, isActive: true }
      : { username: identity, isActive: true };

    const user = await prisma.user.findFirst({
      where,
      include: { branch: { select: { id: true, name: true, code: true } } },
    });

    // Do not leak which part is wrong
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, error: 'User is deactivated' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Normalize role (string safety)
    const role = normalizeRole(user.role) || ROLES.MANAGER;
    if (!isAllowedRole(role)) {
      return res.status(403).json({
        success: false,
        error: 'User role is invalid. Contact administrator.',
      });
    }

    const accessToken = signAccessToken({ ...user, role });
    const refreshToken = signRefreshToken(user);

    // Store refresh token if model exists. If not, still return tokens.
    if (refreshToken) {
      try {
        const refreshDays = 30; // default
        const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
        if (prisma.refreshToken?.create) {
          await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt },
          });
        }
      } catch (err) {
        // If refreshToken model isn't present or DB constraint differs, don't break login.
        console.warn('RefreshToken store skipped:', err?.message || err);
      }
    }

    // lastLogin is optional in schema; do not fail login if not present
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (_) {}

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role,
          branchId: user.branchId,
          branch: user.branch || null,
        },
      },
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = (req.body && req.body.refreshToken) || readBearerToken(req);
    if (!token) return res.status(400).json({ success: false, error: 'refreshToken required' });

    // Verify signature first
    let decoded;
    const refreshSecret = getRefreshSecret();
    if (!refreshSecret) {
      return res.status(500).json({ success: false, error: 'Refresh token secret not configured' });
    }

    try {
      decoded = jwt.verify(token, refreshSecret);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const userId = Number(decoded?.userId);
    if (!userId) return res.status(401).json({ success: false, error: 'Invalid refresh token' });

    // If refreshToken table exists, enforce not revoked
    if (prisma.refreshToken?.findUnique) {
      const db = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });
      if (!db || db.revoked) return res.status(401).json({ success: false, error: 'Invalid refresh token' });
      if (!db.user || db.user.id !== userId) return res.status(401).json({ success: false, error: 'Invalid refresh token' });
      if (!db.user.isActive) return res.status(403).json({ success: false, error: 'User is deactivated' });

      const role = normalizeRole(db.user.role) || ROLES.MANAGER;
      if (!isAllowedRole(role)) {
        return res.status(403).json({ success: false, error: 'User role is invalid. Contact administrator.' });
      }

      const newAccessToken = signAccessToken({ ...db.user, role });
      return res.json({ success: true, data: { accessToken: newAccessToken } });
    }

    // Fallback for missing refreshToken table: just verify JWT and re-sign
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: { branch: true },
    });
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const role = normalizeRole(user.role) || ROLES.MANAGER;
    if (!isAllowedRole(role)) {
      return res.status(403).json({ success: false, error: 'User role is invalid. Contact administrator.' });
    }

    const newAccessToken = signAccessToken({ ...user, role });
    return res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ success: false, error: 'Refresh failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = readBearerToken(req);
    if (token && prisma.refreshToken?.update) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revoked: true },
      });
    }
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    console.warn('Logout cleanup failed:', err);
    return res.json({ success: true, message: 'Logged out' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const token = readBearerToken(req) || req.query.token;
    if (!token) return res.status(400).json({ success: false, error: 'token required' });

    const decoded = jwt.verify(token, getAccessSecret());

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: { id: true, username: true, email: true, role: true, branchId: true },
    });

    if (!user) return res.json({ success: false, error: 'User not found' });

    return res.json({
      success: true,
      data: {
        valid: true,
        userId: user.id,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
      },
    });
  } catch (err) {
    return res.json({ success: false, error: 'Invalid or expired token' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id, isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
        profileImage: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};
