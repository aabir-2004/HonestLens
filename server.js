const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const cacheService = require('./middleware/cache');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://newsapi.org", "https://factchecktools.googleapis.com"]
    }
  }
}));

// Compression middleware for better performance
app.use(compression());

// CORS configuration for deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.NETLIFY_URL ? `https://${process.env.NETLIFY_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting with different limits for different endpoints
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 200 : 1000,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for verification endpoints
const verificationLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  process.env.NODE_ENV === 'production' ? 20 : 100,
  'Too many verification requests. Please wait before trying again.'
);

app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Logging
app.use(morgan('combined'));

// Safe route loading and mounting function
function safeLoadAndMount(routePath, apiPath, routeName) {
  try {
    console.log(`🔄 Loading ${routeName}...`);
    const route = require(routePath);
    
    if (typeof route === 'function' || (route && typeof route.use === 'function')) {
      console.log(`✅ ${routeName} loaded successfully`);
      
      // Try to mount the route
      try {
        app.use(apiPath, route);
        console.log(`✅ ${routeName} mounted at ${apiPath}`);
      } catch (mountError) {
        console.error(`❌ Failed to mount ${routeName} at ${apiPath}:`, mountError.message);
        console.error(`Check for malformed route paths in ${routePath}`);
        console.error(`Common issues: routes like '/:' or '/users/:' without parameter names`);
      }
    } else {
      console.error(`❌ ${routeName} is not a valid middleware function:`, typeof route);
    }
  } catch (error) {
    console.error(`❌ Failed to load ${routeName}:`, error.message);
  }
}

// Apply caching to public endpoints BEFORE mounting routes (temporarily disabled for debugging)
// app.use('/api/news', cacheService.middleware(300)); // 5 minutes cache
// app.use('/api/health', cacheService.middleware(60)); // 1 minute cache

// Load and mount routes safely with rate limiting
safeLoadAndMount('./routes/auth', '/api/auth', 'authRoutes');
safeLoadAndMount('./routes/news', '/api/news', 'newsRoutes');

// Apply strict rate limiting to verification routes
app.use('/api/verification', verificationLimiter);
safeLoadAndMount('./routes/verification', '/api/verification', 'verificationRoutes');

safeLoadAndMount('./routes/users', '/api/users', 'userRoutes');
safeLoadAndMount('./routes/admin', '/api/admin', 'adminRoutes');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve frontend for all non-API routes
app.get('/*path', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HonestLens server running on port ${PORT}`);
      console.log(`Server available at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;