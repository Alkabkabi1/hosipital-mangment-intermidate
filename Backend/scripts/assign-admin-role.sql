-- ========================================
-- Script to Check and Assign ADMIN Role
-- ========================================

-- 1. Check current users and their roles
SELECT 
    u.id,
    u.name,
    u.email,
    u.role as legacy_role,
    GROUP_CONCAT(r.role_name) as active_roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.role
ORDER BY u.id;

-- 2. Check available roles
SELECT * FROM roles ORDER BY role_name;

-- ========================================
-- SOLUTION 1: Assign ADMIN role to a specific user by email
-- Replace 'your@email.com' with your actual email
-- ========================================

-- First, find your user ID
SET @user_email = 'admin@hospital.sa';  -- CHANGE THIS TO YOUR EMAIL
SELECT @user_id := id FROM App_Users WHERE email = @user_email COLLATE utf8mb4_unicode_ci LIMIT 1;

-- Check if user was found
SELECT 
    CASE 
        WHEN @user_id IS NULL THEN '❌ User not found! Change the email above.'
        ELSE CONCAT('✅ Found user ID: ', @user_id)
    END as status;

-- Find ADMIN role ID
SELECT @admin_role_id := role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1;

-- Check if ADMIN role exists
SELECT 
    CASE 
        WHEN @admin_role_id IS NULL THEN '❌ ADMIN role not found in database!'
        ELSE CONCAT('✅ Found ADMIN role ID: ', @admin_role_id)
    END as status;

-- Assign ADMIN role to the user (if both exist)
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT @user_id, @admin_role_id, @user_id, TRUE
WHERE @user_id IS NOT NULL 
  AND @admin_role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = @user_id AND role_id = @admin_role_id
  );

-- Verify the assignment
SELECT 
    u.id,
    u.name,
    u.email,
    GROUP_CONCAT(r.role_name) as roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.id = @user_id
GROUP BY u.id, u.name, u.email;

-- ========================================
-- SOLUTION 2: If ADMIN role doesn't exist, create it
-- ========================================

INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active)
VALUES ('ADMIN', 'مدير', 'System administrator with full access', TRUE);

-- ========================================
-- SOLUTION 3: Assign ADMIN to ALL existing users (use with caution!)
-- ========================================

-- Uncomment the lines below if you want to give ADMIN role to everyone:
-- INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
-- SELECT 
--     u.id as user_id,
--     r.role_id,
--     u.id as assigned_by,
--     TRUE
-- FROM App_Users u
-- CROSS JOIN roles r
-- WHERE r.role_name = 'ADMIN'
--   AND NOT EXISTS (
--     SELECT 1 FROM user_roles ur
--     WHERE ur.user_id = u.id AND ur.role_id = r.role_id
--   );

-- ========================================
-- Final check: Show all users with ADMIN role
-- ========================================

SELECT 
    u.id,
    u.name,
    u.email,
    'ADMIN' as role
FROM App_Users u
INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
INNER JOIN roles r ON ur.role_id = r.role_id
WHERE r.role_name = 'ADMIN' AND r.is_active = TRUE;

