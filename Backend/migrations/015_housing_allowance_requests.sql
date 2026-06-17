-- Housing Allowance Requests Table (بدل سكن أطباء سعوديين)
-- Migration: 015_housing_allowance_requests.sql

CREATE TABLE IF NOT EXISTS Housing_Allowance_Requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(50),
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  nationality VARCHAR(100) DEFAULT 'سعودي',
  
  -- Letter details
  letter_date DATE NOT NULL,
  hijri_date VARCHAR(50),
  housing_director VARCHAR(255),
  
  -- Period details
  period_start DATE,
  period_end DATE,
  
  -- Additional information
  social_status VARCHAR(100),
  allowance_reason TEXT,
  
  -- Notes from various parties
  housing_manager_note TEXT,
  finance_note TEXT,
  finance_name VARCHAR(255),
  hr_director VARCHAR(255),
  employee_notes TEXT,
  
  -- Status and approval tracking
  status VARCHAR(50) DEFAULT 'submitted',
  approval_stage VARCHAR(100),
  total_approvers INT DEFAULT 0,
  approved_count INT DEFAULT 0,
  final_decision VARCHAR(50) DEFAULT 'pending',
  
  -- Administrative fields
  request_notes TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Audit fields
  approved_by INT,
  approved_at DATETIME,
  rejected_by INT,
  rejected_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  
  -- Foreign keys
  FOREIGN KEY (employee_id) REFERENCES App_Users(id),
  FOREIGN KEY (approved_by) REFERENCES App_Users(id),
  FOREIGN KEY (rejected_by) REFERENCES App_Users(id),
  
  -- Indexes for performance
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_approval_stage (approval_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Housing Allowance Status History Table
CREATE TABLE IF NOT EXISTS Housing_Allowance_Status_History (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  change_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (request_id) REFERENCES Housing_Allowance_Requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES App_Users(id),
  
  -- Indexes
  INDEX idx_request_id (request_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add reference_number column for tracking
ALTER TABLE Housing_Allowance_Requests 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50) UNIQUE AFTER id;

-- Add request_date column for consistency with other request tables
ALTER TABLE Housing_Allowance_Requests
ADD COLUMN IF NOT EXISTS request_date DATE AFTER letter_date;

-- Create trigger to auto-generate reference numbers
DELIMITER $$

DROP TRIGGER IF EXISTS housing_allowance_reference_number$$

CREATE TRIGGER housing_allowance_reference_number
BEFORE INSERT ON Housing_Allowance_Requests
FOR EACH ROW
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    SET NEW.reference_number = CONCAT('HA-', LPAD(NEW.id, 6, '0'));
  END IF;
  
  IF NEW.request_date IS NULL THEN
    SET NEW.request_date = NEW.letter_date;
  END IF;
  
  IF NEW.submitted_at IS NULL THEN
    SET NEW.submitted_at = NOW();
  END IF;
END$$

DELIMITER ;

-- Insert initial test data (optional - remove in production)
-- This helps verify the table structure works correctly
INSERT INTO Housing_Allowance_Requests 
  (employee_id, employee_name, employee_number, job_title, department, nationality, letter_date, status)
SELECT 
  id, 
  CONCAT(name, ' (Test)'), 
  CONCAT('EMP', id), 
  'طبيب استشاري', 
  'الطوارئ', 
  'سعودي', 
  CURDATE(), 
  'قيد الاعتماد'
FROM App_Users 
WHERE role = 'employee' 
LIMIT 0;  -- Set to 1 to insert test data, 0 to skip

-- Verify table creation
SELECT 
  TABLE_NAME, 
  TABLE_ROWS, 
  CREATE_TIME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('Housing_Allowance_Requests', 'Housing_Allowance_Status_History');

