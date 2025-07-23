const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('🔍 Starting middleware diagnostic...');

// 1. Check environment variables
console.log('\n=== ENVIRONMENT VARIABLES ===');
const envVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'FRONTEND_URL',
  'DATABASE_URL'
];

envVars.forEach(varName => {
  console.log(`${varName}: ${process.env[varName] ? '✅ Set' : '❌ Not set'}`);
});

// 2. Check middleware directory
console.log('\n=== MIDDLEWARE FILES ===');
const middlewareDir = path.join(__dirname, 'middleware');
try {
  const files = fs.readdirSync(middlewareDir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      console.log(`Found middleware: ${file}`);
    }
  });
} catch (err) {
  console.error('❌ Could not read middleware directory:', err.message);
}

// 3. Test middleware loading
console.log('\n=== TESTING MIDDLEWARE LOADING ===');
const testMiddleware = (name, path) => {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    const middleware = require(path);
    if (typeof middleware === 'function') {
      console.log(`✅ ${name} is a valid middleware function`);
      return true;
    } else if (middleware && typeof middleware === 'object') {
      console.log(`ℹ️  ${name} is an object with ${Object.keys(middleware).length} properties`);
      return true;
    } else {
      console.error(`❌ ${name} is not a valid middleware:`, typeof middleware);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error loading ${name}:`, error.message);
    return false;
  }
};

// Test all middleware files
testMiddleware('authMiddleware', './middleware/auth');
testMiddleware('errorHandler', './middleware/errorHandler');

// 4. Check for any global route handlers in app.js or similar
console.log('\n=== GLOBAL ROUTE HANDLERS ===');
const appFiles = ['app.js', 'index.js'];
appFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`Found possible global route handler: ${file}`);
  }
});

// 5. Check for any hidden files in routes directory
console.log('\n=== HIDDEN FILES IN ROUTES ===');
try {
  const routeFiles = fs.readdirSync(path.join(__dirname, 'routes'));
  routeFiles.forEach(file => {
    if (file.startsWith('.') || file.endsWith('~') || file.endsWith('.swp')) {
      console.log(`⚠️  Found hidden/temporary file in routes: ${file}`);
    }
  });
} catch (err) {
  console.error('❌ Could not read routes directory:', err.message);
}

console.log('\n=== DIAGNOSTIC COMPLETE ===');
console.log('If no issues were found, the problem might be in:');
console.log('1. Dynamic route generation in your application code');
console.log('2. Third-party middleware configuration');
console.log('3. Environment-specific configurations');
console.log('4. Cached node_modules (try: rm -rf node_modules && npm install)');
