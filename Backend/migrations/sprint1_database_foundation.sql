-- =============================================================================
-- SPRINT 1: DATABASE FOUNDATION - COMPREHENSIVE MIGRATION
-- =============================================================================
-- Purpose: Fix critical database schema issues preventing request creation
-- Executed by: Claude Sonnet 3.5
-- Date: 2025-11-15
-- Status: PENDING EXECUTION
-- =============================================================================

-- =============================================================================
-- DAY 1: CREATE MISSING STATUS HISTORY TABLES
-- =============================================================================

-- Task 1.1: Create assignment_status_history Table
-- Purpose: Track status changes for assignment requests
CREATE TABLE IF NOT EXISTS assignment_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    previous_status VARCHAR(50) NULL,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    approval_level INT DEFAULT 1,
    
    -- Foreign Keys
    FOREIGN KEY (assignment_id) REFERENCES Assignment_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_status (status),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task 1.2: Create assignment_termination_status_history Table
-- Purpose: Track status changes for assignment termination requests
CREATE TABLE IF NOT EXISTS assignment_termination_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    termination_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    previous_status VARCHAR(50) NULL,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    approval_level INT DEFAULT 1,
    
    -- Foreign Keys
    FOREIGN KEY (termination_id) REFERENCES Assignment_Termination_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE RESTRICT,
    
    -- Indexes for performance
    INDEX idx_termination_id (termination_id),
    INDEX idx_status (status),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DAY 2: FIX COLUMN NAME MISMATCHES & ADD MISSING FIELDS
-- =============================================================================

-- Task 2.1: Fix Experience Certificate Table Column Mismatch
-- Current Issue: API sends 'job_title', table expects 'position'
-- Solution: Add job_title column

-- Check if column exists before adding
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nora_database' 
    AND TABLE_NAME = 'Experience_Certificate_Requests' 
    AND COLUMN_NAME = 'job_title'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE Experience_Certificate_Requests ADD COLUMN job_title VARCHAR(255) NULL',
    'SELECT "Column job_title already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate existing data from position column
UPDATE Experience_Certificate_Requests 
SET job_title = position 
WHERE job_title IS NULL AND position IS NOT NULL;

-- Task 2.2: Add Missing occupation Column to Certificate Requests
-- Current Issue: API expects 'occupation' field but table doesn't have it

SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nora_database' 
    AND TABLE_NAME = 'Certificate_Requests' 
    AND COLUMN_NAME = 'occupation'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE Certificate_Requests ADD COLUMN occupation VARCHAR(255) NULL',
    'SELECT "Column occupation already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set default values for existing records
UPDATE Certificate_Requests 
SET occupation = CASE 
    WHEN job_title IS NOT NULL AND job_title != '' THEN job_title
    WHEN department IS NOT NULL AND department != '' THEN CONCAT(department, ' - Specialist')
    ELSE 'Not Specified'
END 
WHERE occupation IS NULL;

-- Task 2.3: Add Missing Fields to Delegation Requests
-- Current Issue: API expects 'reference_number' and 'request_date'

-- Check and add reference_number
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nora_database' 
    AND TABLE_NAME = 'Delegation_Requests' 
    AND COLUMN_NAME = 'reference_number'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE Delegation_Requests ADD COLUMN reference_number VARCHAR(100) NULL',
    'SELECT "Column reference_number already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add request_date
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nora_database' 
    AND TABLE_NAME = 'Delegation_Requests' 
    AND COLUMN_NAME = 'request_date'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE Delegation_Requests ADD COLUMN request_date DATE NULL',
    'SELECT "Column request_date already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Generate reference numbers for existing records
UPDATE Delegation_Requests 
SET reference_number = CONCAT('DEL-', YEAR(COALESCE(created_at, CURDATE())), '-', LPAD(id, 6, '0')),
    request_date = COALESCE(created_at, CURDATE())
WHERE reference_number IS NULL;

-- =============================================================================
-- DAY 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Add composite indexes for status history tables
ALTER TABLE assignment_status_history 
ADD INDEX IF NOT EXISTS idx_assignment_status (assignment_id, status),
ADD INDEX IF NOT EXISTS idx_changed_by_date (changed_by, changed_at);

ALTER TABLE assignment_termination_status_history
ADD INDEX IF NOT EXISTS idx_termination_status (termination_id, status),
ADD INDEX IF NOT EXISTS idx_changed_by_date (changed_by, changed_at);

-- Add indexes to modified tables for better query performance
ALTER TABLE Experience_Certificate_Requests
ADD INDEX IF NOT EXISTS idx_job_title (job_title),
ADD INDEX IF NOT EXISTS idx_employee_name (employee_name);

ALTER TABLE Certificate_Requests  
ADD INDEX IF NOT EXISTS idx_occupation (occupation),
ADD INDEX IF NOT EXISTS idx_employee_name (employee_name);

ALTER TABLE Delegation_Requests
ADD INDEX IF NOT EXISTS idx_reference_number (reference_number),
ADD INDEX IF NOT EXISTS idx_request_date (request_date);

-- =============================================================================
-- DAY 3: POPULATE INITIAL STATUS HISTORY RECORDS
-- =============================================================================

-- Create initial status history records for existing assignment requests
INSERT INTO assignment_status_history (assignment_id, status, changed_by, changed_at, notes)
SELECT 
    ar.id,
    COALESCE(ar.status, 'قيد الاعتماد') as status,
    COALESCE(ar.created_by, 1) as changed_by,
    COALESCE(ar.created_at, NOW()) as changed_at,
    'Initial status created during Sprint 1 database migration' as notes
FROM Assignment_Requests ar
LEFT JOIN assignment_status_history ash ON ar.id = ash.assignment_id
WHERE ash.id IS NULL;

-- Create initial status history records for existing termination requests
INSERT INTO assignment_termination_status_history (termination_id, status, changed_by, changed_at, notes)
SELECT 
    atr.id,
    COALESCE(atr.status, 'قيد الاعتماد') as status,
    COALESCE(atr.created_by, 1) as changed_by,
    COALESCE(atr.created_at, NOW()) as changed_at,
    'Initial status created during Sprint 1 database migration' as notes
FROM Assignment_Termination_Requests atr
LEFT JOIN assignment_termination_status_history atsh ON atr.id = atsh.termination_id  
WHERE atsh.id IS NULL;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

