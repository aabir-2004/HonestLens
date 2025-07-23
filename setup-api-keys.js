#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class APIKeySetup {
  constructor() {
    this.envPath = path.join(__dirname, '.env');
    this.envEnhancedPath = path.join(__dirname, '.env.enhanced');
    this.apiKeys = {};
  }

  async start() {
    console.log('🔑 HonestLens API Key Setup Wizard');
    console.log('=' .repeat(50));
    console.log('This wizard will help you configure API keys for enhanced verification.\n');

    // Check if .env exists
    if (!fs.existsSync(this.envPath)) {
      console.log('📝 Creating .env file from template...');
      this.createEnvFromTemplate();
    }

    console.log('📋 API Keys needed for full functionality:');
    console.log('1. News API (Free) - News article verification');
    console.log('2. OpenAI API (Paid) - Advanced content analysis');
    console.log('3. Google Fact Check API (Free) - Fact-checking database');
    console.log('4. Google Vision API (Free tier) - Image analysis');
    console.log('5. TinEye API (Optional) - Reverse image search\n');

    await this.setupAPIKeys();
    this.updateEnvFile();
    this.showNextSteps();

    rl.close();
  }

  createEnvFromTemplate() {
    if (fs.existsSync(this.envEnhancedPath)) {
      fs.copyFileSync(this.envEnhancedPath, this.envPath);
      console.log('✅ Created .env file from .env.enhanced template\n');
    } else {
      // Create basic .env file
      const basicEnv = `# HonestLens Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d

# API Keys (add your keys below)
NEWS_API_KEY=
OPENAI_API_KEY=
GOOGLE_FACT_CHECK_API_KEY=
GOOGLE_VISION_API_KEY=
TINEYE_API_KEY=

# Optional Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
`;
      fs.writeFileSync(this.envPath, basicEnv);
      console.log('✅ Created basic .env file\n');
    }
  }

  async setupAPIKeys() {
    console.log('🚀 Let\'s set up your API keys!\n');

    // News API
    await this.setupNewsAPI();
    
    // OpenAI API
    await this.setupOpenAI();
    
    // Google APIs
    await this.setupGoogleAPIs();
    
    // Optional APIs
    await this.setupOptionalAPIs();
  }

  async setupNewsAPI() {
    console.log('📰 1. News API Setup');
    console.log('   Website: https://newsapi.org/');
    console.log('   Cost: FREE (up to 1,000 requests/day)');
    console.log('   Purpose: Real-time news verification and cross-referencing\n');

    const hasKey = await this.askQuestion('Do you already have a News API key? (y/n): ');
    
    if (hasKey.toLowerCase() === 'y') {
      const apiKey = await this.askQuestion('Enter your News API key: ');
      this.apiKeys.NEWS_API_KEY = apiKey.trim();
      console.log('✅ News API key saved!\n');
    } else {
      console.log('📝 To get your News API key:');
      console.log('   1. Go to https://newsapi.org/');
      console.log('   2. Click "Get API Key"');
      console.log('   3. Sign up with your email');
      console.log('   4. Verify your email');
      console.log('   5. Copy your API key from the dashboard');
      console.log('   6. Come back and run this setup again\n');
      
      const skipForNow = await this.askQuestion('Skip News API for now? (y/n): ');
      if (skipForNow.toLowerCase() !== 'y') {
        const apiKey = await this.askQuestion('Enter your News API key: ');
        this.apiKeys.NEWS_API_KEY = apiKey.trim();
        console.log('✅ News API key saved!\n');
      }
    }
  }

  async setupOpenAI() {
    console.log('🤖 2. OpenAI API Setup');
    console.log('   Website: https://platform.openai.com/');
    console.log('   Cost: PAY-PER-USE (starts at $0.002/1K tokens)');
    console.log('   Purpose: Advanced content analysis and reasoning\n');

    const hasKey = await this.askQuestion('Do you already have an OpenAI API key? (y/n): ');
    
    if (hasKey.toLowerCase() === 'y') {
      const apiKey = await this.askQuestion('Enter your OpenAI API key: ');
      this.apiKeys.OPENAI_API_KEY = apiKey.trim();
      console.log('✅ OpenAI API key saved!\n');
    } else {
      console.log('📝 To get your OpenAI API key:');
      console.log('   1. Go to https://platform.openai.com/');
      console.log('   2. Sign up or log in');
      console.log('   3. Add billing information (required)');
      console.log('   4. Go to API Keys section');
      console.log('   5. Create a new API key');
      console.log('   6. Copy the key (starts with sk-...)');
      console.log('   💡 Tip: Start with $5 credit for testing\n');
      
      const skipForNow = await this.askQuestion('Skip OpenAI API for now? (y/n): ');
      if (skipForNow.toLowerCase() !== 'y') {
        const apiKey = await this.askQuestion('Enter your OpenAI API key: ');
        this.apiKeys.OPENAI_API_KEY = apiKey.trim();
        console.log('✅ OpenAI API key saved!\n');
      }
    }
  }

  async setupGoogleAPIs() {
    console.log('🔍 3. Google Cloud APIs Setup');
    console.log('   Website: https://console.cloud.google.com/');
    console.log('   Cost: FREE tier available');
    console.log('   Purpose: Fact-checking database and image analysis\n');

    const hasKeys = await this.askQuestion('Do you already have Google Cloud API keys? (y/n): ');
    
    if (hasKeys.toLowerCase() === 'y') {
      const factCheckKey = await this.askQuestion('Enter your Google Fact Check API key: ');
      this.apiKeys.GOOGLE_FACT_CHECK_API_KEY = factCheckKey.trim();
      
      const visionKey = await this.askQuestion('Enter your Google Vision API key: ');
      this.apiKeys.GOOGLE_VISION_API_KEY = visionKey.trim();
      
      console.log('✅ Google API keys saved!\n');
    } else {
      console.log('📝 To get your Google Cloud API keys:');
      console.log('   1. Go to https://console.cloud.google.com/');
      console.log('   2. Create a new project or select existing');
      console.log('   3. Enable these APIs:');
      console.log('      - Fact Check Tools API');
      console.log('      - Cloud Vision API');
      console.log('   4. Go to Credentials > Create Credentials > API Key');
      console.log('   5. Copy your API key');
      console.log('   💡 Tip: You can use the same key for both services\n');
      
      const skipForNow = await this.askQuestion('Skip Google APIs for now? (y/n): ');
      if (skipForNow.toLowerCase() !== 'y') {
        const factCheckKey = await this.askQuestion('Enter your Google Fact Check API key: ');
        this.apiKeys.GOOGLE_FACT_CHECK_API_KEY = factCheckKey.trim();
        
        const visionKey = await this.askQuestion('Enter your Google Vision API key (or same as above): ');
        this.apiKeys.GOOGLE_VISION_API_KEY = visionKey.trim();
        
        console.log('✅ Google API keys saved!\n');
      }
    }
  }

  async setupOptionalAPIs() {
    console.log('🔧 4. Optional APIs');
    console.log('   These APIs provide additional features but are not required\n');

    const setupOptional = await this.askQuestion('Set up optional APIs? (y/n): ');
    
    if (setupOptional.toLowerCase() === 'y') {
      console.log('🔍 TinEye API (Reverse Image Search)');
      console.log('   Website: https://tineye.com/');
      console.log('   Cost: FREE tier available');
      
      const tinyEyeKey = await this.askQuestion('Enter TinEye API key (or press Enter to skip): ');
      if (tinyEyeKey.trim()) {
        this.apiKeys.TINEYE_API_KEY = tinyEyeKey.trim();
        console.log('✅ TinEye API key saved!\n');
      }
    }
  }

  updateEnvFile() {
    console.log('💾 Updating .env file...');
    
    let envContent = fs.readFileSync(this.envPath, 'utf8');
    
    // Update each API key
    Object.keys(this.apiKeys).forEach(key => {
      const value = this.apiKeys[key];
      if (value) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      }
    });
    
    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ .env file updated successfully!\n');
  }

  showNextSteps() {
    console.log('🎉 API Key Setup Complete!');
    console.log('=' .repeat(50));
    
    const configuredKeys = Object.keys(this.apiKeys).filter(key => this.apiKeys[key]);
    const totalKeys = Object.keys(this.apiKeys).length;
    
    console.log(`📊 Configured: ${configuredKeys.length}/${totalKeys} API keys`);
    
    if (configuredKeys.length > 0) {
      console.log('\n✅ Configured APIs:');
      configuredKeys.forEach(key => {
        const service = this.getServiceName(key);
        console.log(`   - ${service}`);
      });
    }
    
    const missingKeys = ['NEWS_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_FACT_CHECK_API_KEY', 'GOOGLE_VISION_API_KEY']
      .filter(key => !this.apiKeys[key]);
    
    if (missingKeys.length > 0) {
      console.log('\n⚠️  Missing APIs (system will work with reduced functionality):');
      missingKeys.forEach(key => {
        const service = this.getServiceName(key);
        console.log(`   - ${service}`);
      });
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Start the server: npm start');
    console.log('3. Open http://localhost:5000');
    console.log('4. Test verification with different content types');
    
    if (missingKeys.length > 0) {
      console.log('\n💡 To add missing API keys later:');
      console.log('   - Run this setup again: node setup-api-keys.js');
      console.log('   - Or manually edit the .env file');
    }
    
    console.log('\n📚 For detailed API setup instructions, see README.md');
  }

  getServiceName(key) {
    const services = {
      'NEWS_API_KEY': 'News API (News verification)',
      'OPENAI_API_KEY': 'OpenAI API (Advanced analysis)',
      'GOOGLE_FACT_CHECK_API_KEY': 'Google Fact Check API',
      'GOOGLE_VISION_API_KEY': 'Google Vision API (Image analysis)',
      'TINEYE_API_KEY': 'TinEye API (Reverse image search)'
    };
    return services[key] || key;
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new APIKeySetup();
  setup.start().catch(console.error);
}

module.exports = APIKeySetup;
