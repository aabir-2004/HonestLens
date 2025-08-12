const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_URL || path.join(dataDir, 'honestlens.db');

class Database {
  constructor() {
    this.db = null;
    this.connectionPool = [];
    this.maxConnections = 10;
    this.currentConnections = 0;
  }

  async connect() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          // Optimize SQLite for better performance
          this.db.run('PRAGMA foreign_keys = ON');
          this.db.run('PRAGMA journal_mode = WAL');
          this.db.run('PRAGMA synchronous = NORMAL');
          this.db.run('PRAGMA cache_size = 1000');
          this.db.run('PRAGMA temp_store = MEMORY');
          resolve(this.db);
        }
      });
    });
  }

  // Initialize all database tables
  async initializeTables() {
    await this.connect();
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
            is_verified BOOLEAN DEFAULT FALSE,
            verification_token VARCHAR(255),
            reset_token VARCHAR(255),
            reset_token_expires DATETIME,
            profile_image VARCHAR(255),
            bio TEXT,
            reputation_score INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // News articles table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS news_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            url VARCHAR(1000),
            source VARCHAR(200),
            author VARCHAR(200),
            published_date DATETIME,
            category VARCHAR(100),
            language VARCHAR(10) DEFAULT 'en',
            image_url VARCHAR(1000),
            summary TEXT,
            keywords TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Verification requests table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS verification_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            article_id INTEGER,
            request_type TEXT NOT NULL CHECK (request_type IN ('url', 'text', 'image')),
            content TEXT NOT NULL,
            url VARCHAR(1000),
            image_path VARCHAR(500),
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE SET NULL
          )
        `);

        // Verification results table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS verification_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            truth_score DECIMAL(5,2) NOT NULL,
            credibility_level TEXT NOT NULL CHECK (credibility_level IN ('not_credible', 'low_credibility', 'mixed_credibility', 'mostly_credible', 'highly_credible')),
            verification_method VARCHAR(100),
            sources_checked TEXT,
            evidence TEXT,
            reasoning TEXT,
            confidence_score DECIMAL(5,2),
            flags TEXT,
            verified_by INTEGER,
            verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES verification_requests(id) ON DELETE CASCADE,
            FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
          )
        `);

        // Fact check sources table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS fact_check_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(200) NOT NULL,
            url VARCHAR(500) NOT NULL,
            api_endpoint VARCHAR(500),
            api_key VARCHAR(255),
            reliability_score DECIMAL(3,2) DEFAULT 0.8,
            is_active BOOLEAN DEFAULT TRUE,
            source_type TEXT DEFAULT 'other' CHECK (source_type IN ('government', 'media', 'fact_checker', 'academic', 'other')),
            country VARCHAR(50),
            language VARCHAR(10) DEFAULT 'en',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // User reports table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS user_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_id INTEGER,
            article_id INTEGER,
            report_type TEXT NOT NULL CHECK (report_type IN ('misinformation', 'spam', 'inappropriate', 'copyright', 'other')),
            description TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
            reviewed_by INTEGER,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
          )
        `);

        // User activity logs table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS user_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id INTEGER,
            details TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          )
        `);

        // Notifications table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'system' CHECK (type IN ('verification_complete', 'report_update', 'system', 'achievement')),
            is_read BOOLEAN DEFAULT FALSE,
            action_url VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // API usage tracking table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS api_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            endpoint VARCHAR(200) NOT NULL,
            method VARCHAR(10) NOT NULL,
            status_code INTEGER,
            response_time INTEGER,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          )
        `);

        // Create indexes for better performance
        this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(url)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_verification_results_request_id ON verification_results(request_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at)');

        // Insert default fact-check sources
        this.insertDefaultSources();

        resolve();
      });
    });
  }

  // Insert default fact-checking sources
  insertDefaultSources() {
    const defaultSources = [
      {
        name: 'Press Information Bureau (PIB)',
        url: 'https://pib.gov.in',
        source_type: 'government',
        country: 'India',
        reliability_score: 0.95
      },
      {
        name: 'MyGov India',
        url: 'https://www.mygov.in',
        source_type: 'government',
        country: 'India',
        reliability_score: 0.90
      },
      {
        name: 'Fact Crescendo',
        url: 'https://factcrescendo.com',
        source_type: 'fact_checker',
        country: 'India',
        reliability_score: 0.85
      },
      {
        name: 'Alt News',
        url: 'https://www.altnews.in',
        source_type: 'fact_checker',
        country: 'India',
        reliability_score: 0.88
      },
      {
        name: 'Boom Live',
        url: 'https://www.boomlive.in',
        source_type: 'fact_checker',
        country: 'India',
        reliability_score: 0.87
      }
    ];

    defaultSources.forEach(source => {
      this.db.run(`
        INSERT OR IGNORE INTO fact_check_sources 
        (name, url, source_type, country, reliability_score)
        VALUES (?, ?, ?, ?, ?)
      `, [source.name, source.url, source.source_type, source.country, source.reliability_score]);
    });
  }

  // Generic query method
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Generic run method for INSERT, UPDATE, DELETE
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

const database = new Database();

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await database.connect();
    await database.initializeTables();
    console.log('✅ Database initialized successfully');
    return database;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports = { database, initializeDatabase };