const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get user dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's verification stats
    const verificationStats = await db.get(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
      FROM verification_requests 
      WHERE user_id = ?
    `, [userId]);

    // Get user's recent activity
    const recentActivity = await db.query(`
      SELECT action, resource_type, resource_id, details, created_at
      FROM user_activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    // Get user's reputation breakdown
    const reputationBreakdown = await db.get(`
      SELECT 
        reputation_score,
        (SELECT COUNT(*) FROM verification_requests WHERE user_id = ? AND status = 'completed') as verifications_completed,
        (SELECT COUNT(*) FROM user_reports WHERE reporter_id = ? AND status = 'resolved') as reports_resolved
      FROM users 
      WHERE id = ?
    `, [userId, userId, userId]);

    // Get unread notifications count
    const unreadNotifications = await db.get(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    res.json({
      success: true,
      data: {
        verificationStats: {
          totalRequests: verificationStats.total_requests || 0,
          completed: verificationStats.completed || 0,
          pending: verificationStats.pending || 0,
          processing: verificationStats.processing || 0
        },
        recentActivity: recentActivity.map(activity => ({
          action: activity.action,
          resourceType: activity.resource_type,
          resourceId: activity.resource_id,
          details: activity.details ? JSON.parse(activity.details) : null,
          timestamp: activity.created_at
        })),
        reputation: {
          score: reputationBreakdown.reputation_score || 0,
          verificationsCompleted: reputationBreakdown.verifications_completed || 0,
          reportsResolved: reputationBreakdown.reports_resolved || 0
        },
        notifications: {
          unreadCount: unreadNotifications.count || 0
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = 0';
    }

    const notifications = await db.query(`
      SELECT id, title, message, type, is_read, action_url, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM notifications ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.is_read === 1,
          actionUrl: notif.action_url,
          createdAt: notif.created_at
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
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if notification belongs to user
    const notification = await db.get(`
      SELECT id FROM notifications WHERE id = ? AND user_id = ?
    `, [id, userId]);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Mark as read
    await db.run(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user.userId;

    await db.run(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's reports
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let whereClause = 'WHERE ur.reporter_id = ?';
    let params = [userId];

    if (status) {
      whereClause += ' AND ur.status = ?';
      params.push(status);
    }

    const reports = await db.query(`
      SELECT ur.*, na.title as article_title, na.source as article_source,
             reviewer.username as reviewed_by_username
      FROM user_reports ur
      LEFT JOIN news_articles na ON ur.article_id = na.id
      LEFT JOIN users reviewer ON ur.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY ur.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM user_reports ur ${whereClause}
    `, params);

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
          reviewedBy: report.reviewed_by_username,
          article: {
            title: report.article_title,
            source: report.article_source
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
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user activity history
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let whereClause = 'WHERE user_id = ?';
    let params = [userId];

    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    const activities = await db.query(`
      SELECT action, resource_type, resource_id, details, ip_address, created_at
      FROM user_activity_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM user_activity_logs ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        activities: activities.map(activity => ({
          action: activity.action,
          resourceType: activity.resource_type,
          resourceId: activity.resource_id,
          details: activity.details ? JSON.parse(activity.details) : null,
          ipAddress: activity.ip_address,
          timestamp: activity.created_at
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
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user preferences
router.put('/preferences', [
  body('emailNotifications').optional().isBoolean(),
  body('pushNotifications').optional().isBoolean(),
  body('language').optional().isIn(['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu']),
  body('timezone').optional().isString()
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

    const userId = req.user.userId;
    const preferences = req.body;

    // Store preferences in user_activity_logs as JSON for now
    // In a real implementation, you'd have a separate user_preferences table
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (?, 'update_preferences', ?, ?, ?)
    `, [userId, JSON.stringify(preferences), req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get comprehensive user statistics
    const stats = await db.get(`
      SELECT 
        u.reputation_score,
        u.created_at as member_since,
        (SELECT COUNT(*) FROM verification_requests WHERE user_id = ?) as total_verifications,
        (SELECT COUNT(*) FROM verification_requests WHERE user_id = ? AND status = 'completed') as completed_verifications,
        (SELECT COUNT(*) FROM user_reports WHERE reporter_id = ?) as total_reports,
        (SELECT COUNT(*) FROM user_reports WHERE reporter_id = ? AND status = 'resolved') as resolved_reports,
        (SELECT AVG(vres.truth_score) 
         FROM verification_requests vreq 
         JOIN verification_results vres ON vreq.id = vres.request_id 
         WHERE vreq.user_id = ?) as avg_truth_score
      FROM users u
      WHERE u.id = ?
    `, [userId, userId, userId, userId, userId, userId]);

    // Get monthly verification activity
    const monthlyActivity = await db.query(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM verification_requests
      WHERE user_id = ? AND created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `, [userId]);

    // Get verification type breakdown
    const typeBreakdown = await db.query(`
      SELECT 
        request_type,
        COUNT(*) as count
      FROM verification_requests
      WHERE user_id = ?
      GROUP BY request_type
    `, [userId]);

    res.json({
      success: true,
      data: {
        overview: {
          reputationScore: stats.reputation_score || 0,
          memberSince: stats.member_since,
          totalVerifications: stats.total_verifications || 0,
          completedVerifications: stats.completed_verifications || 0,
          totalReports: stats.total_reports || 0,
          resolvedReports: stats.resolved_reports || 0,
          avgTruthScore: Math.round(stats.avg_truth_score || 0)
        },
        monthlyActivity: monthlyActivity.map(item => ({
          month: item.month,
          count: item.count
        })),
        typeBreakdown: typeBreakdown.map(item => ({
          type: item.request_type,
          count: item.count
        }))
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;