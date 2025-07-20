const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'honestlens_secret_key');

    // Get user from database to ensure they still exist and get latest info
    const user = await db.get(
      'SELECT id, username, email, role, is_verified FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Add user info to request object
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified
    };

    // Log API usage
    await db.run(`
      INSERT INTO api_usage (user_id, endpoint, method, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `, [user.id, req.originalUrl, req.method, req.ip, req.get('User-Agent')]);

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = authMiddleware;