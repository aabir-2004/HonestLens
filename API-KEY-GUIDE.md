# 🔑 API Key Setup Guide for HonestLens

This guide will help you obtain all the API keys needed for HonestLens's enhanced verification features.

## 🚀 Quick Start

**Option 1: Interactive Setup (Recommended)**
```bash
node setup-api-keys.js
```

**Option 2: Manual Setup**
1. Copy `.env.enhanced` to `.env`
2. Follow the detailed instructions below
3. Add your API keys to the `.env` file

## 📋 Required API Keys

### Priority Levels:
- 🟢 **Essential**: Core functionality
- 🟡 **Recommended**: Enhanced features
- 🔵 **Optional**: Additional capabilities

---

## 🟢 1. News API (Essential - FREE)

**Purpose**: Real-time news verification and cross-referencing
**Cost**: FREE (1,000 requests/day)
**Website**: https://newsapi.org/

### Step-by-Step Setup:

1. **Visit NewsAPI.org**
   - Go to https://newsapi.org/
   - Click "Get API Key" button

2. **Sign Up**
   - Enter your email address
   - Choose a strong password
   - Select "Developer" plan (free)

3. **Verify Email**
   - Check your email for verification link
   - Click the verification link

4. **Get Your API Key**
   - Log in to your dashboard
   - Copy your API key (looks like: `1234567890abcdef1234567890abcdef`)

5. **Add to .env**
   ```env
   NEWS_API_KEY=your_actual_api_key_here
   ```

### Usage Limits:
- 1,000 requests per day
- Perfect for testing and moderate usage
- Upgrade available if needed

---

## 🟡 2. OpenAI API (Recommended - PAID)

**Purpose**: Advanced content analysis and reasoning
**Cost**: Pay-per-use (starts at $0.002/1K tokens)
**Website**: https://platform.openai.com/

### Step-by-Step Setup:

1. **Create OpenAI Account**
   - Go to https://platform.openai.com/
   - Sign up or log in with existing account

2. **Add Billing Information**
   - Go to Billing section
   - Add a payment method
   - Set usage limits (recommended: $5-10 for testing)

3. **Create API Key**
   - Navigate to "API Keys" section
   - Click "Create new secret key"
   - Give it a descriptive name (e.g., "HonestLens")
   - Copy the key (starts with `sk-`)

4. **Add to .env**
   ```env
   OPENAI_API_KEY=sk-your_actual_api_key_here
   ```

### Cost Estimation:
- Text analysis: ~$0.002 per verification
- 1000 verifications ≈ $2
- Start with $5 credit for testing

### ⚠️ Important Notes:
- Keep your API key secure
- Set usage limits to avoid unexpected charges
- Monitor usage in OpenAI dashboard

---

## 🟡 3. Google Cloud APIs (Recommended - FREE TIER)

**Purpose**: Fact-checking database and image analysis
**Cost**: FREE tier available
**Website**: https://console.cloud.google.com/

### APIs Needed:
- **Fact Check Tools API**: For fact-checking verification
- **Cloud Vision API**: For image analysis

### Step-by-Step Setup:

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Click "New Project"
   - Enter project name: "HonestLens"
   - Click "Create"

2. **Enable Required APIs**
   - In the search bar, type "Fact Check Tools API"
   - Click on it and press "Enable"
   - Repeat for "Cloud Vision API"

3. **Create API Key**
   - Go to "Credentials" in the left menu
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

4. **Secure Your API Key (Recommended)**
   - Click on your API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled
   - Under "Application restrictions", add your domain

5. **Add to .env**
   ```env
   GOOGLE_FACT_CHECK_API_KEY=your_google_api_key_here
   GOOGLE_VISION_API_KEY=your_google_api_key_here
   ```

### Free Tier Limits:
- **Fact Check API**: 10,000 requests/day
- **Vision API**: 1,000 requests/month
- Perfect for development and testing

---

## 🔵 4. TinEye API (Optional)

**Purpose**: Reverse image search for image verification
**Cost**: FREE tier available
**Website**: https://tineye.com/

### Step-by-Step Setup:

1. **Create TinEye Account**
   - Go to https://tineye.com/
   - Click "Sign Up"
   - Complete registration

2. **Get API Access**
   - Go to https://tineye.com/api
   - Sign up for API access
   - Choose the free tier

3. **Get Your API Key**
   - Access your API dashboard
   - Copy your API key and secret

4. **Add to .env**
   ```env
   TINEYE_API_KEY=your_tineye_api_key_here
   ```

---

## 🛠️ Configuration

### Complete .env File Example:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Essential APIs
NEWS_API_KEY=1234567890abcdef1234567890abcdef

# Recommended APIs
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef
GOOGLE_FACT_CHECK_API_KEY=AIzaSy1234567890abcdef1234567890abcdef
GOOGLE_VISION_API_KEY=AIzaSy1234567890abcdef1234567890abcdef

# Optional APIs
TINEYE_API_KEY=your_tineye_key_here

# Additional Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
```

## 🧪 Testing Your Setup

After configuring your API keys:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Test the Configuration**
   ```bash
   node test-enhancements.js
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open the Application**
   - Go to http://localhost:5000
   - Try verifying different types of content

## 🔒 Security Best Practices

### API Key Security:
- ✅ Never commit `.env` file to version control
- ✅ Use environment variables in production
- ✅ Set usage limits and monitoring
- ✅ Rotate keys periodically
- ✅ Restrict API keys to specific services

### Monitoring Usage:
- Check API dashboards regularly
- Set up billing alerts (for paid APIs)
- Monitor error rates and quotas

## 🚨 Troubleshooting

### Common Issues:

#### "API Key Invalid" Errors:
- Double-check the key is copied correctly
- Ensure no extra spaces or characters
- Verify the API is enabled (for Google Cloud)

#### "Quota Exceeded" Errors:
- Check your API usage limits
- Upgrade to paid tier if needed
- Wait for quota reset (usually daily)

#### "Network Error" Issues:
- Check internet connection
- Verify API endpoints are accessible
- Check firewall settings

### Getting Help:
- Check API provider documentation
- Review error logs in `./logs/honestlens.log`
- Test individual APIs using their documentation

## 💰 Cost Management

### Free Tier Limits:
- **News API**: 1,000 requests/day
- **Google Fact Check**: 10,000 requests/day
- **Google Vision**: 1,000 requests/month
- **TinEye**: 150 requests/month

### Paid API Costs:
- **OpenAI**: ~$0.002 per verification
- **Google Vision**: $1.50 per 1,000 requests (after free tier)

### Cost Optimization Tips:
- Start with free tiers
- Monitor usage patterns
- Implement caching for repeated requests
- Set strict usage limits

## 🔄 Fallback Behavior

HonestLens is designed to work gracefully even without all API keys:

- **No News API**: Uses RSS feeds and basic analysis
- **No OpenAI**: Uses built-in NLP analysis
- **No Google APIs**: Uses alternative fact-checking methods
- **No TinEye**: Skips reverse image search

The system will automatically detect available APIs and adjust functionality accordingly.

## 📞 Support

If you need help with API setup:

1. **Check the logs**: `./logs/honestlens.log`
2. **Run the test suite**: `node test-enhancements.js`
3. **Review API documentation** for specific providers
4. **Check the README.md** for additional troubleshooting

---

**Ready to get started?** Run the interactive setup:
```bash
node setup-api-keys.js
```
