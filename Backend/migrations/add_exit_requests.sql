-- ==========================================
-- Exit Request (طلب إنهاء العمل) System
-- Created: October 27, 2025
-- ==========================================

-- Main table for exit requests
CREATE TABLE IF NOT EXISTS Exit_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    employee_id_number VARCHAR(50),
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    supervisor_name VARCHAR(255),
    mobile_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Open-ended questions
    exit_reasons TEXT,
    work_environment TEXT,
    manager_relationship TEXT,
    coworker_relationship TEXT,
    suggestions TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    approval_stage VARCHAR(100) DEFAULT 'Pending Review',
    
    -- Multi-approval integration
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision VARCHAR(50) DEFAULT 'pending',
    
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
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history for audit trail
CREATE TABLE IF NOT EXISTS Exit_Request_Status_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Exit_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

