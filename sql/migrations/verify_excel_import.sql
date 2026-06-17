-- Verify Excel Import Results
-- Run this in MySQL Workbench to check the imported data

USE hospital_management;

-- Check employee import results
SELECT 'Employee Import Summary' as Info;
SELECT COUNT(*) as total_employees FROM Employees;
SELECT COUNT(*) as total_users FROM App_Users;
SELECT COUNT(*) as total_departments FROM Departments;

-- Sample employee data
SELECT 'Sample Employee Data' as Info;
SELECT 
    employee_number,
    full_name_ar,
    email_work,
    position,
    phone_primary
FROM Employees 
LIMIT 10;

-- Sample user accounts
SELECT 'Sample User Accounts' as Info;
SELECT 
    name,
    email,
    role,
    employee_id,
    is_active
FROM App_Users 
LIMIT 10;

-- Department breakdown
SELECT 'Department Breakdown' as Info;
SELECT 
    d.name_ar as department_name,
    COUNT(e.employee_id) as employee_count
FROM Departments d
LEFT JOIN Employees e ON e.department_id = d.department_id
GROUP BY d.department_id, d.name_ar
ORDER BY employee_count DESC;

-- User role distribution
SELECT 'User Role Distribution' as Info;
SELECT 
    role,
    COUNT(*) as user_count
FROM App_Users
GROUP BY role
ORDER BY user_count DESC;

-- Check for any issues
SELECT 'Data Quality Check' as Info;
SELECT 
    'Employees without users' as issue_type,
    COUNT(*) as count
FROM Employees e
LEFT JOIN App_Users u ON u.employee_id = e.employee_id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Users without employees' as issue_type,
    COUNT(*) as count
FROM App_Users u
LEFT JOIN Employees e ON e.employee_id = u.employee_id
WHERE u.employee_id IS NOT NULL AND e.employee_id IS NULL

UNION ALL

SELECT 
    'Employees without email' as issue_type,
    COUNT(*) as count
FROM Employees
WHERE email_work IS NULL OR email_work = ''

UNION ALL

SELECT 
    'Users with duplicate emails' as issue_type,
    COUNT(*) as count
FROM (
    SELECT email, COUNT(*) as cnt
    FROM App_Users
    GROUP BY email
    HAVING cnt > 1
) duplicates;
