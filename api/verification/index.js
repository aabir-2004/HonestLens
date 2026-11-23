const express = require('express');
const router = express.Router();

// Import individual route handlers
const verifyUrlHandler = require('./verify-url');
const verifyTextHandler = require('./verify-text');
const verifyImageHandler = require('./verify-image');

// Route definitions
router.post('/verify-url', verifyUrlHandler);
router.post('/verify-text', verifyTextHandler);
router.post('/verify-image', verifyImageHandler);

// Default verification endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'HonestLens Verification API',
    endpoints: [
      'POST /api/verification/verify-url - Verify news URL',
      'POST /api/verification/verify-text - Verify text content',
      'POST /api/verification/verify-image - Verify image content'
    ]
  });
});

module.exports = router;