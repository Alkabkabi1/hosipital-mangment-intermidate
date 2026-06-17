-- ==========================================
-- Assignment Request Forms System
-- Created: November 9, 2025
-- ==========================================
-- Creates 3 new request types:
-- 1. Assignment (قرار تكليف)
-- 2. Assignment Termination (إنهاء تكليف)
-- 3. Internal Transfer (نقل داخلي)

-- ==========================================
-- 1. Assignment Requests Table (قرار تكليف)
-- ==========================================

CREATE TABLE IF NOT EXISTS Assignment_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    national_id VARCHAR(50),
    
    -- Current position info
    current_department VARCHAR(100),
    current_position VARCHAR(255),
    current_location VARCHAR(100),
    
    -- Assignment details
    assignment_type ENUM('temporary', 'permanent', 'project_based', 'acting') DEFAULT 'temporary',
    new_role VARCHAR(255) NOT NULL,
    new_department VARCHAR(100),
    assignment_reason TEXT NOT NULL,
    
    -- Duration
    start_date DATE NOT NULL,
    end_date DATE,
    expected_duration VARCHAR(50),
    
    -- Additional info
    additional_benefits TEXT,
    financial_impact VARCHAR(100),
    requires_relocation BOOLEAN DEFAULT FALSE,
    request_notes TEXT,
    
    -- Multi-approval columns
    status VARCHAR(50) DEFAULT 'submitted',
    approval_stage VARCHAR(50) DEFAULT 'Pending Review',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    admin_notes TEXT,
    rejection_reason TEXT,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_final_decision (final_decision),
    INDEX idx_approval_stage (approval_stage),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. Assignment Termination Requests (إنهاء تكليف)
-- ==========================================

CREATE TABLE IF NOT EXISTS Assignment_Termination_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    national_id VARCHAR(50),
    
    -- Assignment info being terminated
    original_assignment_id INT,
    assignment_role VARCHAR(255) NOT NULL,
    assignment_department VARCHAR(100),
    assignment_start_date DATE,
    
    -- Termination details
    termination_reason TEXT NOT NULL,
    termination_date DATE NOT NULL,
    early_termination BOOLEAN DEFAULT FALSE,
    
    -- Return to position
    return_to_department VARCHAR(100),
    return_to_position VARCHAR(255),
    return_date DATE,
    
    -- Performance/evaluation
    assignment_performance TEXT,
    lessons_learned TEXT,
    request_notes TEXT,
    
    -- Multi-approval columns
    status VARCHAR(50) DEFAULT 'submitted',
    approval_stage VARCHAR(50) DEFAULT 'Pending Review',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    admin_notes TEXT,
    rejection_reason TEXT,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_final_decision (final_decision),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. Internal Transfer Requests (نقل داخلي)
-- ==========================================

CREATE TABLE IF NOT EXISTS Internal_Transfer_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    national_id VARCHAR(50),
    
    -- Current position
    current_department VARCHAR(100) NOT NULL,
    current_position VARCHAR(255) NOT NULL,
    current_location VARCHAR(100),
    hire_date DATE,
    years_of_service VARCHAR(20),
    
    -- Transfer to
    target_department VARCHAR(100) NOT NULL,
    target_position VARCHAR(255) NOT NULL,
    target_location VARCHAR(100),
    
    -- Transfer details
    transfer_type ENUM('permanent', 'temporary', 'secondment') DEFAULT 'permanent',
    transfer_reason TEXT NOT NULL,
    effective_date DATE NOT NULL,
    return_date DATE,
    
    -- Impact assessment
    skills_match TEXT,
    training_needed TEXT,
    budget_impact VARCHAR(100),
    requires_relocation BOOLEAN DEFAULT FALSE,
    relocation_support_needed BOOLEAN DEFAULT FALSE,
    
    -- Stakeholder approval
    current_manager_approved BOOLEAN DEFAULT FALSE,
    target_manager_approved BOOLEAN DEFAULT FALSE,
    request_notes TEXT,
    
    -- Multi-approval columns
    status VARCHAR(50) DEFAULT 'submitted',
    approval_stage VARCHAR(50) DEFAULT 'Pending Review',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    admin_notes TEXT,
    rejection_reason TEXT,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_final_decision (final_decision),
    INDEX idx_departments (current_department, target_department),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. Status History Tables (Audit Trail)
-- ==========================================

CREATE TABLE IF NOT EXISTS Assignment_Status_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Assignment_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Assignment_Termination_Status_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Assignment_Termination_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Internal_Transfer_Status_History (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES Internal_Transfer_Requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. Update ENUM Types for Multi-Approval
-- ==========================================

-- Add new request types to Request_Approvals
ALTER TABLE Request_Approvals 
MODIFY COLUMN request_type ENUM(
  'clearance', 'onboarding', 'delegation', 'direct', 
  'certificate', 'experience', 'leave', 'exit',
  'assignment', 'assignment_termination', 'internal_transfer'
) NOT NULL;

-- Add new request types to Approval_Rules
ALTER TABLE Approval_Rules 
MODIFY COLUMN request_type ENUM(
  'clearance', 'onboarding', 'delegation', 'direct', 
  'certificate', 'experience', 'leave', 'exit',
  'assignment', 'assignment_termination', 'internal_transfer'
) NOT NULL;

-- ==========================================
-- 6. Add Approval Rules
-- ==========================================

-- Assignment requires HR + MANAGER + ADMIN (3-level approval - critical decision)
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('assignment', 'HR', 1, TRUE, TRUE),
('assignment', 'MANAGER', 2, TRUE, TRUE),
('assignment', 'ADMIN', 3, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;

-- Assignment Termination requires HR + MANAGER (2-level approval)
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('assignment_termination', 'HR', 1, TRUE, TRUE),
('assignment_termination', 'MANAGER', 2, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;

-- Internal Transfer requires HR + MANAGER + ADMIN (3-level - affects org structure)
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('internal_transfer', 'HR', 1, TRUE, TRUE),
('internal_transfer', 'MANAGER', 2, TRUE, TRUE),
('internal_transfer', 'ADMIN', 3, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE, updated_at = CURRENT_TIMESTAMP;

-- ==========================================
-- 7. Update Stored Procedures
-- ==========================================

-- Update SP_Recalculate_Request_Approvals to include new types
-- (Already handles dynamic table names via CASE statement)

-- Update SP_Find_Stuck_Requests to include new tables
DROP PROCEDURE IF EXISTS SP_Find_Stuck_Requests;

DELIMITER $$

CREATE PROCEDURE SP_Find_Stuck_Requests()
BEGIN
  SELECT 
    'clearance' as request_type, cr.id as request_id, cr.status,
    cr.total_approvers, cr.approved_count,
    COUNT(ra.approval_id) as actual_total,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as actual_approved,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
    'Mismatch in approver counts' as issue
  FROM Clearance_Requests cr
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = cr.id
  WHERE cr.final_decision = 'pending' AND cr.status NOT IN ('مكتمل', 'مرفوض')
  GROUP BY cr.id
  HAVING cr.total_approvers != actual_total OR cr.approved_count != actual_approved OR (actual_pending = 0 AND cr.approved_count < cr.total_approvers)
  
  UNION ALL SELECT 'onboarding', ob.id, ob.status, ob.total_approvers, ob.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Onboarding_Requests ob
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'onboarding' AND ra.request_id = ob.id
  WHERE ob.final_decision = 'pending' AND ob.status NOT IN ('مكتمل', 'مرفوض')
  GROUP BY ob.id HAVING ob.total_approvers != COUNT(ra.approval_id) OR ob.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  UNION ALL SELECT 'delegation', dr.id, dr.status, dr.total_approvers, dr.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Delegation_Requests dr
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'delegation' AND ra.request_id = dr.id
  WHERE dr.final_decision = 'pending' AND dr.status NOT IN ('مكتمل', 'مرفوض')
  GROUP BY dr.id HAVING dr.total_approvers != COUNT(ra.approval_id) OR dr.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  UNION ALL SELECT 'certificate', cr.id, cr.status, cr.total_approvers, cr.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Certificate_Requests cr
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'certificate' AND ra.request_id = cr.id
  WHERE cr.final_decision = 'pending' AND cr.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY cr.id HAVING cr.total_approvers != COUNT(ra.approval_id) OR cr.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  UNION ALL SELECT 'experience', er.id, er.status, er.total_approvers, er.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Experience_Certificate_Requests er
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'experience' AND ra.request_id = er.id
  WHERE er.final_decision = 'pending' AND er.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY er.id HAVING er.total_approvers != COUNT(ra.approval_id) OR er.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  UNION ALL SELECT 'leave', lv.id, lv.status, lv.total_approvers, lv.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Leave_Requests lv
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'leave' AND ra.request_id = lv.id
  WHERE lv.final_decision = 'pending' AND lv.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY lv.id HAVING lv.total_approvers != COUNT(ra.approval_id) OR lv.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  UNION ALL SELECT 'exit', ex.id, ex.status, ex.total_approvers, ex.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Exit_Requests ex
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'exit' AND ra.request_id = ex.id
  WHERE ex.final_decision = 'pending' AND ex.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY ex.id HAVING ex.total_approvers != COUNT(ra.approval_id) OR ex.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  -- NEW: Assignment requests
  UNION ALL SELECT 'assignment', ar.id, ar.status, ar.total_approvers, ar.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Assignment_Requests ar
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'assignment' AND ra.request_id = ar.id
  WHERE ar.final_decision = 'pending' AND ar.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY ar.id HAVING ar.total_approvers != COUNT(ra.approval_id) OR ar.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  -- NEW: Assignment Termination requests
  UNION ALL SELECT 'assignment_termination', at.id, at.status, at.total_approvers, at.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Assignment_Termination_Requests at
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'assignment_termination' AND ra.request_id = at.id
  WHERE at.final_decision = 'pending' AND at.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY at.id HAVING at.total_approvers != COUNT(ra.approval_id) OR at.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END)
  
  -- NEW: Internal Transfer requests
  UNION ALL SELECT 'internal_transfer', it.id, it.status, it.total_approvers, it.approved_count,
    COUNT(ra.approval_id), SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END),
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END), 'Mismatch in approver counts'
  FROM Internal_Transfer_Requests it
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'internal_transfer' AND ra.request_id = it.id
  WHERE it.final_decision = 'pending' AND it.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY it.id HAVING it.total_approvers != COUNT(ra.approval_id) OR it.approved_count != SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END);
END$$

DELIMITER ;

-- Grant permissions
GRANT EXECUTE ON PROCEDURE nora_database.SP_Find_Stuck_Requests TO 'nora'@'localhost';

-- ==========================================
-- Success Message
-- ==========================================

SELECT '✅ Assignment Request Forms Created Successfully!' AS Status,
       '3 new tables created: Assignment, Assignment_Termination, Internal_Transfer' AS Info,
       'Multi-approval support integrated with HR + MANAGER + ADMIN workflow' AS Details;

