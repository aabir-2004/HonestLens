const express = require('express');
const path = require('path');
const fs = require('fs');

// List of route files to test
const routeFiles = [
  './routes/auth',
  './routes/news',
  './routes/verification',
  './routes/users',
  './routes/admin'
];

// Function to extract all routes from a router
function getRoutes(router) {
  const routes = [];
  
  function processLayer(layer, path = '') {
    if (layer.route) {
      // This is a route
      const methods = {};
      if (layer.route.methods) {
        Object.keys(layer.route.methods).forEach(method => {
          if (layer.route.methods[method]) {
            methods[method.toUpperCase()] = true;
          }
        });
      }
      routes.push({
        path: path + (layer.route.path === '/' ? '' : layer.route.path),
        methods: Object.keys(methods)
      });
    } else if (layer.name === 'router' || layer.name === 'bound dispatch') {
      // This is a router, process its stack
      const routerPath = layer.regexp.toString()
        .replace('/^\\', '') // Remove leading /^
        .replace('\\/?(?=\\?|$)', '') // Remove trailing /?$ 
        .replace(/\\(.)/g, '$1') // Unescape characters
        .replace('(?:([^\/]+?))', ':$1') // Convert capture groups to named params
        .replace(/\?\^\$/g, '*'); // Convert catch-all to *
      
      if (layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach(sublayer => {
          processLayer(sublayer, path + (routerPath === '^' ? '' : routerPath));
        });
      }
    }
  }

  // Process the router's stack
  if (router && router.stack) {
    router.stack.forEach(layer => processLayer(layer));
  }
  
  return routes;
}

async function testRoutes() {
  const app = express();
  
  for (const routeFile of routeFiles) {
    try {
      console.log(`\n🔍 Testing ${routeFile}...`);
      
      // Clear the require cache to get a fresh module
      delete require.cache[require.resolve(routeFile)];
      
      // Load the route file
      const router = require(routeFile);
      
      // Mount the router
      app.use('/test', router);
      
      // Get all routes from the router
      const routes = getRoutes(router);
      console.log(`✅ ${routeFile} loaded successfully with ${routes.length} routes`);
      
      // Log all routes
      routes.forEach(route => {
        console.log(`  ${route.methods.join(', ')} ${route.path}`);
      });
      
    } catch (error) {
      console.error(`❌ Error in ${routeFile}:`);
      console.error(error);
      
      // If this is the path-to-regexp error, we've found our culprit
      if (error.message && error.message.includes('Missing parameter name')) {
        console.error('\n🚨 FOUND THE PROBLEM ROUTE FILE:', routeFile);
        return;
      }
    }
  }
  
  console.log('\n✅ All route files loaded successfully (no errors found)');
  
  // Start the server to test route mounting
  const server = app.listen(3001, () => {
    console.log('\nTest server running on http://localhost:3001');
    console.log('Press Ctrl+C to stop the server');
  });
  
  // Handle server shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down test server...');
    server.close(() => {
      console.log('Test server stopped');
      process.exit(0);
    });
  });
}

testRoutes().catch(console.error);
