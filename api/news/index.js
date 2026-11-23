const express = require('express');
const router = express.Router();

// Import individual route handlers
const liveHandler = require('./live');
const trendingHandler = require('./trending');

// Route definitions
router.get('/live', liveHandler);
router.get('/trending', trendingHandler);

// Default news endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'HonestLens News API',
    endpoints: [
      '/api/news/live - Get live news',
      '/api/news/trending - Get trending news'
    ]
  });
});

module.exports = router;