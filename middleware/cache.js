const redisService = require('../config/redis');

// In-memory cache fallback
const memoryCache = new Map();
const MEMORY_CACHE_LIMIT = 1000;

class CacheService {
  constructor() {
    this.useRedis = false;
    this.init();
  }

  async init() {
    try {
      await redisService.connect();
      this.useRedis = redisService.isConnected;
    } catch (error) {
      console.warn('Cache service falling back to memory cache');
      this.useRedis = false;
    }
  }

  async get(key) {
    if (this.useRedis) {
      return await redisService.get(key);
    }
    
    // Memory cache fallback
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    if (cached) {
      memoryCache.delete(key);
    }
    
    return null;
  }

  async set(key, value, expireInSeconds = 3600) {
    if (this.useRedis) {
      return await redisService.set(key, value, expireInSeconds);
    }
    
    // Memory cache fallback with size limit
    if (memoryCache.size >= MEMORY_CACHE_LIMIT) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
    
    memoryCache.set(key, {
      value,
      expires: Date.now() + (expireInSeconds * 1000)
    });
    
    return true;
  }

  async del(key) {
    if (this.useRedis) {
      return await redisService.del(key);
    }
    
    return memoryCache.delete(key);
  }

  // Middleware for caching API responses
  middleware(expireInSeconds = 300) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip caching for authenticated requests
      if (req.headers.authorization) {
        return next();
      }

      const cacheKey = `api:${req.originalUrl}`;
      
      try {
        const cached = await this.get(cacheKey);
        if (cached) {
          res.set('X-Cache', 'HIT');
          return res.json(cached);
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
          // Only cache successful responses
          if (res.statusCode === 200) {
            cacheService.set(cacheKey, data, expireInSeconds);
          }
          res.set('X-Cache', 'MISS');
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }
}

const cacheService = new CacheService();
module.exports = cacheService;