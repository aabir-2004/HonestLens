-- SQLite Production Optimizations
-- Run these commands to optimize your database for production

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Optimize synchronous mode
PRAGMA synchronous = NORMAL;

-- Increase cache size (in KB)
PRAGMA cache_size = 10000;

-- Use memory for temporary storage
PRAGMA temp_store = MEMORY;

-- Optimize page size
PRAGMA page_size = 4096;

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Analyze tables for better query planning
ANALYZE;

-- Vacuum to optimize database file
VACUUM;
