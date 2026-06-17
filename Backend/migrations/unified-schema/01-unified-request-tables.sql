-- =====================================================
-- UNIFIED REQUEST SYSTEM DATABASE SCHEMA
-- =====================================================
-- Consolidates all request implementations into a single, consistent schema
-- Preserves 100% of existing data through field mapping
-- Adds multi-approval support for all request types
-- Version: 2.0
-- Date: January 2025
-- =====================================================

-- =====================================================
-- SECTION 1: BASE REQUEST STRUCTURE
-- =====================================================

-- Common fields that all request types share
-- This serves as the foundation for inheritance patterns

-- =====================================================
-- SECTION 2: CLEARANCE REQUESTS (CONSOLIDATED SCHEMA)
-- =====================================================

-- Combines both clearance implementations into single source of truth
-- Preserves ALL existing fields from both schemas
CREATE TABLE IF NOT EXISTS Unified_Clearance_Requests (
    -- Primary identification
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (from both schemas)
    employee_id INT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Core clearance data (consolidated fields)
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    last_work_day DATE NULL,  -- Consolidated: last_working_day → last_work_day
    
    -- Enhanced clearance fields (from employee-requests schema)
    clearance_type ENUM('end_of_service', 'end_mid_service') NULL COMMENT 'Type of clearance',
    specific_reason VARCHAR(100) NULL COMMENT 'Specific reason code',
    document_number VARCHAR(50) NULL COMMENT 'Official document number',
    reason VARCHAR(500) NULL COMMENT 'General reason for clearance',
    
    -- Approval tracking (consolidated from both schemas)
    approved_by INT NULL,
    approved_at DATETIME NULL,
    rejected_by INT NULL,
    rejected_at DATETIME NULL,
    decision_note TEXT NULL,  -- Consolidated: rejection_reason + notes
    
    -- Multi-approval system integration
    approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
    total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
    approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp',
    
    -- Extended data storage
    payload_json LONGTEXT NULL COMMENT 'Additional form data and metadata',
    
    -- System timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE KEY uq_clearance_reference (reference_number),
    KEY idx_clearance_status (status),
    KEY idx_clearance_employee_email (employee_email),
    KEY idx_clearance_employee_id (employee_id),
    KEY idx_clearance_request_date (request_date),
    KEY idx_clearance_approval_stage (approval_stage),
    KEY idx_clearance_final_decision (final_decision),
    KEY idx_clearance_clearance_type (clearance_type),
    KEY idx_clearance_created_by_user (created_by_user),
    
    -- Foreign key constraints
    CONSTRAINT fk_unified_clearance_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_clearance_created_by FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_clearance_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_clearance_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Unified clearance requests consolidating all implementations';

-- =====================================================
-- SECTION 3: ONBOARDING REQUESTS (CONSOLIDATED SCHEMA)
-- =====================================================

-- Combines simple and comprehensive onboarding implementations
-- Supports both basic and detailed form submissions
CREATE TABLE IF NOT EXISTS Unified_Onboarding_Requests (
    -- Primary identification
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information (standard across all requests)
    employee_id INT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Core onboarding data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    start_date DATE NOT NULL COMMENT 'Employee start date',
    
    -- Basic onboarding fields (from simple implementation)
    position_title VARCHAR(255) NULL COMMENT 'Job position title',
    department_id INT NULL COMMENT 'Target department ID',
    supervisor_id INT NULL COMMENT 'Assigned supervisor ID',
    
    -- Comprehensive onboarding fields (from employee-requests schema)
    document_number VARCHAR(50) NULL COMMENT 'Official appointment document',
    transaction_number VARCHAR(50) NULL COMMENT 'HR transaction reference',
    transaction_date DATE NULL COMMENT 'Transaction processing date',
    employee_status ENUM('full_assignment', 'partial_assignment') NULL COMMENT 'Employment status type',
    employment_type ENUM('civil_service', 'self_employment', 'surplus_workforce', 'locum', 'partial_assignment') NULL COMMENT 'Type of employment',
    onboarding_reason ENUM('transfer', 'assignment', 'appointment', 'secondment', 'scholarship') NULL COMMENT 'Reason for onboarding',
    reason_for_job VARCHAR(500) NULL COMMENT 'Detailed job assignment reason',
    
    -- Extended employee information (for comprehensive forms)
    employee_number VARCHAR(50) NULL COMMENT 'Official employee number',
    nationality VARCHAR(100) NULL COMMENT 'Employee nationality',
    gender ENUM('male', 'female') NULL COMMENT 'Employee gender',
    birth_date DATE NULL COMMENT 'Employee birth date',
    appointment_date DATE NULL COMMENT 'Official appointment date',
    
    -- Approval tracking
    approved_by INT NULL,
    approved_at DATETIME NULL,
    rejected_by INT NULL,
    rejected_at DATETIME NULL,
    decision_note TEXT NULL,
    
    -- Multi-approval system integration
    approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
    total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
    approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
    final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp',
    
    -- Extended data storage
    payload_json LONGTEXT NULL COMMENT 'Complex form data and additional information',
    notes TEXT NULL COMMENT 'General notes and comments',
    
    -- System timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    UNIQUE KEY uq_onboarding_reference (reference_number),
    KEY idx_onboarding_status (status),
    KEY idx_onboarding_employee_email (employee_email),
    KEY idx_onboarding_employee_id (employee_id),
    KEY idx_onboarding_request_date (request_date),
    KEY idx_onboarding_start_date (start_date),
    KEY idx_onboarding_approval_stage (approval_stage),
    KEY idx_onboarding_final_decision (final_decision),
    KEY idx_onboarding_employment_type (employment_type),
    KEY idx_onboarding_created_by_user (created_by_user),
    
    -- Foreign key constraints
    CONSTRAINT fk_unified_onboarding_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_onboarding_created_by FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_onboarding_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_onboarding_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_onboarding_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_onboarding_supervisor FOREIGN KEY (supervisor_id) REFERENCES App_Users(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Unified onboarding requests supporting both simple and comprehensive forms';

-- =====================================================
-- SECTION 4: STANDARDIZED REQUEST TABLES
-- =====================================================

-- All other request types updated with consistent structure and multi-approval support

-- Delegation Requests (enhanced with multi-approval)
CREATE TABLE IF NOT EXISTS Unified_Delegation_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information
    employee_id INT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Delegation-specific data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    from_email VARCHAR(255) NULL COMMENT 'Delegator email',
    to_email VARCHAR(255) NULL COMMENT 'Delegate email', 
    delegation_type VARCHAR(100) NULL COMMENT 'Type of delegation',
    scope_description TEXT NULL COMMENT 'Scope of delegated authority',
    start_date DATE NULL COMMENT 'Delegation start date',
    end_date DATE NULL COMMENT 'Delegation end date',
    
    -- Approval tracking and multi-approval
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
    
    payload_json LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_delegation_reference (reference_number),
    KEY idx_delegation_status (status),
    KEY idx_delegation_from_email (from_email),
    KEY idx_delegation_to_email (to_email),
    KEY idx_delegation_approval_stage (approval_stage),
    
    CONSTRAINT fk_unified_delegation_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
    CONSTRAINT fk_unified_delegation_created_by FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Certificate Requests (enhanced with multi-approval)
CREATE TABLE IF NOT EXISTS Unified_Certificate_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Certificate-specific data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    occupation VARCHAR(255) NOT NULL,
    iqama_number VARCHAR(50) NULL,
    passport_number VARCHAR(50) NULL,
    nationality VARCHAR(100) NOT NULL,
    
    -- Approval tracking and multi-approval
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
    
    UNIQUE KEY uq_certificate_reference (reference_number),
    KEY idx_certificate_status (status),
    KEY idx_certificate_employee_id (employee_id),
    KEY idx_certificate_approval_stage (approval_stage),
    
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Experience Certificate Requests (enhanced with multi-approval)
CREATE TABLE IF NOT EXISTS Unified_Experience_Certificate_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Experience certificate specific data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL COMMENT 'Employment start date',
    end_date DATE NULL COMMENT 'Employment end date (if applicable)',
    experience_years INT NULL COMMENT 'Years of experience',
    experience_months INT NULL COMMENT 'Additional months of experience',
    
    -- Approval tracking and multi-approval
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
    
    UNIQUE KEY uq_experience_reference (reference_number),
    KEY idx_experience_status (status),
    KEY idx_experience_employee_id (employee_id),
    KEY idx_experience_approval_stage (approval_stage),
    
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Housing Allowance Requests (enhanced with multi-approval)
CREATE TABLE IF NOT EXISTS Unified_Housing_Allowance_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(50) NOT NULL,
    
    -- Employee information
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_dept VARCHAR(150) NULL,
    created_by_user INT NULL,
    
    -- Housing allowance specific data
    status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
    request_date DATE NOT NULL,
    allowance_type ENUM('saudi_doctors', 'general_housing') NOT NULL COMMENT 'Type of housing allowance',
    monthly_amount DECIMAL(10,2) NULL COMMENT 'Requested monthly allowance amount',
    justification TEXT NULL COMMENT 'Justification for housing allowance',
    accommodation_details TEXT NULL COMMENT 'Details about current accommodation',
    
    -- Approval tracking and multi-approval
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
    
    UNIQUE KEY uq_housing_reference (reference_number),
    KEY idx_housing_status (status),
    KEY idx_housing_employee_id (employee_id),
    KEY idx_housing_allowance_type (allowance_type),
    KEY idx_housing_approval_stage (approval_stage),
    
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
