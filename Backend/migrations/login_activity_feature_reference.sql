-- ============================================================================
-- Admin Login Activity Feature - Database Migration (REFERENCE ONLY)
-- ============================================================================
-- 
-- STATUS: ✅ NOT NEEDED - All components already exist in nora_datbase
-- 
-- This file is provided for:
-- 1. Documentation purposes
-- 2. Fresh installations on new servers
-- 3. Database restoration scenarios
-- 
-- VERIFIED: All tables and columns already exist as of Nov 6, 2025
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Add login tracking columns to App_Users (if not exists)
-- ----------------------------------------------------------------------------
-- Status: ✅ Already exists - last_login and login_count columns confirmed

-- Add last_login column (SKIP - already exists)
-- ALTER TABLE App_Users 
-- ADD COLUMN last_login DATETIME NULL COMMENT 'Timestamp of last successful login';

-- Add login_count column (SKIP - already exists)
-- ALTER TABLE App_Users
-- ADD COLUMN login_count INT NOT NULL DEFAULT 0 COMMENT 'Total number of successful logins';

-- Add index for performance (SKIP - already exists)
-- CREATE INDEX idx_app_users_last_login ON App_Users(last_login);


-- ----------------------------------------------------------------------------
-- Step 2: Verify Audit_Events table structure
-- ----------------------------------------------------------------------------
-- Status: ✅ Already exists with correct structure

-- Table structure (REFERENCE - already exists):
/*
CREATE TABLE IF NOT EXISTS Audit_Events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  actor_email VARCHAR(255) NULL,
  action VARCHAR(64) NOT NULL,
  resource VARCHAR(128) NULL,
  resource_id VARCHAR(64) NULL,
  ip VARCHAR(64) NULL,
  meta JSON NULL,
  immutable TINYINT DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_audit_ts (ts),
  KEY idx_audit_user (user_id),
  KEY idx_audit_action (action),
  KEY idx_audit_res (resource, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/


-- ----------------------------------------------------------------------------
-- Step 3: Verify roles table exists
-- ----------------------------------------------------------------------------
-- Status: ✅ Already exists

-- Table structure (REFERENCE - already exists):
/*
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  role_name_ar VARCHAR(120) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

-- Ensure ADMIN role exists (SKIP - already exists)
-- INSERT IGNORE INTO roles (role_name, role_name_ar, description) 
-- VALUES ('ADMIN', 'مسؤول', 'Administrator with elevated privileges');


-- ----------------------------------------------------------------------------
-- Step 4: Verify user_roles table exists
-- ----------------------------------------------------------------------------
-- Status: ✅ Already exists

-- Table structure (REFERENCE - already exists):
/*
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME NULL,
  UNIQUE KEY uq_user_role (user_id, role_id),
  KEY idx_user_roles_user (user_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/


-- ============================================================================
-- OPTIONAL: Sample data for testing (ONLY if needed)
-- ============================================================================

-- Grant ADMIN role to a test user (EXAMPLE - modify user_id as needed)
-- INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, is_active)
-- VALUES (
--   1,  -- Replace with actual user ID
--   (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
--   1,  -- Assigned by admin
--   1   -- Active
-- );


-- ============================================================================
-- OPTIONAL: Seed historical login data for testing (ONLY for testing)
-- ============================================================================

-- Update existing users with random login activity (TEST DATA ONLY)
/*
UPDATE App_Users 
SET 
  last_login = DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
  login_count = FLOOR(RAND() * 100) + 5
WHERE id BETWEEN 1 AND 10;
*/

-- Add sample audit events (TEST DATA ONLY)
/*
INSERT INTO Audit_Events (user_id, actor_email, action, resource, resource_id, ts, ip)
SELECT 
  id, 
  email, 
  'USER_LOGIN', 
  'auth', 
  CAST(id AS CHAR), 
  DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
  CONCAT('192.168.1.', FLOOR(RAND() * 255))
FROM App_Users 
WHERE id BETWEEN 1 AND 10
LIMIT 20;
*/


-- ============================================================================
-- MAINTENANCE: Cleanup old audit events (OPTIONAL)
-- ============================================================================

-- Delete login events older than 90 days (RUN PERIODICALLY)
/*
DELETE FROM Audit_Events 
WHERE action = 'USER_LOGIN' 
  AND ts < DATE_SUB(NOW(), INTERVAL 90 DAY);
*/


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if login tracking columns exist
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'nora_datbase'
  AND TABLE_NAME = 'App_Users'
  AND COLUMN_NAME IN ('last_login', 'login_count');

-- Check recent login activity
SELECT 
  COUNT(*) as total_logins,
  COUNT(DISTINCT user_id) as unique_users,
  DATE(ts) as login_date
FROM Audit_Events
WHERE action = 'USER_LOGIN'
  AND ts >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(ts)
ORDER BY login_date DESC;

-- Check users with ADMIN role
SELECT 
  u.id,
  u.name,
  u.email,
  u.last_login,
  u.login_count,
  GROUP_CONCAT(r.role_name) as roles
FROM App_Users u
INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
INNER JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
WHERE u.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.last_login, u.login_count
HAVING FIND_IN_SET('ADMIN', roles) > 0;

-- ============================================================================
-- END OF MIGRATION FILE
-- ============================================================================

