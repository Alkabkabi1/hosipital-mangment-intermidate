-- 007_add_username.sql
-- Add username column to App_Users if missing; add unique index if missing.

ALTER TABLE App_Users
  ADD COLUMN IF NOT EXISTS username VARCHAR(255) NULL;

-- Backfill suggestion: if username is NULL, set to left part of email (optional)
UPDATE App_Users SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Unique index on username if not exists (MySQL 8)
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'App_Users'
    AND index_name = 'uq_users_username'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE App_Users ADD UNIQUE KEY uq_users_username (username)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

