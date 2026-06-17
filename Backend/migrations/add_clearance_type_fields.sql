-- Migration: Add clearance_type and specific_reason columns to Clearance_Requests table
-- Date: 2025-01-XX
-- Description: Adds support for clearance type (end_of_service / end_mid_service) and specific reason codes

-- Check if columns already exist before adding
SET @db_name = DATABASE();

-- Add clearance_type column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'clearance_type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN clearance_type ENUM(''end_of_service'', ''end_mid_service'') NULL COMMENT ''Type of clearance: end of service or end mid service'' AFTER last_work_day',
  'SELECT ''Column clearance_type already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add specific_reason column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'specific_reason'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN specific_reason VARCHAR(100) NULL COMMENT ''Specific reason code (e.g., retirement, due_to_assignment)'' AFTER clearance_type',
  'SELECT ''Column specific_reason already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index on clearance_type for faster filtering
SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND INDEX_NAME = 'idx_clearance_type'
);

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_clearance_type ON Clearance_Requests(clearance_type)',
  'SELECT ''Index idx_clearance_type already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed: Added clearance_type and specific_reason columns to Clearance_Requests' AS result;

