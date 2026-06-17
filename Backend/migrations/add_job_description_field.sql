-- =====================================================
-- Migration: Add Job Description Field to Employees
-- Date: 2025-11-23
-- Purpose: Add job_description field to store functional job descriptions
-- =====================================================

-- Add job_description column to Employees table
ALTER TABLE Employees 
ADD COLUMN job_description TEXT NULL 
COMMENT 'Functional job description (الوصف الوظيفي)' 
AFTER job_title_id;

-- Verify the column was added
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'Employees'
  AND COLUMN_NAME = 'job_description';

-- Show sample of updated table structure
DESCRIBE Employees;

