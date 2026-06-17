-- Check if Clearance_Requests table has all required columns

DESCRIBE Clearance_Requests;

-- Check specifically for multi-approval columns
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Clearance_Requests'
  AND COLUMN_NAME IN ('approval_stage', 'total_approvers', 'approved_count', 'final_decision', 'last_approval_at')
ORDER BY COLUMN_NAME;

-- Compare with Onboarding_Requests
SELECT 
    'Onboarding' AS table_name,
    COLUMN_NAME,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Onboarding_Requests'
  AND COLUMN_NAME IN ('approval_stage', 'total_approvers', 'approved_count', 'final_decision', 'last_approval_at')

UNION ALL

SELECT 
    'Clearance' AS table_name,
    COLUMN_NAME,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Clearance_Requests'
  AND COLUMN_NAME IN ('approval_stage', 'total_approvers', 'approved_count', 'final_decision', 'last_approval_at')
ORDER BY table_name, COLUMN_NAME;

-- If Clearance_Requests is missing columns, you'll see NULL or empty rows

