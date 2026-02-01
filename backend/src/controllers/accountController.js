const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// HARDCODED JWT SECRETS
const JWT_ACCESS_SECRET = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
const JWT_REFRESH_SECRET = 'c1c2b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1';

const authController = {
  // ✅ LOGIN (FIXED - Accepts both username or email)
  login: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if either username or email is provided
      const loginIdentifier = username || email;
      
      if (!loginIdentifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username/email and password are required'
        });
      }

      // Find user by username OR email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: loginIdentifier },
            { email: loginIdentifier }
          ]
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const tokenPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        branchId: user.branchId
      };

      const accessToken = jwt.sign(tokenPayload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: {
            ...userWithoutPassword,
            name: user.fullName,
            permissions: ['all']
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  },

  // ✅ VERIFY TOKEN
  verifyToken: async (req, res) => {
    try {
      let token = req.headers.authorization;
      
      if (token && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      
      if (!token) {
        token = req.body.token || req.body.accessToken;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
          valid: false
        });
      }

      token = token.trim();

      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          valid: false
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            ...user,
            name: user.fullName
          },
          valid: true
        }
      });

    } catch (error) {
      console.error('Verify token error:', error.message);
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        valid: false
      });
    }
  },

  // ✅ REFRESH TOKEN
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      if (new Date() > storedToken.expiresAt) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired'
        });
      }

      const accessToken = jwt.sign(
        {
          id: storedToken.user.id,
          username: storedToken.user.username,
          email: storedToken.user.email,
          role: storedToken.user.role,
          branchId: storedToken.user.branchId
        },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        data: {
          accessToken
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to refresh token'
      });
    }
  },

  // ✅ GET CURRENT USER
  getCurrentUser: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: {
            ...userWithoutPassword,
            name: user.fullName,
            permissions: ['all']
          }
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user data'
      });
    }
  },

  // ✅ LOGOUT
  logout: async (req, res) => {
    try {
      const refreshToken = req.body.refreshToken;
      
      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  },

  // ✅ REGISTER
  register: async (req, res) => {
    try {
      const { username, email, password, fullName, phone, role, branchId } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username or email already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          fullName,
          phone,
          role: role || 'staff',
          branchId: branchId || 1,
          isActive: true
        },
        include: {
          branch: true
        }
      });

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          message: 'User registered successfully'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  },

  // ✅ UPDATE PROFILE
  updateProfile: async (req, res) => {
    try {
      const { fullName, email, phone } = req.body;
      const userId = req.user.id;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName,
          email,
          phone,
          updatedAt: new Date()
        },
        include: {
          branch: true
        }
      });

      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          message: 'Profile updated successfully'
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  },

  // ✅ CHANGE PASSWORD
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
};

module.exports = authController;