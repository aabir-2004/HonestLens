module.exports = {
  apps: [{
    name: 'honestlens',
    script: 'server.js',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000,
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    // Performance monitoring
    monitoring: false,
    pmx: false,
    
    // Restart policy
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced features
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'data'],
    
    // Environment variables
    env_file: '.env.production'
  }]
};