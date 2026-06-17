-- =============================================================================
-- SPRINT 1: FIX REMAINING ISSUES
-- =============================================================================
-- Purpose: Fix the issues identified in the validation
-- =============================================================================

-- Fix 1: Add request_date to Delegation_Requests if missing
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nora_database' 
    AND TABLE_NAME = 'delegation_requests' 
    AND COLUMN_NAME = 'request_date'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE delegation_requests ADD COLUMN request_date DATE NULL',
    'SELECT "Column request_date already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate request_date for existing records
UPDATE delegation_requests 
SET request_date = COALESCE(created_at, CURDATE())
WHERE request_date IS NULL;

-- Fix 2: Create composite indexes (without IF NOT EXISTS syntax)
-- For assignment_status_history
CREATE INDEX IF NOT EXISTS idx_assignment_status ON assignment_status_history (assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_changed_by_date_ash ON assignment_status_history (changed_by, changed_at);

-- For assignment_termination_status_history  
CREATE INDEX IF NOT EXISTS idx_termination_status ON assignment_termination_status_history (termination_id, status);
CREATE INDEX IF NOT EXISTS idx_changed_by_date_atsh ON assignment_termination_status_history (changed_by, changed_at);

-- For Experience_Certificate_Requests
CREATE INDEX IF NOT EXISTS idx_job_title ON experience_certificate_requests (job_title);
CREATE INDEX IF NOT EXISTS idx_employee_name_exp ON experience_certificate_requests (employee_name);

-- For Certificate_Requests  
CREATE INDEX IF NOT EXISTS idx_occupation ON certificate_requests (occupation);
CREATE INDEX IF NOT EXISTS idx_employee_name_cert ON certificate_requests (employee_name);

-- For Delegation_Requests
CREATE INDEX IF NOT EXISTS idx_reference_number ON delegation_requests (reference_number);
CREATE INDEX IF NOT EXISTS idx_request_date ON delegation_requests (request_date);

-- =============================================================================
-- VALIDATION: Check all required columns exist
-- =============================================================================
SELECT 
    'COLUMN_CHECK' as validation_type,
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nora_database' 
AND (
    (TABLE_NAME = 'experience_certificate_requests' AND COLUMN_NAME IN ('position', 'job_title')) OR
    (TABLE_NAME = 'certificate_requests' AND COLUMN_NAME = 'occupation') OR
    (TABLE_NAME = 'delegation_requests' AND COLUMN_NAME IN ('reference_number', 'request_date'))
)
ORDER BY TABLE_NAME, COLUMN_NAME;

