-- ==========================================
-- Employee Forms System
-- Created: November 18, 2025
-- ==========================================
-- Creates 6 new request types:
-- 1. Contractor Housing Allowance (بدل سكن المتعاقدين)
-- 2. Guarantee Detailed (كفالة غرم وأداء وحضور بديل)
-- 3. Guarantee Fine (كفالة غرم وأداء)
-- 4. Guarantee Public Law (كفالة غرم وأداء في الحق العام)
-- 5. Saudi Ticket Compensation (تعويض تذاكر امر الاركاب للسعوديين)
-- 6. Ticket Compensation (تعويض تذاكر للمتعاقدين غير السعوديين والمرافقين)

-- ==========================================
-- 1. Contractor Housing Allowance Requests
-- ==========================================
CREATE TABLE IF NOT EXISTS Contractor_Housing_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    employee_id_number VARCHAR(50),
    employee_job VARCHAR(255),
    employee_nationality VARCHAR(100),
    
    -- Request details
    contract_year_start DATE NOT NULL,
    contract_year_end DATE NOT NULL,
    family_members INT DEFAULT 1,
    request_date DATE NOT NULL,
    
    -- Officials information
    competent_employee_name VARCHAR(255),
    housing_head_name VARCHAR(255),
    hr_director_name VARCHAR(255),
    
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. Guarantee Detailed Requests (كفالة غرم وأداء وحضور بديل)
-- ==========================================
CREATE TABLE IF NOT EXISTS Guarantee_Detailed_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    
    -- Guarantor information
    guarantor_id_card VARCHAR(50) NOT NULL,
    guarantor_id_source VARCHAR(100) NOT NULL,
    guarantor_department VARCHAR(255) NOT NULL,
    guarantor_address TEXT NOT NULL,
    guarantor_name VARCHAR(255) NOT NULL,
    guarantor_workplace VARCHAR(255),
    guarantor_nationality VARCHAR(100),
    
    -- Guaranteed person information
    guaranteed_name VARCHAR(255) NOT NULL,
    guaranteed_id_card VARCHAR(50) NOT NULL,
    guaranteed_id_source VARCHAR(100) NOT NULL,
    guaranteed_workplace VARCHAR(255),
    guaranteed_nationality VARCHAR(100),
    guaranteed_job_title VARCHAR(255),
    guaranteed_address TEXT,
    
    -- Guarantee details
    guarantee_reason TEXT NOT NULL,
    guarantee_amount DECIMAL(15, 2),
    guarantee_start_date DATE,
    guarantee_end_date DATE,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. Guarantee Fine Requests (كفالة غرم وأداء)
-- ==========================================
CREATE TABLE IF NOT EXISTS Guarantee_Fine_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    
    -- Guarantor information
    guarantor_name VARCHAR(255) NOT NULL,
    guarantor_job_title VARCHAR(255),
    guarantor_id_number VARCHAR(50) NOT NULL,
    guarantor_mobile VARCHAR(20),
    
    -- Guaranteed person information
    guaranteed_name VARCHAR(255) NOT NULL,
    guaranteed_id_number VARCHAR(50) NOT NULL,
    guaranteed_mobile VARCHAR(20),
    guaranteed_workplace VARCHAR(255),
    
    -- Guarantee details
    guarantee_type VARCHAR(100) NOT NULL,
    guarantee_amount DECIMAL(15, 2),
    guarantee_reason TEXT NOT NULL,
    fine_details TEXT,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. Guarantee Public Law Requests (كفالة غرم وأداء في الحق العام)
-- ==========================================
CREATE TABLE IF NOT EXISTS Guarantee_Public_Law_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    
    -- Guarantor information
    guarantor_id_card VARCHAR(50) NOT NULL,
    guarantor_id_source VARCHAR(100) NOT NULL,
    guarantor_address TEXT NOT NULL,
    guarantor_department VARCHAR(255) NOT NULL,
    
    -- Guaranteed person information
    guaranteed_name VARCHAR(255) NOT NULL,
    guaranteed_id_number VARCHAR(50) NOT NULL,
    guaranteed_workplace VARCHAR(255),
    guaranteed_nationality VARCHAR(100),
    
    -- Guarantee details
    guarantee_type ENUM('public_right', 'fine', 'attendance') NOT NULL,
    guarantee_amount DECIMAL(15, 2),
    guarantee_details TEXT NOT NULL,
    offense_description TEXT,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. Saudi Ticket Compensation Requests (تعويض تذاكر امر الاركاب للسعوديين)
-- ==========================================
CREATE TABLE IF NOT EXISTS Saudi_Ticket_Compensation_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    employee_id_number VARCHAR(50),
    
    -- Travel details
    itinerary VARCHAR(255) NOT NULL,
    travel_start_date DATE NOT NULL,
    travel_end_date DATE NOT NULL,
    travel_purpose TEXT NOT NULL,
    
    -- Ticket details
    ticket_class ENUM('economy', 'business', 'first_class') DEFAULT 'economy',
    ticket_cost DECIMAL(10, 2),
    airline_name VARCHAR(255),
    ticket_number VARCHAR(100),
    
    -- Compensation details
    compensation_amount DECIMAL(10, 2),
    compensation_reason TEXT,
    has_boarding_pass BOOLEAN DEFAULT FALSE,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. Ticket Compensation Requests (تعويض تذاكر للمتعاقدين غير السعوديين والمرافقين)
-- ==========================================
CREATE TABLE IF NOT EXISTS Ticket_Compensation_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50),
    employee_nationality VARCHAR(100),
    
    -- Contract details
    contract_start_date DATE,
    contract_end_date DATE,
    contract_duration VARCHAR(50),
    
    -- Travel details
    departure_country VARCHAR(100) NOT NULL,
    arrival_country VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    return_date DATE,
    
    -- Ticket details
    ticket_type ENUM('employee', 'family', 'annual_leave') DEFAULT 'employee',
    ticket_cost DECIMAL(10, 2),
    number_of_tickets INT DEFAULT 1,
    
    -- Companions information (stored as JSON)
    companions_data JSON,
    
    -- Compensation details
    total_compensation_amount DECIMAL(10, 2),
    compensation_notes TEXT,
    has_required_documents BOOLEAN DEFAULT FALSE,
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
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_nationality (employee_nationality)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

