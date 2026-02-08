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

  const where = looksLikeEmail
    ? { email: identity }
    : { username: identity };

  return { identity, password, looksLikeEmail, where };
}

// ==================== CONTROLLERS ====================

exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, role, branchId } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName: fullName || null,
        role: normalizeRole(role) || ROLES.STAFF,
        branchId: branchId || 1,
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identity, password, looksLikeEmail, where } = parseLoginIdentity(req.body);

    if (!identity || !password) {
      return res.status(400).json({ success: false, error: 'Email/Username and password required' });
    }

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

    // If refreshToken table doesn't exist, just verify the JWT and generate a new access token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const role = normalizeRole(user.role) || ROLES.MANAGER;
    if (!isAllowedRole(role)) {
      return res.status(403).json({ success: false, error: 'User role is invalid. Contact administrator.' });
    }

    const newAccessToken = signAccessToken({ ...user, role });
    return res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (e) {
    console.error('Refresh token error:', e);
    return res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const token = readBearerToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Token required' });

    const decoded = jwt.verify(token, getAccessSecret());

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User not found or deactivated' });
    }

    return res.json({ success: true, message: 'Token is valid' });
  } catch (e) {
    console.error('Verify token error:', e);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = (req.body && req.body.refreshToken) || readBearerToken(req);
    if (!token) return res.status(400).json({ success: false, error: 'refreshToken required' });

    // If refreshToken table exists, revoke the token
    if (prisma.refreshToken?.update) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revoked: true },
      });
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (e) {
    console.error('Logout error:', e);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const token = readBearerToken(req);
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const decoded = jwt.verify(token, getAccessSecret());
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
