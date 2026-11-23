# HonestLens - Complete Deployment Guide

## 🎯 Quick Deployment Options

### Option 1: Vercel (Recommended - Full Stack)
- ✅ Frontend + Backend in one deployment
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ✅ Global CDN

### Option 2: Vercel + Supabase
- ✅ Frontend on Vercel
- ✅ Database on Supabase
- ✅ Best performance and scalability

### Option 3: Vercel + Render
- ✅ Frontend on Vercel
- ✅ Backend on Render
- ✅ Separate database management

## 🚀 One-Click Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/HonestLens-2)

**After clicking deploy:**
1. Connect your GitHub account
2. Set environment variables (see below)
3. Deploy!

### Required Environment Variables for Vercel:
```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-here
NEWS_API_KEY=your-newsapi-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository
```bash
# Clone or ensure you have the project
git clone https://github.com/yourusername/HonestLens-2.git
cd HonestLens-2

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your actual values
```

### 2. Get Required API Keys

#### NewsAPI Key
1. Go to [newsapi.org](https://newsapi.org)
2. Sign up for free account
3. Get your API key

#### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add billing
3. Generate API key

### 3. Deploy Frontend + Backend to Vercel

#### Method A: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: honestlens (or your choice)
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Method B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub
4. Configure environment variables
5. Deploy

### 4. Set Up Database (Choose One)

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL from `supabase-schema.sql` in SQL Editor
4. Add these environment variables to Vercel:
   ```
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   DATABASE_TYPE=supabase
   ```

#### Option B: Keep SQLite (Development Only)
- No additional setup needed
- Data stored in serverless function (not persistent)

### 5. Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables:

**Required:**
- `NODE_ENV` = `production`
- `JWT_SECRET` = (generate with: `openssl rand -hex 64`)
- `NEWS_API_KEY` = your NewsAPI key
- `OPENAI_API_KEY` = your OpenAI key

**For Supabase:**
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_ANON_KEY` = your Supabase anon key
- `DATABASE_TYPE` = `supabase`

**Optional:**
- `RATE_LIMIT_MAX_REQUESTS` = `100`
- `RATE_LIMIT_WINDOW_MS` = `900000`

### 6. Test Your Deployment

```bash
# Test API health
curl https://your-app.vercel.app/api/health

# Test news endpoint
curl https://your-app.vercel.app/api/news

# Test frontend
open https://your-app.vercel.app
```

## 🔧 Alternative: Separate Frontend/Backend

### Frontend on Vercel + Backend on Render

#### Deploy Backend to Render:
1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Add all your API keys

#### Update Frontend:
Update your frontend API calls to point to Render backend:
```javascript
const API_BASE_URL = 'https://your-app.onrender.com/api';
```

## 🔒 Security Checklist

- ✅ Strong JWT secret (64+ characters)
- ✅ API keys in environment variables (not code)
- ✅ CORS configured for your domain
- ✅ Rate limiting enabled
- ✅ HTTPS enforced (automatic with Vercel)

## 📊 Monitoring

### Vercel Analytics
- Enable in project settings
- Monitor performance and usage

### Error Tracking
- Check Vercel function logs
- Set up error alerts

### Database Monitoring (Supabase)
- Monitor usage in Supabase dashboard
- Set up backup schedules

## 🚨 Troubleshooting

### Common Issues:

#### 1. "API endpoint not found"
- Check `vercel.json` configuration
- Ensure `api/index.js` exists
- Verify routes are properly configured

#### 2. CORS errors
- Add your domain to environment variables
- Check CORS configuration in API

#### 3. Environment variables not working
- Redeploy after adding variables
- Check variable names match exactly

#### 4. Database connection issues
- Verify Supabase credentials
- Check database schema is created
- Test connection strings

### Debug Commands:
```bash
# Local development
vercel dev

# Check logs
vercel logs

# List environment variables
vercel env ls
```

## 🎉 Success!

Your HonestLens application should now be live at:
`https://your-project-name.vercel.app`

### What's Deployed:
- ✅ Frontend (React-like interface)
- ✅ Backend API (Node.js serverless functions)
- ✅ Database (Supabase or SQLite)
- ✅ Authentication system
- ✅ News verification features
- ✅ Rate limiting and security

## 📞 Need Help?

1. Check the logs in Vercel dashboard
2. Test API endpoints individually
3. Verify all environment variables are set
4. Review the detailed `DEPLOYMENT-GUIDE.md`

## 🔄 Updates

To update your deployment:
```bash
git add .
git commit -m "Update application"
git push origin main
```

Vercel will automatically redeploy!