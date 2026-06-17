-- Migration: Add document_number column to Clearance_Requests table
-- Date: 2025-01-XX
-- Description: Adds document number field to store the document number that the clearance is based on

-- Check if column already exists before adding
SET @db_name = DATABASE();

-- Add document_number column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND COLUMN_NAME = 'document_number'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Clearance_Requests ADD COLUMN document_number VARCHAR(100) NULL COMMENT ''Document number that the clearance is based on'' AFTER specific_reason',
  'SELECT ''Column document_number already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index on document_number for faster searching
SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Clearance_Requests' 
    AND INDEX_NAME = 'idx_document_number'
);

SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_document_number ON Clearance_Requests(document_number)',
  'SELECT ''Index idx_document_number already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed: Added document_number column to Clearance_Requests' AS result;

