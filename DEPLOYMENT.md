# HonestLens Deployment Guide

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
```bash
# Database will be automatically initialized on first run
mkdir -p data uploads logs
```

### 4. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run start:prod
```

#### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2

# Monitor
pm2 status
pm2 logs honestlens
```

## 🔧 Configuration

### Required Environment Variables
- `JWT_SECRET`: Strong secret key for JWT tokens
- `NEWS_API_KEY`: Get from [NewsAPI](https://newsapi.org/)
- `OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com/)

### Optional Environment Variables
- `GOOGLE_APPLICATION_CREDENTIALS`: For Google Cloud services
- `FRONTEND_URL`: Your frontend application URL
- `ML_SERVICE_URL`: External ML service endpoint

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### News
- `GET /api/news/verified` - Get verified news
- `GET /api/news/debunked` - Get debunked news
- `GET /api/news/search` - Search news articles
- `GET /api/news/categories` - Get news categories
- `GET /api/news/trending` - Get trending topics
- `GET /api/news/live` - Get live news from external API
- `GET /api/news/:id` - Get single article
- `POST /api/news/:id/report` - Report article

### Verification
- `POST /api/verification/verify-url` - Verify news URL
- `POST /api/verification/verify-text` - Verify text content
- `POST /api/verification/verify-image` - Verify image
- `GET /api/verification/result/:requestId` - Get verification result
- `GET /api/verification/history` - Get verification history

### Admin (Requires admin role)
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/reports` - View reports
- `PUT /api/admin/reports/:id/review` - Review reports

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (user, moderator, admin)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization
- File upload restrictions

## 📊 Database

- SQLite database stored in `./data/honestlens.db`
- Automatic schema initialization
- Backup recommended for production

## 🚀 Deployment Options

### 1. Local Server
```bash
npm run start:prod
```

### 2. PM2 Process Manager
```bash
npm run pm2
```

### 3. Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start:prod"]
```

### 4. Cloud Platforms
- **Heroku**: Add buildpack and set environment variables
- **Railway**: Connect GitHub repo and deploy
- **DigitalOcean**: Use App Platform or Droplet
- **AWS**: Use Elastic Beanstalk or EC2

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure `data` directory exists
   - Check file permissions

2. **API Key Errors**
   - Verify all required API keys in `.env`
   - Check API key validity

3. **CORS Issues**
   - Update `FRONTEND_URL` in `.env`
   - Check allowed origins in server.js

4. **File Upload Issues**
   - Ensure `uploads` directory exists
   - Check file size limits

### Health Check
```bash
curl http://localhost:5000/api/health
```

## 📝 Monitoring

### PM2 Commands
```bash
pm2 status          # View process status
pm2 logs honestlens  # View logs
pm2 restart honestlens # Restart app
pm2 stop honestlens  # Stop app
pm2 delete honestlens # Remove from PM2
```

### Log Files
- Application logs: `./logs/app.log`
- Error logs: `./logs/error.log`
- PM2 logs: `~/.pm2/logs/`

## 🔄 Updates

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart honestlens
```

## 📞 Support

For issues and questions:
1. Check this deployment guide
2. Review application logs
3. Check GitHub issues
4. Contact development team