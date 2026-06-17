-- =====================================================
-- REMAINING REQUEST TYPES - UNIFIED SCHEMA COMPLETION
-- =====================================================
-- Completes the unified schema with remaining request types
-- Adds multi-approval support to all existing single-implementation types
-- Ensures consistent structure across all 11 request types
-- =====================================================

-- =====================================================
-- SECTION 1: EXIT REQUESTS (ENHANCED)
-- =====================================================

CREATE TABLE IF NOT EXISTS Unified_Exit_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (standardized)
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Basic employee details from original schema
    employee_number VARCHAR(50) NULL,
    employee_id_number VARCHAR(50) NULL,
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    supervisor_name VARCHAR(255) NULL,
    mobile_number VARCHAR(20) NULL,
    
    -- Core exit request data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    
    -- Exit feedback fields (preserved from original)
    exit_reasons TEXT NULL COMMENT 'Reasons for leaving',
    work_environment TEXT NULL COMMENT 'Feedback on work environment',
    manager_relationship TEXT NULL COMMENT 'Feedback on manager relationship',
    coworker_relationship TEXT NULL COMMENT 'Feedback on coworker relationships',
    suggestions TEXT NULL COMMENT 'Suggestions for improvement',
    
    -- Approval tracking and multi-approval support
    approved_by INT NULL,
    approved_at DATETIME NULL,
    rejected_by INT NULL,
    rejected_at DATETIME NULL,
    decision_note TEXT NULL,
    approval_stage VARCHAR(50) DEFAULT 'pending',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    request_notes TEXT NULL,
    payload_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE KEY uq_exit_reference (reference_number),
    KEY idx_exit_status (status),
    KEY idx_exit_employee_id (employee_id),
    KEY idx_exit_department (department),
    KEY idx_exit_approval_stage (approval_stage),
    KEY idx_exit_created_at (created_at),
    
    -- Foreign key constraints
    CONSTRAINT fk_unified_exit_employee FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_unified_exit_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_exit_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 2: ASSIGNMENT REQUESTS (STANDARDIZED)
-- =====================================================

CREATE TABLE IF NOT EXISTS Unified_Assignment_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (standardized)
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Employee details from original schema
    employee_number VARCHAR(50) NULL,
    national_id VARCHAR(50) NULL,
    
    -- Current position information
    current_department VARCHAR(100) NULL,
    current_position VARCHAR(255) NULL,
    current_location VARCHAR(100) NULL,
    
    -- Assignment details
    assignment_type ENUM('temporary', 'permanent', 'project_based', 'acting') DEFAULT 'temporary',
    new_role VARCHAR(255) NOT NULL,
    new_department VARCHAR(100) NULL,
    assignment_reason TEXT NOT NULL,
    
    -- Duration and scheduling
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    expected_duration VARCHAR(50) NULL,
    
    -- Additional assignment information
    additional_benefits TEXT NULL,
    financial_impact VARCHAR(100) NULL,
    requires_relocation BOOLEAN DEFAULT FALSE,
    
    -- Multi-approval system (already present, ensuring consistency)
    approval_stage VARCHAR(50) DEFAULT 'pending',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    decision_note TEXT NULL,
    
    request_notes TEXT NULL,
    payload_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE KEY uq_assignment_reference (reference_number),
    KEY idx_assignment_status (status),
    KEY idx_assignment_employee_id (employee_id),
    KEY idx_assignment_type (assignment_type),
    KEY idx_assignment_approval_stage (approval_stage),
    
    -- Foreign keys
    CONSTRAINT fk_unified_assignment_employee FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 3: ASSIGNMENT TERMINATION REQUESTS (STANDARDIZED)
-- =====================================================

CREATE TABLE IF NOT EXISTS Unified_Assignment_Termination_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (standardized)
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Employee details
    employee_number VARCHAR(50) NULL,
    national_id VARCHAR(50) NULL,
    
    -- Assignment termination details
    current_assignment_id INT NULL COMMENT 'Reference to original assignment',
    current_assignment_role VARCHAR(255) NOT NULL,
    assignment_start_date DATE NULL COMMENT 'When assignment started',
    termination_reason TEXT NOT NULL,
    
    -- Return details
    return_to_department VARCHAR(100) NULL,
    return_to_position VARCHAR(255) NULL,
    return_date DATE NULL,
    
    -- Core request data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    effective_date DATE NOT NULL COMMENT 'When termination becomes effective',
    
    -- Multi-approval system
    approval_stage VARCHAR(50) DEFAULT 'pending',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    decision_note TEXT NULL,
    
    request_notes TEXT NULL,
    payload_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE KEY uq_assignment_termination_reference (reference_number),
    KEY idx_assignment_termination_status (status),
    KEY idx_assignment_termination_employee_id (employee_id),
    KEY idx_assignment_termination_approval_stage (approval_stage),
    
    -- Foreign keys
    CONSTRAINT fk_unified_assignment_termination_employee FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_unified_assignment_termination_original FOREIGN KEY (current_assignment_id) REFERENCES Unified_Assignment_Requests(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 4: INTERNAL TRANSFER REQUESTS (STANDARDIZED)
-- =====================================================

CREATE TABLE IF NOT EXISTS Unified_Internal_Transfer_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (standardized)
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Employee details
    employee_number VARCHAR(50) NULL,
    national_id VARCHAR(50) NULL,
    job_title VARCHAR(255) NOT NULL,
    
    -- Current position
    current_department VARCHAR(100) NOT NULL,
    current_position VARCHAR(255) NOT NULL,
    current_supervisor VARCHAR(255) NULL,
    current_location VARCHAR(100) NULL,
    
    -- Transfer destination
    target_department VARCHAR(100) NOT NULL,
    target_position VARCHAR(255) NOT NULL,
    target_supervisor VARCHAR(255) NULL,
    target_location VARCHAR(100) NULL,
    
    -- Transfer details
    transfer_reason TEXT NOT NULL,
    transfer_type ENUM('permanent', 'temporary') DEFAULT 'permanent',
    requires_training BOOLEAN DEFAULT FALSE,
    salary_impact VARCHAR(100) NULL,
    
    -- Core request data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    preferred_start_date DATE NULL,
    
    -- Multi-approval system
    approval_stage VARCHAR(50) DEFAULT 'pending',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    decision_note TEXT NULL,
    
    request_notes TEXT NULL,
    payload_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE KEY uq_internal_transfer_reference (reference_number),
    KEY idx_internal_transfer_status (status),
    KEY idx_internal_transfer_employee_id (employee_id),
    KEY idx_internal_transfer_current_dept (current_department),
    KEY idx_internal_transfer_target_dept (target_department),
    KEY idx_internal_transfer_approval_stage (approval_stage),
    
    -- Foreign keys
    CONSTRAINT fk_unified_internal_transfer_employee FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 5: MATERNITY LEAVE REQUESTS (ENHANCED)
-- =====================================================

CREATE TABLE IF NOT EXISTS Unified_Maternity_Leave_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (standardized)
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Employee details
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    supervisor_name VARCHAR(255) NULL,
    
    -- Maternity leave specific data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    expected_due_date DATE NOT NULL COMMENT 'Expected delivery date',
    requested_start_date DATE NOT NULL COMMENT 'When leave should start',
    requested_end_date DATE NULL COMMENT 'When leave should end',
    leave_duration_weeks INT DEFAULT 14 COMMENT 'Duration in weeks',
    
    -- Medical information
    medical_certificate_attached BOOLEAN DEFAULT FALSE,
    doctor_name VARCHAR(255) NULL,
    medical_notes TEXT NULL,
    
    -- Work arrangement details
    work_handover_plan TEXT NULL COMMENT 'Plan for work handover',
    temporary_replacement VARCHAR(255) NULL COMMENT 'Who will cover the role',
    return_work_plan TEXT NULL COMMENT 'Plan for returning to work',
    
    -- Multi-approval system
    approval_stage VARCHAR(50) DEFAULT 'pending',
    total_approvers INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL,
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by INT NULL,
    rejected_at TIMESTAMP NULL,
    decision_note TEXT NULL,
    
    request_notes TEXT NULL,
    payload_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE KEY uq_maternity_reference (reference_number),
    KEY idx_maternity_status (status),
    KEY idx_maternity_employee_id (employee_id),
    KEY idx_maternity_due_date (expected_due_date),
    KEY idx_maternity_approval_stage (approval_stage),
    
    -- Foreign keys
    CONSTRAINT fk_unified_maternity_employee FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 6: STATUS STANDARDIZATION TABLE
-- =====================================================

-- Create a mapping table for status standardization
CREATE TABLE IF NOT EXISTS Request_Status_Mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Status identifiers
    canonical_status VARCHAR(50) NOT NULL COMMENT 'Internal system status',
    display_status_ar VARCHAR(50) NOT NULL COMMENT 'Arabic display status',
    display_status_en VARCHAR(50) NOT NULL COMMENT 'English display status',
    
    -- Status metadata
    status_category ENUM('pending', 'approved', 'rejected', 'in_progress') NOT NULL,
    status_order INT NOT NULL DEFAULT 0 COMMENT 'Order for sorting',
    is_final BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a final status',
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE KEY uq_canonical_status (canonical_status),
    KEY idx_status_category (status_category),
    KEY idx_status_order (status_order)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 7: REFERENCE NUMBER GENERATION TABLE
-- =====================================================

-- Create a table to manage reference number generation and avoid conflicts
CREATE TABLE IF NOT EXISTS Request_Reference_Sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    request_type VARCHAR(50) NOT NULL COMMENT 'Type of request (clearance, onboarding, etc.)',
    prefix VARCHAR(10) NOT NULL COMMENT 'Prefix for reference numbers',
    current_sequence INT NOT NULL DEFAULT 1 COMMENT 'Current sequence number',
    date_created DATE NOT NULL COMMENT 'Date this sequence was created',
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    UNIQUE KEY uq_request_type (request_type),
    UNIQUE KEY uq_prefix (prefix),
    KEY idx_date_created (date_created)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial reference sequence data
INSERT INTO Request_Reference_Sequences (request_type, prefix, current_sequence, date_created) VALUES
('clearance', 'CLR', 1, CURDATE()),
('onboarding', 'ONB', 1, CURDATE()),
('delegation', 'DLG', 1, CURDATE()),
('certificate', 'CRT', 1, CURDATE()),
('experience', 'EXP', 1, CURDATE()),
('exit', 'EXT', 1, CURDATE()),
('assignment', 'ASG', 1, CURDATE()),
('assignment_termination', 'AST', 1, CURDATE()),
('internal_transfer', 'ITR', 1, CURDATE()),
('maternity_leave', 'MAT', 1, CURDATE()),
('housing_allowance', 'HSG', 1, CURDATE())
ON DUPLICATE KEY UPDATE current_sequence = current_sequence;

-- Insert standard status mappings
INSERT INTO Request_Status_Mapping (canonical_status, display_status_ar, display_status_en, status_category, status_order, is_final) VALUES
('pending', 'قيد الاعتماد', 'Pending Approval', 'pending', 1, FALSE),
('in_review', 'قيد المراجعة', 'Under Review', 'in_progress', 2, FALSE),
('approved', 'مكتمل', 'Approved', 'approved', 3, TRUE),
('rejected', 'مرفوض', 'Rejected', 'rejected', 4, TRUE)
ON DUPLICATE KEY UPDATE display_status_ar = VALUES(display_status_ar);
