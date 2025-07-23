require('dotenv').config();

console.log('=== ENVIRONMENT VARIABLES TEST ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Not set');

// Test if dotenv is working
if (!process.env.NODE_ENV) {
  console.log('\n❌ dotenv is not loading environment variables correctly');
  console.log('Troubleshooting steps:');
  console.log('1. Make sure .env file is in the root directory');
  console.log('2. Check .env file permissions (should be 644)');
  console.log('3. Verify .env file has valid KEY=VALUE pairs');
  console.log('4. Try requiring dotenv/config instead of dotenv');
} else {
  console.log('\n✅ Environment variables are loading correctly');
}

// Try alternative dotenv loading method
console.log('\n=== TRYING ALTERNATIVE DOTENV LOADING ===');
require('dotenv').config({ path: '.env' });
console.log('NODE_ENV (explicit path):', process.env.NODE_ENV || 'Still not set');
