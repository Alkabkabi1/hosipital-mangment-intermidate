-- =====================================================
-- Migration: Create Permissions System
-- =====================================================
-- This migration creates a comprehensive permission
-- system with role-based permission assignment.
--
-- Version: 1.0
-- Date: October 20, 2025
-- =====================================================

USE nora_database;

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
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

-- =====================================================
-- ROLE_PERMISSIONS TABLE  
-- =====================================================
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

-- =====================================================
-- INSERT DEFAULT PERMISSIONS
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

-- Request Management - General
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

-- =====================================================
-- ASSIGN DEFAULT PERMISSIONS TO ROLES
-- =====================================================

-- ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id, granted_by, notes)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
  permission_id,
  1, -- System
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
INSERT IGNORE INTO permissions (permission_name, resource, action, description) VALUES
('finance:approve', 'finance', 'approve', 'Approve financial requests');

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
-- VERIFICATION QUERIES
-- =====================================================

SELECT 'Permissions created:' AS status, COUNT(*) AS count FROM permissions WHERE is_active = TRUE;
SELECT 'Role-Permission mappings:' AS status, COUNT(*) AS count FROM role_permissions WHERE is_active = TRUE;

-- Show permissions per role
SELECT 
  r.role_name,
  COUNT(rp.role_permission_id) AS permission_count,
  GROUP_CONCAT(p.permission_name ORDER BY p.permission_name SEPARATOR ', ') AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = TRUE
LEFT JOIN permissions p ON rp.permission_id = p.permission_id AND p.is_active = TRUE
GROUP BY r.role_id, r.role_name
ORDER BY r.role_name;

SELECT 'Migration 009: Permissions system created successfully' AS status;

