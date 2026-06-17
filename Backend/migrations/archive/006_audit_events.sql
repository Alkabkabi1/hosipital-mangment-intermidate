-- 006_audit_events.sql
-- Idempotent migration to create Audit_Events and indexes

-- Create table if not exists
CREATE TABLE IF NOT EXISTS `Audit_Events` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ts` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` INT NULL,
  `actor_email` VARCHAR(255) NULL,
  `action` VARCHAR(64) NOT NULL,
  `resource` VARCHAR(128) NULL,
  `resource_id` VARCHAR(64) NULL,
  `ip` VARCHAR(64) NULL,
  `meta` JSON NULL,
  `immutable` TINYINT DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Helper to create index if it doesn't exist (MySQL 8 compatible)
SET @db_name = DATABASE();

-- Index on ts
SET @idx_name = 'idx_audit_ts';
SET @exists = (SELECT COUNT(1) FROM information_schema.statistics 
               WHERE table_schema=@db_name AND table_name='Audit_Events' AND index_name=@idx_name);
SET @sql = IF(@exists=0, 'CREATE INDEX idx_audit_ts ON Audit_Events (ts)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on user_id
SET @idx_name = 'idx_audit_user';
SET @exists = (SELECT COUNT(1) FROM information_schema.statistics 
               WHERE table_schema=@db_name AND table_name='Audit_Events' AND index_name=@idx_name);
SET @sql = IF(@exists=0, 'CREATE INDEX idx_audit_user ON Audit_Events (user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on action
SET @idx_name = 'idx_audit_action';
SET @exists = (SELECT COUNT(1) FROM information_schema.statistics 
               WHERE table_schema=@db_name AND table_name='Audit_Events' AND index_name=@idx_name);
SET @sql = IF(@exists=0, 'CREATE INDEX idx_audit_action ON Audit_Events (action)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Composite index on (resource, resource_id)
SET @idx_name = 'idx_audit_res';
SET @exists = (SELECT COUNT(1) FROM information_schema.statistics 
               WHERE table_schema=@db_name AND table_name='Audit_Events' AND index_name=@idx_name);
SET @sql = IF(@exists=0, 'CREATE INDEX idx_audit_res ON Audit_Events (resource, resource_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

