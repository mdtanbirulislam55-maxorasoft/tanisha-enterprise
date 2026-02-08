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

    const finalRole = normalizeRole(role) || ROLES.MANAGER;
    if (!isAllowedRole(finalRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed: ${Object.values(ROLES).join(', ')}`,
      });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: String(username).trim(),
        email: String(email).trim().toLowerCase(),
        password: hashed,
        fullName: String(fullName).trim(),
        phone: phone ? String(phone).trim() : null,
        role: finalRole,
        branchId: branchId ? Number(branchId) : 1,
        isActive: true,
        emailVerified: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    return res.status(201).json({ success: true, data: user });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ success: false, error: 'Register failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identity, password, looksLikeEmail } = parseLoginIdentity(req.body);

    if (!identity || !password) {
      return res.status(400).json({
        success: false,
        error: 'username/email and password required',
      });
    }

    const where = looksLikeEmail
      ? { email: identity.toLowerCase() }
      : { username: identity };

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

    // If no refreshToken table, still allow refresh using JWT validity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, branchId: true, isActive: true, username: true, email: true, fullName: true },
    });

    if (!user) return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    if (!user.isActive) return res.status(403).json({ success: false, error: 'User is deactivated' });

    const role = normalizeRole(user.role) || ROLES.MANAGER;
    if (!isAllowedRole(role)) {
      return res.status(403).json({ success: false, error: 'User role is invalid. Contact administrator.' });
    }

    const newAccessToken = signAccessToken({ ...user, role });
    return res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (e) {
    console.error('Refresh error:', e);
    return res.status(500).json({ success: false, error: 'Refresh failed' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const token = readBearerToken(req) || (req.body && req.body.token);
    if (!token) return res.status(400).json({ success: false, error: 'token required' });

    const decoded = jwt.verify(token, getAccessSecret());
    const userId = Number(decoded?.userId);
    if (!userId) return res.status(401).json({ success: false, error: 'Invalid token' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, fullName: true, role: true, branchId: true, isActive: true },
    });

    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ success: false, error: 'User is deactivated' });

    const role = normalizeRole(user.role) || ROLES.MANAGER;
    if (!isAllowedRole(role)) {
      return res.status(403).json({ success: false, error: 'User role is invalid. Contact administrator.' });
    }

    return res.json({
      success: true,
      data: {
        valid: true,
        user: { ...user, role },
      },
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.body && req.body.refreshToken;
    if (refreshToken && prisma.refreshToken?.updateMany) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
    return res.json({ success: true, message: 'Logged out' });
  } catch (e) {
    console.error('Logout error:', e);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ success: false, error: 'User is deactivated' });

    const role = normalizeRole(user.role) || ROLES.MANAGER;
    return res.json({ success: true, data: { ...user, role } });
  } catch (e) {
    console.error('GetCurrentUser error:', e);
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// Export roles (useful for middleware validation)
exports.ROLES = ROLES;

module.exports = {
  register: exports.register,
  login: exports.login,
  refreshToken: exports.refreshToken,
  verifyToken: exports.verifyToken,
  logout: exports.logout,
  getCurrentUser: exports.getCurrentUser,
  ROLES,
};
