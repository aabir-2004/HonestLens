const express = require('express');
require('dotenv').config();

console.log('Starting minimal server test...');
const app = express();

// Test basic route
app.get('/', (req, res) => {
  res.send('Minimal server is running');
});

// Test route mounting one by one
const testMount = (name, path) => {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    const router = require(path);
    app.use('/api/' + name, router);
    console.log(`✅ Successfully mounted ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to mount ${name}:`, error.message);
    if (error.message.includes('Missing parameter name')) {
      console.error('🚨 Found the problematic route!');
    }
    return false;
  }
};

// Test mounting routes in the same order as server.js
const routeTests = [
  { name: 'auth', path: './routes/auth' },
  { name: 'news', path: './routes/news' },
  { name: 'verification', path: './routes/verification' },
  { name: 'user', path: './routes/users' },  // Note: using 'user' but loading from 'users'
  { name: 'admin', path: './routes/admin' }
];

// Run tests
let success = true;
for (const test of routeTests) {
  if (!testMount(test.name, test.path)) {
    success = false;
    break;
  }
}

if (success) {
  console.log('\n✅ All routes mounted successfully!');
  // Start the server if all tests pass
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`\nMinimal test server running on http://localhost:${PORT}`);
    console.log('Visit http://localhost:3002/api/ to test routes');
    console.log('Press Ctrl+C to stop the server');
  });
}
