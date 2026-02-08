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

// ==================== JWT HELPERS ====================
function getAccessSecret() {
  const s =
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    process.env.JWT_REFRESH_SECRET;

  if (!s) throw new Error('JWT_ACCESS_SECRET / JWT_SECRET missing');
  return s;
}

function getRefreshSecret() {
  return (
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET
  );
}

function getAccessExpiry() {
  return process.env.JWT_ACCESS_EXPIRE || process.env.JWT_EXPIRE || '15m';
}

function getRefreshExpiry() {
  return process.env.JWT_REFRESH_EXPIRE || '30d';
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

  return jwt.sign({ userId: user.id }, secret, {
    expiresIn: getRefreshExpiry(),
  });
}

function readBearerToken(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

function parseLoginIdentity(body = {}) {
  const raw =
    body.usernameOrEmail ||
    body.email ||
    body.username ||
    '';

  const identity = String(raw).trim();
  const password = String(body.password || '').trim();
  const looksLikeEmail = identity.includes('@');

  return { identity, password, looksLikeEmail };
}

// ==================== CONTROLLERS ====================

const register = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (exists) {
      return res.status(409).json({ success: false, error: 'User exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const finalRole = normalizeRole(role) || ROLES.MANAGER;

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        password: hashed,
        fullName,
        role: finalRole,
        isActive: true,
      },
    });

    return res.json({ success: true, data: user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Register failed' });
  }
};

const login = async (req, res) => {
  try {
    const { identity, password, looksLikeEmail } =
      parseLoginIdentity(req.body);

    if (!identity || !password) {
      return res.status(400).json({ success: false, error: 'Missing login data' });
    }

    const where = looksLikeEmail
      ? { email: identity.toLowerCase() }
      : { username: identity };

    const user = await prisma.user.findFirst({ where });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'User disabled' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const role = normalizeRole(user.role);
    if (!isAllowedRole(role)) {
      return res.status(403).json({ success: false, error: 'Invalid role' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

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
        },
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken || readBearerToken(req);
    if (!token) {
      return res.status(400).json({ success: false, error: 'No token' });
    }

    const decoded = jwt.verify(token, getRefreshSecret());
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const accessToken = signAccessToken(user);
    return res.json({ success: true, data: { accessToken } });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Refresh failed' });
  }
};

const verifyToken = async (req, res) => {
  try {
    const token = readBearerToken(req);
    if (!token) return res.status(400).json({ success: false });

    const decoded = jwt.verify(token, getAccessSecret());
    return res.json({ success: true, data: decoded });
  } catch {
    return res.status(401).json({ success: false });
  }
};

const logout = async (req, res) => {
  return res.json({ success: true });
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    return res.json({ success: true, data: user });
  } catch {
    return res.status(500).json({ success: false });
  }
};

// ✅ SINGLE EXPORT (IMPORTANT)
module.exports = {
  register,
  login,
  refreshToken,
  verifyToken,
  logout,
  getCurrentUser,
  ROLES,
};
