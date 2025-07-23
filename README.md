# HonestLens

HonestLens is an AI-powered news verification tool for India. It checks news authenticity using trusted sources like the Press Information Bureau (PIB). Instead of just true or false, it assigns a Truth Score to show how accurate a claim is, helping users quickly spot fake or misleading news.

## Backend API

This is the backend API server for HonestLens, built with Node.js, Express, and SQLite.

### Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **News Verification**: AI-powered verification of URLs, text content, and images
- **Truth Scoring**: Advanced scoring system (0-100) with credibility levels
- **Fact-Check Sources**: Integration with trusted Indian sources like PIB, MyGov
- **User Management**: User profiles, reputation system, activity tracking
- **Admin Dashboard**: Comprehensive admin panel for content moderation
- **Real-time Notifications**: User notifications for verification results
- **Reporting System**: Community-driven content reporting and moderation
- **Analytics**: Detailed analytics and insights for administrators
- **Rate Limiting**: API rate limiting and security measures

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

#### News Verification
- `POST /api/verification/verify-url` - Verify news URL
- `POST /api/verification/verify-text` - Verify text content
- `POST /api/verification/verify-image` - Verify image content
- `GET /api/verification/result/:id` - Get verification result
- `GET /api/verification/history` - Get user's verification history

#### News Articles
- `GET /api/news/verified` - Get verified news articles
- `GET /api/news/debunked` - Get debunked news articles
- `GET /api/news/:id` - Get single news article
- `GET /api/news/search` - Search news articles
- `POST /api/news/:id/report` - Report news article
- `GET /api/news/categories` - Get news categories
- `GET /api/news/trending` - Get trending topics

#### User Dashboard
- `GET /api/user/dashboard` - Get user dashboard stats
- `GET /api/user/notifications` - Get user notifications
- `PUT /api/user/notifications/:id/read` - Mark notification as read
- `PUT /api/user/notifications/read-all` - Mark all notifications as read
- `GET /api/user/reports` - Get user's reports
- `GET /api/user/activity` - Get user activity history
- `PUT /api/user/preferences` - Update user preferences
- `GET /api/user/stats` - Get user statistics

#### Admin Panel
- `GET /api/admin/dashboard` - Get admin dashboard stats
- `GET /api/admin/users` - Get all users with pagination
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/reports` - Get pending reports
- `PUT /api/admin/reports/:id/review` - Review report
- `GET /api/admin/verifications` - Get verification requests
- `PUT /api/admin/verifications/:id/verify` - Manually verify content
- `GET /api/admin/analytics` - Get system analytics

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd honestlens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
DATABASE_URL=./data/honestlens.db
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and profiles
- **news_articles**: News articles and content
- **verification_requests**: Verification requests from users
- **verification_results**: AI verification results with truth scores
- **fact_check_sources**: Trusted fact-checking sources
- **user_reports**: Community reports and moderation
- **user_activity_logs**: User activity tracking
- **notifications**: User notifications
- **api_usage**: API usage tracking

### Truth Scoring System

HonestLens uses a sophisticated truth scoring system:

- **0-29**: Not Credible
- **30-49**: Low Credibility
- **50-69**: Mixed Credibility
- **70-84**: Mostly Credible
- **85-100**: Highly Credible

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- File upload restrictions
- SQL injection prevention

### Trusted Sources

The system integrates with trusted Indian fact-checking sources:

- Press Information Bureau (PIB)
- MyGov India
- Fact Crescendo
- Alt News
- Boom Live

### Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### API Documentation

The API follows RESTful conventions and returns JSON responses in the following format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors if applicable
  ]
}
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### License

MIT License - see LICENSE file for details.

# Deployment

## Prerequisites
- Node.js (v14+ recommended)
- npm
- [pm2](https://pm2.keymetrics.io/) (for process management)

## Setup
1. Copy `.env.example` to `.env` and fill in your API keys and secrets:
   ```sh
   cp .env.example .env
   # Edit .env and set your NEWS_API_KEY
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the app in production mode with pm2:
   ```sh
   npx pm2 start server.js --name honestlens --env production
   ```
4. To view logs:
   ```sh
   npx pm2 logs honestlens
   ```
5. To stop or restart:
   ```sh
   npx pm2 stop honestlens
   npx pm2 restart honestlens
   ```

## Notes
- Make sure your ML microservice is also running in production.
- For HTTPS, use a reverse proxy like Nginx or deploy on a cloud platform with SSL support.
