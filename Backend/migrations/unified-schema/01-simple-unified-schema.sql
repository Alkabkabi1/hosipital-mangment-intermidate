-- =====================================================
-- SIMPLIFIED UNIFIED SCHEMA - NO SYNTAX ISSUES
-- =====================================================
-- Creates basic unified tables for demonstration
-- Can be expanded after basic functionality is working
-- =====================================================

-- Status mapping table
CREATE TABLE IF NOT EXISTS Request_Status_Mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    canonical_status VARCHAR(50) NOT NULL,
    display_status_ar VARCHAR(50) NOT NULL,
    display_status_en VARCHAR(50) NOT NULL,
    status_category ENUM('pending', 'approved', 'rejected', 'in_progress') NOT NULL,
    status_order INT NOT NULL DEFAULT 0,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_canonical_status (canonical_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reference number sequences
CREATE TABLE IF NOT EXISTS Request_Reference_Sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    current_sequence INT NOT NULL DEFAULT 1,
    date_created DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_request_type (request_type),
    UNIQUE KEY uq_prefix (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration log
CREATE TABLE IF NOT EXISTS Migration_Log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    status ENUM('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    details TEXT NULL,
    records_migrated INT DEFAULT 0,
    errors_encountered INT DEFAULT 0,
    UNIQUE KEY uq_migration_name (migration_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert standard status mappings
INSERT IGNORE INTO Request_Status_Mapping 
(canonical_status, display_status_ar, display_status_en, status_category, status_order, is_final) 
VALUES
('pending', 'قيد الاعتماد', 'Pending Approval', 'pending', 1, FALSE),
('in_review', 'قيد المراجعة', 'Under Review', 'in_progress', 2, FALSE),
('approved', 'مكتمل', 'Approved', 'approved', 3, TRUE),
('rejected', 'مرفوض', 'Rejected', 'rejected', 4, TRUE);

-- Insert reference sequences for all request types
INSERT IGNORE INTO Request_Reference_Sequences 
(request_type, prefix, current_sequence, date_created) 
VALUES
('clearance', 'CLR', 1000, CURDATE()),
('onboarding', 'ONB', 1000, CURDATE()),
('delegation', 'DLG', 1000, CURDATE()),
('certificate', 'CRT', 1000, CURDATE()),
('experience', 'EXP', 1000, CURDATE()),
('exit', 'EXT', 1000, CURDATE()),
('assignment', 'ASG', 1000, CURDATE()),
('assignment_termination', 'AST', 1000, CURDATE()),
('internal_transfer', 'ITR', 1000, CURDATE()),
('maternity_leave', 'MAT', 1000, CURDATE()),
('housing_allowance', 'HSG', 1000, CURDATE());

-- Add enhanced fields to existing tables rather than creating new unified tables
-- This approach avoids schema replacement and preserves all existing data

-- Enhance Clearance_Requests table
ALTER TABLE Clearance_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Clearance_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Clearance_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Clearance_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Clearance_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;

-- Enhance Onboarding_Requests table
ALTER TABLE Onboarding_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Onboarding_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Onboarding_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Onboarding_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Onboarding_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;

-- Enhance Certificate_Requests table
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS employee_email VARCHAR(255);
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS employee_dept VARCHAR(150);
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS created_by_user INT;
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS request_date DATE;
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
ALTER TABLE Certificate_Requests ADD COLUMN IF NOT EXISTS decision_note TEXT;

-- Enhance Experience_Certificate_Requests table  
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS employee_email VARCHAR(255);
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS employee_dept VARCHAR(150);
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS created_by_user INT;
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS request_date DATE;
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
ALTER TABLE Experience_Certificate_Requests ADD COLUMN IF NOT EXISTS decision_note TEXT;

-- Enhance Delegation_Requests table
ALTER TABLE Delegation_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Delegation_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Delegation_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Delegation_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Delegation_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;

-- Enhance Exit_Requests table
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
ALTER TABLE Exit_Requests ADD COLUMN IF NOT EXISTS decision_note TEXT;

-- Enhance Maternity_Leave_Requests table
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
ALTER TABLE Maternity_Leave_Requests ADD COLUMN IF NOT EXISTS decision_note TEXT;

-- Enhance Housing_Allowance_Requests table
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending';
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0;
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0;
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50);
ALTER TABLE Housing_Allowance_Requests ADD COLUMN IF NOT EXISTS decision_note TEXT;

SELECT 'UNIFIED SCHEMA ENHANCEMENT COMPLETED' as status, NOW() as timestamp;
