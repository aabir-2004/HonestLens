const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

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

// Safe route loading function
function safeRequire(path, routeName) {
  try {
    const route = require(path);
    if (typeof route === 'function' || (route && typeof route.use === 'function')) {
      console.log(`✅ ${routeName} loaded successfully`);
      return route;
    } else {
      console.error(`❌ ${routeName} is not a valid middleware function:`, typeof route);
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to load ${routeName}:`, error.message);
    return null;
  }
}

// Load routes safely
const authRoutes = safeRequire('./routes/auth', 'authRoutes');
const newsRoutes = safeRequire('./routes/news', 'newsRoutes');
const verificationRoutes = safeRequire('./routes/verification', 'verificationRoutes');
const userRoutes = safeRequire('./routes/users', 'userRoutes');
const adminRoutes = safeRequire('./routes/admin', 'adminRoutes');

// Apply routes only if they loaded successfully
if (authRoutes) {
  app.use('/api/auth', authRoutes);
}
if (newsRoutes) {
  app.use('/api/news', newsRoutes);
}
if (verificationRoutes) {
  app.use('/api/verification', verificationRoutes);
}
if (userRoutes) {
  app.use('/api/user', userRoutes);
}
if (adminRoutes) {
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

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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