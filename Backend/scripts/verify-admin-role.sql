-- ========================================
-- Quick Check: Is ADMIN role assigned?
-- ========================================

-- 1. Show your current user and roles
SELECT 
    u.id,
    u.name,
    u.email,
    GROUP_CONCAT(r.role_name SEPARATOR ', ') as roles,
    COUNT(ur.role_id) as role_count
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
WHERE u.email = 'admin@hospital.sa'  -- ⚠️ CHANGE TO YOUR EMAIL
GROUP BY u.id, u.name, u.email;

-- 2. If role_count is 0, assign ADMIN role now:
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    u.id,
    r.role_id,
    u.id,
    TRUE
FROM App_Users u
CROSS JOIN roles r
WHERE u.email = 'admin@hospital.sa'  -- ⚠️ CHANGE TO YOUR EMAIL
  AND r.role_name = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2
    WHERE ur2.user_id = u.id AND ur2.role_id = r.role_id
  );

-- 3. Verify again
SELECT 
    u.id,
    u.name,
    u.email,
    GROUP_CONCAT(r.role_name SEPARATOR ', ') as roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
WHERE u.email = 'admin@hospital.sa'  -- ⚠️ CHANGE TO YOUR EMAIL
GROUP BY u.id, u.name, u.email;

-- 4. Check if ADMIN role exists at all
SELECT * FROM roles WHERE role_name = 'ADMIN';

-- If ADMIN role doesn't exist, create it:
-- INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active)
-- VALUES ('ADMIN', 'مدير', 'System administrator', TRUE);

