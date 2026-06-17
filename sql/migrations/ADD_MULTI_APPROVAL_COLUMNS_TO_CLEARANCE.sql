-- Add multi-approval columns to Clearance_Requests table
-- (These columns already exist in Onboarding_Requests)

-- Check if columns exist first
SET @db_name = DATABASE();

-- Add approval_stage column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'approval_stage'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN approval_stage VARCHAR(50) DEFAULT ''pending'' COMMENT ''Current approval stage''',
  'SELECT ''Column approval_stage already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add total_approvers column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'total_approvers'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN total_approvers INT DEFAULT 0 COMMENT ''Total number of required approvers''',
  'SELECT ''Column total_approvers already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approved_count column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'approved_count'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN approved_count INT DEFAULT 0 COMMENT ''Number of approvals received''',
  'SELECT ''Column approved_count already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add final_decision column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'final_decision'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN final_decision ENUM(''pending'', ''approved'', ''rejected'') DEFAULT ''pending''',
  'SELECT ''Column final_decision already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_approval_at column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'last_approval_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN last_approval_at TIMESTAMP NULL COMMENT ''Last approval timestamp''',
  'SELECT ''Column last_approval_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify all columns were added
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Clearance_Requests'
  AND COLUMN_NAME IN ('approval_stage', 'total_approvers', 'approved_count', 'final_decision', 'last_approval_at')
ORDER BY COLUMN_NAME;

