-- =====================================================
-- Add Complete Excel Fields to Employees Table
-- =====================================================
-- This migration adds all missing fields from the Excel file
-- Based on Excel row structure analysis
-- =====================================================

SET @db_name = DATABASE();

-- Add job_category_detail column (موظف الباب الأول)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'job_category_detail'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN job_category_detail VARCHAR(150) NULL COMMENT "موظف الباب الأول - Job Category Detail/Classification" AFTER job_title_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add worker_type column (عامل)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'worker_type'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN worker_type VARCHAR(100) NULL COMMENT "عامل - Worker Type/Classification" AFTER contract_start_date',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add worker_classification column (second عامل field)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'worker_classification'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN worker_classification VARCHAR(100) NULL COMMENT "تصنيف العامل - Worker Classification" AFTER worker_type',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add manager/supervisor information
-- Manager Name (مسير)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'manager_name'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN manager_name VARCHAR(255) NULL COMMENT "اسم المدير/المسير - Manager/Supervisor Name" AFTER worker_classification',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Manager Organization (مسير تجمع مكة المكرمة الصحي)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'manager_organization'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN manager_organization VARCHAR(255) NULL COMMENT "منظمة المدير - Manager Organization" AFTER manager_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Manager National ID
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'manager_national_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN manager_national_id VARCHAR(50) NULL COMMENT "رقم هوية المدير - Manager National ID" AFTER manager_organization',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Manager Email
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'manager_email'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN manager_email VARCHAR(255) NULL COMMENT "بريد المدير - Manager Email" AFTER manager_national_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Manager Phone
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND COLUMN_NAME = 'manager_phone'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE Employees ADD COLUMN manager_phone VARCHAR(32) NULL COMMENT "هاتف المدير - Manager Phone" AFTER manager_email',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add indexes for better query performance
-- Index on manager fields for filtering
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND INDEX_NAME = 'idx_employees_manager'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE Employees ADD INDEX idx_employees_manager (manager_national_id, manager_email)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on worker classification
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'Employees' 
    AND INDEX_NAME = 'idx_employees_worker_classification'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE Employees ADD INDEX idx_employees_worker_classification (worker_type, worker_classification)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ Migration completed: Added all Excel fields to Employees table' AS Status;

