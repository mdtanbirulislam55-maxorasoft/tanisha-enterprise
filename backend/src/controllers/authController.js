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
// - Refresh secret: JWT_REFRESH_SECRET (required)
// - Refresh expiry: JWT_REFRESH_EXPIRE OR JWT_REFRESH_EXPIRE

function getAccessSecret() {
  const s = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_ACCESS_SECRET (or JWT_SECRET) is missing in .env');
  return s;
}

function getRefreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET is missing in .env');
  return s;
}

function getAccessExpiry() {
  return process.env.JWT_ACCESS_EXPIRE || process.env.JWT_EXPIRE || '15m';
}

function getRefreshExpiry() {
  return process.env.JWT_REFRESH_EXPIRE || '7d';
}

// ==================== CONTROLLERS ====================

exports.register = async (req, res) => {
  const { username, email, password, fullName, phone, role, branchId } = req.body;

  try {
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, password, and fullName are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Validate role if provided
    if (role && !isAllowedRole(role)) {
      return res.status(400).json({
        success: false,
        error: `Role '${role}' is not allowed. Allowed roles: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        role: role ? normalizeRole(role) : 'STAFF',
        branchId: branchId || 1,
        isActive: true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        message: 'User registered successfully',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Find user by username OR email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        isActive: true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Validate role
    if (!isAllowedRole(user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${user.role}' is not allowed`,
      });
    }

    // Create tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
      getAccessSecret(),
      { expiresIn: getAccessExpiry() }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      getRefreshSecret(),
      { expiresIn: getRefreshExpiry() }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(refreshToken, getRefreshSecret());

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        branchId: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    if (!isAllowedRole(user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${user.role}' is not allowed`,
      });
    }

    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
      getAccessSecret(),
      { expiresIn: getAccessExpiry() }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
};

exports.logout = async (req, res) => {
  // In a real implementation, you might want to blacklist the refresh token
  // For simplicity, we just acknowledge the logout
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

exports.verifyToken = async (req, res) => {
  const token = req.query.token || req.body.token;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    const decoded = jwt.verify(token, getAccessSecret());

    // Optionally check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: { id: true },
    });

    if (!user) {
      return res.json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        branchId: decoded.branchId,
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId, isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
