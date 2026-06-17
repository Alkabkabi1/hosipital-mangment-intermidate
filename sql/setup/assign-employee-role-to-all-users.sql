-- =====================================================
-- Assign EMPLOYEE Role to All Users Without Roles
-- =====================================================
-- 
-- This script ensures every user in the system has at least
-- the EMPLOYEE role assigned. Users who already have roles
-- will not be affected (due to INSERT IGNORE).
--
-- Safe to run multiple times (idempotent)
-- 
-- Date: October 26, 2025
-- =====================================================

-- Step 1: Verify EMPLOYEE role exists
-- If this returns 0 rows, you need to create the EMPLOYEE role first
SELECT 
    role_id, 
    role_name, 
    role_name_ar,
    is_active 
FROM roles 
WHERE role_name = 'EMPLOYEE';

-- If EMPLOYEE role doesn't exist, create it:
-- INSERT INTO roles (role_name, role_name_ar, description, is_active)
-- VALUES ('EMPLOYEE', 'موظف', 'Basic employee role with standard permissions', 1);

-- =====================================================
-- Step 2: Check current status (optional - for review)
-- =====================================================
-- See which users currently have no roles
SELECT 
    u.id,
    u.email,
    u.name,
    u.is_active as user_active,
    COUNT(ur.user_role_id) as role_count
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
WHERE u.is_active = 1  -- Only active users
GROUP BY u.id, u.email, u.name, u.is_active
HAVING role_count = 0
ORDER BY u.email;

-- =====================================================
-- Step 3: Assign EMPLOYEE role to all users without roles
-- =====================================================
-- This query:
-- 1. Finds all active users
-- 2. Excludes users who already have the EMPLOYEE role
-- 3. Assigns EMPLOYEE role to those missing it
-- 4. Uses INSERT IGNORE to avoid errors if role already exists

INSERT IGNORE INTO user_roles (
    user_id, 
    role_id, 
    assigned_by,
    is_active,
    notes,
    assigned_at
)
SELECT 
    u.id AS user_id,
    r.role_id,
    u.id AS assigned_by,  -- Self-assigned (or set to NULL if preferred)
    1 AS is_active,
    'Bulk assignment: Auto-assigned EMPLOYEE role to ensure all users have at least one role' AS notes,
    NOW() AS assigned_at
FROM App_Users u
CROSS JOIN roles r
WHERE r.role_name = 'EMPLOYEE'
  AND r.is_active = 1
  AND u.is_active = 1  -- Only assign to active users
  AND NOT EXISTS (
    -- Exclude users who already have ANY role assigned (active or inactive)
    SELECT 1 
    FROM user_roles ur2 
    WHERE ur2.user_id = u.id 
      AND ur2.is_active = 1
  );

-- =====================================================
-- Step 4: Verification - Check results
-- =====================================================
-- After running Step 3, verify all users now have roles:

SELECT 
    u.id,
    u.email,
    u.name,
    COUNT(ur.user_role_id) as role_count,
    GROUP_CONCAT(r.role_name ORDER BY r.role_name SEPARATOR ', ') as roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = 1
WHERE u.is_active = 1
GROUP BY u.id, u.email, u.name
ORDER BY u.email;

-- =====================================================
-- Alternative: Assign EMPLOYEE role only if user has NO roles at all
-- (More targeted - only affects users with zero roles)
-- =====================================================

-- Uncomment this if you prefer to assign EMPLOYEE role only to users
-- who have absolutely NO roles (including inactive ones):
/*
INSERT IGNORE INTO user_roles (
    user_id, 
    role_id, 
    assigned_by,
    is_active,
    notes,
    assigned_at
)
SELECT 
    u.id AS user_id,
    r.role_id,
    NULL AS assigned_by,  -- Set to NULL for bulk assignment
    1 AS is_active,
    'Bulk assignment: Auto-assigned EMPLOYEE role' AS notes,
    NOW() AS assigned_at
FROM App_Users u
CROSS JOIN roles r
WHERE r.role_name = 'EMPLOYEE'
  AND r.is_active = 1
  AND u.is_active = 1
  AND NOT EXISTS (
    -- Exclude users who already have the EMPLOYEE role
    SELECT 1 
    FROM user_roles ur2 
    WHERE ur2.user_id = u.id 
      AND ur2.role_id = r.role_id
  )
  AND NOT EXISTS (
    -- Only assign if user has NO active roles at all
    SELECT 1 
    FROM user_roles ur3 
    WHERE ur3.user_id = u.id 
      AND ur3.is_active = 1
  );
*/

-- =====================================================
-- Expected Results:
-- =====================================================
-- After running Step 3, you should see:
-- - All active users now have at least 1 role (EMPLOYEE)
-- - Users who already had roles are unaffected
-- - The user_roles table now has entries for all users
-- 
-- Next steps:
-- - Manager can assign additional roles (HR, MANAGER, etc.) via UI
-- - Users need to log out and log back in to refresh their token
-- - Or wait 30 seconds for automatic token refresh
-- =====================================================

