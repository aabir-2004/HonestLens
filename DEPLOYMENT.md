# HonestLens Deployment Guide

This guide covers deploying HonestLens to production platforms optimized for 10,000+ concurrent users.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended)
Railway offers excellent Node.js support with automatic scaling and built-in Redis.

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=$(openssl rand -base64 32)
   railway variables set NEWS_API_KEY=your_news_api_key
   railway variables set OPENAI_API_KEY=your_openai_key
   railway variables set GOOGLE_FACT_CHECK_API_KEY=your_google_key
   ```

3. **Add Redis (Optional)**
   ```bash
   railway add redis
   ```

### Option 2: Render
Render provides good performance with automatic SSL and CDN.

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

3. **Set Environment Variables** (in Render dashboard)
   ```
   NODE_ENV=production
   JWT_SECRET=your_secure_jwt_secret
   NEWS_API_KEY=your_news_api_key
   OPENAI_API_KEY=your_openai_key
   GOOGLE_FACT_CHECK_API_KEY=your_google_key
   ```

### Option 3: Vercel (API Routes Only)
For serverless deployment of API endpoints.

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔧 Environment Configuration

### Required Environment Variables
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_change_this
DATABASE_URL=./data/honestlens.db
FRONTEND_URL=https://your-domain.com
```

### Optional API Keys (for enhanced features)
```env
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_key
GOOGLE_VISION_API_KEY=your_google_vision_key
REDIS_URL=redis://localhost:6379
```

### Performance Settings
```env
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=16
TRUST_PROXY=true
```

## 📊 Performance Optimizations

### 1. Caching Strategy
- **Redis**: Primary cache for API responses and session data
- **Memory Cache**: Fallback when Redis unavailable
- **CDN**: Static assets served via platform CDN

### 2. Database Optimization
- **SQLite WAL Mode**: Enabled for better concurrent access
- **Connection Pooling**: Optimized for high concurrency
- **Indexes**: Created on frequently queried columns

### 3. Rate Limiting
- **General API**: 200 requests per 15 minutes
- **Verification**: 20 requests per 5 minutes
- **IP-based**: Prevents abuse and ensures fair usage

### 4. Security Features
- **Helmet.js**: Security headers
- **CORS**: Configured for production domains
- **Input Validation**: All endpoints validated
- **JWT**: Secure authentication tokens

## 🔍 API Key Setup

### News API (Free Tier: 1000 requests/day)
1. Visit [NewsAPI.org](https://newsapi.org/)
2. Sign up for free account
3. Copy API key to `NEWS_API_KEY`

### OpenAI API (Pay-per-use)
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create account and add billing
3. Generate API key
4. Set `OPENAI_API_KEY`

### Google Fact Check API (Free Tier: 10,000 requests/day)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable "Fact Check Tools API"
3. Create credentials
4. Set `GOOGLE_FACT_CHECK_API_KEY`

## 🏗️ Architecture for 10,000+ Users

### Horizontal Scaling
```javascript
// PM2 Cluster Mode (if using VPS)
pm2 start ecosystem.config.js --env production
```

### Load Balancing
- **Platform Load Balancer**: Railway/Render handle this automatically
- **Multiple Instances**: PM2 cluster mode for VPS deployments
- **Health Checks**: `/api/health` endpoint for monitoring

### Database Scaling
- **SQLite**: Suitable for 10K users with WAL mode
- **Upgrade Path**: PostgreSQL for 100K+ users
- **Backup Strategy**: Automated daily backups

### Monitoring
```javascript
// Health check endpoint
GET /api/health
Response: { status: 'OK', timestamp: '2024-12-08T...' }
```

## 🚦 Deployment Checklist

### Pre-deployment
- [ ] Set all required environment variables
- [ ] Configure API keys
- [ ] Test locally with production settings
- [ ] Run security audit: `npm audit`

### Post-deployment
- [ ] Verify health check endpoint
- [ ] Test API endpoints
- [ ] Monitor error logs
- [ ] Set up monitoring alerts

### Security Checklist
- [ ] Change default JWT secret
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS (handled by platforms)
- [ ] Set up rate limiting
- [ ] Configure CSP headers

## 📈 Monitoring & Maintenance

### Log Files
```
./logs/combined.log  # All logs
./logs/error.log     # Error logs only
./logs/out.log       # Standard output
```

### Performance Metrics
- Response time: < 500ms average
- Memory usage: < 1GB
- CPU usage: < 80%
- Error rate: < 1%

### Scaling Triggers
- **Scale Up**: CPU > 80% for 5 minutes
- **Scale Out**: Response time > 1000ms
- **Database**: Query time > 100ms

## 🔧 Troubleshooting

### Common Issues

#### 1. High Memory Usage
```bash
# Check memory usage
free -h
# Restart application
pm2 restart honestlens
```

#### 2. Database Locked
```bash
# Check database connections
lsof | grep honestlens.db
# Restart if needed
pm2 restart honestlens
```

#### 3. API Rate Limits
- Monitor API usage in logs
- Implement exponential backoff
- Consider upgrading API plans

### Performance Issues
```bash
# Check application logs
pm2 logs honestlens

# Monitor system resources
htop

# Database performance
sqlite3 data/honestlens.db ".schema"
```

## 🌐 Domain & SSL

### Custom Domain Setup
1. **Railway**: Add custom domain in dashboard
2. **Render**: Configure custom domain with automatic SSL
3. **DNS**: Point CNAME to platform-provided URL

### SSL Certificate
- **Automatic**: All platforms provide free SSL
- **Custom**: Upload custom certificates if needed

## 📱 Frontend Deployment

### Static Hosting Options
1. **Vercel**: Excellent for static sites
2. **Netlify**: Good performance and features
3. **GitHub Pages**: Free for public repos

### CDN Configuration
- Enable gzip compression
- Set cache headers for static assets
- Optimize images and fonts

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway up --detach
```

## 📞 Support & Resources

### Platform Documentation
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Monitoring Tools
- Platform built-in monitoring
- [UptimeRobot](https://uptimerobot.com/) for external monitoring
- [LogRocket](https://logrocket.com/) for user session recording

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.