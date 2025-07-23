# HonestLens - Enhanced AI-Powered News Verification

HonestLens is an advanced AI-powered news verification tool for India that uses cutting-edge machine learning and multiple API integrations to provide accurate, comprehensive fact-checking. Instead of simple true/false verdicts, it provides nuanced Truth Scores (0-100) with detailed analysis and credibility assessments.

## 🚀 Recent Enhancements

### Advanced ML Integration
- **Multi-layered Content Analysis**: Natural Language Processing using compromise.js, sentiment analysis, and linguistic pattern detection
- **Misinformation Pattern Detection**: Advanced algorithms to identify clickbait, emotional manipulation, and suspicious language patterns
- **Enhanced Image Verification**: OCR text extraction, manipulation detection, metadata analysis, and visual content verification
- **Cross-Reference Verification**: Intelligent fact-checking against multiple trusted sources

### Powerful API Integrations
- **News API**: Real-time news article verification and cross-referencing
- **Google Fact Check API**: Integration with Google's fact-checking database
- **OpenAI GPT Integration**: Advanced content analysis and reasoning
- **RSS Fact-Checker Integration**: Real-time monitoring of Indian fact-checking sources (PIB, Alt News, Boom Live, FactChecker.in)
- **Google Vision API**: Advanced image analysis and object detection (optional)

### Enhanced Frontend Experience
- **Real-time Verification Progress**: Live updates during the verification process
- **Comprehensive Result Display**: Detailed breakdowns of ML analysis, API results, and evidence
- **Interactive Score Visualization**: Animated truth score circles and confidence indicators
- **Source Attribution**: Clear display of all verified sources and their reliability
- **Mobile-Responsive Design**: Optimized for all device sizes

## 🏗️ Architecture

### Backend Services
- **ML Service** (`services/mlService.js`): Advanced machine learning analysis
- **API Service** (`services/apiService.js`): External API integrations and cross-referencing
- **Image Service** (`services/imageService.js`): Comprehensive image verification

### Enhanced Verification Pipeline
1. **Content Ingestion**: URL, text, or image input
2. **ML Analysis**: Natural language processing and pattern detection
3. **API Verification**: Cross-referencing with external fact-checking services
4. **Image Analysis**: Manipulation detection and OCR text extraction
5. **Score Calculation**: Weighted scoring based on multiple factors
6. **Result Compilation**: Comprehensive report with evidence and reasoning

## 🛠️ Installation & Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Quick Start
```bash
# Clone the repository
git clone <your-repo-url>
cd HonestLens-2

# Install dependencies
npm install

# Copy environment configuration
cp .env.enhanced .env

# Configure API keys (see Configuration section)
nano .env

# Start the server
npm start
```

### Development Mode
```bash
npm run dev
```

## ⚙️ Configuration

### Required API Keys
Copy `.env.enhanced` to `.env` and configure the following API keys:

```env
# News API (Free tier available)
NEWS_API_KEY=your_news_api_key_here

# Google Cloud APIs (Free tier available)
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_api_key_here
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# OpenAI API (Pay-per-use)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: TinEye API for reverse image search
TINEYE_API_KEY=your_tineye_api_key_here
```

### API Key Setup Instructions

#### 1. News API
- Visit [NewsAPI.org](https://newsapi.org/)
- Sign up for a free account
- Copy your API key to `NEWS_API_KEY`

#### 2. Google Cloud APIs
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing
- Enable "Fact Check Tools API" and "Vision API"
- Create credentials and copy API keys

#### 3. OpenAI API
- Visit [OpenAI Platform](https://platform.openai.com/)
- Create an account and add billing information
- Generate an API key from the API keys section

### Optional Configuration
The system works with basic functionality even without all API keys. Missing APIs will gracefully fallback to alternative methods.

## 🎯 Features

### Core Verification Capabilities
- **URL Verification**: Analyze news articles from any URL
- **Text Analysis**: Direct text content verification
- **Image Verification**: Comprehensive image authenticity checking
- **Real-time Processing**: Live updates during verification
- **Multi-source Cross-referencing**: Verification against multiple trusted sources

### Advanced Analysis Features
- **Truth Score (0-100)**: Nuanced credibility assessment
- **Credibility Levels**: Highly Credible, Mostly Credible, Mixed, Low, Not Credible
- **Evidence Compilation**: Detailed supporting evidence and reasoning
- **Flag Detection**: Identification of suspicious patterns and concerns
- **Source Attribution**: Clear tracking of all verification sources

### Enhanced User Experience
- **Progress Tracking**: Real-time verification progress indicators
- **Detailed Breakdowns**: ML analysis, API results, and confidence scores
- **Interactive Visualizations**: Animated score displays and progress bars
- **Mobile Optimization**: Responsive design for all devices
- **Share Functionality**: Easy sharing of verification results

## 🔧 API Endpoints

### Enhanced Verification Endpoints
- `POST /api/verification/verify-url` - Enhanced URL verification with ML and API analysis
- `POST /api/verification/verify-text` - Advanced text content analysis
- `POST /api/verification/verify-image` - Comprehensive image verification
- `GET /api/verification/result/:id` - Real-time verification status and results
- `GET /api/verification/history` - User verification history with enhanced details

### Response Format
```json
{
  "success": true,
  "data": {
    "requestId": "unique-request-id",
    "status": "completed",
    "result": {
      "truthScore": 87,
      "credibilityLevel": "highly_credible",
      "method": "Enhanced AI Analysis (url) - ML + API + Text",
      "reasoning": "Advanced ML analysis performed using multiple services...",
      "evidence": "Source from trusted domain; Verified by 3 trusted sources...",
      "confidenceScore": 92,
      "flags": [],
      "mlAnalysis": {
        "contentScore": 85,
        "sourceScore": 90,
        "crossRefScore": 88
      },
      "apiAnalysis": {
        "newsAPIScore": 85,
        "factCheckScore": 90,
        "openAIScore": 87
      },
      "sourcesChecked": [
        {
          "name": "Times of India",
          "url": "https://timesofindia.com/...",
          "type": "news_api"
        }
      ]
    }
  }
}
```

## 🧠 Machine Learning Features

### Content Analysis
- **Sentiment Analysis**: Emotional tone detection
- **Linguistic Pattern Recognition**: Identification of misinformation patterns
- **Factuality Indicators**: Detection of specific dates, numbers, and official sources
- **Clickbait Detection**: Recognition of sensational language and manipulation tactics

### Image Analysis
- **Metadata Extraction**: EXIF data analysis and suspicious pattern detection
- **OCR Text Analysis**: Text extraction and content verification
- **Manipulation Detection**: Basic image tampering identification
- **Visual Content Analysis**: Object and scene recognition (with Google Vision API)

### Cross-Reference Verification
- **Multi-source Fact-checking**: Integration with Indian and international fact-checkers
- **RSS Feed Monitoring**: Real-time monitoring of trusted news sources
- **API Cross-referencing**: Verification against multiple external databases
- **Weighted Scoring**: Intelligent combination of multiple verification methods

## 🌐 Trusted Sources

### Indian Fact-Checking Sources
- **PIB Fact Check**: Press Information Bureau official fact-checking
- **MyGov India**: Government of India official portal
- **Alt News**: Independent fact-checking organization
- **Boom Live**: Digital journalism and fact-checking
- **FactChecker.in**: Data-driven journalism and fact-checking

### International Sources
- **Google Fact Check**: Global fact-checking database
- **News API**: Verified news sources worldwide
- **Reuters**: International news verification
- **BBC**: British Broadcasting Corporation fact-checking

## 🚀 Performance & Scalability

### Optimization Features
- **Concurrent Processing**: Multiple verification methods run in parallel
- **Intelligent Caching**: API response caching to reduce latency
- **Graceful Fallbacks**: System continues working even if some APIs are unavailable
- **Rate Limiting**: Built-in protection against API abuse
- **Error Handling**: Comprehensive error recovery and user feedback

### Monitoring & Analytics
- **Real-time Logging**: Detailed verification process logging
- **Performance Metrics**: API response times and success rates
- **User Analytics**: Verification patterns and usage statistics
- **Admin Dashboard**: Comprehensive system monitoring

## 🔒 Security & Privacy

### Data Protection
- **No Content Storage**: User-submitted content is not permanently stored
- **API Key Security**: Secure environment variable management
- **Rate Limiting**: Protection against abuse and spam
- **CORS Configuration**: Secure cross-origin resource sharing

### Privacy Features
- **Anonymous Verification**: No user tracking for basic verification
- **Secure Transmission**: HTTPS encryption for all communications
- **Minimal Data Collection**: Only essential data is processed

## 🤝 Contributing

### Development Setup
```bash
# Install development dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Code formatting
npm run format

# Linting
npm run lint
```

### Adding New Verification Sources
1. Update `services/apiService.js` with new API integration
2. Add configuration to `.env.enhanced`
3. Update documentation and tests
4. Submit pull request with detailed description

## 📊 Verification Accuracy

### Scoring Methodology
- **Content Analysis**: 40% weight - ML-based content verification
- **Source Analysis**: 30% weight - Domain trust and reliability assessment
- **Cross-Reference**: 25% weight - External fact-checker verification
- **Image Analysis**: 5% weight - Visual content authenticity (when applicable)

### Credibility Levels
- **Highly Credible (85-100%)**: Strong evidence supporting accuracy
- **Mostly Credible (70-84%)**: Generally reliable with minor concerns
- **Mixed Credibility (50-69%)**: Some supporting and contradicting evidence
- **Low Credibility (30-49%)**: Significant concerns identified
- **Not Credible (0-29%)**: Strong evidence against accuracy

## 🐛 Troubleshooting

### Common Issues

#### API Key Errors
```bash
# Check if API keys are properly set
echo $NEWS_API_KEY
echo $OPENAI_API_KEY
```

#### Service Unavailable
- The system gracefully handles API outages
- Verification continues with available services
- Check logs for specific API error messages

#### Performance Issues
- Verify internet connection for API calls
- Check API rate limits and quotas
- Monitor server resources and scaling

### Getting Help
- Check the logs in `./logs/honestlens.log`
- Review API documentation for external services
- Submit issues with detailed error messages and steps to reproduce

## 📈 Future Enhancements

### Planned Features
- **Video Verification**: Deep fake detection and video authenticity checking
- **Blockchain Integration**: Immutable verification records
- **Community Verification**: Crowdsourced fact-checking integration
- **Advanced AI Models**: Integration with latest language models
- **Regional Language Support**: Hindi and other Indian language analysis

### API Roadmap
- **WhatsApp Integration**: Direct verification through messaging
- **Browser Extension**: Real-time verification while browsing
- **Mobile App**: Native iOS and Android applications
- **Enterprise API**: Advanced features for media organizations

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI**: Advanced language model integration
- **Google Cloud**: Fact-checking and vision APIs
- **News API**: Real-time news data
- **Indian Fact-Checkers**: PIB, Alt News, Boom Live, FactChecker.in
- **Open Source Community**: Various NPM packages and tools

---

**HonestLens** - Empowering truth through advanced AI verification technology.
