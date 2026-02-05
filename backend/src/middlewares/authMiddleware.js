const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

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

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive',
      });
    }

    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }
};

// Role-based middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const userRole = req.user.role?.toUpperCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
