-- ==========================================
-- Maternity Leave and Housing Allowance Requests System
-- Created: November 13, 2025
-- ==========================================

-- ==========================================
-- 1. Maternity Leave Requests Table (طلب إجازة رعاية مولود)
-- ==========================================

CREATE TABLE IF NOT EXISTS Maternity_Leave_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    employee_id_number VARCHAR(50),
    service_type VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    appointment_date DATE,
    
    -- Leave details
    request_type ENUM('new', 'extension') DEFAULT 'new',
    leave_from_date DATE NOT NULL,
    leave_to_date DATE NOT NULL,
    leave_duration INT NOT NULL,
    
    -- Employee signature and pledge
    employee_signature VARCHAR(255),
    pledge_date DATE,
    
    -- Manager approval
    approval_option ENUM('approve', 'defer') DEFAULT 'approve',
    defer_period VARCHAR(100),
    manager_name VARCHAR(255),
    manager_signature VARCHAR(255),
    
    -- Attachments (file names only)
    attach_birth_notice_name VARCHAR(255),
    attach_birth_cert_name VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    approval_stage VARCHAR(100) DEFAULT 'Pending Review',
    
    -- Multi-approval integration
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Request metadata
    request_notes TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_department (department),
    INDEX idx_approval_stage (approval_stage),
    INDEX idx_final_decision (final_decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history for audit trail
CREATE TABLE IF NOT EXISTS Maternity_Leave_Status_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    change_note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Maternity_Leave_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    INDEX idx_request (request_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. Housing Allowance Requests Table (بدل سكن أطباء سعوديين)
-- ==========================================

CREATE TABLE IF NOT EXISTS Housing_Allowance_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL DEFAULT 'سعودي',
    
    -- Letter details
    letter_date DATE NOT NULL,
    hijri_date VARCHAR(100),
    housing_director VARCHAR(255),
    
    -- Period and allowance details
    period_start DATE,
    period_end DATE,
    social_status VARCHAR(100),
    allowance_reason VARCHAR(500),
    
    -- Administrative notes
    housing_manager_note TEXT,
    finance_note TEXT,
    finance_name VARCHAR(255),
    hr_director VARCHAR(255),
    employee_notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    approval_stage VARCHAR(100) DEFAULT 'Pending Review',
    
    -- Multi-approval integration
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Request metadata
    request_notes TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_employee (employee_id),
    INDEX idx_employee_number (employee_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_department (department),
    INDEX idx_approval_stage (approval_stage),
    INDEX idx_final_decision (final_decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history for audit trail
CREATE TABLE IF NOT EXISTS Housing_Allowance_Status_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    change_note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Housing_Allowance_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    INDEX idx_request (request_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. Update Multi-Approval System Integration
-- ==========================================

-- Add new request types to Request_Approvals table
ALTER TABLE Request_Approvals 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer', 'maternity_leave', 'housing_allowance') NOT NULL;

-- Add new request types to Approval_Rules table
ALTER TABLE Approval_Rules 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer', 'maternity_leave', 'housing_allowance') NOT NULL;

-- Add approval rules for Maternity Leave requests
-- Maternity leave requires HR and Manager approval
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('maternity_leave', 'HR', 1, TRUE, TRUE),
('maternity_leave', 'MANAGER', 2, TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- Add approval rules for Housing Allowance requests
-- Housing allowance requires HR, Finance, and Manager approval
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('housing_allowance', 'HR', 1, TRUE, TRUE),
('housing_allowance', 'FINANCE', 2, TRUE, TRUE),
('housing_allowance', 'MANAGER', 3, TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
