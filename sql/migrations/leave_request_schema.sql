-- ==========================================
-- Leave Request (طلب إجازة) System
-- Created: October 28, 2025
-- ==========================================

-- Main table for leave requests (exceptional leave & student accompaniment leave)
CREATE TABLE IF NOT EXISTS Leave_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    employee_id_number VARCHAR(50),
    job_title VARCHAR(255) NOT NULL,
    appointment_date DATE,
    job_type ENUM('civil', 'self') NOT NULL DEFAULT 'civil',
    
    -- Leave type (can be multiple)
    leave_types JSON NOT NULL, -- Array of: 'exceptional', 'student'
    
    -- Request type
    request_type ENUM('new', 'extension') NOT NULL DEFAULT 'new',
    
    -- Leave details
    leave_duration VARCHAR(100) NOT NULL,
    leave_from_date DATE NOT NULL,
    leave_to_date DATE NOT NULL,
    previous_leave_duration VARCHAR(100),
    leave_reasons TEXT NOT NULL,
    
    -- Employee signature
    employee_signature_name VARCHAR(255) NOT NULL,
    employee_signature VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL,
    
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
    INDEX idx_leave_dates (leave_from_date, leave_to_date),
    INDEX idx_request_type (request_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history table for leave requests
CREATE TABLE IF NOT EXISTS Leave_Request_Status_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    change_notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Leave_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments table for leave requests
CREATE TABLE IF NOT EXISTS Leave_Request_Comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Leave_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO Leave_Requests (
    employee_id, employee_name, employee_number, employee_id_number, job_title,
    appointment_date, job_type, leave_types, request_type, leave_duration,
    leave_from_date, leave_to_date, previous_leave_duration, leave_reasons,
    employee_signature_name, employee_signature, request_date, status, approval_stage
) VALUES
(
    1, 'أحمد محمد العتيبي', '12345', '1234567890', 'ممرض',
    '2020-01-15', 'civil', '["exceptional"]', 'new', '30 يوم',
    '2025-11-01', '2025-11-30', '', 'ظروف عائلية طارئة',
    'أحمد محمد العتيبي', 'أحمد محمد العتيبي', '2025-10-28', 'submitted', 'Pending Review'
)
ON DUPLICATE KEY UPDATE id=id;

