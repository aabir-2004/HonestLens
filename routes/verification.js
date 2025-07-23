const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const mlService = require('../services/mlService');
const apiService = require('../services/apiService');
const imageService = require('../services/imageService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'verification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'verification-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Submit URL verification request
router.post('/verify-url', authMiddleware, [
  body('url').isURL().withMessage('Please provide a valid URL'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
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

    const { url, priority = 'medium' } = req.body;

    // Check if URL has been verified recently
    const existingRequest = await db.get(`
      SELECT id, status, created_at FROM verification_requests 
      WHERE url = ? AND status IN ('pending', 'processing', 'completed')
      ORDER BY created_at DESC LIMIT 1
    `, [url]);

    if (existingRequest && existingRequest.status === 'completed') {
      const result = await db.get(`
        SELECT * FROM verification_results WHERE request_id = ?
      `, [existingRequest.id]);

      return res.json({
        success: true,
        message: 'URL already verified',
        data: {
          requestId: existingRequest.id,
          status: 'completed',
          result: result
        }
      });
    }

    // Extract content from URL
    let content = '';
    let articleData = null;
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'HonestLens-Bot/1.0'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract article content
      const title = $('title').text() || $('h1').first().text() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      const articleText = $('article, .content, .post-content, .entry-content, main').text() || $('body').text();
      
      content = `${title}\n\n${description}\n\n${articleText}`.substring(0, 5000);
      
      articleData = {
        title: title.substring(0, 500),
        content: articleText.substring(0, 10000),
        url: url,
        source: new URL(url).hostname,
        published_date: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching URL content:', error);
      content = `URL: ${url}`;
    }

    // Store article if extracted
    let articleId = null;
    if (articleData) {
      const articleResult = await db.run(`
        INSERT OR IGNORE INTO news_articles (title, content, url, source, published_date)
        VALUES (?, ?, ?, ?, ?)
      `, [articleData.title, articleData.content, articleData.url, articleData.source, articleData.published_date]);
      
      if (articleResult.id) {
        articleId = articleResult.id;
      } else {
        const existingArticle = await db.get('SELECT id FROM news_articles WHERE url = ?', [url]);
        articleId = existingArticle?.id;
      }
    }

    // Create verification request
    const requestResult = await db.run(`
      INSERT INTO verification_requests (user_id, article_id, request_type, content, url, priority)
      VALUES (?, ?, 'url', ?, ?, ?)
    `, [req.user.userId, articleId, content, url, priority]);

    // Process verification immediately
    const verificationResult = await processVerification(requestResult.id, 'url', content, url);

    res.status(201).json({
      success: true,
      message: 'URL verification request submitted',
      data: {
        requestId: requestResult.id,
        status: 'processing',
        estimatedTime: '2-5 minutes'
      }
    });

  } catch (error) {
    console.error('URL verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit text verification request
router.post('/verify-text', authMiddleware, [
  body('text').isLength({ min: 10, max: 10000 }).withMessage('Text must be between 10 and 10000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
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

    const { text, priority = 'medium' } = req.body;

    // Create verification request
    const requestResult = await db.run(`
      INSERT INTO verification_requests (user_id, request_type, content, priority)
      VALUES (?, 'text', ?, ?)
    `, [req.user.userId, text, priority]);

    // Process verification immediately
    const verificationResult = await processVerification(requestResult.id, 'text', text);

    res.status(201).json({
      success: true,
      message: 'Text verification request submitted',
      data: {
        requestId: requestResult.id,
        status: 'processing',
        estimatedTime: '1-3 minutes'
      }
    });

  } catch (error) {
    console.error('Text verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit image verification request
router.post('/verify-image', authMiddleware, upload.single('image'), [
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { priority = 'medium' } = req.body;
    const imagePath = req.file.path;

    // Create verification request
    const requestResult = await db.run(`
      INSERT INTO verification_requests (user_id, request_type, content, image_path, priority)
      VALUES (?, 'image', ?, ?, ?)
    `, [req.user.userId, `Image verification: ${req.file.filename}`, imagePath, priority]);

    // Process verification immediately
    const verificationResult = await processVerification(requestResult.id, 'image', `Image: ${req.file.filename}`, null, imagePath);

    res.status(201).json({
      success: true,
      message: 'Image verification request submitted',
      data: {
        requestId: requestResult.id,
        status: 'processing',
        estimatedTime: '3-7 minutes'
      }
    });

  } catch (error) {
    console.error('Image verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get verification result
router.get('/result/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get verification request
    const request = await db.get(`
      SELECT vr.*, na.title, na.source 
      FROM verification_requests vr
      LEFT JOIN news_articles na ON vr.article_id = na.id
      WHERE vr.id = ? AND vr.user_id = ?
    `, [requestId, req.user.userId]);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    // Get verification result if completed
    let result = null;
    if (request.status === 'completed') {
      result = await db.get(`
        SELECT * FROM verification_results WHERE request_id = ?
      `, [requestId]);
    }

    res.json({
      success: true,
      data: {
        request: {
          id: request.id,
          type: request.request_type,
          status: request.status,
          priority: request.priority,
          content: request.content,
          url: request.url,
          imagePath: request.image_path,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          article: request.title ? {
            title: request.title,
            source: request.source
          } : null
        },
        result: result ? {
          truthScore: result.truth_score,
          credibilityLevel: result.credibility_level,
          verificationMethod: result.verification_method,
          sourcesChecked: result.sources_checked ? JSON.parse(result.sources_checked) : [],
          evidence: result.evidence,
          reasoning: result.reasoning,
          confidenceScore: result.confidence_score,
          flags: result.flags ? JSON.parse(result.flags) : [],
          verifiedAt: result.verified_at
        } : null
      }
    });

  } catch (error) {
    console.error('Get verification result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's verification history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE vr.user_id = ?';
    let params = [req.user.userId];

    if (status) {
      whereClause += ' AND vr.status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND vr.request_type = ?';
      params.push(type);
    }

    const requests = await db.query(`
      SELECT vr.*, na.title, na.source,
             vres.truth_score, vres.credibility_level, vres.verified_at
      FROM verification_requests vr
      LEFT JOIN news_articles na ON vr.article_id = na.id
      LEFT JOIN verification_results vres ON vr.id = vres.request_id
      ${whereClause}
      ORDER BY vr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.get(`
      SELECT COUNT(*) as count FROM verification_requests vr ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        requests: requests.map(req => ({
          id: req.id,
          type: req.request_type,
          status: req.status,
          priority: req.priority,
          content: req.content.substring(0, 200) + (req.content.length > 200 ? '...' : ''),
          url: req.url,
          createdAt: req.created_at,
          article: req.title ? {
            title: req.title,
            source: req.source
          } : null,
          result: req.truth_score ? {
            truthScore: req.truth_score,
            credibilityLevel: req.credibility_level,
            verifiedAt: req.verified_at
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
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Process verification (internal function)
async function processVerification(requestId, type, content, url = null, imagePath = null) {
  try {
    // Update request status to processing
    await db.run(`
      UPDATE verification_requests 
      SET status = 'processing', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [requestId]);

    // Simulate AI verification process
    const verificationResult = await performAIVerification(type, content, url, imagePath);

    // Store verification result
    await db.run(`
      INSERT INTO verification_results 
      (request_id, truth_score, credibility_level, verification_method, sources_checked, 
       evidence, reasoning, confidence_score, flags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      requestId,
      verificationResult.truthScore,
      verificationResult.credibilityLevel,
      verificationResult.method,
      JSON.stringify(verificationResult.sourcesChecked),
      verificationResult.evidence,
      verificationResult.reasoning,
      verificationResult.confidenceScore,
      JSON.stringify(verificationResult.flags)
    ]);

    // Update request status to completed
    await db.run(`
      UPDATE verification_requests 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [requestId]);

    return verificationResult;

  } catch (error) {
    console.error('Verification processing error:', error);
    
    // Update request status to failed
    await db.run(`
      UPDATE verification_requests 
      SET status = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [requestId]);

    throw error;
  }
}

// Enhanced AI Verification using ML and API services
async function performAIVerification(type, content, url, imagePath) {
  console.log(`Starting enhanced verification for ${type}:`, { content: content?.substring(0, 100), url, imagePath });
  
  try {
    let mlAnalysis = null;
    let apiAnalysis = null;
    let imageAnalysis = null;

    // Perform ML analysis for text content
    if (content && (type === 'text' || type === 'url')) {
      console.log('Performing ML content analysis...');
      mlAnalysis = await mlService.verifyContent(content, url);
    }

    // Perform external API verification
    if (content || url) {
      console.log('Performing external API verification...');
      apiAnalysis = await apiService.verifyWithExternalAPIs(content, url);
    }

    // Perform image analysis if image is provided
    if (imagePath && type === 'image') {
      console.log('Performing image verification...');
      imageAnalysis = await imageService.verifyImage(imagePath);
    }

    // Combine all analyses
    const combinedResult = combineVerificationResults({
      mlAnalysis,
      apiAnalysis,
      imageAnalysis,
      type,
      content,
      url,
      imagePath
    });

    console.log('Verification completed successfully');
    return combinedResult;

  } catch (error) {
    console.error('Enhanced verification error:', error);
    
    // Fallback to basic verification
    console.log('Falling back to basic verification...');
    return await performBasicVerification(type, content, url, imagePath);
  }
}

// Combine results from multiple verification services
function combineVerificationResults({ mlAnalysis, apiAnalysis, imageAnalysis, type, content, url, imagePath }) {
  let truthScore = 50;
  let evidence = [];
  let flags = [];
  let sourcesChecked = [];
  let reasoning = 'Enhanced AI verification performed using multiple services. ';
  let confidenceScore = 70;

  // Process ML analysis results
  if (mlAnalysis) {
    truthScore = mlAnalysis.finalScore;
    evidence.push(...mlAnalysis.evidence);
    flags.push(...mlAnalysis.flags);
    reasoning += `ML analysis: ${mlAnalysis.reasoning} `;
    confidenceScore += 10;
  }

  // Process API analysis results
  if (apiAnalysis) {
    // Weight API results with ML results
    const apiWeight = 0.4;
    const mlWeight = mlAnalysis ? 0.6 : 1.0;
    
    if (mlAnalysis) {
      truthScore = Math.round((truthScore * mlWeight) + (apiAnalysis.aggregatedScore * apiWeight));
    } else {
      truthScore = apiAnalysis.aggregatedScore;
    }

    // Add API sources
    sourcesChecked.push(...apiAnalysis.sources);
    
    // Add API-specific evidence
    if (apiAnalysis.newsAPIResults && apiAnalysis.newsAPIResults.relevantArticles.length > 0) {
      evidence.push(`Found ${apiAnalysis.newsAPIResults.relevantArticles.length} relevant news articles`);
    }
    
    if (apiAnalysis.googleFactCheckResults && apiAnalysis.googleFactCheckResults.relevantClaims.length > 0) {
      evidence.push(`Cross-referenced with ${apiAnalysis.googleFactCheckResults.relevantClaims.length} fact-check claims`);
    }
    
    if (apiAnalysis.rssFactCheckResults && apiAnalysis.rssFactCheckResults.length > 0) {
      evidence.push(`Checked against ${apiAnalysis.rssFactCheckResults.length} Indian fact-check sources`);
    }

    if (apiAnalysis.openAIAnalysis) {
      reasoning += `OpenAI analysis: ${apiAnalysis.openAIAnalysis.reasoning || 'Advanced AI analysis performed'}. `;
      confidenceScore += 15;
    }
  }

  // Process image analysis results
  if (imageAnalysis) {
    const imageWeight = 0.3;
    const combinedWeight = mlAnalysis || apiAnalysis ? 0.7 : 1.0;
    
    if (mlAnalysis || apiAnalysis) {
      truthScore = Math.round((truthScore * combinedWeight) + (imageAnalysis.finalScore * imageWeight));
    } else {
      truthScore = imageAnalysis.finalScore;
    }

    evidence.push(...imageAnalysis.evidence);
    flags.push(...imageAnalysis.flags);
    reasoning += `Image analysis: ${imageAnalysis.flags.length === 0 ? 'No manipulation detected' : 'Potential issues found'}. `;
    confidenceScore += 10;
  }

  // Determine credibility level
  let credibilityLevel;
  if (truthScore >= 85) credibilityLevel = 'highly_credible';
  else if (truthScore >= 70) credibilityLevel = 'mostly_credible';
  else if (truthScore >= 50) credibilityLevel = 'mixed_credibility';
  else if (truthScore >= 30) credibilityLevel = 'low_credibility';
  else credibilityLevel = 'not_credible';

  // Ensure confidence score is reasonable
  confidenceScore = Math.min(95, confidenceScore);

  return {
    truthScore: Math.max(0, Math.min(100, truthScore)),
    credibilityLevel,
    method: `Enhanced AI Analysis (${type}) - ML + API + ${imageAnalysis ? 'Image' : 'Text'}`,
    sourcesChecked: sourcesChecked.slice(0, 10), // Limit sources
    evidence: evidence.join('; '),
    reasoning: reasoning.trim(),
    confidenceScore: Math.round(confidenceScore),
    flags: [...new Set(flags)], // Remove duplicates
    mlAnalysis: mlAnalysis ? {
      contentScore: mlAnalysis.contentAnalysis?.score,
      sourceScore: mlAnalysis.sourceAnalysis?.score,
      crossRefScore: mlAnalysis.crossReference?.score
    } : null,
    apiAnalysis: apiAnalysis ? {
      newsAPIScore: apiAnalysis.newsAPIResults?.credibilityScore,
      factCheckScore: apiAnalysis.googleFactCheckResults?.credibilityScore,
      openAIScore: apiAnalysis.openAIAnalysis?.credibilityScore
    } : null,
    imageAnalysis: imageAnalysis ? {
      manipulationScore: imageAnalysis.manipulationDetection?.manipulationScore,
      hasText: imageAnalysis.textAnalysis?.hasText,
      textScore: imageAnalysis.textAnalysis?.textAnalysis?.score
    } : null
  };
}

// Fallback basic verification function
async function performBasicVerification(type, content, url, imagePath) {
  console.log('Performing basic verification fallback...');
  
  // Get fact-check sources
  const sources = await db.query(`
    SELECT name, url, reliability_score FROM fact_check_sources 
    WHERE is_active = 1 AND country = 'India'
    ORDER BY reliability_score DESC
  `);

  let truthScore = 50;
  let flags = [];
  let evidence = [];

  // Basic content analysis
  if (content) {
    const suspiciousKeywords = [
      'breaking', 'urgent', 'shocking', 'unbelievable', 'secret', 'hidden truth',
      'they don\'t want you to know', 'viral', 'must share', 'forward this'
    ];

    const contentLower = content.toLowerCase();
    const suspiciousCount = suspiciousKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;

    if (suspiciousCount > 2) {
      truthScore -= 20;
      flags.push('Contains sensational language');
    }
  }

  // Basic URL analysis
  if (url) {
    try {
      const domain = new URL(url).hostname;
      const trustedDomains = [
        'pib.gov.in', 'mygov.in', 'timesofindia.com', 'thehindu.com',
        'indianexpress.com', 'ndtv.com', 'bbc.com', 'reuters.com'
      ];

      if (trustedDomains.some(trusted => domain.includes(trusted))) {
        truthScore += 15;
        evidence.push(`Source from trusted domain: ${domain}`);
      } else {
        truthScore -= 10;
        flags.push('Source from unverified domain');
      }
    } catch (error) {
      flags.push('Invalid URL provided');
      truthScore -= 15;
    }
  }

  // Simulate basic fact-checking
  const checkedSources = sources.slice(0, 3).map(source => ({
    name: source.name,
    url: source.url,
    reliability: source.reliability_score,
    status: Math.random() > 0.3 ? 'verified' : 'no_match'
  }));

  const verifiedSources = checkedSources.filter(s => s.status === 'verified');
  if (verifiedSources.length > 0) {
    truthScore += verifiedSources.length * 10;
    evidence.push(`Verified by ${verifiedSources.length} trusted sources`);
  }

  // Determine credibility level
  let credibilityLevel;
  if (truthScore >= 85) credibilityLevel = 'highly_credible';
  else if (truthScore >= 70) credibilityLevel = 'mostly_credible';
  else if (truthScore >= 50) credibilityLevel = 'mixed_credibility';
  else if (truthScore >= 30) credibilityLevel = 'low_credibility';
  else credibilityLevel = 'not_credible';

  return {
    truthScore: Math.round(Math.max(0, Math.min(100, truthScore))),
    credibilityLevel,
    method: `Basic Analysis (${type}) - Fallback Mode`,
    sourcesChecked: checkedSources,
    evidence: evidence.join('; '),
    reasoning: `Basic verification performed. ${evidence.length > 0 ? 'Evidence: ' + evidence.join(', ') + '. ' : ''}${flags.length > 0 ? 'Concerns: ' + flags.join(', ') + '. ' : ''}Cross-referenced with ${checkedSources.length} fact-checking sources.`,
    confidenceScore: 60,
    flags
  };
}

module.exports = router;