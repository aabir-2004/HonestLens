const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get verified news articles
router.get('/verified', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, source, credibility } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = `
      WHERE vres.credibility_level IN ('highly_credible', 'mostly_credible')
    `;
    let params = [];

    if (category) {
      whereClause += ' AND na.category = ?';
      params.push(category);
    }

    if (source) {
      whereClause += ' AND na.source LIKE ?';
      params.push(`%${source}%`);
    }

    if (credibility) {
      whereClause += ' AND vres.credibility_level = ?';
      params.push(credibility);
    }

    const articles = await db.query(`
      SELECT na.*, vres.truth_score, vres.credibility_level, vres.verified_at,
             u.username as verified_by_username
      FROM news_articles na
      INNER JOIN verification_requests vreq ON na.id = vreq.article_id
      INNER JOIN verification_results vres ON vreq.id = vres.request_id
      LEFT JOIN users u ON vres.verified_by = u.id
      ${whereClause}
      ORDER BY vres.verified_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count
      FROM news_articles na
      INNER JOIN verification_requests vreq ON na.id = vreq.article_id
      INNER JOIN verification_results vres ON vreq.id = vres.request_id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || article.content.substring(0, 200) + '...',
          url: article.url,
          source: article.source,
          author: article.author,
          publishedDate: article.published_date,
          category: article.category,
          imageUrl: article.image_url,
          verification: {
            truthScore: article.truth_score,
            credibilityLevel: article.credibility_level,
            verifiedAt: article.verified_at,
            verifiedBy: article.verified_by_username
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
    console.error('Get verified news error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get debunked news articles
router.get('/debunked', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const articles = await db.query(`
      SELECT na.*, vres.truth_score, vres.credibility_level, vres.verified_at,
             vres.reasoning, u.username as verified_by_username
      FROM news_articles na
      INNER JOIN verification_requests vreq ON na.id = vreq.article_id
      INNER JOIN verification_results vres ON vreq.id = vres.request_id
      LEFT JOIN users u ON vres.verified_by = u.id
      WHERE vres.credibility_level IN ('not_credible', 'low_credibility')
      ORDER BY vres.verified_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count
      FROM news_articles na
      INNER JOIN verification_requests vreq ON na.id = vreq.article_id
      INNER JOIN verification_results vres ON vreq.id = vres.request_id
      WHERE vres.credibility_level IN ('not_credible', 'low_credibility')
    `);

    res.json({
      success: true,
      data: {
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || article.content.substring(0, 200) + '...',
          url: article.url,
          source: article.source,
          publishedDate: article.published_date,
          verification: {
            truthScore: article.truth_score,
            credibilityLevel: article.credibility_level,
            reasoning: article.reasoning,
            verifiedAt: article.verified_at,
            verifiedBy: article.verified_by_username
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
    console.error('Get debunked news error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single news article with verification details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await db.get(`
      SELECT na.*, vres.truth_score, vres.credibility_level, vres.verification_method,
             vres.sources_checked, vres.evidence, vres.reasoning, vres.confidence_score,
             vres.flags, vres.verified_at, u.username as verified_by_username
      FROM news_articles na
      LEFT JOIN verification_requests vreq ON na.id = vreq.article_id
      LEFT JOIN verification_results vres ON vreq.id = vres.request_id
      LEFT JOIN users u ON vres.verified_by = u.id
      WHERE na.id = ?
    `, [id]);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Get related articles
    const relatedArticles = await db.query(`
      SELECT na.id, na.title, na.source, na.published_date,
             vres.truth_score, vres.credibility_level
      FROM news_articles na
      LEFT JOIN verification_requests vreq ON na.id = vreq.article_id
      LEFT JOIN verification_results vres ON vreq.id = vres.request_id
      WHERE na.id != ? AND (na.category = ? OR na.source = ?)
      ORDER BY na.published_date DESC
      LIMIT 5
    `, [id, article.category, article.source]);

    res.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          content: article.content,
          summary: article.summary,
          url: article.url,
          source: article.source,
          author: article.author,
          publishedDate: article.published_date,
          category: article.category,
          language: article.language,
          imageUrl: article.image_url,
          keywords: article.keywords ? article.keywords.split(',') : [],
          verification: article.truth_score ? {
            truthScore: article.truth_score,
            credibilityLevel: article.credibility_level,
            verificationMethod: article.verification_method,
            sourcesChecked: article.sources_checked ? JSON.parse(article.sources_checked) : [],
            evidence: article.evidence,
            reasoning: article.reasoning,
            confidenceScore: article.confidence_score,
            flags: article.flags ? JSON.parse(article.flags) : [],
            verifiedAt: article.verified_at,
            verifiedBy: article.verified_by_username
          } : null
        },
        relatedArticles: relatedArticles.map(rel => ({
          id: rel.id,
          title: rel.title,
          source: rel.source,
          publishedDate: rel.published_date,
          verification: rel.truth_score ? {
            truthScore: rel.truth_score,
            credibilityLevel: rel.credibility_level
          } : null
        }))
      }
    });

  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search news articles
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20, category, credibility, dateFrom, dateTo } = req.query;

    if (!q || q.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters long'
      });
    }

    const offset = (page - 1) * limit;
    const searchTerm = `%${q.trim()}%`;

    let whereClause = `
      WHERE (na.title LIKE ? OR na.content LIKE ? OR na.keywords LIKE ?)
    `;
    let params = [searchTerm, searchTerm, searchTerm];

    if (category) {
      whereClause += ' AND na.category = ?';
      params.push(category);
    }

    if (credibility) {
      whereClause += ' AND vres.credibility_level = ?';
      params.push(credibility);
    }

    if (dateFrom) {
      whereClause += ' AND na.published_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND na.published_date <= ?';
      params.push(dateTo);
    }

    const articles = await db.query(`
      SELECT na.*, vres.truth_score, vres.credibility_level, vres.verified_at
      FROM news_articles na
      LEFT JOIN verification_requests vreq ON na.id = vreq.article_id
      LEFT JOIN verification_results vres ON vreq.id = vres.request_id
      ${whereClause}
      ORDER BY na.published_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count
      FROM news_articles na
      LEFT JOIN verification_requests vreq ON na.id = vreq.article_id
      LEFT JOIN verification_results vres ON vreq.id = vres.request_id
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        query: q,
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || article.content.substring(0, 200) + '...',
          url: article.url,
          source: article.source,
          publishedDate: article.published_date,
          category: article.category,
          verification: article.truth_score ? {
            truthScore: article.truth_score,
            credibilityLevel: article.credibility_level,
            verifiedAt: article.verified_at
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
    console.error('Search articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Report news article
router.post('/:id/report', authMiddleware, [
  body('reportType').isIn(['misinformation', 'spam', 'inappropriate', 'copyright', 'other']),
  body('description').optional().isLength({ max: 1000 }).trim()
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
    const { reportType, description } = req.body;

    // Check if article exists
    const article = await db.get('SELECT id FROM news_articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check if user already reported this article
    const existingReport = await db.get(`
      SELECT id FROM user_reports 
      WHERE reporter_id = ? AND article_id = ? AND status != 'dismissed'
    `, [req.user.userId, id]);

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: 'You have already reported this article'
      });
    }

    // Create report
    const result = await db.run(`
      INSERT INTO user_reports (reporter_id, article_id, report_type, description)
      VALUES (?, ?, ?, ?)
    `, [req.user.userId, id, reportType, description]);

    // Log user activity
    await db.run(`
      INSERT INTO user_activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, 'report_article', 'article', ?, ?, ?, ?)
    `, [req.user.userId, id, JSON.stringify({ reportType, description }), req.ip, req.get('User-Agent')]);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: result.id
      }
    });

  } catch (error) {
    console.error('Report article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get news categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query(`
      SELECT category, COUNT(*) as count
      FROM news_articles
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          name: cat.category,
          count: cat.count
        }))
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get trending topics
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get most verified articles in last 7 days
    const trending = await db.query(`
      SELECT na.title, na.source, na.category, COUNT(vreq.id) as verification_count,
             AVG(vres.truth_score) as avg_truth_score
      FROM news_articles na
      INNER JOIN verification_requests vreq ON na.id = vreq.article_id
      LEFT JOIN verification_results vres ON vreq.id = vres.request_id
      WHERE vreq.created_at >= datetime('now', '-7 days')
      GROUP BY na.id
      HAVING verification_count > 1
      ORDER BY verification_count DESC, avg_truth_score DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        trending: trending.map(item => ({
          title: item.title,
          source: item.source,
          category: item.category,
          verificationCount: item.verification_count,
          avgTruthScore: Math.round(item.avg_truth_score || 0)
        }))
      }
    });

  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;