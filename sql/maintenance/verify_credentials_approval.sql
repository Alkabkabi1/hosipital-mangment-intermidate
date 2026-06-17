-- ==========================================
-- Credentials Approval System - Verification
-- Date: November 11, 2025
-- ==========================================

-- Check if the tables exist and have the required columns
SELECT 
  'Employee_Certificates Table' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Certificates'

UNION ALL

SELECT 
  'Employee_Licenses Table' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Licenses'

UNION ALL

-- Check for verified column in Certificates
SELECT 
  'Certificates.verified column' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Certificates'
  AND column_name = 'verified'

UNION ALL

-- Check for verified_by column in Certificates
SELECT 
  'Certificates.verified_by column' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Certificates'
  AND column_name = 'verified_by'

UNION ALL

-- Check for verified_at column in Certificates
SELECT 
  'Certificates.verified_at column' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Certificates'
  AND column_name = 'verified_at'

UNION ALL

-- Check for verified column in Licenses
SELECT 
  'Licenses.verified column' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Licenses'
  AND column_name = 'verified'

UNION ALL

-- Check for verified_by column in Licenses
SELECT 
  'Licenses.verified_by column' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Licenses'
  AND column_name = 'verified_by'

UNION ALL

-- Check for verified_at column in Licenses
SELECT 
  'Licenses.verified_at column' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'Employee_Licenses'
  AND column_name = 'verified_at';

-- Show statistics
SELECT '--- STATISTICS ---' as info;

SELECT 
  'Total Certificates' as metric,
  COUNT(*) as count,
  SUM(CASE WHEN verified = TRUE THEN 1 ELSE 0 END) as verified,
  SUM(CASE WHEN verified = FALSE THEN 1 ELSE 0 END) as pending
FROM Employee_Certificates;

SELECT 
  'Total Licenses' as metric,
  COUNT(*) as count,
  SUM(CASE WHEN verified = TRUE THEN 1 ELSE 0 END) as verified,
  SUM(CASE WHEN verified = FALSE THEN 1 ELSE 0 END) as pending
FROM Employee_Licenses;

-- Show pending items (what admin will see)
SELECT '--- PENDING CERTIFICATES ---' as info;

SELECT 
  c.id,
  c.certificate_name,
  c.certificate_type,
  e.name as employee_name,
  e.email as employee_email,
  e.department_name,
  c.created_at
FROM Employee_Certificates c
JOIN App_Users e ON c.employee_id = e.id
WHERE c.verified = FALSE
ORDER BY c.created_at DESC
LIMIT 10;

SELECT '--- PENDING LICENSES ---' as info;

SELECT 
  l.id,
  l.license_name,
  l.license_number,
  e.name as employee_name,
  e.email as employee_email,
  e.department_name,
  l.expiry_date,
  l.created_at
FROM Employee_Licenses l
JOIN App_Users e ON l.employee_id = e.id
WHERE l.verified = FALSE
ORDER BY l.created_at DESC
LIMIT 10;

-- Show recently verified items
SELECT '--- RECENTLY VERIFIED (Last 7 days) ---' as info;

SELECT 
  'Certificate' as type,
  c.certificate_name as name,
  e.name as employee_name,
  a.name as verified_by_name,
  c.verified_at
FROM Employee_Certificates c
JOIN App_Users e ON c.employee_id = e.id
LEFT JOIN App_Users a ON c.verified_by = a.id
WHERE c.verified = TRUE 
  AND c.verified_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)

UNION ALL

SELECT 
  'License' as type,
  l.license_name as name,
  e.name as employee_name,
  a.name as verified_by_name,
  l.verified_at
FROM Employee_Licenses l
JOIN App_Users e ON l.employee_id = e.id
LEFT JOIN App_Users a ON l.verified_by = a.id
WHERE l.verified = TRUE 
  AND l.verified_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY verified_at DESC
LIMIT 10;

