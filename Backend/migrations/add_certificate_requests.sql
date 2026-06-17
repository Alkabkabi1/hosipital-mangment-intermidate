-- ==========================================
-- Certificate of Identification (شهادة تعريف) System
-- Created: October 26, 2025
-- ==========================================

-- Main table for certificate requests
CREATE TABLE IF NOT EXISTS Certificate_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    occupation VARCHAR(255) NOT NULL,
    iqama_number VARCHAR(50),
    passport_number VARCHAR(50),
    nationality VARCHAR(100) NOT NULL,
    
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
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Status history for audit trail
CREATE TABLE IF NOT EXISTS Certificate_Status_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    change_note TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (certificate_id) REFERENCES Certificate_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    INDEX idx_certificate (certificate_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- First, alter the Approval_Rules table to add 'certificate' to the ENUM
-- Check if request_type is ENUM and modify it
ALTER TABLE Approval_Rules 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate') NOT NULL;

-- Now add approval rule for certificates
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active)
VALUES ('certificate', 'HR', 1, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- Optional: Add more approval roles as needed
-- INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active)
-- VALUES ('certificate', 'MANAGER', 2, TRUE, TRUE)
-- ON DUPLICATE KEY UPDATE is_active = TRUE;

COMMIT;

