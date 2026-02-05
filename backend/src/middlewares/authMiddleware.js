const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const normalizeRole = (role) => (role ? String(role).trim().toLowerCase() : '');

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET (or JWT_SECRET) missing in env');
  }
  return secret;
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getAccessSecret());

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        branchId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not authorized',
      });
    }

    req.user = { ...user, role: normalizeRole(user.role) };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const allowedRoles = roles.map(normalizeRole);
    if (!allowedRoles.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: insufficient permissions',
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
