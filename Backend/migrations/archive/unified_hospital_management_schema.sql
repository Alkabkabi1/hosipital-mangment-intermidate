-- Unified Hospital Management Database Schema
-- Compatible with MySQL 5.6+ (replaces JSON with LONGTEXT)
-- Consolidates: 001_initial_schema.sql + 002_employee_requests.sql

-- =====================================================
-- DATABASE SETUP
-- =====================================================

CREATE DATABASE IF NOT EXISTS hospital_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_management;
SET NAMES utf8mb4;

-- =====================================================
-- CORE REFERENCE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS Departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(20) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  description TEXT NULL,
  department_type VARCHAR(50) NOT NULL DEFAULT 'administrative',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_departments_code (department_code),
  KEY idx_departments_name_en (name_en),
  KEY idx_departments_type (department_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Job_Titles (
  job_title_id INT AUTO_INCREMENT PRIMARY KEY,
  title_code VARCHAR(20) NOT NULL,
  title_en VARCHAR(150) NOT NULL,
  title_ar VARCHAR(150) NOT NULL,
  category VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_titles_code (title_code),
  KEY idx_job_titles_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Employees (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_number VARCHAR(50) NOT NULL,
  full_name_en VARCHAR(200) NULL,
  full_name_ar VARCHAR(200) NULL,
  first_name VARCHAR(100) NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  first_name_ar VARCHAR(150) NULL,
  second_name_ar VARCHAR(150) NULL,
  third_name_ar VARCHAR(150) NULL,
  family_name_ar VARCHAR(150) NULL,
  department_id INT NULL,
  position VARCHAR(150) NULL,
  job_title VARCHAR(150) NULL,
  job_title_id INT NULL,
  national_id VARCHAR(50) NULL,
  identity_type VARCHAR(50) NULL,
  nationality VARCHAR(100) NULL,
  gender VARCHAR(20) NULL,
  birth_date DATE NULL,
  phone_primary VARCHAR(32) NULL,
  phone_secondary VARCHAR(32) NULL,
  email_work VARCHAR(150) NULL,
  hire_date DATE NULL,
  contract_type VARCHAR(50) NULL,
  employment_status VARCHAR(50) NULL,
  contract_start_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employees_number (employee_number),
  KEY idx_employees_department (department_id),
  KEY idx_employees_job_title (job_title_id),
  KEY idx_employees_national_id (national_id),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL,
  CONSTRAINT fk_employees_job_title FOREIGN KEY (job_title_id) REFERENCES Job_Titles(job_title_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER MANAGEMENT & ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL,
  role_name_ar VARCHAR(120) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS App_Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  employee_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  login_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_app_users_email (email),
  KEY idx_app_users_employee (employee_id),
  CONSTRAINT fk_app_users_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_role_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_user_roles_user_role (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_audit_log (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  action ENUM('ASSIGNED', 'REMOVED') NOT NULL,
  performed_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_role_audit_user FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_audit_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_role_audit_actor FOREIGN KEY (performed_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW user_role_assignments AS
SELECT
  ur.user_role_id AS assignment_id,
  ur.user_id,
  ur.role_id,
  ur.assigned_by,
  ur.assigned_at,
  ur.notes,
  ur.is_active
FROM user_roles ur;

-- =====================================================
-- EMPLOYEE REQUESTS TABLES (UNIFIED - MYSQL 5.6+ COMPATIBLE)
-- =====================================================

-- طلبات مباشرة العمل (Onboarding)
CREATE TABLE IF NOT EXISTS Onboarding_Requests (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference_number VARCHAR(64)     NOT NULL,
  employee_id      INT             NULL,
  employee_email   VARCHAR(190)    NOT NULL,
  employee_name    VARCHAR(190)    NULL,
  employee_dept    VARCHAR(190)    NULL,
  created_by_user  INT             NULL,
  status           VARCHAR(32)     NOT NULL DEFAULT 'قيد الاعتماد',
  request_date     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_by      INT             NULL,
  approved_at      DATETIME        NULL,
  rejected_by      INT             NULL,
  rejected_at      DATETIME        NULL,
  decision_note    TEXT            NULL,
  payload_json     LONGTEXT        NULL,               -- تفاصيل إضافية (LONGTEXT for MySQL 5.6 compatibility)
  PRIMARY KEY (id),
  UNIQUE KEY uq_onb_ref (reference_number),
  KEY idx_onb_status_created (status, created_at),
  KEY idx_onb_employee_email (employee_email),
  CONSTRAINT fk_onb_created_by FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_onb_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_onb_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- طلبات إخلاء الطرف (Clearance)
CREATE TABLE IF NOT EXISTS Clearance_Requests (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference_number VARCHAR(64)     NOT NULL,
  employee_id      INT             NULL,
  employee_email   VARCHAR(190)    NOT NULL,
  employee_name    VARCHAR(190)    NULL,
  employee_dept    VARCHAR(190)    NULL,
  created_by_user  INT             NULL,
  status           VARCHAR(32)     NOT NULL DEFAULT 'قيد الاعتماد',
  request_date     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_work_day    DATE            NULL,
  reason           VARCHAR(100)    NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_by      INT             NULL,
  approved_at      DATETIME        NULL,
  rejected_by      INT             NULL,
  rejected_at      DATETIME        NULL,
  decision_note    TEXT            NULL,
  payload_json     LONGTEXT        NULL,               -- LONGTEXT for MySQL 5.6 compatibility
  PRIMARY KEY (id),
  UNIQUE KEY uq_clr_ref (reference_number),
  KEY idx_clr_status_created (status, created_at),
  KEY idx_clr_employee_email (employee_email),
  CONSTRAINT fk_clr_created_by FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- تفويضات (Delegation)
CREATE TABLE IF NOT EXISTS Delegation_Requests (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference_number VARCHAR(64)     NOT NULL,
  created_by_user  INT             NULL,
  from_email       VARCHAR(190)    NOT NULL,
  to_email         VARCHAR(190)    NOT NULL,
  scopes_json      LONGTEXT        NOT NULL,           -- LONGTEXT for MySQL 5.6 compatibility
  valid_from       DATE            NOT NULL,
  valid_to         DATE            NOT NULL,
  status           VARCHAR(32)     NOT NULL DEFAULT 'قيد الاعتماد',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_by      INT             NULL,
  approved_at      DATETIME        NULL,
  rejected_by      INT             NULL,
  rejected_at      DATETIME        NULL,
  decision_note    TEXT            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dlg_ref (reference_number),
  KEY idx_dlg_status_created (status, created_at),
  KEY idx_dlg_to_email (to_email),
  CONSTRAINT fk_dlg_created_by FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dlg_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dlg_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- LEGACY WORKFLOW TABLES (FROM 001_initial_schema.sql)
-- =====================================================
-- These are the more complex workflow tables from the original schema
-- Keeping them for backward compatibility and future enhancements

CREATE TABLE IF NOT EXISTS ClearanceStatuses (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  name_en VARCHAR(60) NOT NULL,
  name_ar VARCHAR(120) NOT NULL,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_clearance_statuses_en (name_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Clearance_Forms (
  clearance_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  request_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  last_working_day DATE NULL,
  reason TEXT NULL,
  status_id INT NOT NULL,
  notes TEXT NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_clearance_reference (reference_number),
  KEY idx_clearance_employee (employee_id),
  KEY idx_clearance_status (status_id),
  CONSTRAINT fk_clearance_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_clearance_status FOREIGN KEY (status_id) REFERENCES ClearanceStatuses(status_id) ON DELETE RESTRICT,
  CONSTRAINT fk_clearance_approver FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Clearance_Signatures (
  signature_id INT AUTO_INCREMENT PRIMARY KEY,
  clearance_id INT NULL,
  delegation_id INT NULL,
  onboarding_id INT NULL,
  department_id INT NOT NULL,
  signer_name VARCHAR(150) NOT NULL,
  signer_title VARCHAR(150) NOT NULL,
  signed_by INT NULL,
  signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature_date DATE NULL,
  comment TEXT NULL,
  UNIQUE KEY uq_clearance_signature (clearance_id, department_id),
  KEY idx_clearance_signatures_department (department_id),
  CONSTRAINT fk_clearance_signature_clearance FOREIGN KEY (clearance_id) REFERENCES Clearance_Forms(clearance_id) ON DELETE CASCADE,
  CONSTRAINT fk_clearance_signature_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
  CONSTRAINT fk_clearance_signature_user FOREIGN KEY (signed_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Clearance_Status_History (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  clearance_id INT NOT NULL,
  status_id INT NOT NULL,
  updated_by INT NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clearance_history_form FOREIGN KEY (clearance_id) REFERENCES Clearance_Forms(clearance_id) ON DELETE CASCADE,
  CONSTRAINT fk_clearance_history_status FOREIGN KEY (status_id) REFERENCES ClearanceStatuses(status_id) ON DELETE RESTRICT,
  CONSTRAINT fk_clearance_history_user FOREIGN KEY (updated_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delegation_forms (
  delegation_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  request_date DATE NOT NULL,
  delegation_type VARCHAR(100) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  reason TEXT NULL,
  delegated_to_employee_id INT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_delegation_reference (reference_number),
  KEY idx_delegation_employee (employee_id),
  KEY idx_delegation_status (status),
  CONSTRAINT fk_delegation_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_delegation_delegatee FOREIGN KEY (delegated_to_employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DelegationStatuses (
  delegation_status_id INT AUTO_INCREMENT PRIMARY KEY,
  delegation_id INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  updated_by INT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_delegation_status_form FOREIGN KEY (delegation_id) REFERENCES delegation_forms(delegation_id) ON DELETE CASCADE,
  CONSTRAINT fk_delegation_status_user FOREIGN KEY (updated_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Delegation_Signatures (
  signature_id INT AUTO_INCREMENT PRIMARY KEY,
  clearance_id INT NULL,
  delegation_id INT NULL,
  onboarding_id INT NULL,
  department_id INT NOT NULL,
  signer_name VARCHAR(150) NOT NULL,
  signer_title VARCHAR(150) NOT NULL,
  signed_by INT NULL,
  signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature_date DATE NULL,
  comment TEXT NULL,
  UNIQUE KEY uq_delegation_signature (delegation_id, department_id),
  KEY idx_delegation_signatures_department (department_id),
  CONSTRAINT fk_delegation_signature_form FOREIGN KEY (delegation_id) REFERENCES delegation_forms(delegation_id) ON DELETE CASCADE,
  CONSTRAINT fk_delegation_signature_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
  CONSTRAINT fk_delegation_signature_user FOREIGN KEY (signed_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS onboarding_forms (
  onboarding_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  reference_number VARCHAR(100) NOT NULL,
  request_date DATE NOT NULL,
  start_date DATE NOT NULL,
  position VARCHAR(150) NULL,
  department_id INT NULL,
  supervisor_id INT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  notes TEXT NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_onboarding_reference (reference_number),
  KEY idx_onboarding_employee (employee_id),
  KEY idx_onboarding_department (department_id),
  CONSTRAINT fk_onboarding_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_onboarding_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE SET NULL,
  CONSTRAINT fk_onboarding_supervisor FOREIGN KEY (supervisor_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
  CONSTRAINT fk_onboarding_approver FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Onboarding_Signatures (
  signature_id INT AUTO_INCREMENT PRIMARY KEY,
  clearance_id INT NULL,
  delegation_id INT NULL,
  onboarding_id INT NULL,
  department_id INT NOT NULL,
  signer_name VARCHAR(150) NOT NULL,
  signer_title VARCHAR(150) NOT NULL,
  signed_by INT NULL,
  signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  signature_date DATE NULL,
  comment TEXT NULL,
  UNIQUE KEY uq_onboarding_signature (onboarding_id, department_id),
  KEY idx_onboarding_signatures_department (department_id),
  CONSTRAINT fk_onboarding_signature_form FOREIGN KEY (onboarding_id) REFERENCES onboarding_forms(onboarding_id) ON DELETE CASCADE,
  CONSTRAINT fk_onboarding_signature_department FOREIGN KEY (department_id) REFERENCES Departments(department_id) ON DELETE CASCADE,
  CONSTRAINT fk_onboarding_signature_user FOREIGN KEY (signed_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Onboarding_Status_History (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  onboarding_id INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  updated_by INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_onboarding_history_form FOREIGN KEY (onboarding_id) REFERENCES onboarding_forms(onboarding_id) ON DELETE CASCADE,
  CONSTRAINT fk_onboarding_history_user FOREIGN KEY (updated_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO Departments (department_code, name_en, name_ar, description, department_type, is_active)
VALUES
  ('ADM', 'Administration', 'الإدارة العامة', 'Corporate administration office', 'administrative', 1),
  ('FIN', 'Finance', 'المالية', 'Finance and accounting department', 'support', 1),
  ('ITD', 'Information Technology', 'تقنية المعلومات', 'IT operations and support', 'support', 1),
  ('HR', 'Human Resources', 'الموارد البشرية', 'Human resources department', 'support', 1),
  ('MED', 'Medical', 'الطبي', 'Medical department', 'clinical', 1)
ON DUPLICATE KEY UPDATE
  name_en = VALUES(name_en),
  name_ar = VALUES(name_ar),
  description = VALUES(description),
  department_type = VALUES(department_type),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO roles (role_name, role_name_ar, description, is_active)
VALUES
  ('ADMIN', 'مدير النظام', 'System administrator with full access', 1),
  ('HR', 'الموارد البشرية', 'Human resources specialist', 1),
  ('IT', 'تقنية المعلومات', 'IT department representative', 1),
  ('FINANCE', 'المالية', 'Finance department representative', 1),
  ('MANAGER', 'مدير القسم', 'Department manager role', 1),
  ('EMPLOYEE', 'موظف', 'Standard employee role', 1)
ON DUPLICATE KEY UPDATE
  role_name_ar = VALUES(role_name_ar),
  description = VALUES(description),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO ClearanceStatuses (name_en, name_ar, description, display_order)
VALUES
  ('pending', 'قيد الاعتماد', 'Awaiting approval', 1),
  ('in_progress', 'قيد المراجعة', 'Under review by departments', 2),
  ('approved', 'موافق عليه', 'Approved by administration', 3),
  ('rejected', 'مرفوض', 'Request rejected', 4),
  ('on_hold', 'معلق', 'Temporarily paused', 5),
  ('cancelled', 'ملغي', 'Request cancelled', 6),
  ('completed', 'مكتمل', 'Workflow completed', 7)
ON DUPLICATE KEY UPDATE
  name_ar = VALUES(name_ar),
  description = VALUES(description),
  display_order = VALUES(display_order);

INSERT INTO Employees (
  employee_number,
  full_name_en,
  full_name_ar,
  first_name,
  last_name,
  department_id,
  position,
  email_work,
  phone_primary
)
VALUES (
  'EMP-0001',
  'System Administrator',
  'مسؤول النظام',
  'System',
  'Administrator',
  (SELECT department_id FROM Departments WHERE department_code = 'ADM' LIMIT 1),
  'Head of IT',
  'admin@hospital.local',
  '+966500000000'
)
ON DUPLICATE KEY UPDATE
  full_name_en = VALUES(full_name_en),
  full_name_ar = VALUES(full_name_ar),
  department_id = VALUES(department_id),
  position = VALUES(position),
  email_work = VALUES(email_work),
  phone_primary = VALUES(phone_primary),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO App_Users (
  name,
  email,
  password_hash,
  role,
  employee_id,
  is_active
)
VALUES (
  'System Admin',
  'admin@example.com',
  '$2b$12$CqJX9oIoYNewc19hXtODHe4qzM7gc3KJ2YMBX1IzBgE4c3OJbGdvG',
  'admin',
  (SELECT employee_id FROM Employees WHERE employee_number = 'EMP-0001' LIMIT 1),
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role),
  employee_id = VALUES(employee_id),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
SELECT
  u.id,
  r.role_id,
  u.id,
  'Bootstrap assignment',
  1
FROM App_Users u
JOIN roles r ON r.role_name = 'ADMIN'
WHERE u.email = 'admin@example.com'
ON DUPLICATE KEY UPDATE
  assigned_by = VALUES(assigned_by),
  notes = VALUES(notes),
  is_active = VALUES(is_active),
  assigned_at = CURRENT_TIMESTAMP;

-- Link the admin account to the employee record if missing
UPDATE App_Users u
SET employee_id = (
  SELECT employee_id
  FROM Employees
  WHERE employee_number = 'EMP-0001'
  LIMIT 1
)
WHERE u.email = 'admin@example.com'
  AND (u.employee_id IS NULL OR u.employee_id = 0);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Unified Hospital Management Database Schema Applied Successfully!' as Status;
SELECT 'MySQL 5.6+ Compatible - JSON fields converted to LONGTEXT' as Compatibility;
SELECT 'Login: admin@example.com / Admin@123' as LoginInfo;
SELECT 'All tables created and seeded with initial data' as DataStatus;
