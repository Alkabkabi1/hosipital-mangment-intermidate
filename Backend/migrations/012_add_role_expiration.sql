-- ========================================
-- Migration 012: Add Role Expiration Support
-- ========================================
-- Purpose: Enable time-limited role assignments with automatic expiration
-- Author: System
-- Date: 2025-10-20
-- ========================================

-- Add expiration columns to user_roles table (if they don't exist)
-- Check and add expires_at
SET @exists_expires = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'expires_at');
SET @sql_expires = IF(@exists_expires = 0, 
  'ALTER TABLE user_roles ADD COLUMN expires_at DATETIME NULL COMMENT ''When this role assignment expires (NULL = never)'' AFTER is_active',
  'SELECT ''Column expires_at already exists'' AS message');
PREPARE stmt FROM @sql_expires;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add expiration_notified
SET @exists_notified = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'expiration_notified');
SET @sql_notified = IF(@exists_notified = 0, 
  'ALTER TABLE user_roles ADD COLUMN expiration_notified TINYINT(1) DEFAULT 0 COMMENT ''Whether user was notified about expiration''',
  'SELECT ''Column expiration_notified already exists'' AS message');
PREPARE stmt FROM @sql_notified;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes if they don't exist
SET @exists_idx1 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND INDEX_NAME = 'idx_user_roles_expires');
SET @sql_idx1 = IF(@exists_idx1 = 0,
  'ALTER TABLE user_roles ADD INDEX idx_user_roles_expires (expires_at)',
  'SELECT ''Index idx_user_roles_expires already exists'' AS message');
PREPARE stmt FROM @sql_idx1;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists_idx2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND INDEX_NAME = 'idx_user_roles_expiring');
SET @sql_idx2 = IF(@exists_idx2 = 0,
  'ALTER TABLE user_roles ADD INDEX idx_user_roles_expiring (expires_at, expiration_notified)',
  'SELECT ''Index idx_user_roles_expiring already exists'' AS message');
PREPARE stmt FROM @sql_idx2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update role_audit_log to track expiration events
-- SKIPPED: role_audit_log table will be created in future migration
-- ALTER TABLE role_audit_log
-- MODIFY COLUMN action ENUM('ASSIGNED', 'REMOVED', 'EXPIRED', 'RENEWED') NOT NULL COMMENT 'Action performed on role';

-- Create view for expiring roles (expires in next 7 days)
CREATE OR REPLACE VIEW expiring_roles AS
SELECT 
  ur.user_role_id,
  ur.user_id,
  u.name AS user_name,
  u.email AS user_email,
  ur.role_id,
  r.role_name,
  r.role_name_ar,
  ur.expires_at,
  DATEDIFF(ur.expires_at, NOW()) AS days_until_expiration,
  ur.expiration_notified,
  ur.assigned_by,
  ur.assigned_at
FROM user_roles ur
INNER JOIN App_Users u ON u.id = ur.user_id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE ur.is_active = TRUE
  AND ur.expires_at IS NOT NULL
  AND ur.expires_at > NOW()
  AND ur.expires_at <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY ur.expires_at ASC;

-- Create view for expired roles (not yet disabled)
CREATE OR REPLACE VIEW expired_roles AS
SELECT 
  ur.user_role_id,
  ur.user_id,
  u.name AS user_name,
  u.email AS user_email,
  ur.role_id,
  r.role_name,
  r.role_name_ar,
  ur.expires_at,
  DATEDIFF(NOW(), ur.expires_at) AS days_expired,
  ur.assigned_by,
  ur.assigned_at
FROM user_roles ur
INNER JOIN App_Users u ON u.id = ur.user_id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE ur.is_active = TRUE
  AND ur.expires_at IS NOT NULL
  AND ur.expires_at < NOW()
ORDER BY ur.expires_at ASC;

-- Verify table structure
SHOW COLUMNS FROM user_roles LIKE 'expires_at';

-- Show expiring roles (if any)
SELECT * FROM expiring_roles LIMIT 10;

-- Migration complete
SELECT 'Migration 012: Role expiration support added successfully' AS status;

-- ========================================
-- Usage Examples:
--
-- Assign role with 30-day expiration:
-- INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
-- VALUES (123, 2, 1, DATE_ADD(NOW(), INTERVAL 30 DAY));
--
-- Get roles expiring in next 7 days:
-- SELECT * FROM expiring_roles;
--
-- Get already expired roles:
-- SELECT * FROM expired_roles;
--
-- Renew an expiring role (extend by 30 days):
-- UPDATE user_roles 
-- SET expires_at = DATE_ADD(expires_at, INTERVAL 30 DAY),
--     expiration_notified = 0
-- WHERE user_role_id = ?;
-- ========================================

-- ========================================
-- Rollback Instructions:
-- DROP VIEW IF EXISTS expired_roles;
-- DROP VIEW IF EXISTS expiring_roles;
-- ALTER TABLE role_audit_log 
-- MODIFY COLUMN action ENUM('ASSIGNED', 'REMOVED') NOT NULL;
-- ALTER TABLE user_roles
-- DROP INDEX idx_user_roles_expiring,
-- DROP INDEX idx_user_roles_expires,
-- DROP COLUMN expiration_notified,
-- DROP COLUMN expires_at;
-- ========================================

