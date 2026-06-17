-- Add columns from Excel file (A-I) to App_Users table
-- Based on Excel structure:
-- A: اسم الموظف (name) - already exists
-- B: رقم الهوية (national_id)
-- C: الرقم الوظيفي (employee_number)
-- D: الجنسية (nationality)
-- E: القسم/الإدارة (department_name)
-- F: المسمى الوظيفي (job_title)
-- G: رقم الجوال (phone)
-- H: البريد الالكتروني (email) - already exists
-- I: نوع التوظيف (employment_type)

-- Check if columns exist before adding
SET @db_name = DATABASE();

-- Add national_id (B)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'national_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN national_id VARCHAR(50) NULL COMMENT "رقم الهوية الوطنية" AFTER username',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add employee_number (C)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'employee_number'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN employee_number VARCHAR(50) NULL COMMENT "الرقم الوظيفي" AFTER national_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add nationality (D)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'nationality'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN nationality VARCHAR(50) NULL COMMENT "الجنسية" AFTER employee_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add department_name (E)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'department_name'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN department_name VARCHAR(255) NULL COMMENT "القسم/الإدارة" AFTER nationality',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add job_title (F)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'job_title'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN job_title VARCHAR(255) NULL COMMENT "المسمى الوظيفي" AFTER department_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add phone (G)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'phone'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN phone VARCHAR(50) NULL COMMENT "رقم الجوال" AFTER job_title',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add employment_type (I)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = @db_name 
    AND TABLE_NAME = 'App_Users' 
    AND COLUMN_NAME = 'employment_type'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE App_Users ADD COLUMN employment_type VARCHAR(50) NULL COMMENT "نوع التوظيف" AFTER phone',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add indexes for better performance (MySQL doesn't support IF NOT EXISTS for indexes)
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'App_Users' 
    AND INDEX_NAME = 'idx_app_users_national_id'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_app_users_national_id ON App_Users(national_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'App_Users' 
    AND INDEX_NAME = 'idx_app_users_employee_number'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_app_users_employee_number ON App_Users(employee_number)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'App_Users' 
    AND INDEX_NAME = 'idx_app_users_phone'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_app_users_phone ON App_Users(phone)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

