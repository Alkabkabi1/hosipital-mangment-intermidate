-- ========================================
-- Test Login Activity Queries
-- To debug the 500 Internal Server Error
-- ========================================

-- Test 1: Get all users with login activity
SELECT 
  u.id as userId,
  u.name as userName,
  u.email as userEmail,
  u.last_login as lastLogin,
  u.login_count as loginCount,
  u.is_active as isActive,
  GROUP_CONCAT(r.role_name) as roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.last_login, u.login_count, u.is_active
ORDER BY u.last_login DESC
LIMIT 10;

-- Test 2: Get recent login sessions from audit log
SELECT 
  ae.id as auditId,
  ae.user_id as userId,
  u.name as userName,
  u.email as userEmail,
  ae.ts as loginTime,
  ae.ip as ipAddress,
  ae.action
FROM Audit_Events ae
INNER JOIN App_Users u ON ae.user_id = u.id
WHERE ae.action = 'USER_LOGIN'
ORDER BY ae.ts DESC
LIMIT 10;

-- Test 3: Check if Audit_Events table exists and has data
SELECT COUNT(*) as total_audit_events FROM Audit_Events;
SELECT COUNT(*) as login_events FROM Audit_Events WHERE action = 'USER_LOGIN';

-- Test 4: Get active users (last 24 hours)
SELECT 
  u.id as userId,
  u.name as userName,
  u.email as userEmail,
  u.last_login as lastLogin,
  u.login_count as loginCount,
  u.is_active as isActive,
  GROUP_CONCAT(r.role_name) as roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  AND u.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.last_login, u.login_count, u.is_active
ORDER BY u.last_login DESC;

-- Test 5: Get login statistics
SELECT 
  COUNT(DISTINCT u.id) as totalUsers,
  COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN u.id END) as activeToday,
  COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as activeThisWeek,
  COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as activeThisMonth,
  COUNT(DISTINCT CASE WHEN u.last_login IS NULL THEN u.id END) as neverLoggedIn,
  SUM(u.login_count) as totalLogins
FROM App_Users u
WHERE u.is_active = TRUE;

-- ========================================
-- If any of these fail, check:
-- 1. Audit_Events table exists
-- 2. last_login column exists in App_Users
-- 3. login_count column exists in App_Users
-- ========================================

-- Check table structure
DESCRIBE App_Users;
DESCRIBE Audit_Events;
DESCRIBE user_roles;
DESCRIBE roles;

