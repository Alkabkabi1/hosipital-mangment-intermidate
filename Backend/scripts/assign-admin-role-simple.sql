-- ========================================
-- SIMPLE VERSION: Assign ADMIN Role
-- ========================================
-- Just change the email below and run this!
-- ========================================

-- Step 1: Check current users and roles
SELECT 
    u.id,
    u.name,
    u.email,
    GROUP_CONCAT(r.role_name) as current_roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
GROUP BY u.id, u.name, u.email
ORDER BY u.id;

-- Step 2: Assign ADMIN role to your user
-- ⚠️ CHANGE THE EMAIL BELOW TO YOUR EMAIL! ⚠️

INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    u.id as user_id,
    r.role_id,
    u.id as assigned_by,
    TRUE as is_active
FROM App_Users u
CROSS JOIN roles r
WHERE u.email = 'admin@hospital.sa'  -- ⚠️ CHANGE THIS EMAIL!
  AND r.role_name = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = u.id 
      AND ur2.role_id = r.role_id
  );

-- Step 3: Verify the assignment
SELECT 
    u.id,
    u.name,
    u.email,
    GROUP_CONCAT(r.role_name) as roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'admin@hospital.sa'  -- ⚠️ CHANGE THIS EMAIL!
GROUP BY u.id, u.name, u.email;

-- If ADMIN role doesn't exist, uncomment and run this:
-- INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active)
-- VALUES ('ADMIN', 'مدير', 'System administrator', TRUE);

-- ========================================
-- Done! Now:
-- 1. Logout from the admin panel
-- 2. Login again (to refresh your JWT token)
-- 3. Try the login activity page again
-- ========================================

