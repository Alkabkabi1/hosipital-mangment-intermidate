-- =====================================================
-- Migration: Create Employee Job Descriptions Table
-- Purpose: Allow employees to submit job descriptions for approval
-- Similar to certificates and licenses system
-- =====================================================

-- Drop old job_description column if exists
ALTER TABLE Employees DROP COLUMN IF EXISTS job_description;

-- Create Employee_Job_Descriptions table
CREATE TABLE IF NOT EXISTS Employee_Job_Descriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  job_description TEXT NOT NULL COMMENT 'The functional job description',
  submission_notes TEXT NULL COMMENT 'Notes from employee when submitting',
  verified TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether admin has approved it',
  verified_by INT NULL COMMENT 'Admin user ID who verified',
  verified_at TIMESTAMP NULL COMMENT 'When it was verified',
  rejection_reason TEXT NULL COMMENT 'Reason if rejected',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_employee_job_desc_employee (employee_id),
  KEY idx_employee_job_desc_verified (verified),
  CONSTRAINT fk_employee_job_desc_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_employee_job_desc_verified_by FOREIGN KEY (verified_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing job_description data if table exists
-- INSERT INTO Employee_Job_Descriptions (employee_id, job_description, verified, verified_at)
-- SELECT employee_id, job_description, 1, NOW()
-- FROM Employees 
-- WHERE job_description IS NOT NULL AND job_description != '';

SELECT 'Employee_Job_Descriptions table created successfully' AS status;

