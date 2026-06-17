-- ========================================
-- Migration 011: Enhanced Access Audit Logging
-- ========================================
-- Purpose: Track all role-based access attempts for security monitoring
-- Author: System
-- Date: 2025-10-20
-- ========================================

-- Create role access audit table
CREATE TABLE IF NOT EXISTS role_access_audit (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'User making the request',
  endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint accessed',
  http_method VARCHAR(10) NOT NULL COMMENT 'HTTP method (GET, POST, etc)',
  required_roles JSON COMMENT 'Roles required for access',
  user_roles JSON COMMENT 'Roles the user had at time of request',
  access_granted TINYINT(1) NOT NULL COMMENT '1=granted, 0=denied',
  ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6 address',
  user_agent TEXT COMMENT 'Browser/client user agent',
  request_id VARCHAR(100) COMMENT 'Unique request identifier for tracing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_endpoint (endpoint),
  INDEX idx_audit_granted (access_granted),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_user_created (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for all role-based access control checks';

-- Create summary view for common queries
CREATE OR REPLACE VIEW access_audit_summary AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  raa.endpoint,
  raa.http_method,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN raa.access_granted = 1 THEN 1 ELSE 0 END) AS granted_count,
  SUM(CASE WHEN raa.access_granted = 0 THEN 1 ELSE 0 END) AS denied_count,
  MAX(raa.created_at) AS last_attempt,
  DATE(raa.created_at) AS attempt_date
FROM role_access_audit raa
INNER JOIN App_Users u ON u.id = raa.user_id
WHERE raa.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name, u.email, raa.endpoint, raa.http_method, DATE(raa.created_at)
ORDER BY last_attempt DESC;

-- Create denied access view for security monitoring
CREATE OR REPLACE VIEW denied_access_summary AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  raa.endpoint,
  raa.http_method,
  raa.required_roles,
  raa.user_roles,
  raa.ip_address,
  COUNT(*) AS denial_count,
  MAX(raa.created_at) AS last_denial,
  DATE(raa.created_at) AS denial_date
FROM role_access_audit raa
INNER JOIN App_Users u ON u.id = raa.user_id
WHERE raa.access_granted = 0
  AND raa.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name, u.email, raa.endpoint, raa.http_method, raa.required_roles, 
         raa.user_roles, raa.ip_address, DATE(raa.created_at)
ORDER BY denial_count DESC, last_denial DESC;

-- Verify table creation
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'role_access_audit';

-- Migration complete
SELECT 'Migration 011: Access audit table created successfully' AS status;

-- ========================================
-- Usage Examples:
-- 
-- Get all denied access attempts today:
-- SELECT * FROM denied_access_summary WHERE denial_date = CURDATE();
--
-- Get users with excessive denials:
-- SELECT user_email, SUM(denial_count) as total_denials
-- FROM denied_access_summary
-- GROUP BY user_email
-- HAVING total_denials > 10;
--
-- Get access summary for specific user:
-- SELECT * FROM access_audit_summary WHERE user_email = 'user@example.com';
-- ========================================

-- ========================================
-- Rollback Instructions:
-- DROP VIEW IF EXISTS denied_access_summary;
-- DROP VIEW IF EXISTS access_audit_summary;
-- DROP TABLE IF EXISTS role_access_audit;
-- ========================================

