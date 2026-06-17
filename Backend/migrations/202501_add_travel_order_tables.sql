-- Migration: Add Non-Saudi Travel Order Request Tables
-- Date: 2025-01-16
-- Description: Tables for managing travel order requests for non-Saudi contractors

-- Main Travel Order Requests Table
CREATE TABLE IF NOT EXISTS NonSaudi_Travel_Order_Requests (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Employee Information
  employee_id INT NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(50),
  
  -- Contractor Details
  contractor_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  iqama_number VARCHAR(50) NOT NULL,
  passport_number VARCHAR(50) NOT NULL,
  contact_number VARCHAR(20),
  travel_destination VARCHAR(500) NOT NULL,
  
  -- Work Period
  work_start_date DATE NOT NULL,
  work_end_date DATE NOT NULL,
  work_duration_days INT,
  
  -- Dependents Period
  dependents_start_date DATE,
  dependents_end_date DATE,
  dependents_duration_days INT,
  
  -- Dependents Data (JSON array)
  dependents JSON,
  
  -- Sponsor/Commitment Information
  sponsor_name VARCHAR(255) NOT NULL,
  sponsor_id VARCHAR(50),
  sponsor_commitment TEXT,
  sponsor_signature VARCHAR(255),
  sponsor_signature_date DATE,
  
  -- Director Approval
  director_signature VARCHAR(255),
  director_notes TEXT,
  
  -- HR Checklist
  checklist JSON,
  
  -- HR Officer Details
  hr_officer_name VARCHAR(255),
  hr_officer_signature VARCHAR(255),
  hr_officer_stamp VARCHAR(255),
  
  -- HR Manager Details
  hr_manager_name VARCHAR(255),
  hr_manager_signature VARCHAR(255),
  hr_manager_stamp VARCHAR(255),
  
  -- Approval Status Fields (Required for Multi-Approval)
  status VARCHAR(50) DEFAULT 'submitted',
  approval_stage VARCHAR(100) DEFAULT 'Pending Review',
  final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_count INT DEFAULT 0,
  total_approvers INT DEFAULT 0,
  
  -- Admin Fields
  admin_notes TEXT,
  rejection_reason TEXT,
  completion_notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  -- Foreign Keys
  FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_employee_id (employee_id),
  INDEX idx_contractor_name (contractor_name),
  INDEX idx_status (status),
  INDEX idx_approval_stage (approval_stage),
  INDEX idx_created_at (created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status History Table
CREATE TABLE IF NOT EXISTS NonSaudi_Travel_Order_Status_History (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  change_notes TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES NonSaudi_Travel_Order_Requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
  
  INDEX idx_request_id (request_id),
  INDEX idx_changed_at (changed_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing (optional)
-- You can remove this section in production

-- Success message
SELECT 'NonSaudi Travel Order tables created successfully' AS Status;

