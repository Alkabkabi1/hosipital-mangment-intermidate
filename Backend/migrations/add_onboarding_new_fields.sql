-- Migration: Add new fields to Onboarding_Requests table
-- Date: 2025-01-XX
-- Description: Adds comprehensive fields for the new onboarding form structure

-- Check if columns already exist before adding
SET @db_name = DATABASE();

-- Add start_date column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'start_date'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN start_date DATE NULL COMMENT ''Start date for onboarding'' AFTER request_date',
  'SELECT ''Column start_date already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add document_number column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'document_number'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN document_number VARCHAR(100) NULL COMMENT ''Document number'' AFTER start_date',
  'SELECT ''Column document_number already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add transaction_number column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'transaction_number'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN transaction_number VARCHAR(100) NULL COMMENT ''Transaction number the onboarding is based on'' AFTER document_number',
  'SELECT ''Column transaction_number already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add transaction_date column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'transaction_date'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN transaction_date DATE NULL COMMENT ''Transaction date'' AFTER transaction_number',
  'SELECT ''Column transaction_date already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add employee_status column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'employee_status'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN employee_status ENUM(''full_assignment'', ''partial_assignment'') NULL COMMENT ''Employee status: full or partial assignment'' AFTER transaction_date',
  'SELECT ''Column employee_status already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add employment_type column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'employment_type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN employment_type ENUM(''civil_service'', ''self_employment'', ''surplus_workforce'', ''locum'', ''partial_assignment'') NULL COMMENT ''Type of employment'' AFTER employee_status',
  'SELECT ''Column employment_type already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add onboarding_reason column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'onboarding_reason'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN onboarding_reason ENUM(''transfer'', ''assignment'', ''appointment'', ''secondment'', ''scholarship'') NULL COMMENT ''Reason for onboarding'' AFTER employment_type',
  'SELECT ''Column onboarding_reason already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add reason_for_job column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND COLUMN_NAME = 'reason_for_job'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Onboarding_Requests ADD COLUMN reason_for_job ENUM(''transfer'', ''assignment'', ''appointment'', ''secondment'', ''scholarship'') NULL COMMENT ''Reason for giving the job'' AFTER onboarding_reason',
  'SELECT ''Column reason_for_job already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes for faster filtering
SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND INDEX_NAME = 'idx_onboarding_employee_status'
);

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_onboarding_employee_status ON Onboarding_Requests(employee_status)',
  'SELECT ''Index idx_onboarding_employee_status already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Onboarding_Requests' 
    AND INDEX_NAME = 'idx_onboarding_employment_type'
);

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_onboarding_employment_type ON Onboarding_Requests(employment_type)',
  'SELECT ''Index idx_onboarding_employment_type already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed: Added new fields to Onboarding_Requests table' AS result;

