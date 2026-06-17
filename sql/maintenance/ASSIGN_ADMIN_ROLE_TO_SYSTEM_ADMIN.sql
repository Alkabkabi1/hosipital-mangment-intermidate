-- Assign ADMIN role to System Admin user

-- Step 1: Verify System Admin user exists
SELECT id, name, email, role FROM App_Users WHERE email = 'admin@hospital.sa';

-- Step 2: Get ADMIN role ID
SELECT role_id, role_name FROM roles WHERE role_name = 'ADMIN';

-- Step 3: Assign ADMIN role to System Admin
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
VALUES (
  (SELECT id FROM App_Users WHERE email = 'admin@hospital.sa'),
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
  (SELECT id FROM App_Users WHERE email = 'admin@hospital.sa'), -- self-assigned
  TRUE
)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- Step 4: Verify assignment
SELECT 
  u.id,
  u.name,
  u.email,
  r.role_name,
  ur.is_active,
  ur.assigned_at
FROM user_roles ur
INNER JOIN App_Users u ON ur.user_id = u.id
INNER JOIN roles r ON ur.role_id = r.role_id
WHERE u.email = 'admin@hospital.sa';

-- Expected: Should show ADMIN role assigned to System Admin

