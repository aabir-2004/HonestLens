const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Register endpoint
router.post('/register', authLimiter, [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('fullName').optional().isLength({ max: 100 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await db.run(`
      INSERT INTO users (username, email, password_hash, full_name, verification_token)
      VALUES (?, ?, ?, ?, ?)
    `, [username, email, passwordHash, fullName || null, verificationToken]);

    // Log user activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, 'register', ?, ?, ?)
    `, [result.id, JSON.stringify({ username, email }), req.ip, req.get('User-Agent')]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.id,
        username,
        email,
        verificationRequired: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await db.get(
      'SELECT id, username, email, password_hash, full_name, role, is_verified, reputation_score FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'honestlens_secret_key',
      { expiresIn: '24h' }
    );

    // Update last login
    await db.run(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Log user activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, 'login', ?, ?, ?)
    `, [user.id, JSON.stringify({ email }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isVerified: user.is_verified,
          reputationScore: user.reputation_score
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await db.get(`
      SELECT id, username, email, full_name, role, is_verified, profile_image, 
             bio, reputation_score, created_at
      FROM users WHERE id = ?
    `, [req.user.userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isVerified: user.is_verified,
          profileImage: user.profile_image,
          bio: user.bio,
          reputationScore: user.reputation_score,
          memberSince: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, [
  body('fullName').optional().isLength({ max: 100 }).trim(),
  body('bio').optional().isLength({ max: 500 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, bio } = req.body;

    await db.run(`
      UPDATE users 
      SET full_name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [fullName || null, bio || null, req.user.userId]);

    // Log user activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, 'profile_update', ?, ?, ?)
    `, [req.user.userId, JSON.stringify({ fullName, bio }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', authMiddleware, [
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const user = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.userId]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.run(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newPasswordHash, req.user.userId]);

    // Log user activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, 'password_change', ?, ?, ?)
    `, [req.user.userId, JSON.stringify({ timestamp: new Date().toISOString() }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Log user activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, 'logout', ?, ?, ?)
    `, [req.user.userId, JSON.stringify({ timestamp: new Date().toISOString() }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;