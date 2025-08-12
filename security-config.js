// Security Configuration for Production
// Add this to your server.js file

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://newsapi.org"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Enhanced rate limiting for different endpoints
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Apply different rate limits
app.use('/api/verification', createRateLimiter(5 * 60 * 1000, 20, 'Too many verification requests'));
app.use('/api/auth', createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts'));
app.use('/api', createRateLimiter(15 * 60 * 1000, 200, 'Too many API requests'));
