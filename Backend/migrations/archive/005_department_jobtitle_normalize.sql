-- Normalize Departments and Job_Titles names (idempotent)
SET NAMES utf8mb4;

-- Add normalized columns if not exists
SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'Departments' AND column_name = 'name_norm'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE Departments ADD COLUMN name_norm VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'Job_Titles' AND column_name = 'name_norm'
);
SET @sql := IF(@exists = 0, 'ALTER TABLE Job_Titles ADD COLUMN name_norm VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Populate normalized values (lowercase, trimmed, collapse spaces)
UPDATE Departments
SET name_norm = LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS(' ', name_en, name_ar)), ' +', ' '))
WHERE name_norm IS NULL OR name_norm = '';

UPDATE Job_Titles
SET name_norm = LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS(' ', title_en, title_ar)), ' +', ' '))
WHERE name_norm IS NULL OR name_norm = '';

-- Add indexes if not exist
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Departments' AND index_name = 'idx_dept_name_norm'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_dept_name_norm ON Departments (name_norm)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Job_Titles' AND index_name = 'idx_job_title_name_norm'
);
SET @sql := IF(@exists = 0, 'CREATE INDEX idx_job_title_name_norm ON Job_Titles (name_norm)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Optional unique enforcement (apply after dedupe approved)
-- The following commented block shows adding UNIQUE if not exists:
-- SET @exists := (
--   SELECT COUNT(*) FROM information_schema.statistics
--   WHERE table_schema = DATABASE() AND table_name = 'Departments' AND index_name = 'uq_dept_name_norm'
-- );
-- SET @sql := IF(@exists = 0, 'ALTER TABLE Departments ADD UNIQUE KEY uq_dept_name_norm (name_norm)', 'SELECT 1');
-- PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

