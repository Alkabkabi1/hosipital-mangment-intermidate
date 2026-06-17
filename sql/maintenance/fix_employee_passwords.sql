-- ==========================================
-- Fix Employee Passwords to "123456"
-- Date: October 26, 2025
-- ==========================================

-- If you already ran the old SQL with wrong password hash,
-- run this to fix all employee passwords to "123456"

-- Correct bcrypt hash for "123456": 
-- $2b$12$HrOGpvrvkeM/tE09H87WeemgYGzcO3Q3YbPF1upRq2zPyUPBPI6wy

UPDATE App_Users 
SET password_hash = '$2b$12$HrOGpvrvkeM/tE09H87WeemgYGzcO3Q3YbPF1upRq2zPyUPBPI6wy' 
WHERE email LIKE 'employee20%@hospital.sa';

-- Verify the update
SELECT 
    id,
    name,
    email,
    role,
    is_active
FROM App_Users 
WHERE email LIKE 'employee20%@hospital.sa'
ORDER BY email
LIMIT 10;

-- Show count
SELECT COUNT(*) as updated_count 
FROM App_Users 
WHERE email LIKE 'employee20%@hospital.sa';

COMMIT;

