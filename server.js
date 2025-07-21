const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Import routes with error handling
let authRoutes, newsRoutes, verificationRoutes, userRoutes, adminRoutes;
let errorHandler;

try {
  authRoutes = require('./routes/auth');
  console.log('authRoutes loaded:', typeof authRoutes);
} catch (err) {
  console.error('Failed to load auth routes:', err.message);
  authRoutes = express.Router(); // Fallback empty router
}

try {
  newsRoutes = require('./routes/news');
  console.log('newsRoutes loaded:', typeof newsRoutes);
} catch (err) {
  console.error('Failed to load news routes:', err.message);
  newsRoutes = express.Router();
}

try {
  verificationRoutes = require('./routes/verification');
  console.log('verificationRoutes loaded:', typeof verificationRoutes);
} catch (err) {
  console.error('Failed to load verification routes:', err.message);
  verificationRoutes = express.Router();
}

try {
  userRoutes = require('./routes/user');
  console.log('userRoutes loaded:', typeof userRoutes);
} catch (err) {
  console.error('Failed to load user routes:', err.message);
  userRoutes = express.Router();
}

try {
  adminRoutes = require('./routes/admin');
  console.log('adminRoutes loaded:', typeof adminRoutes);
} catch (err) {
  console.error('Failed to load admin routes:', err.message);
  adminRoutes = express.Router();
}

try {
  const errorHandlerModule = require('./middleware/errorHandler');
  errorHandler = errorHandlerModule.errorHandler || errorHandlerModule;
  console.log('errorHandler loaded:', typeof errorHandler);
} catch (err) {
  console.error('Failed to load error handler:', err.message);
  // Fallback error handler
  errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  };
}

// Initialize database
let initializeDatabase;
try {
  const dbModule = require('./config/database');
  initializeDatabase = dbModule.initializeDatabase;
  console.log('database module loaded:', typeof initializeDatabase);
} catch (err) {
  console.error('Failed to load database module:', err.message);
  initializeDatabase = () => Promise.resolve(); // Fallback
}

// Routes - only use if they're valid functions
if (typeof authRoutes === 'function') {
  app.use('/api/auth', authRoutes);
}

if (typeof newsRoutes === 'function') {
  app.use('/api/news', newsRoutes);
}

if (typeof verificationRoutes === 'function') {
  app.use('/api/verification', verificationRoutes);
}

if (typeof userRoutes === 'function') {
  app.use('/api/users', userRoutes);
}

if (typeof adminRoutes === 'function') {
  app.use('/api/admin', adminRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware - only use if it's a valid function
if (typeof errorHandler === 'function') {
  app.use(errorHandler);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
if (typeof initializeDatabase === 'function') {
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`HonestLens server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
} else {
  // Start server without database initialization
  app.listen(PORT, () => {
    console.log(`HonestLens server running on port ${PORT} (no database)`);
  });
}

module.exports = app;