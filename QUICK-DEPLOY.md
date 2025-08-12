# 🚀 Quick Deploy Guide - HonestLens

Deploy your HonestLens application in under 10 minutes!

## 🎯 Choose Your Platform

### Option 1: Railway (Recommended) ⭐
**Best for: Node.js apps with databases and Redis**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway link
railway up

# 3. Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set FRONTEND_URL=https://your-domain.com

# 4. Add your API keys
railway variables set NEWS_API_KEY=your_key_here
railway variables set OPENAI_API_KEY=your_key_here
```

**✅ Pros:** Built-in Redis, automatic scaling, great Node.js support  
**💰 Cost:** Free tier, then $5/month  
**🔗 URL:** Your app will be available at `https://your-app.railway.app`

### Option 2: Render
**Best for: Simple deployment with free tier**

1. Go to [render.com](https://render.com) and connect your GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables from `.env.production`
5. Deploy!

**✅ Pros:** Free tier available, automatic SSL, good docs  
**💰 Cost:** Free tier, then $7/month  
**🔗 URL:** Your app will be available at `https://your-app.onrender.com`

### Option 3: Vercel (Serverless)
**Best for: Serverless deployment**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod

# 3. Set environment variables in dashboard
```

**✅ Pros:** Excellent performance, global CDN, generous free tier  
**💰 Cost:** Free tier generous, pro from $20/month  
**🔗 URL:** Your app will be available at `https://your-app.vercel.app`

## ⚡ Pre-Deployment Checklist

### 1. Run Optimization Script
```bash
node optimize-for-production.js
```

### 2. Set Up API Keys (Optional but Recommended)
```bash
node setup-api-keys.js
```

### 3. Test Locally
```bash
npm install
npm start
# Visit http://localhost:5000/api/health
```

## 🔑 Essential Environment Variables

**Required:**
```env
NODE_ENV=production
JWT_SECRET=your_secure_secret_here
FRONTEND_URL=https://your-domain.com
```

**Optional (for enhanced features):**
```env
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=your_openai_key
GOOGLE_FACT_CHECK_API_KEY=your_google_key
REDIS_URL=redis://localhost:6379
```

## 🎯 Performance for 10,000+ Users

Your app is optimized for high traffic with:

- ✅ **Caching**: Redis + memory fallback
- ✅ **Rate Limiting**: 200 requests/15min per IP
- ✅ **Database**: Optimized SQLite with WAL mode
- ✅ **Security**: Helmet.js + CORS + input validation
- ✅ **Monitoring**: Health checks + performance logging
- ✅ **Scaling**: Cluster mode support

## 🔍 Post-Deployment Verification

1. **Health Check**: Visit `https://your-app.com/api/health`
2. **API Test**: Try the verification endpoints
3. **Performance**: Check response times < 500ms
4. **Monitoring**: Set up uptime monitoring

## 🆘 Quick Troubleshooting

### App Won't Start
```bash
# Check logs in your platform dashboard
# Common issues:
# - Missing NODE_ENV=production
# - Invalid JWT_SECRET
# - Port configuration
```

### Slow Performance
```bash
# Check memory usage in dashboard
# Add Redis for caching:
# REDIS_URL=redis://localhost:6379
```

### API Errors
```bash
# Verify API keys are set correctly
# Check rate limits aren't exceeded
# Ensure CORS is configured for your domain
```

## 📊 Monitoring Your App

### Built-in Endpoints
- `GET /api/health` - System health
- `GET /api/ready` - Readiness check
- `GET /api/live` - Liveness check

### Recommended Monitoring
- [UptimeRobot](https://uptimerobot.com/) - Free uptime monitoring
- Platform dashboards - Built-in metrics
- [Sentry](https://sentry.io/) - Error tracking (optional)

## 🔄 Updates & Maintenance

### Deploy Updates
```bash
# Railway
railway up

# Render
git push origin main  # Auto-deploys

# Vercel
vercel --prod
```

### Database Maintenance
```bash
# Run optimization script monthly
sqlite3 data/honestlens.db < database-optimization.sql
```

## 🎉 You're Live!

Your HonestLens app is now running and ready to handle 10,000+ users!

**Next Steps:**
1. 🌐 Set up your custom domain
2. 📱 Test on mobile devices
3. 📈 Monitor performance metrics
4. 🔄 Set up automated backups
5. 📧 Configure email notifications (optional)

**Need Help?** Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide or create an issue.

---

**🚀 Happy Deploying!** Your AI-powered news verification tool is ready to fight misinformation at scale.