#!/usr/bin/env node

/**
 * Simple deployment test script
 * Run this after deployment to verify everything works
 */

const https = require('https');
const http = require('http');

function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  const baseUrl = process.argv[2] || 'http://localhost:5000';
  
  console.log(`🚀 Testing deployment at: ${baseUrl}`);
  console.log('=' .repeat(50));
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
      expectedStatus: 200
    },
    {
      name: 'Frontend',
      url: `${baseUrl}/`,
      expectedStatus: 200
    },
    {
      name: 'Static Assets',
      url: `${baseUrl}/style.css`,
      expectedStatus: 200
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await testEndpoint(test.url);
      
      if (result.statusCode === test.expectedStatus) {
        console.log(`✅ ${test.name} - PASSED (${result.statusCode})`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED (Expected ${test.expectedStatus}, got ${result.statusCode})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
      failed++;
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your deployment is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check your deployment.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);