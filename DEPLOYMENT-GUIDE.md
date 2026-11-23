# HonestLens Deployment Guide

## 🚀 Complete Deployment Setup

This guide will help you deploy HonestLens with:
- **Frontend**: Vercel (Static hosting)
- **Backend API**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL) or Local SQLite

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Account** (Optional) - Sign up at [supabase.com](https://supabase.com)
4. **API Keys**:
   - NewsAPI key from [newsapi.org](https://newsapi.org)
   - OpenAI API key from [platform.openai.com](https://platform.openai.com)

## 🔧 Step 1: Prepare Your Repository

### 1.1 Ensure your project structure looks like this:
```
HonestLens-2/
├── api/
│   ├── index.js          # Main API entry point
│   ├── package.json      # API dependencies
│   ├── news/
│   │   ├── index.js
│   │   ├── live.js
│   │   └── trending.js
│   └── verification/
│       ├── index.js
│       ├── verify-url.js
│       ├── verify-text.js
│       └── verify-image.js
├── public/
│   ├── index.html        # Frontend
│   ├── style.css
│   └── script.js
├── vercel.json           # Vercel configuration
├── package.json          # Root dependencies
└── .env.example          # Environment template
```

### 1.2 Commit and push your changes:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration

### 2.2 Configure Environment Variables
In your Vercel project dashboard, go to Settings → Environment Variables and add:

**Required Variables:**
```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random
NEWS_API_KEY=your-newsapi-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

**Optional Variables:**
```
GOOGLE_APPLICATION_CREDENTIALS=base64-encoded-service-account-json
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
```

### 2.3 Deploy
1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## 🗄️ Step 3: Database Setup (Choose One)

### Option A: Supabase (Recommended for Production)

#### 3.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### 3.2 Set up Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- News articles table
CREATE TABLE news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    source VARCHAR(255),
    truth_score INTEGER,
    verification_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification requests table
CREATE TABLE verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    content_type VARCHAR(50),
    content TEXT,
    url TEXT,
    result JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_news_articles_created_at ON news_articles(created_at DESC);
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
```

#### 3.3 Add Supabase Environment Variables
Add these to your Vercel environment variables:
```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_TYPE=supabase
```

### Option B: SQLite (For Development/Testing)
If you prefer to keep using SQLite, add this environment variable:
```
DATABASE_TYPE=sqlite
DATABASE_URL=./data/honestlens.db
```

## 🔒 Step 4: Security Configuration

### 4.1 Update CORS Origins
Add your Vercel domain to environment variables:
```
FRONTEND_URL=https://your-project-name.vercel.app
VERCEL_URL=https://your-project-name.vercel.app
```

### 4.2 Generate Strong JWT Secret
Use this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🧪 Step 5: Testing Your Deployment

### 5.1 Test API Endpoints
```bash
# Health check
curl https://your-project-name.vercel.app/api/health

# Test news endpoint
curl https://your-project-name.vercel.app/api/news

# Test verification endpoint
curl -X POST https://your-project-name.vercel.app/api/verification/verify-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Test news content"}'
```

### 5.2 Test Frontend
1. Visit `https://your-project-name.vercel.app`
2. Try the news verification features
3. Check browser console for any errors

## 🔄 Step 6: Continuous Deployment

### 6.1 Automatic Deployments
- Vercel automatically deploys when you push to your main branch
- Preview deployments are created for pull requests

### 6.2 Environment-Specific Deployments
- Production: `main` branch → `your-project-name.vercel.app`
- Staging: Create a `staging` branch for testing

## 📊 Step 7: Monitoring and Maintenance

### 7.1 Vercel Analytics
- Enable Vercel Analytics in your project settings
- Monitor performance and usage

### 7.2 Error Monitoring
- Check Vercel Function logs for API errors
- Set up alerts for critical issues

### 7.3 Database Monitoring (Supabase)
- Monitor database usage in Supabase dashboard
- Set up backup schedules

## 🚨 Troubleshooting

### Common Issues:

#### 1. API Routes Not Working
- Check `vercel.json` configuration
- Ensure `api/index.js` exists and exports correctly
- Verify environment variables are set

#### 2. CORS Errors
- Add your domain to `FRONTEND_URL` environment variable
- Check CORS configuration in `api/index.js`

#### 3. Database Connection Issues
- Verify Supabase credentials
- Check database schema is created
- Ensure proper environment variables

#### 4. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are listed in `package.json`
- Review build logs in Vercel dashboard

### Debug Commands:
```bash
# Check environment variables
vercel env ls

# View function logs
vercel logs

# Test locally
vercel dev
```

## 📞 Support

If you encounter issues:
1. Check Vercel documentation
2. Review function logs
3. Test API endpoints individually
4. Verify environment variables

## 🎉 Success!

Your HonestLens application should now be:
- ✅ Frontend deployed on Vercel
- ✅ API running as serverless functions
- ✅ Database connected (Supabase or SQLite)
- ✅ Secure with proper CORS and rate limiting
- ✅ Automatically deploying on code changes

Visit your deployed application at: `https://your-project-name.vercel.app`