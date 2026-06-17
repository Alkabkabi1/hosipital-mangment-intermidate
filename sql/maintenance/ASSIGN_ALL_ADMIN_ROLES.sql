-- Assign appropriate roles to all admin users

-- 1. System Admin - should have ADMIN role
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    u.id,
    (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
    u.id,
    TRUE
FROM App_Users u
WHERE u.email = 'admin@hospital.sa'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = u.id 
      AND ur2.role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN')
  );

-- 2. HR Admin - should have ADMIN + HR roles
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    u.id,
    r.role_id,
    u.id,
    TRUE
FROM App_Users u
CROSS JOIN roles r
WHERE u.email = 'hradmin@hospital.sa'
  AND r.role_name IN ('ADMIN', 'HR')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = u.id AND ur2.role_id = r.role_id
  );

-- 3. HR Manager - should have MANAGER + HR roles
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    u.id,
    r.role_id,
    u.id,
    TRUE
FROM App_Users u
CROSS JOIN roles r
WHERE u.email = 'hrmanager@hospital.sa'
  AND r.role_name IN ('MANAGER', 'HR')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = u.id AND ur2.role_id = r.role_id
  );

-- Verify all admin users have roles
SELECT 
    u.email,
    u.name,
    GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
FROM App_Users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE u.email IN ('admin@hospital.sa', 'hradmin@hospital.sa', 'hrmanager@hospital.sa')
GROUP BY u.id, u.email, u.name;

-- Expected results:
-- admin@hospital.sa: ADMIN
-- hradmin@hospital.sa: ADMIN,HR
-- hrmanager@hospital.sa: HR,MANAGER

