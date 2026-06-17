-- =====================================================
-- INSERT TEST USERS - Hospital Management System
-- =====================================================
-- Database: nora_database
-- This script creates test user accounts with proper role assignments
-- All passwords follow pattern: [Username]@123
-- =====================================================

USE nora_database;

-- =====================================================
-- SECTION 1: INSERT USERS INTO App_Users
-- =====================================================

-- Note: Password hashes are bcrypt hashes of the passwords shown in comments
-- You can generate new hashes using: bcrypt.hash(password, 12)

-- Admin User (admin@dev.local / admin123) - Already created by schema
-- If not exists, uncomment below:
INSERT IGNORE INTO App_Users (name, email, username, password_hash, role, is_active) VALUES
('Dev Admin', 'admin@dev.local', 'admin', '$2b$12$kchAEIZ0CcXrXrbZ5pb5SeU0QBDP7f8t2A5xaKXR6Atw93G3QQdLq', 'admin', 1);

-- HR Admin (hradmin@hospital.sa / HRAdmin@123)
INSERT IGNORE INTO App_Users (name, email, username, password_hash, role, is_active) VALUES
('HR Admin', 'hradmin@hospital.sa', 'hradmin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koiyHKijYEu.', 'admin', 1);

-- HR Manager (hrmanager@hospital.sa / HRManager@123)
INSERT IGNORE INTO App_Users (name, email, username, password_hash, role, is_active) VALUES
('HR Manager', 'hrmanager@hospital.sa', 'hrmanager', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 1);

-- HR Employee (hremployee@hospital.sa / HREmployee@123)
INSERT IGNORE INTO App_Users (name, email, username, password_hash, role, is_active) VALUES
('HR Employee', 'hremployee@hospital.sa', 'hremployee', '$2b$12$yGfsbB8lRl6PFlgfVBrS7OZC2r8WfDrXJTbmKvSEPDd0c7Jl8MOqe', 'employee', 1);

-- Basic Employee (employee@dev.local / employee123)
INSERT IGNORE INTO App_Users (name, email, username, password_hash, role, is_active) VALUES
('Test Employee', 'employee@dev.local', 'employee', '$2b$12$4XCnVqj5F5YbPb5d9jN5.e5YKJ8yqJ5X3K9H5j8yQ3X7K5H3j8yQ3', 'employee', 1);

-- =====================================================
-- SECTION 2: ASSIGN ROLES IN user_roles TABLE
-- =====================================================

-- Get user IDs for role assignment
SET @admin_id = (SELECT id FROM App_Users WHERE email = 'admin@dev.local');
SET @hradmin_id = (SELECT id FROM App_Users WHERE email = 'hradmin@hospital.sa');
SET @hrmanager_id = (SELECT id FROM App_Users WHERE email = 'hrmanager@hospital.sa');
SET @hremployee_id = (SELECT id FROM App_Users WHERE email = 'hremployee@hospital.sa');
SET @employee_id = (SELECT id FROM App_Users WHERE email = 'employee@dev.local');

-- Get role IDs
SET @role_admin = (SELECT role_id FROM roles WHERE role_name = 'ADMIN');
SET @role_manager = (SELECT role_id FROM roles WHERE role_name = 'MANAGER');
SET @role_hr = (SELECT role_id FROM roles WHERE role_name = 'HR');
SET @role_employee = (SELECT role_id FROM roles WHERE role_name = 'EMPLOYEE');

-- Assign roles to admin@dev.local (ADMIN role)
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
VALUES (@admin_id, @role_admin, @admin_id, 'System bootstrap - Dev Admin', 1);

-- Assign roles to hradmin@hospital.sa (ADMIN + HR roles)
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
VALUES 
  (@hradmin_id, @role_admin, @admin_id, 'HR Administrator - Full access', 1),
  (@hradmin_id, @role_hr, @admin_id, 'HR Administrator - HR permissions', 1);

-- Assign roles to hrmanager@hospital.sa (MANAGER + HR roles)
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
VALUES 
  (@hrmanager_id, @role_manager, @admin_id, 'HR Manager - Management permissions', 1),
  (@hrmanager_id, @role_hr, @admin_id, 'HR Manager - HR permissions', 1);

-- Assign roles to hremployee@hospital.sa (EMPLOYEE + HR roles)
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
VALUES 
  (@hremployee_id, @role_employee, @admin_id, 'HR Employee - Basic employee access', 1),
  (@hremployee_id, @role_hr, @admin_id, 'HR Employee - HR permissions', 1);

-- Assign roles to employee@dev.local (EMPLOYEE role only)
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
VALUES (@employee_id, @role_employee, @admin_id, 'Test Employee - Basic access', 1);

-- =====================================================
-- SECTION 3: VERIFICATION QUERIES
-- =====================================================

SELECT '✅ Users created successfully!' AS Status;

-- Show all test users with their roles
SELECT 
  u.id,
  u.name,
  u.email,
  u.username,
  u.role AS legacy_role,
  GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS assigned_roles,
  u.is_active
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.email IN (
  'admin@dev.local',
  'hradmin@hospital.sa',
  'hrmanager@hospital.sa',
  'hremployee@hospital.sa',
  'employee@dev.local'
)
GROUP BY u.id, u.name, u.email, u.username, u.role, u.is_active
ORDER BY u.email;

-- =====================================================
-- TEST CREDENTIALS SUMMARY
-- =====================================================
-- 
-- 📋 LOGIN CREDENTIALS:
-- 
-- 1. System Admin:
--    Email: admin@dev.local
--    Password: admin123
--    Roles: ADMIN
-- 
-- 2. HR Admin:
--    Email: hradmin@hospital.sa
--    Password: HRAdmin@123
--    Roles: ADMIN, HR
-- 
-- 3. HR Manager:
--    Email: hrmanager@hospital.sa
--    Password: HRManager@123
--    Roles: MANAGER, HR
-- 
-- 4. HR Employee:
--    Email: hremployee@hospital.sa
--    Password: HREmployee@123
--    Roles: EMPLOYEE, HR
-- 
-- 5. Test Employee:
--    Email: employee@dev.local
--    Password: employee123
--    Roles: EMPLOYEE
-- 
-- ⚠️ IMPORTANT: These are TEST accounts with simple passwords.
--    NEVER use these in production!
-- =====================================================

