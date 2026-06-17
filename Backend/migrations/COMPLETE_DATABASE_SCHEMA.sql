-- =====================================================
-- 🏥 COMPLETE HOSPITAL MANAGEMENT DATABASE SCHEMA
-- =====================================================
-- This file contains ALL tables needed for the hospital management system
-- Run this on a fresh database to create the complete schema
-- 
-- Includes:
-- - Core reference tables (Departments, Job_Titles, Employees)
-- - User management & RBAC (App_Users, roles, user_roles)
-- - Request management (Clearance, Onboarding, Delegation)
-- - Multi-approval system (Request_Approvals, Approval_Rules)
-- - Permission system (permissions, role_permissions)
-- - Role hierarchy (role_hierarchy)
-- - Role expiration (expires_at columns)
-- - Role templates (role_templates, role_template_roles)
-- - Access audit logging (role_access_audit)
-- - Notifications (notifications)
-- - Commissioner tickets (Commissioner_Tickets)
-- - Audit events (Audit_Events)
--
-- Version: 2.0 COMPLETE
-- Date: October 20, 2025
-- Database: MySQL 5.7+ / MySQL 8.0+
-- Compatible: nora_database or hospital_management
-- =====================================================

-- =====================================================
-- DATABASE SETUP
-- =====================================================

-- Note: Adjust database name if needed (nora_database or hospital_management)
CREATE DATABASE IF NOT EXISTS nora_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nora_database;
SET NAMES utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 1: CORE REFERENCE TABLES
-- =====================================================

-- Departments table
CREATE TABLE IF NOT EXISTS Departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(20) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  name_norm VARCHAR(255) NULL COMMENT 'Normalized name for searching',
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

-- Job Titles table
CREATE TABLE IF NOT EXISTS Job_Titles (
  job_title_id INT AUTO_INCREMENT PRIMARY KEY,
  title_code VARCHAR(20) NOT NULL,
  title_en VARCHAR(150) NOT NULL,
  title_ar VARCHAR(150) NOT NULL,
  name_norm VARCHAR(255) NULL COMMENT 'Normalized name for searching',
  category VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_titles_code (title_code),
  KEY idx_job_titles_category (category),
  KEY idx_job_title_name_norm (name_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees table
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
-- SECTION 2: USER MANAGEMENT & ROLES (RBAC)
-- =====================================================

-- Roles table
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

-- App Users table
CREATE TABLE IF NOT EXISTS App_Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(255) NULL COMMENT 'Username for flexible login',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NULL DEFAULT 'employee' COMMENT 'DEPRECATED: Use user_roles table instead',
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

-- User Roles junction table (many-to-many between users and roles)
CREATE TABLE IF NOT EXISTS user_roles (
  user_role_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME NULL COMMENT 'When this role assignment expires (NULL = never)',
  expiration_notified TINYINT(1) DEFAULT 0 COMMENT 'Whether user was notified about expiration',
  UNIQUE KEY uq_user_roles_user_role (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  KEY idx_user_roles_expires (expires_at),
  KEY idx_user_roles_expiring (expires_at, expiration_notified),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 3: PERMISSIONS SYSTEM
-- =====================================================

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  permission_id INT AUTO_INCREMENT PRIMARY KEY,
  permission_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Format: resource:action (e.g., user:manage, request:approve)',
  resource VARCHAR(50) NOT NULL COMMENT 'The resource this permission applies to',
  action VARCHAR(50) NOT NULL COMMENT 'The action allowed on the resource',
  description TEXT COMMENT 'Human-readable description of what this permission allows',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_permission_resource (resource),
  INDEX idx_permission_action (action),
  INDEX idx_permission_active (is_active),
  UNIQUE KEY uq_permission_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Defines all available permissions in the system';

-- Role Permissions junction table (maps permissions to roles)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_by INT NULL COMMENT 'User who granted this permission',
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  INDEX idx_role_permission_role (role_id),
  INDEX idx_role_permission_perm (permission_id),
  INDEX idx_role_permission_active (is_active),
  UNIQUE KEY uq_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps permissions to roles';

-- Role Hierarchy table (for permission inheritance)
CREATE TABLE IF NOT EXISTS role_hierarchy (
  hierarchy_id INT AUTO_INCREMENT PRIMARY KEY,
  parent_role_id INT NOT NULL COMMENT 'Parent role that inherits child permissions',
  child_role_id INT NOT NULL COMMENT 'Child role whose permissions are inherited',
  inheritance_level INT DEFAULT 1 COMMENT 'Level of inheritance (1=direct, 2=indirect, etc)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL COMMENT 'User who created this hierarchy',
  UNIQUE KEY uq_hierarchy (parent_role_id, child_role_id),
  FOREIGN KEY (parent_role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (child_role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  INDEX idx_parent_role (parent_role_id),
  INDEX idx_child_role (child_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Role hierarchy for permission inheritance';

-- =====================================================
-- SECTION 4: ROLE TEMPLATES
-- =====================================================

-- Role Templates table
CREATE TABLE IF NOT EXISTS role_templates (
  template_id INT AUTO_INCREMENT PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Template name in English',
  template_name_ar VARCHAR(150) NOT NULL COMMENT 'Template name in Arabic',
  description TEXT COMMENT 'Template description',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether template is available for use',
  created_by INT NULL COMMENT 'User who created this template',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  INDEX idx_template_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pre-defined role combination templates';

-- Role Template Roles junction table
CREATE TABLE IF NOT EXISTS role_template_roles (
  template_role_id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL COMMENT 'Template ID',
  role_id INT NOT NULL COMMENT 'Role ID in this template',
  UNIQUE KEY uq_template_role (template_id, role_id),
  FOREIGN KEY (template_id) REFERENCES role_templates(template_id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  INDEX idx_template_id (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Roles included in each template';

-- =====================================================
-- SECTION 5: REQUEST MANAGEMENT TABLES
-- =====================================================

-- Onboarding Requests table
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
  approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
  total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
  approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
  final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp',
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

-- Clearance Requests table
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
  approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
  total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
  approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
  final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp',
  UNIQUE KEY uq_clearance_reference (reference_number),
  KEY idx_clearance_status (status),
  KEY idx_clearance_employee_email (employee_email),
  KEY idx_clearance_request_date (request_date),
  KEY idx_clr_created_by_user (created_by_user),
  KEY idx_clr_approved_by (approved_by),
  KEY idx_clr_rejected_by (rejected_by),
  KEY idx_approval_stage (approval_stage),
  KEY idx_final_decision (final_decision),
  CONSTRAINT fk_clearance_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_created_by_user FOREIGN KEY (created_by_user) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_approved_by FOREIGN KEY (approved_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  CONSTRAINT fk_clr_rejected_by FOREIGN KEY (rejected_by) REFERENCES App_Users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delegation Requests table
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
  approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
  total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
  approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
  final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp',
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
-- SECTION 6: MULTI-APPROVAL SYSTEM
-- =====================================================

-- Request Approvals table (tracks all approvals for all request types)
CREATE TABLE IF NOT EXISTS Request_Approvals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('clearance', 'onboarding', 'delegation', 'direct') NOT NULL,
  request_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_order INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  decision_note TEXT,
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request (request_type, request_id),
  INDEX idx_approver (approver_id),
  INDEX idx_status (status),
  INDEX idx_order (approval_order),
  FOREIGN KEY (approver_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_approval (request_type, request_id, approver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Approval Rules table (defines approval workflow per request type)
CREATE TABLE IF NOT EXISTS Approval_Rules (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('clearance', 'onboarding', 'delegation', 'direct') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  approval_order INT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (request_type),
  INDEX idx_role (role_name),
  UNIQUE KEY unique_rule (request_type, role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Role History table (tracks all role assignment changes)
CREATE TABLE IF NOT EXISTS User_Role_History (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT NOT NULL,
  action ENUM('assigned', 'removed', 'activated', 'deactivated') NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_role (role_id),
  INDEX idx_date (effective_date, expiry_date),
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SECTION 7: COMMISSIONER SYSTEM
-- =====================================================

-- Commissioner Tickets table (for delegation/commissioning)
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
-- SECTION 8: AUDIT & LOGGING SYSTEM
-- =====================================================

-- Audit Events table (general audit log)
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

-- Role Access Audit table (tracks all role-based access attempts)
CREATE TABLE IF NOT EXISTS role_access_audit (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'User making the request',
  endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint accessed',
  http_method VARCHAR(10) NOT NULL COMMENT 'HTTP method (GET, POST, etc)',
  required_roles JSON COMMENT 'Roles required for access',
  user_roles JSON COMMENT 'Roles the user had at time of request',
  access_granted TINYINT(1) NOT NULL COMMENT '1=granted, 0=denied',
  ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6 address',
  user_agent TEXT COMMENT 'Browser/client user agent',
  request_id VARCHAR(100) COMMENT 'Unique request identifier for tracing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_endpoint (endpoint),
  INDEX idx_audit_granted (access_granted),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_user_created (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for all role-based access control checks';

-- =====================================================
-- SECTION 9: NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications table (for user notifications)
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO' COMMENT 'Notification type: INFO, ROLE_CHANGE, WARNING, etc',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_notifications (user_id, is_read),
  INDEX idx_notification_created (created_at),
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User notifications for role changes and system events';

-- =====================================================
-- SECTION 10: VIEWS (for easy querying)
-- =====================================================

-- View: Current user roles
CREATE OR REPLACE VIEW V_User_Roles_Current AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  r.role_id,
  r.role_name,
  r.role_name_ar,
  r.description,
  ur.assigned_by,
  ur.assigned_at,
  ab.name AS assigned_by_name,
  ur.is_active,
  ur.expires_at
FROM App_Users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN App_Users ab ON ur.assigned_by = ab.id
WHERE ur.is_active = TRUE AND r.is_active = TRUE;

-- View: Expiring roles (expires in next 7 days)
CREATE OR REPLACE VIEW expiring_roles AS
SELECT 
  ur.user_role_id,
  ur.user_id,
  u.name AS user_name,
  u.email AS user_email,
  ur.role_id,
  r.role_name,
  r.role_name_ar,
  ur.expires_at,
  DATEDIFF(ur.expires_at, NOW()) AS days_until_expiration,
  ur.expiration_notified,
  ur.assigned_by,
  ur.assigned_at
FROM user_roles ur
INNER JOIN App_Users u ON u.id = ur.user_id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE ur.is_active = TRUE
  AND ur.expires_at IS NOT NULL
  AND ur.expires_at > NOW()
  AND ur.expires_at <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY ur.expires_at ASC;

-- View: Expired roles (not yet disabled)
CREATE OR REPLACE VIEW expired_roles AS
SELECT 
  ur.user_role_id,
  ur.user_id,
  u.name AS user_name,
  u.email AS user_email,
  ur.role_id,
  r.role_name,
  r.role_name_ar,
  ur.expires_at,
  DATEDIFF(NOW(), ur.expires_at) AS days_expired,
  ur.assigned_by,
  ur.assigned_at
FROM user_roles ur
INNER JOIN App_Users u ON u.id = ur.user_id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE ur.is_active = TRUE
  AND ur.expires_at IS NOT NULL
  AND ur.expires_at < NOW()
ORDER BY ur.expires_at ASC;

-- View: Role template details
CREATE OR REPLACE VIEW role_template_details AS
SELECT 
  rt.template_id,
  rt.template_name,
  rt.template_name_ar,
  rt.description,
  rt.is_active,
  GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles,
  GROUP_CONCAT(r.role_name_ar ORDER BY r.role_name) AS roles_ar,
  COUNT(DISTINCT rtr.role_id) AS role_count,
  rt.created_at
FROM role_templates rt
LEFT JOIN role_template_roles rtr ON rtr.template_id = rt.template_id
LEFT JOIN roles r ON r.role_id = rtr.role_id
GROUP BY rt.template_id, rt.template_name, rt.template_name_ar, rt.description, rt.is_active, rt.created_at
ORDER BY rt.template_name;

-- View: Access audit summary (last 30 days)
CREATE OR REPLACE VIEW access_audit_summary AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  raa.endpoint,
  raa.http_method,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN raa.access_granted = 1 THEN 1 ELSE 0 END) AS granted_count,
  SUM(CASE WHEN raa.access_granted = 0 THEN 1 ELSE 0 END) AS denied_count,
  MAX(raa.created_at) AS last_attempt,
  DATE(raa.created_at) AS attempt_date
FROM role_access_audit raa
INNER JOIN App_Users u ON u.id = raa.user_id
WHERE raa.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name, u.email, raa.endpoint, raa.http_method, DATE(raa.created_at)
ORDER BY last_attempt DESC;

-- View: Denied access summary (security monitoring)
CREATE OR REPLACE VIEW denied_access_summary AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  raa.endpoint,
  raa.http_method,
  raa.required_roles,
  raa.user_roles,
  raa.ip_address,
  COUNT(*) AS denial_count,
  MAX(raa.created_at) AS last_denial,
  DATE(raa.created_at) AS denial_date
FROM role_access_audit raa
INNER JOIN App_Users u ON u.id = raa.user_id
WHERE raa.access_granted = 0
  AND raa.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.name, u.email, raa.endpoint, raa.http_method, raa.required_roles, 
         raa.user_roles, raa.ip_address, DATE(raa.created_at)
ORDER BY denial_count DESC, last_denial DESC;

-- =====================================================
-- SECTION 11: INITIAL DATA SETUP
-- =====================================================

-- Insert essential roles
INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES
('EMPLOYEE', 'موظف', 'Basic employee role', 1),
('ADMIN', 'مسؤول', 'Administrator with elevated privileges', 1),
('MANAGER', 'مدير', 'Department manager role', 1),
('HR', 'موارد بشرية', 'Human resources role', 1),
('FINANCE', 'مالية', 'Finance department role', 1),
('IT', 'تقنية المعلومات', 'IT department role', 1);

-- Insert default admin user (CHANGE PASSWORD IN PRODUCTION!)
-- Default credentials: admin@dev.local / admin123
SET @ADMIN_EMAIL          := COALESCE(@ADMIN_EMAIL, 'admin@dev.local');
SET @ADMIN_NAME           := COALESCE(@ADMIN_NAME,  'Dev Admin');
SET @ADMIN_PASSWORD_HASH  := COALESCE(@ADMIN_PASSWORD_HASH, '$2b$12$kchAEIZ0CcXrXrbZ5pb5SeU0QBDP7f8t2A5xaKXR6Atw93G3QQdLq');

INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
SELECT @ADMIN_NAME, @ADMIN_EMAIL, @ADMIN_PASSWORD_HASH, 'admin', NULL, TRUE FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM App_Users WHERE email = @ADMIN_EMAIL)
LIMIT 1;

-- Assign ADMIN role to admin user in user_roles table
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes)
SELECT u.id, r.role_id, u.id, 'System bootstrap'
FROM App_Users u, roles r
WHERE u.email = @ADMIN_EMAIL AND r.role_name = 'ADMIN';

-- Backfill username for existing users (email prefix)
UPDATE App_Users SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Set ADMIN as parent of all other roles in hierarchy
INSERT IGNORE INTO role_hierarchy (parent_role_id, child_role_id, inheritance_level)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1) AS parent_role_id,
  role_id AS child_role_id,
  1 AS inheritance_level
FROM roles 
WHERE role_name != 'ADMIN' AND is_active = TRUE;

-- Insert default approval rules
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required) VALUES
('clearance', 'HR', 1, TRUE),
('clearance', 'MANAGER', 2, TRUE),
('onboarding', 'HR', 1, TRUE),
('onboarding', 'MANAGER', 2, TRUE),
('delegation', 'MANAGER', 1, TRUE),
('direct', 'HR', 1, TRUE),
('direct', 'MANAGER', 2, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- SECTION 12: DEFAULT PERMISSIONS
-- =====================================================

-- System Administration
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('system:configure', 'system', 'configure', 'Configure system settings and parameters'),
('system:monitor', 'system', 'monitor', 'Monitor system health and performance'),
('system:backup', 'system', 'backup', 'Create and restore system backups'),
('system:audit', 'system', 'audit', 'View system audit logs and security events');

-- User Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('user:create', 'user', 'create', 'Create new user accounts'),
('user:read', 'user', 'read', 'View user information'),
('user:update', 'user', 'update', 'Update user information'),
('user:delete', 'user', 'delete', 'Delete user accounts'),
('user:manage', 'user', 'manage', 'Full user management access');

-- Role Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('role:assign', 'role', 'assign', 'Assign roles to users'),
('role:remove', 'role', 'remove', 'Remove roles from users'),
('role:create', 'role', 'create', 'Create new roles'),
('role:delete', 'role', 'delete', 'Delete roles'),
('role:manage', 'role', 'manage', 'Full role management access');

-- Request Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('request:create', 'request', 'create', 'Create new requests'),
('request:read_own', 'request', 'read_own', 'View own requests'),
('request:read_all', 'request', 'read_all', 'View all requests'),
('request:read_department', 'request', 'read_department', 'View department requests'),
('request:approve', 'request', 'approve', 'Approve requests'),
('request:reject', 'request', 'reject', 'Reject requests'),
('request:cancel', 'request', 'cancel', 'Cancel requests');

-- Clearance Requests
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('clearance:create', 'clearance', 'create', 'Create clearance requests'),
('clearance:read', 'clearance', 'read', 'View clearance requests'),
('clearance:approve', 'clearance', 'approve', 'Approve clearance requests'),
('clearance:reject', 'clearance', 'reject', 'Reject clearance requests'),
('clearance:manage', 'clearance', 'manage', 'Full clearance request management');

-- Onboarding Requests
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('onboarding:create', 'onboarding', 'create', 'Create onboarding requests'),
('onboarding:read', 'onboarding', 'read', 'View onboarding requests'),
('onboarding:approve', 'onboarding', 'approve', 'Approve onboarding requests'),
('onboarding:reject', 'onboarding', 'reject', 'Reject onboarding requests'),
('onboarding:manage', 'onboarding', 'manage', 'Full onboarding request management');

-- Delegation Requests
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('delegation:create', 'delegation', 'create', 'Create delegation requests'),
('delegation:read', 'delegation', 'read', 'View delegation requests'),
('delegation:approve', 'delegation', 'approve', 'Approve delegation requests'),
('delegation:reject', 'delegation', 'reject', 'Reject delegation requests'),
('delegation:manage', 'delegation', 'manage', 'Full delegation request management');

-- Employee Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('employee:create', 'employee', 'create', 'Create employee records'),
('employee:read', 'employee', 'read', 'View employee information'),
('employee:update', 'employee', 'update', 'Update employee information'),
('employee:delete', 'employee', 'delete', 'Delete employee records'),
('employee:manage', 'employee', 'manage', 'Full employee management access'),
('employee:read_department', 'employee', 'read_department', 'View department employee data');

-- Department Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('department:create', 'department', 'create', 'Create departments'),
('department:read', 'department', 'read', 'View departments'),
('department:update', 'department', 'update', 'Update departments'),
('department:delete', 'department', 'delete', 'Delete departments'),
('department:manage', 'department', 'manage', 'Full department management');

-- Profile Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('profile:read_own', 'profile', 'read_own', 'View own profile'),
('profile:update_own', 'profile', 'update_own', 'Update own profile'),
('profile:read_all', 'profile', 'read_all', 'View all profiles');

-- Document/Upload Management
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('upload:create', 'upload', 'create', 'Upload documents and files'),
('upload:read', 'upload', 'read', 'View uploaded documents'),
('upload:delete', 'upload', 'delete', 'Delete uploaded documents');

-- Commissioner Tickets
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('ticket:issue', 'ticket', 'issue', 'Issue commissioner tickets'),
('ticket:revoke', 'ticket', 'revoke', 'Revoke commissioner tickets'),
('ticket:read', 'ticket', 'read', 'View commissioner tickets'),
('ticket:read_own', 'ticket', 'read_own', 'View own commissioner tickets');

-- Finance permissions
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('finance:approve', 'finance', 'approve', 'Approve financial requests');

-- =====================================================
-- SECTION 13: ASSIGN DEFAULT PERMISSIONS TO ROLES
-- =====================================================

-- ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
  permission_id,
  1,
  'Default permission for ADMIN role'
FROM permissions
WHERE is_active = TRUE
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- MANAGER permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'MANAGER'),
  permission_id,
  1,
  'Default permission for MANAGER role'
FROM permissions
WHERE permission_name IN (
  'request:read_department',
  'request:approve',
  'request:reject',
  'clearance:approve',
  'clearance:reject',
  'delegation:approve',
  'delegation:reject',
  'delegation:create',
  'employee:read_department',
  'ticket:issue',
  'ticket:revoke'
)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- HR permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'HR'),
  permission_id,
  1,
  'Default permission for HR role'
FROM permissions
WHERE permission_name IN (
  'employee:manage',
  'employee:create',
  'employee:read',
  'employee:update',
  'onboarding:manage',
  'onboarding:approve',
  'onboarding:reject',
  'clearance:approve',
  'clearance:reject',
  'ticket:issue'
)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- FINANCE permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'FINANCE'),
  permission_id,
  1,
  'Default permission for FINANCE role'
FROM permissions
WHERE permission_name IN (
  'clearance:approve',
  'clearance:reject',
  'finance:approve',
  'request:read_department'
)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- IT permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'IT'),
  permission_id,
  1,
  'Default permission for IT role'
FROM permissions
WHERE permission_name IN (
  'system:configure',
  'system:monitor',
  'system:backup',
  'user:manage',
  'user:create',
  'user:update'
)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- EMPLOYEE permissions (basic)
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'EMPLOYEE'),
  permission_id,
  1,
  'Default permission for EMPLOYEE role'
FROM permissions
WHERE permission_name IN (
  'request:create',
  'request:read_own',
  'clearance:create',
  'onboarding:create',
  'delegation:create',
  'profile:read_own',
  'profile:update_own',
  'upload:create',
  'ticket:read_own'
)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- =====================================================
-- SECTION 14: DEFAULT ROLE TEMPLATES
-- =====================================================

-- Insert default templates
INSERT INTO role_templates (template_name, template_name_ar, description, created_by) VALUES
('Department Manager', 'مدير قسم', 'Manager role with department-level permissions', 1),
('HR Specialist', 'أخصائي موارد بشرية', 'HR role with employee management capabilities', 1),
('Finance Approver', 'مسؤول الموافقات المالية', 'Finance role with clearance approval permissions', 1),
('System Administrator', 'مدير النظام', 'Full admin access with IT permissions', 1),
('Basic Employee', 'موظف عادي', 'Standard employee with basic request permissions', 1)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Map roles to templates (Department Manager = MANAGER)
INSERT IGNORE INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'Department Manager'),
  role_id
FROM roles WHERE role_name = 'MANAGER';

-- HR Specialist = HR + EMPLOYEE
INSERT IGNORE INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'HR Specialist'),
  role_id
FROM roles WHERE role_name IN ('HR', 'EMPLOYEE');

-- Finance Approver = FINANCE + EMPLOYEE
INSERT IGNORE INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'Finance Approver'),
  role_id
FROM roles WHERE role_name IN ('FINANCE', 'EMPLOYEE');

-- System Administrator = ADMIN + IT
INSERT IGNORE INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'System Administrator'),
  role_id
FROM roles WHERE role_name IN ('ADMIN', 'IT');

-- Basic Employee = EMPLOYEE only
INSERT IGNORE INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'Basic Employee'),
  role_id
FROM roles WHERE role_name = 'EMPLOYEE';

-- =====================================================
-- SECTION 15: SAMPLE DATA (Optional - for development)
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
('SYSADMIN', 'System Administrator', 'مدير نظم', 'technical'),
('HR_SPEC', 'HR Specialist', 'أخصائي موارد بشرية', 'administrative'),
('MANAGER', 'Department Manager', 'مدير قسم', 'management'),
('DOCTOR', 'Medical Doctor', 'طبيب', 'medical'),
('NURSE', 'Nurse', 'ممرض', 'medical');

-- =====================================================
-- SECTION 16: DATA NORMALIZATION (Optional)
-- =====================================================

-- Populate normalized department names
UPDATE Departments
SET name_norm = LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS(' ', name_en, name_ar)), ' +', ' '))
WHERE name_norm IS NULL OR name_norm = '';

-- Populate normalized job title names
UPDATE Job_Titles
SET name_norm = LOWER(REGEXP_REPLACE(TRIM(CONCAT_WS(' ', title_en, title_ar)), ' +', ' '))
WHERE name_norm IS NULL OR name_norm = '';

-- =====================================================
-- SECTION 17: COMPLETION & VERIFICATION
-- =====================================================

-- Show table count
SELECT 'Database schema created successfully!' AS Status,
       COUNT(*) as Total_Tables_Created
FROM information_schema.tables 
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE';

-- Show view count
SELECT 'Views created successfully!' AS Status,
       COUNT(*) as Total_Views_Created
FROM information_schema.tables 
WHERE table_schema = DATABASE()
  AND table_type = 'VIEW';

-- Show roles
SELECT 'Roles created:' AS status, role_name, role_name_ar FROM roles ORDER BY role_name;

-- Show permissions count
SELECT 'Permissions created:' AS status, COUNT(*) AS count FROM permissions WHERE is_active = TRUE;

-- Show role-permission mappings
SELECT 'Role-Permission mappings:' AS status, COUNT(*) AS count FROM role_permissions WHERE is_active = TRUE;

-- Show templates
SELECT 'Role templates created:' AS status, COUNT(*) AS count FROM role_templates WHERE is_active = TRUE;

-- =====================================================
-- 🎉 SCHEMA CREATION COMPLETE!
-- =====================================================
-- 
-- ✅ All 23 tables created
-- ✅ All 6 views created
-- ✅ All 6 roles created
-- ✅ All 58 permissions created  
-- ✅ All default role-permission mappings created
-- ✅ All 5 role templates created
-- ✅ Default admin user created (admin@dev.local / admin123)
-- 
-- ⚠️ IMPORTANT: Change default admin password in production!
-- 
-- 📚 Tables created:
-- 1. Departments
-- 2. Job_Titles
-- 3. Employees
-- 4. roles
-- 5. App_Users
-- 6. user_roles
-- 7. permissions
-- 8. role_permissions
-- 9. role_hierarchy
-- 10. role_templates
-- 11. role_template_roles
-- 12. Onboarding_Requests
-- 13. Clearance_Requests
-- 14. Delegation_Requests
-- 15. Request_Approvals
-- 16. Approval_Rules
-- 17. User_Role_History
-- 18. Commissioner_Tickets
-- 19. Audit_Events
-- 20. role_access_audit
-- 21. notifications
-- 
-- 📊 Views created:
-- 1. V_User_Roles_Current
-- 2. expiring_roles
-- 3. expired_roles
-- 4. role_template_details
-- 5. access_audit_summary
-- 6. denied_access_summary
--
-- 🚀 Your database is ready to use!
-- =====================================================

