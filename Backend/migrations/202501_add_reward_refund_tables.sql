-- Migration: Add Reward/Refund Request Tables
-- Date: 2025-01-16
-- Description: Tables for managing end of service rewards and vacation refund requests

-- Main Reward/Refund Requests Table
CREATE TABLE IF NOT EXISTS Reward_Refund_Requests (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Employee Information
  employee_id INT NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(50),
  
  -- Request Details
  name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  position VARCHAR(255) NOT NULL,
  contract_type VARCHAR(100) NOT NULL,
  job_no VARCHAR(50) NOT NULL,
  work_start DATE NOT NULL,
  record_no VARCHAR(50) NOT NULL,
  contract_end DATE NOT NULL,
  department VARCHAR(255) NOT NULL,
  
  -- Request Type Flags
  opt_end_service BOOLEAN DEFAULT FALSE,
  opt_vacation_refund BOOLEAN DEFAULT FALSE,
  requested_rewards JSON,
  
  -- Request Date
  request_date DATE NOT NULL,
  
  -- Signatures
  employee_signature VARCHAR(255),
  employee_sign_date DATE,
  
  -- HR Decisions
  employee_decision ENUM('eligible', 'not_eligible') DEFAULT 'eligible',
  hr_decision ENUM('eligible', 'not_eligible') DEFAULT 'eligible',
  non_eligibility_reason TEXT,
  
  -- Service Type
  service_type VARCHAR(100),
  
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
  INDEX idx_name (name),
  INDEX idx_status (status),
  INDEX idx_approval_stage (approval_stage),
  INDEX idx_request_date (request_date),
  INDEX idx_created_at (created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status History Table
CREATE TABLE IF NOT EXISTS Reward_Refund_Status_History (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  change_notes TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES Reward_Refund_Requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
  
  INDEX idx_request_id (request_id),
  INDEX idx_changed_at (changed_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Reward/Refund Request tables created successfully' AS Status;

