-- Migration: Add Saudi Airlines Ticket Request Tables
-- Date: 2025-01-16
-- Description: Tables for managing Saudi Airlines ticket requests

-- Main Airlines Ticket Requests Table
CREATE TABLE IF NOT EXISTS Saudi_Airlines_Ticket_Requests (
  -- Primary Key
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Employee Information
  employee_id INT NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(50) NOT NULL,
  
  -- Request Details
  request_date DATE NOT NULL,
  letter_hijri_date VARCHAR(50),
  department VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20),
  
  -- Travel Route
  route_origin VARCHAR(255) NOT NULL,
  route_stop1 VARCHAR(255),
  route_stop2 VARCHAR(255),
  route_return VARCHAR(255) NOT NULL,
  travel_start_date DATE NOT NULL,
  travel_class VARCHAR(100) DEFAULT 'الدرجة السياحية (المخفضة)',
  
  -- Passengers (JSON array)
  passengers JSON NOT NULL,
  
  -- Closing Details
  closing_greeting VARCHAR(255) DEFAULT 'مع أطيب تحياتي،',
  hr_director_name VARCHAR(255) DEFAULT 'أ / بدر عبيد الله العازمي',
  additional_notes TEXT,
  
  -- Service Type
  service_type VARCHAR(100) DEFAULT 'خطاب تذاكر سعودية',
  
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
  INDEX idx_employee_name (employee_name),
  INDEX idx_status (status),
  INDEX idx_approval_stage (approval_stage),
  INDEX idx_request_date (request_date),
  INDEX idx_travel_start_date (travel_start_date),
  INDEX idx_created_at (created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status History Table
CREATE TABLE IF NOT EXISTS Saudi_Airlines_Ticket_Status_History (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  change_notes TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES Saudi_Airlines_Ticket_Requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
  
  INDEX idx_request_id (request_id),
  INDEX idx_changed_at (changed_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Saudi Airlines Ticket Request tables created successfully' AS Status;

