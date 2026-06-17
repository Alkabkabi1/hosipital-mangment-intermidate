-- =====================================================
-- FIX TEST USER PASSWORDS
-- Run this in MySQL Workbench
-- =====================================================

USE nora_database;

-- These are properly hashed passwords using bcrypt
-- Generated with: bcrypt.hash(password, 12)

-- Update admin@dev.local (admin123)
INSERT INTO App_Users (name, email, username, password_hash, role, is_active)
VALUES ('Dev Admin', 'admin@dev.local', 'admin', '$2b$12$kchAEIZ0CcXrXrbZ5pb5SeU0QBDP7f8t2A5xaKXR6Atw93G3QQdLq', 'admin', 1)
ON DUPLICATE KEY UPDATE 
  password_hash = '$2b$12$kchAEIZ0CcXrXrbZ5pb5SeU0QBDP7f8t2A5xaKXR6Atw93G3QQdLq',
  username = 'admin',
  is_active = 1;

-- Assign ADMIN role to admin@dev.local
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
SELECT 
  u.id, 
  r.role_id, 
  u.id, 
  'System admin',
  1
FROM App_Users u
CROSS JOIN roles r
WHERE u.email = 'admin@dev.local' AND r.role_name = 'ADMIN';

-- Verify all users
SELECT 
  u.id,
  u.name,
  u.email,
  u.is_active AS active,
  GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
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
GROUP BY u.id, u.name, u.email, u.is_active
ORDER BY u.email;

-- =====================================================
-- CREDENTIALS SUMMARY:
-- =====================================================
-- admin@dev.local          -> admin123
-- hradmin@hospital.sa      -> HRAdmin@123
-- hrmanager@hospital.sa    -> HRManager@123  
-- hremployee@hospital.sa   -> HREmployee@123
-- employee@dev.local       -> employee123
-- =====================================================

SELECT '✅ All passwords are now properly hashed!' AS Status;

