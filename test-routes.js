const express = require('express');
const path = require('path');

// List of route files to test
const routeFiles = [
  './routes/auth',
  './routes/news',
  './routes/verification',
  './routes/users',
  './routes/admin'
];

async function testRoutes() {
  for (const routeFile of routeFiles) {
    try {
      console.log(`\n🔍 Testing ${routeFile}...`);
      
      // Create a new Express app for each test
      const app = express();
      
      // Load the route file
      const route = require(routeFile);
      
      // Try to use the route with a test path
      app.use('/test', route);
      
      console.log(`✅ ${routeFile} loaded successfully`);
    } catch (error) {
      console.error(`❌ Error in ${routeFile}:`);
      console.error(error.message);
      
      // If this is the path-to-regexp error, we've found our culprit
      if (error.message.includes('Missing parameter name')) {
        console.error('\n🚨 FOUND THE PROBLEM ROUTE FILE:', routeFile);
        console.error('This file contains a malformed route path. Please check all route definitions in this file.');
        return; // Stop testing after finding the first error
      }
    }
  }
  
  console.log('\n✅ All route files loaded successfully (no path-to-regexp errors found)');
}

testRoutes().catch(console.error);
