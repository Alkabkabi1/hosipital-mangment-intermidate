-- =====================================================
-- Add Excel Additional Fields to Employees Table
-- =====================================================
-- This migration adds three fields from the Excel file:
-- 1. العمر (Age) - Can be stored or calculated from birth_date
-- 2. المجموعة (Department Category) - Organizational grouping
-- 3. الملاك الوظيفي (Staff Positioning) - Internal classification
-- =====================================================

SET @db_name = DATABASE();

-- Add age column (العمر)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'age'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN age INT NULL COMMENT "العمر - Age (can be calculated from birth_date)" AFTER birth_date',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add department_category column (المجموعة)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'department_category'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN department_category VARCHAR(100) NULL COMMENT "المجموعة - Department Category/Organizational Grouping" AFTER department_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add staff_positioning column (الملاك الوظيفي)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'staff_positioning'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN staff_positioning VARCHAR(100) NULL COMMENT "الملاك الوظيفي - Staff Positioning/Internal Classification" AFTER position',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add indexes for better query performance
-- Index on department_category for filtering
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND INDEX_NAME = 'idx_employees_department_category'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE Employees ADD INDEX idx_employees_department_category (department_category)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on staff_positioning for filtering
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND INDEX_NAME = 'idx_employees_staff_positioning'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE Employees ADD INDEX idx_employees_staff_positioning (staff_positioning)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Optional: Update existing records to calculate age from birth_date
-- Note: Age can be calculated on-the-fly using: TIMESTAMPDIFF(YEAR, birth_date, CURDATE())
-- This update will populate age for existing records that have birth_date
UPDATE Employees 
SET age = TIMESTAMPDIFF(YEAR, birth_date, CURDATE())
WHERE birth_date IS NOT NULL AND age IS NULL;

SELECT '✅ Migration completed: Added age, department_category, and staff_positioning columns to Employees table' AS Status;

