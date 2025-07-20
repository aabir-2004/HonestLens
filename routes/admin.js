const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Admin middleware to check if user has admin role
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or moderator role required.'
    });
  }
  next();
};

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Get admin dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get overall system statistics
    const stats = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-30 days')) as new_users_month,
        (SELECT COUNT(*) FROM news_articles) as total_articles,
        (SELECT COUNT(*) FROM verification_requests) as total_verifications,
        (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending') as pending_verifications,
        (SELECT COUNT(*) FROM user_reports WHERE status = 'pending') as pending_reports,
        (SELECT AVG(truth_score) FROM verification_results) as avg_truth_score
    `);

    // Get daily verification activity for last 30 days
    const dailyActivity = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM verification_requests
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get credibility distribution
    const credibilityDistribution = await db.query(`
      SELECT 
        credibility_level,
        COUNT(*) as count
      FROM verification_results
      GROUP BY credibility_level
    `);

    // Get top sources
    const topSources = await db.query(`
      SELECT 
        source,
        COUNT(*) as count,
        AVG(vres.truth_score) as avg_score
      FROM news_articles na
      LEFT JOIN verification_requests vreq ON na.id = vreq.article_id
      LEFT JOIN verification_results vres ON vreq.id = vres.request_id
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: stats.total_users || 0,
          newUsersThisMonth: stats.new_users_month || 0,
          totalArticles: stats.total_articles || 0,
          totalVerifications: stats.total_verifications || 0,
          pendingVerifications: stats.pending_verifications || 0,
          pendingReports: stats.pending_reports || 0,
          avgTruthScore: Math.round(stats.avg_truth_score || 0)
        },
        dailyActivity: dailyActivity.map(item => ({
          date: item.date,
          count: item.count
        })),
        credibilityDistribution: credibilityDistribution.map(item => ({
          level: item.credibility_level,
          count: item.count
        })),
        topSources: topSources.map(item => ({
          source: item.source,
          count: item.count,
          avgScore: Math.round(item.avg_score || 0)
        }))
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const users = await db.query(`
      SELECT id, username, email, full_name, role, is_verified, reputation_score, created_at,
             (SELECT COUNT(*) FROM verification_requests WHERE user_id = users.id) as verification_count,
             (SELECT COUNT(*) FROM user_reports WHERE reporter_id = users.id) as report_count
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM users ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isVerified: user.is_verified === 1,
          reputationScore: user.reputation_score,
          verificationCount: user.verification_count,
          reportCount: user.report_count,
          createdAt: user.created_at
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount.count / limit),
          totalItems: totalCount.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user role
router.put('/users/:id/role', [
  body('role').isIn(['user', 'moderator', 'admin']).withMessage('Invalid role')
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

    const { id } = req.params;
    const { role } = req.body;

    // Check if user exists
    const user = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role
    await db.run(`
      UPDATE users 
      SET role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [role, id]);

    // Log admin activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, 'admin_update_user_role', 'user', ?, ?, ?, ?)
    `, [req.user.userId, id, JSON.stringify({ username: user.username, newRole: role }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending reports
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    const offset = (page - 1) * limit;

    const reports = await db.query(`
      SELECT ur.*, na.title as article_title, na.url as article_url,
             reporter.username as reporter_username,
             reviewer.username as reviewed_by_username
      FROM user_reports ur
      LEFT JOIN news_articles na ON ur.article_id = na.id
      LEFT JOIN users reporter ON ur.reporter_id = reporter.id
      LEFT JOIN users reviewer ON ur.reviewed_by = reviewer.id
      WHERE ur.status = ?
      ORDER BY ur.created_at DESC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM user_reports WHERE status = ?
    `, [status]);

    res.json({
      success: true,
      data: {
        reports: reports.map(report => ({
          id: report.id,
          reportType: report.report_type,
          description: report.description,
          status: report.status,
          createdAt: report.created_at,
          reviewedAt: report.reviewed_at,
          reporter: {
            username: report.reporter_username
          },
          reviewedBy: report.reviewed_by_username,
          article: {
            title: report.article_title,
            url: report.article_url
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount.count / limit),
          totalItems: totalCount.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Review report
router.put('/reports/:id/review', [
  body('status').isIn(['resolved', 'dismissed']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).trim()
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

    const { id } = req.params;
    const { status, notes } = req.body;

    // Check if report exists
    const report = await db.get('SELECT id, reporter_id FROM user_reports WHERE id = ?', [id]);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report
    await db.run(`
      UPDATE user_reports 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, req.user.userId, id]);

    // Create notification for reporter
    await db.run(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      report.reporter_id,
      'Report Review Complete',
      `Your report has been reviewed and marked as ${status}. ${notes ? 'Notes: ' + notes : ''}`,
      'report_update'
    ]);

    // Log admin activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, 'admin_review_report', 'report', ?, ?, ?, ?)
    `, [req.user.userId, id, JSON.stringify({ status, notes }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Report reviewed successfully'
    });

  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get verification requests for manual review
router.get('/verifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', priority } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE vr.status = ?';
    let params = [status];

    if (priority) {
      whereClause += ' AND vr.priority = ?';
      params.push(priority);
    }

    const verifications = await db.query(`
      SELECT vr.*, u.username as user_username, na.title as article_title
      FROM verification_requests vr
      LEFT JOIN users u ON vr.user_id = u.id
      LEFT JOIN news_articles na ON vr.article_id = na.id
      ${whereClause}
      ORDER BY 
        CASE vr.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        vr.created_at ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM verification_requests vr ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        verifications: verifications.map(verification => ({
          id: verification.id,
          type: verification.request_type,
          content: verification.content.substring(0, 500) + (verification.content.length > 500 ? '...' : ''),
          url: verification.url,
          imagePath: verification.image_path,
          status: verification.status,
          priority: verification.priority,
          createdAt: verification.created_at,
          user: {
            username: verification.user_username
          },
          article: verification.article_title ? {
            title: verification.article_title
          } : null
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount.count / limit),
          totalItems: totalCount.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Manually verify content
router.put('/verifications/:id/verify', [
  body('truthScore').isFloat({ min: 0, max: 100 }).withMessage('Truth score must be between 0 and 100'),
  body('credibilityLevel').isIn(['not_credible', 'low_credibility', 'mixed_credibility', 'mostly_credible', 'highly_credible']),
  body('evidence').optional().isLength({ max: 2000 }).trim(),
  body('reasoning').isLength({ min: 10, max: 2000 }).trim()
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

    const { id } = req.params;
    const { truthScore, credibilityLevel, evidence, reasoning } = req.body;

    // Check if verification request exists
    const request = await db.get('SELECT id, user_id FROM verification_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    // Create verification result
    await db.run(`
      INSERT INTO verification_results 
      (request_id, truth_score, credibility_level, verification_method, evidence, reasoning, verified_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, truthScore, credibilityLevel, 'Manual Review', evidence, reasoning, req.user.userId]);

    // Update request status
    await db.run(`
      UPDATE verification_requests 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    // Create notification for user
    await db.run(`
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (?, ?, ?, ?, ?)
    `, [
      request.user_id,
      'Verification Complete',
      `Your verification request has been completed with a truth score of ${truthScore}%.`,
      'verification_complete',
      `/verification/result/${id}`
    ]);

    // Log admin activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, 'admin_manual_verification', 'verification', ?, ?, ?, ?)
    `, [req.user.userId, id, JSON.stringify({ truthScore, credibilityLevel }), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Verification completed successfully'
    });

  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let dateFilter = "datetime('now', '-30 days')";
    if (period === '7d') dateFilter = "datetime('now', '-7 days')";
    else if (period === '90d') dateFilter = "datetime('now', '-90 days')";
    else if (period === '1y') dateFilter = "datetime('now', '-1 year')";

    // User growth
    const userGrowth = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Verification trends
    const verificationTrends = await db.query(`
      SELECT DATE(created_at) as date, 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM verification_requests
      WHERE created_at >= ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Truth score distribution
    const truthScoreDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN truth_score >= 90 THEN '90-100'
          WHEN truth_score >= 80 THEN '80-89'
          WHEN truth_score >= 70 THEN '70-79'
          WHEN truth_score >= 60 THEN '60-69'
          WHEN truth_score >= 50 THEN '50-59'
          ELSE '0-49'
        END as score_range,
        COUNT(*) as count
      FROM verification_results
      WHERE verified_at >= ${dateFilter}
      GROUP BY score_range
      ORDER BY score_range DESC
    `);

    res.json({
      success: true,
      data: {
        period,
        userGrowth: userGrowth.map(item => ({
          date: item.date,
          count: item.count
        })),
        verificationTrends: verificationTrends.map(item => ({
          date: item.date,
          total: item.total,
          completed: item.completed
        })),
        truthScoreDistribution: truthScoreDistribution.map(item => ({
          range: item.score_range,
          count: item.count
        }))
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;