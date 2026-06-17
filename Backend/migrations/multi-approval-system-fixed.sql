-- ============================================
-- Multi-Manager Approval System (FIXED VERSION)
-- Works with MySQL 5.7+ and 8.0+
-- ============================================

-- Use the correct database
USE hospital_management;

-- ============================================
-- 1. Create Request_Approvals Table
-- ============================================
CREATE TABLE IF NOT EXISTS Request_Approvals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('clearance', 'onboarding', 'delegation', 'direct') NOT NULL,
  request_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_order INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  decision_note TEXT,
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_request (request_type, request_id),
  INDEX idx_approver (approver_id),
  INDEX idx_status (status),
  INDEX idx_order (approval_order),
  
  FOREIGN KEY (approver_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_approval (request_type, request_id, approver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Create Approval_Rules Table
-- ============================================
CREATE TABLE IF NOT EXISTS Approval_Rules (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('clearance', 'onboarding', 'delegation', 'direct') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  approval_order INT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (request_type),
  INDEX idx_role (role_name),
  UNIQUE KEY unique_rule (request_type, role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Insert Default Approval Rules
-- ============================================
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required) VALUES
('clearance', 'HR', 1, TRUE),
('clearance', 'MANAGER', 2, TRUE),
('onboarding', 'HR', 1, TRUE),
('onboarding', 'MANAGER', 2, TRUE),
('delegation', 'MANAGER', 1, TRUE),
('direct', 'HR', 1, TRUE),
('direct', 'MANAGER', 2, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- 4. Create User_Role_History Table
-- ============================================
CREATE TABLE IF NOT EXISTS User_Role_History (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT NOT NULL,
  action ENUM('assigned', 'removed', 'activated', 'deactivated') NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_role (role_id),
  INDEX idx_date (effective_date, expiry_date),
  
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Add Columns to Clearance_Requests
-- MySQL doesn't support IF NOT EXISTS for ADD COLUMN
-- Run each statement separately, ignore errors if column exists
-- ============================================

-- Add approval_stage column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND COLUMN_NAME = 'approval_stage';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN approval_stage VARCHAR(50) DEFAULT ''pending'' COMMENT ''Current approval stage''',
  'SELECT ''Column approval_stage already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add total_approvers column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND COLUMN_NAME = 'total_approvers';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN total_approvers INT DEFAULT 0 COMMENT ''Total number of required approvers''',
  'SELECT ''Column total_approvers already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approved_count column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND COLUMN_NAME = 'approved_count';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN approved_count INT DEFAULT 0 COMMENT ''Number of approvals received''',
  'SELECT ''Column approved_count already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add final_decision column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND COLUMN_NAME = 'final_decision';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN final_decision ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''pending''',
  'SELECT ''Column final_decision already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_approval_at column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND COLUMN_NAME = 'last_approval_at';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN last_approval_at TIMESTAMP NULL COMMENT ''Last approval timestamp''',
  'SELECT ''Column last_approval_at already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. Add Columns to Onboarding_Requests
-- ============================================

-- Add approval_stage column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Onboarding_Requests' 
  AND COLUMN_NAME = 'approval_stage';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN approval_stage VARCHAR(50) DEFAULT ''pending'' COMMENT ''Current approval stage''',
  'SELECT ''Column approval_stage already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add total_approvers column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Onboarding_Requests' 
  AND COLUMN_NAME = 'total_approvers';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN total_approvers INT DEFAULT 0 COMMENT ''Total number of required approvers''',
  'SELECT ''Column total_approvers already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approved_count column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Onboarding_Requests' 
  AND COLUMN_NAME = 'approved_count';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN approved_count INT DEFAULT 0 COMMENT ''Number of approvals received''',
  'SELECT ''Column approved_count already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add final_decision column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Onboarding_Requests' 
  AND COLUMN_NAME = 'final_decision';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN final_decision ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''pending''',
  'SELECT ''Column final_decision already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_approval_at column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Onboarding_Requests' 
  AND COLUMN_NAME = 'last_approval_at';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN last_approval_at TIMESTAMP NULL COMMENT ''Last approval timestamp''',
  'SELECT ''Column last_approval_at already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. Add Columns to Delegation_Requests
-- ============================================

-- Add approval_stage column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Delegation_Requests' 
  AND COLUMN_NAME = 'approval_stage';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Delegation_Requests ADD COLUMN approval_stage VARCHAR(50) DEFAULT ''pending'' COMMENT ''Current approval stage''',
  'SELECT ''Column approval_stage already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add total_approvers column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Delegation_Requests' 
  AND COLUMN_NAME = 'total_approvers';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Delegation_Requests ADD COLUMN total_approvers INT DEFAULT 0 COMMENT ''Total number of required approvers''',
  'SELECT ''Column total_approvers already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approved_count column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Delegation_Requests' 
  AND COLUMN_NAME = 'approved_count';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Delegation_Requests ADD COLUMN approved_count INT DEFAULT 0 COMMENT ''Number of approvals received''',
  'SELECT ''Column approved_count already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add final_decision column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Delegation_Requests' 
  AND COLUMN_NAME = 'final_decision';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Delegation_Requests ADD COLUMN final_decision ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''pending''',
  'SELECT ''Column final_decision already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_approval_at column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Delegation_Requests' 
  AND COLUMN_NAME = 'last_approval_at';

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Delegation_Requests ADD COLUMN last_approval_at TIMESTAMP NULL COMMENT ''Last approval timestamp''',
  'SELECT ''Column last_approval_at already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 8. Create Views
-- ============================================

-- View for current user roles
CREATE OR REPLACE VIEW V_User_Roles_Current AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  r.role_id,
  r.role_name,
  r.role_name_ar,
  r.description,
  ur.assigned_by,
  ur.assigned_at,
  ab.name AS assigned_by_name,
  ur.is_active
FROM App_Users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN App_Users ab ON ur.assigned_by = ab.id
WHERE ur.is_active = TRUE AND r.is_active = TRUE;

-- View for pending approvals
CREATE OR REPLACE VIEW V_Pending_Approvals AS
SELECT 
  ra.approval_id,
  ra.request_type,
  ra.request_id,
  ra.approver_id,
  u.name AS approver_name,
  u.email AS approver_email,
  r.role_name AS approver_role,
  ra.approval_order,
  ra.status,
  ra.created_at,
  CASE 
    WHEN ra.request_type = 'clearance' THEN cr.employee_id
    WHEN ra.request_type = 'onboarding' THEN onb.employee_id
    WHEN ra.request_type = 'delegation' THEN dr.employee_id
    ELSE NULL
  END AS request_owner_id
FROM Request_Approvals ra
INNER JOIN App_Users u ON ra.approver_id = u.id
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN Clearance_Requests cr ON ra.request_type = 'clearance' AND ra.request_id = cr.clearance_id
LEFT JOIN Onboarding_Requests onb ON ra.request_type = 'onboarding' AND ra.request_id = onb.onboarding_id  
LEFT JOIN Delegation_Requests dr ON ra.request_type = 'delegation' AND ra.request_id = dr.delegation_id
WHERE ra.status = 'pending' AND ur.is_active = TRUE;

-- ============================================
-- 9. Create Indexes for Performance
-- ============================================

-- Check and create indexes if they don't exist
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND INDEX_NAME = 'idx_approval_stage';

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_approval_stage ON Clearance_Requests(approval_stage)',
  'SELECT ''Index idx_approval_stage already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'hospital_management' 
  AND TABLE_NAME = 'Clearance_Requests' 
  AND INDEX_NAME = 'idx_final_decision';

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_final_decision ON Clearance_Requests(final_decision)',
  'SELECT ''Index idx_final_decision already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 10. Verify Installation
-- ============================================

SELECT 'Multi-Approval System Installation Complete!' AS Status;

-- Show created tables
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'hospital_management'
  AND TABLE_NAME IN ('Request_Approvals', 'Approval_Rules', 'User_Role_History')
ORDER BY TABLE_NAME;

-- Show approval rules
SELECT * FROM Approval_Rules ORDER BY request_type, approval_order;

-- Show added columns in Clearance_Requests
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'hospital_management'
  AND TABLE_NAME = 'Clearance_Requests'
  AND COLUMN_NAME IN ('approval_stage', 'total_approvers', 'approved_count', 'final_decision', 'last_approval_at')
ORDER BY ORDINAL_POSITION;

