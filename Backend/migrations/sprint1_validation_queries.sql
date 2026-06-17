-- =============================================================================
-- SPRINT 1: VALIDATION QUERIES
-- =============================================================================
-- Purpose: Comprehensive validation of Sprint 1 database changes
-- Run these queries after executing the main migration
-- =============================================================================

-- =============================================================================
-- VALIDATION 1: Verify Tables Were Created
-- =============================================================================
SELECT 'TABLE_EXISTENCE_CHECK' as validation_type;
SHOW TABLES LIKE '%status_history%';

-- =============================================================================
-- VALIDATION 2: Comprehensive Structure Validation
-- =============================================================================
SELECT 'STRUCTURE_VALIDATION' as validation_type;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nora_database' 
AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- =============================================================================
-- VALIDATION 3: Foreign Key Constraint Validation
-- =============================================================================
SELECT 'FOREIGN_KEY_VALIDATION' as validation_type;
SELECT 
    kcu.TABLE_NAME,
    kcu.COLUMN_NAME,
    kcu.CONSTRAINT_NAME,
    kcu.REFERENCED_TABLE_NAME,
    kcu.REFERENCED_COLUMN_NAME,
    rc.UPDATE_RULE,
    rc.DELETE_RULE
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
WHERE kcu.TABLE_SCHEMA = 'nora_database' 
AND kcu.TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
AND kcu.REFERENCED_TABLE_NAME IS NOT NULL;

-- =============================================================================
-- VALIDATION 4: Index Validation
-- =============================================================================
SELECT 'INDEX_VALIDATION' as validation_type;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'nora_database' 
AND TABLE_NAME IN (
    'assignment_status_history', 
    'assignment_termination_status_history',
    'Experience_Certificate_Requests',
    'Certificate_Requests',
    'Delegation_Requests'
)
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- =============================================================================
-- VALIDATION 5: Column Existence Verification
-- =============================================================================
SELECT 'COLUMN_EXISTENCE_CHECK' as validation_type;
SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'nora_database' 
AND (
    (TABLE_NAME = 'Experience_Certificate_Requests' AND COLUMN_NAME IN ('position', 'job_title')) OR
    (TABLE_NAME = 'Certificate_Requests' AND COLUMN_NAME = 'occupation') OR
    (TABLE_NAME = 'Delegation_Requests' AND COLUMN_NAME IN ('reference_number', 'request_date'))
)
ORDER BY TABLE_NAME, COLUMN_NAME;

-- =============================================================================
-- VALIDATION 6: Data Migration Validation
-- =============================================================================
SELECT 'DATA_MIGRATION_VALIDATION' as validation_type;

SELECT 
    'Experience_Certificate_Requests' as table_name,
    COUNT(*) as total_rows,
    COUNT(job_title) as job_title_populated,
    COUNT(CASE WHEN job_title IS NOT NULL AND position IS NOT NULL AND job_title = position THEN 1 END) as properly_migrated,
    COUNT(CASE WHEN job_title IS NULL AND position IS NOT NULL THEN 1 END) as migration_issues
FROM Experience_Certificate_Requests
UNION ALL
SELECT 
    'Certificate_Requests' as table_name,
    COUNT(*) as total_rows,
    COUNT(occupation) as occupation_populated,
    COUNT(CASE WHEN occupation IS NOT NULL AND occupation != 'Not Specified' THEN 1 END) as meaningful_data,
    COUNT(CASE WHEN occupation IS NULL THEN 1 END) as null_values
FROM Certificate_Requests
UNION ALL
SELECT 
    'Delegation_Requests' as table_name,
    COUNT(*) as total_rows,
    COUNT(reference_number) as reference_populated,
    COUNT(CASE WHEN reference_number LIKE 'DEL-%-______' THEN 1 END) as proper_format,
    COUNT(CASE WHEN request_date IS NULL THEN 1 END) as missing_dates
FROM Delegation_Requests;

-- =============================================================================
-- VALIDATION 7: Status History Population Check
-- =============================================================================
SELECT 'STATUS_HISTORY_VALIDATION' as validation_type;

SELECT 
    'assignment_status_history' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT assignment_id) as unique_assignments,
    MIN(changed_at) as earliest_entry,
    MAX(changed_at) as latest_entry
FROM assignment_status_history
UNION ALL
SELECT 
    'assignment_termination_status_history' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT termination_id) as unique_terminations,
    MIN(changed_at) as earliest_entry,
    MAX(changed_at) as latest_entry
FROM assignment_termination_status_history;

-- =============================================================================
-- VALIDATION 8: Final Health Check (Pass/Fail Summary)
-- =============================================================================
SELECT 'FINAL_HEALTH_CHECK' as validation_type;

SELECT 
    'Database Health Check' as check_type,
    'All Tables Exist' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_SCHEMA = 'nora_database' 
              AND TABLE_NAME IN (
                'assignment_status_history',
                'assignment_termination_status_history'
              )) = 2 
        THEN 'PASS ✓' 
        ELSE 'FAIL ✗' 
    END as result
UNION ALL
SELECT 
    'Database Health Check' as check_type,
    'All Required Columns Exist' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'nora_database' 
              AND ((TABLE_NAME = 'Experience_Certificate_Requests' AND COLUMN_NAME = 'job_title') 
                   OR (TABLE_NAME = 'Certificate_Requests' AND COLUMN_NAME = 'occupation')
                   OR (TABLE_NAME = 'Delegation_Requests' AND COLUMN_NAME = 'reference_number')
                   OR (TABLE_NAME = 'Delegation_Requests' AND COLUMN_NAME = 'request_date'))) = 4
        THEN 'PASS ✓' 
        ELSE 'FAIL ✗' 
    END as result
UNION ALL
SELECT 
    'Database Health Check' as check_type,
    'Foreign Key Constraints' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
              WHERE TABLE_SCHEMA = 'nora_database' 
              AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
              AND REFERENCED_TABLE_NAME IS NOT NULL) >= 4
        THEN 'PASS ✓' 
        ELSE 'FAIL ✗' 
    END as result
UNION ALL
SELECT 
    'Database Health Check' as check_type,
    'UTF8MB4 Character Sets' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = 'nora_database' 
              AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
              AND DATA_TYPE IN ('varchar', 'text')
              AND CHARACTER_SET_NAME = 'utf8mb4') >= 4
        THEN 'PASS ✓' 
        ELSE 'FAIL ✗' 
    END as result;

-- =============================================================================
-- VALIDATION COMPLETE
-- =============================================================================

