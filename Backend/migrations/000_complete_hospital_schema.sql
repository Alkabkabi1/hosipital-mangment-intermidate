-- =====================================================
-- COMPLETE HOSPITAL MANAGEMENT DATABASE SCHEMA
-- =====================================================
-- This file consolidates all migrations into a single source of truth
-- Run this on a fresh database to get the complete schema
-- 
-- Combines:
-- - unified_hospital_management_schema.sql (base tables)
-- - 001_bootstrap_admin.sql (admin user and roles)
-- - 002_fk_constraints.sql (foreign key constraints)
-- - 003_commissioner_tickets.sql (commissioner system)
-- - 004_status_canonical.sql (status normalization)
-- - 005_department_jobtitle_normalize.sql (name normalization)
-- - 006_audit_events.sql (audit logging)
-- - 007_add_username.sql (username support)
-- 
-- Version: 1.0
-- Date: $(date)
-- Compatible: MySQL 5.7+, MySQL 8.0+
-- =====================================================

-- =====================================================
-- DATABASE SETUP
-- =====================================================

CREATE DATABASE IF NOT EXISTS hospital_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_management;
SET NAMES utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Table name variables (for consistency across migrations)
SET @T_USERS      := COALESCE(@T_USERS, 'App_Users');
SET @T_USER_ROLES := COALESCE(@T_USER_ROLES, 'user_roles');
SET @T_ROLES      := COALESCE(@T_ROLES, 'roles');

-- =====================================================
-- CORE REFERENCE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS Departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(20) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  name_norm VARCHAR(255) NULL, -- Normalized name for searching
  description TEXT NULL,
  department_type VARCHAR(50) NOT NULL DEFAULT 'administrative',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_departments_code (department_code),
  KEY idx_departments_name_en (name_en),
  KEY idx_departments_type (department_type),
  KEY idx_dept_name_norm (name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Job_Titles (
  job_title_id INT AUTO_INCREMENT PRIMARY KEY,
  title_code VARCHAR(20) NOT NULL,
  title_en VARCHAR(150) NOT NULL,
  title_ar VARCHAR(150) NOT NULL,
  name_norm VARCHAR(255) NULL, -- Normalized name for searching
  category VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_titles_code (title_code),
  KEY idx_job_titles_category (category),
  KEY idx_job_title_name_norm (name_norm)
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
  username VARCHAR(255) NULL, -- Added for flexible login
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  employee_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  login_count INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_app_users_email (email),
  UNIQUE KEY uq_users_username (username),
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

-- =====================================================
-- REQUEST MANAGEMENT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS Onboarding_Requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL,
  employee_id INT NULL,
  employee_email VARCHAR(255) NOT NULL,
  employee_name VARCHAR(200) NOT NULL,
  employee_dept VARCHAR(150) NULL,
  created_by_user INT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
  request_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejected_by INT NULL,
  rejected_at DATETIME NULL,
  decision_note TEXT NULL,
  payload_json LONGTEXT NULL,
  UNIQUE KEY uq_onboarding_reference (reference_number),
  KEY idx_onboarding_status (status),
  KEY idx_onboarding_employee_email (employee_email),
  KEY idx_onboarding_request_date (request_date),
  KEY idx_onb_created_by_user (created_by_user),
  KEY idx_onb_approved_by (approved_by),
  KEY idx_onb_rejected_by (rejected_by),
  CONSTRAINT fk_onboarding_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
  CONSTRAINT fk_onb_created_by_user FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_onb_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_onb_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Clearance_Requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL,
  employee_id INT NULL,
  employee_email VARCHAR(255) NOT NULL,
  employee_name VARCHAR(200) NOT NULL,
  employee_dept VARCHAR(150) NULL,
  created_by_user INT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
  request_date DATE NOT NULL,
  last_work_day DATE NULL,
  reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejected_by INT NULL,
  rejected_at DATETIME NULL,
  decision_note TEXT NULL,
  payload_json LONGTEXT NULL,
  UNIQUE KEY uq_clearance_reference (reference_number),
  KEY idx_clearance_status (status),
  KEY idx_clearance_employee_email (employee_email),
  KEY idx_clearance_request_date (request_date),
  KEY idx_clr_created_by_user (created_by_user),
  KEY idx_clr_approved_by (approved_by),
  KEY idx_clr_rejected_by (rejected_by),
  CONSTRAINT fk_clearance_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_created_by_user FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Delegation_Requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL,
  created_by_user INT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'قيد الاعتماد',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NULL,
  permissions_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  rejected_by INT NULL,
  rejected_at DATETIME NULL,
  decision_note TEXT NULL,
  UNIQUE KEY uq_delegation_reference (reference_number),
  KEY idx_delegation_status (status),
  KEY idx_delegation_from_email (from_email),
  KEY idx_delegation_to_email (to_email),
  KEY idx_delegation_dates (start_date, end_date),
  KEY idx_dlg_created_by_user (created_by_user),
  KEY idx_dlg_approved_by (approved_by),
  KEY idx_dlg_rejected_by (rejected_by),
  CONSTRAINT fk_dlg_created_by_user FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dlg_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dlg_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMMISSIONER SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS Commissioner_Tickets (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issuer_user_id   INT             NOT NULL,
  subject_user_id  INT             NOT NULL,
  scopes_json      LONGTEXT        NOT NULL,
  valid_from       DATETIME        NOT NULL,
  valid_to         DATETIME        NOT NULL,
  revoked_at       DATETIME        NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comm_subject_valid_to (subject_user_id, valid_to),
  KEY idx_comm_valid_to (valid_to),
  CONSTRAINT fk_comm_issuer FOREIGN KEY (issuer_user_id) REFERENCES App_Users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_comm_subject FOREIGN KEY (subject_user_id) REFERENCES App_Users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AUDIT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS Audit_Events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  actor_email VARCHAR(255) NULL,
  action VARCHAR(64) NOT NULL,
  resource VARCHAR(128) NULL,
  resource_id VARCHAR(64) NULL,
  ip VARCHAR(64) NULL,
  meta JSON NULL,
  immutable TINYINT DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_audit_ts (ts),
  KEY idx_audit_user (user_id),
  KEY idx_audit_action (action),
  KEY idx_audit_res (resource, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert essential roles
INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES
('EMPLOYEE', 'موظف', 'Basic employee role', 1),
('ADMIN', 'مسؤول', 'Administrator with elevated privileges', 1),
('MANAGER', 'مدير', 'Department manager role', 1),
('HR', 'موارد بشرية', 'Human resources role', 1);

-- Insert default admin user (with placeholder password - CHANGE THIS!)
-- Admin seed variables (override in production)
SET @ADMIN_EMAIL          := COALESCE(@ADMIN_EMAIL, 'admin@dev.local');
SET @ADMIN_NAME           := COALESCE(@ADMIN_NAME,  'Dev Admin');
-- WARNING: Change this password hash in production!
SET @ADMIN_PASSWORD_HASH  := COALESCE(@ADMIN_PASSWORD_HASH, '$2b$12$kchAEIZ0CcXrXrbZ5pb5SeU0QBDP7f8t2A5xaKXR6Atw93G3QQdLq');

INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
SELECT @ADMIN_NAME, @ADMIN_EMAIL, @ADMIN_PASSWORD_HASH, 'admin', NULL, TRUE FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM App_Users WHERE email = @ADMIN_EMAIL)
LIMIT 1;

-- Assign ADMIN role to admin user
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes)
SELECT u.id, r.role_id, u.id, 'System bootstrap'
FROM App_Users u, roles r
WHERE u.email = @ADMIN_EMAIL AND r.role_name = 'ADMIN';

-- Backfill username for existing users (email prefix)
UPDATE App_Users SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- =====================================================
-- DATA NORMALIZATION
-- =====================================================

-- Populate normalized department names
UPDATE Departments
SET name_norm = LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS(' ', name_en, name_ar)), ' +', ' '))
WHERE name_norm IS NULL OR name_norm = '';

-- Populate normalized job title names
UPDATE Job_Titles
SET name_norm = LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS(' ', title_en, title_ar)), ' +', ' '))
WHERE name_norm IS NULL OR name_norm = '';

-- Normalize request statuses to standard values
-- Pending variants
UPDATE Onboarding_Requests SET status = 'قيد الاعتماد' 
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%'
  OR LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');

UPDATE Clearance_Requests SET status = 'قيد الاعتماد'
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%'
  OR LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');

UPDATE Delegation_Requests SET status = 'قيد الاعتماد'
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%'
  OR LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');

-- Approved variants
UPDATE Onboarding_Requests SET status = 'مكتمل' 
  WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%'
  OR LOWER(status) IN ('approved','accepted','done','complete','completed');

UPDATE Clearance_Requests SET status = 'مكتمل'
  WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%'
  OR LOWER(status) IN ('approved','accepted','done','complete','completed');

UPDATE Delegation_Requests SET status = 'مكتمل'
  WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%'
  OR LOWER(status) IN ('approved','accepted','done','complete','completed');

-- Rejected variants
UPDATE Onboarding_Requests SET status = 'مرفوض' 
  WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%'
  OR LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');

UPDATE Clearance_Requests SET status = 'مرفوض'
  WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%'
  OR LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');

UPDATE Delegation_Requests SET status = 'مرفوض'
  WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%'
  OR LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');

-- =====================================================
-- SAMPLE DATA (Optional - for development)
-- =====================================================

-- Insert sample departments
INSERT IGNORE INTO Departments (department_code, name_en, name_ar, department_type) VALUES
('IT', 'Information Technology', 'تقنية المعلومات', 'technical'),
('HR', 'Human Resources', 'الموارد البشرية', 'administrative'),
('FIN', 'Finance', 'المالية', 'administrative'),
('MED', 'Medical', 'طبي', 'medical'),
('ADMIN', 'Administration', 'الإدارة', 'administrative');

-- Insert sample job titles
INSERT IGNORE INTO Job_Titles (title_code, title_en, title_ar, category) VALUES
('DEV', 'Software Developer', 'مطور برمجيات', 'technical'),
('ADMIN', 'System Administrator', 'مدير نظم', 'technical'),
('HR_SPEC', 'HR Specialist', 'أخصائي موارد بشرية', 'administrative'),
('MANAGER', 'Department Manager', 'مدير قسم', 'management'),
('DOCTOR', 'Medical Doctor', 'طبيب', 'medical'),
('NURSE', 'Nurse', 'ممرض', 'medical');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Hospital Management Database Schema Setup Complete!' as Status,
       COUNT(*) as Tables_Created
FROM information_schema.tables 
WHERE table_schema = 'hospital_management';

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 1. Change the default admin password hash before production use!
-- 2. Review and adjust the sample data as needed
-- 3. This schema supports both Arabic and English content
-- 4. All tables use utf8mb4 for proper Unicode support
-- 5. Foreign key constraints ensure data integrity
-- 6. Indexes are optimized for common query patterns
-- 7. The audit system tracks all user actions
-- 8. Commissioner system supports delegation workflows
-- 9. Status normalization ensures consistent data
-- 10. Run this script on a fresh database for best results
-- =====================================================
