// Enhanced Health Check System
// Add this to your routes or server.js

const os = require('os');
const fs = require('fs');

// Detailed health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      system: Math.round(os.totalmem() / 1024 / 1024)
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: os.loadavg()
    },
    database: 'connected', // Add actual database check
    cache: 'available' // Add actual cache check
  };

  // Check if critical services are available
  try {
    // Add your database connection check here
    // Add your Redis connection check here
    
    res.status(200).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
    res.status(503).json(health);
  }
});

// Readiness probe (for Kubernetes/Docker)
app.get('/api/ready', (req, res) => {
  // Check if app is ready to serve traffic
  res.status(200).json({ status: 'ready' });
});

// Liveness probe (for Kubernetes/Docker)
app.get('/api/live', (req, res) => {
  // Check if app is alive
  res.status(200).json({ status: 'alive' });
});
