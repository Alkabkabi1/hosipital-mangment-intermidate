-- ==========================================
-- Experience Certificate (شهادة خبرة) System
-- Created: October 26, 2025
-- ==========================================

-- Main table for experience certificate requests
CREATE TABLE IF NOT EXISTS Experience_Certificate_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason_for_leaving VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    approval_stage VARCHAR(100) DEFAULT 'Pending Review',
    
    -- Multi-approval integration
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision VARCHAR(50) DEFAULT 'pending',
    
    -- Request metadata
    request_notes TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history for audit trail
CREATE TABLE IF NOT EXISTS Experience_Certificate_Status_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    experience_certificate_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    change_note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (experience_certificate_id) REFERENCES Experience_Certificate_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    INDEX idx_certificate (experience_certificate_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update Approval_Rules and Request_Approvals ENUMs to include 'experience'
ALTER TABLE Approval_Rules 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience') NOT NULL;

ALTER TABLE Request_Approvals 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience') NOT NULL;

-- Add approval rule for experience certificates
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active)
VALUES ('experience', 'HR', 1, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

COMMIT;

