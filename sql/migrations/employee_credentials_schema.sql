-- ==========================================
-- Employee Certificates & Licenses System
-- Created: October 28, 2025
-- ==========================================

-- Table for employee certificates (degrees, diplomas, etc.)
CREATE TABLE IF NOT EXISTS Employee_Certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    
    -- Certificate details
    certificate_name VARCHAR(255) NOT NULL,
    issuing_institution VARCHAR(255) NOT NULL,
    certificate_type ENUM('bachelor', 'master', 'phd', 'diploma', 'certificate', 'training', 'other') NOT NULL DEFAULT 'certificate',
    field_of_study VARCHAR(255),
    issue_date DATE,
    
    -- File attachment
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(100),
    
    -- Metadata
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT NULL,
    verified_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_type (certificate_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for professional licenses (medical licenses, certifications, etc.)
CREATE TABLE IF NOT EXISTS Employee_Licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    
    -- License details
    license_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    license_type ENUM('medical', 'nursing', 'pharmacy', 'laboratory', 'radiology', 'professional', 'other') NOT NULL DEFAULT 'professional',
    
    -- Dates
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    renewal_reminder_days INT DEFAULT 30, -- Days before expiry to show reminder
    
    -- File attachment
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(100),
    
    -- Status
    status ENUM('active', 'expired', 'suspended', 'renewed') DEFAULT 'active',
    auto_status_updated BOOLEAN DEFAULT TRUE, -- Auto-update status based on expiry_date
    
    -- Renewal tracking
    renewed_from_license_id INT NULL, -- If this is a renewal, link to old license
    renewal_notes TEXT,
    
    -- Metadata
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT NULL,
    verified_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES App_Users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES App_Users(id) ON DELETE SET NULL,
    FOREIGN KEY (renewed_from_license_id) REFERENCES Employee_Licenses(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_employee (employee_id),
    INDEX idx_expiry (expiry_date),
    INDEX idx_status (status),
    INDEX idx_license_number (license_number),
    INDEX idx_type (license_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for license renewal history
CREATE TABLE IF NOT EXISTS License_Renewal_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_id INT NOT NULL,
    old_expiry_date DATE NOT NULL,
    new_expiry_date DATE NOT NULL,
    renewed_by INT NOT NULL,
    renewal_notes TEXT,
    renewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (license_id) REFERENCES Employee_Licenses(id) ON DELETE CASCADE,
    FOREIGN KEY (renewed_by) REFERENCES App_Users(id) ON DELETE CASCADE,
    
    INDEX idx_license (license_id),
    INDEX idx_renewed_at (renewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO Employee_Certificates (
    employee_id, certificate_name, issuing_institution, certificate_type, 
    field_of_study, issue_date, description
) VALUES
(
    1, 'بكالوريوس التمريض', 'جامعة الملك سعود', 'bachelor',
    'التمريض', '2018-06-15', 'شهادة بكالوريوس في التمريض من جامعة الملك سعود'
),
(
    1, 'دورة الإنعاش القلبي الرئوي', 'الهيئة السعودية للتخصصات الصحية', 'training',
    'الطوارئ الطبية', '2023-03-10', 'دورة معتمدة في الإنعاش القلبي الرئوي'
)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO Employee_Licenses (
    employee_id, license_name, license_number, issuing_authority, 
    license_type, issue_date, expiry_date, renewal_reminder_days, status
) VALUES
(
    1, 'ترخيص مزاولة مهنة التمريض', 'NUR-2024-12345', 'الهيئة السعودية للتخصصات الصحية',
    'nursing', '2024-01-01', '2025-12-31', 30, 'active'
),
(
    1, 'شهادة BLS - الإنعاش الأساسي', 'BLS-2024-98765', 'جمعية القلب الأمريكية',
    'professional', '2024-06-15', '2026-06-15', 60, 'active'
)
ON DUPLICATE KEY UPDATE id=id;

