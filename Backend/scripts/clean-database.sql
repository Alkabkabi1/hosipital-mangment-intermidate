-- =====================================================
-- CLEAN DATABASE - Remove All Data
-- =====================================================
-- This script removes ALL data from the database
-- Use with caution! This is irreversible!
-- =====================================================

USE hospital_management;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. Clear Request Tables
-- =====================================================

TRUNCATE TABLE Clearance_Requests;
TRUNCATE TABLE Onboarding_Requests;
TRUNCATE TABLE Delegation_Requests;

-- =====================================================
-- 2. Clear Workflow Tables
-- =====================================================

TRUNCATE TABLE Clearance_Forms;
TRUNCATE TABLE ClearanceStatuses;
TRUNCATE TABLE Clearance_Status_History;
TRUNCATE TABLE Clearance_Signatures;

TRUNCATE TABLE onboarding_forms;
TRUNCATE TABLE Onboarding_Status_History;
TRUNCATE TABLE Onboarding_Signatures;

TRUNCATE TABLE delegation_forms;
TRUNCATE TABLE DelegationStatuses;
TRUNCATE TABLE Delegation_Signatures;

-- =====================================================
-- 3. Clear Audit and History Tables
-- =====================================================

TRUNCATE TABLE role_audit_log;

-- =====================================================
-- 4. Clear User Roles (Keep roles table)
-- =====================================================

DELETE FROM user_roles WHERE user_id NOT IN (
  SELECT id FROM App_Users WHERE email = 'admin@example.com'
);

-- =====================================================
-- 5. Clear Users (Keep admin user)
-- =====================================================

DELETE FROM App_Users WHERE email != 'admin@example.com';

-- =====================================================
-- 6. Clear Employees (Keep essential data)
-- =====================================================

-- Option 1: Delete all employees
-- TRUNCATE TABLE Employees;

-- Option 2: Keep employees but clear their data (uncomment if needed)
-- UPDATE Employees SET 
--   phone = NULL,
--   email = NULL,
--   address = NULL
-- WHERE employee_id > 0;

-- =====================================================
-- 7. Reset Auto Increment Values
-- =====================================================

ALTER TABLE Clearance_Requests AUTO_INCREMENT = 1;
ALTER TABLE Onboarding_Requests AUTO_INCREMENT = 1;
ALTER TABLE Delegation_Requests AUTO_INCREMENT = 1;
ALTER TABLE Clearance_Forms AUTO_INCREMENT = 1;
ALTER TABLE onboarding_forms AUTO_INCREMENT = 1;
ALTER TABLE delegation_forms AUTO_INCREMENT = 1;
ALTER TABLE App_Users AUTO_INCREMENT = 2;

-- =====================================================
-- 8. Re-enable Foreign Key Checks
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Verification Queries
-- =====================================================

SELECT 'Clearance Requests' as Table_Name, COUNT(*) as Count FROM Clearance_Requests
UNION ALL
SELECT 'Onboarding Requests', COUNT(*) FROM Onboarding_Requests
UNION ALL
SELECT 'Delegation Requests', COUNT(*) FROM Delegation_Requests
UNION ALL
SELECT 'App Users', COUNT(*) FROM App_Users
UNION ALL
SELECT 'User Roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'Employees', COUNT(*) FROM Employees;

-- =====================================================
-- Success Message
-- =====================================================

SELECT '✅ Database cleaned successfully!' as Status;
SELECT 'Only admin user and base data remain' as Note;

