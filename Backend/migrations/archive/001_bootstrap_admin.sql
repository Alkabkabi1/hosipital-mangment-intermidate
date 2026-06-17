-- Bootstrap admin, roles, and normalize legacy statuses (idempotent)
-- Environment: dev/private network only
-- This migration is safe to run multiple times.

USE hospital_management;
SET NAMES utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- NOTE: This script assumes the roles table has `role_name_ar` and the users table has a `role` column.
-- If your schema differs, gate or adjust these columns via information_schema or override in CI before running.

-- Table name variables (override in CI if needed)
SET @T_USERS      := COALESCE(@T_USERS, 'App_Users');
SET @T_USER_ROLES := COALESCE(@T_USER_ROLES, 'user_roles');
SET @T_ROLES      := COALESCE(@T_ROLES, 'roles');

-- Admin seed variables (override in CI/CD or mysql client)
SET @ADMIN_EMAIL          := COALESCE(@ADMIN_EMAIL, 'admin@dev.local');
SET @ADMIN_NAME           := COALESCE(@ADMIN_NAME,  'Dev Admin');
-- WARNING: placeholder hash not for production; provide a real bcrypt hash via @ADMIN_PASSWORD_HASH
SET @ADMIN_PASSWORD_HASH  := COALESCE(@ADMIN_PASSWORD_HASH, '$2b$12$REPLACE_WITH_SECURE_HASH______________.______________.________');

-- 1) Ensure essential roles exist (idempotent)
SET @sql := CONCAT(
  'INSERT IGNORE INTO ', @T_ROLES, ' (role_name, role_name_ar, description, is_active) ',
  'VALUES (?,?,?,1),(?,?,?,1)'
);
PREPARE stmt FROM @sql;
SET @r1 := 'EMPLOYEE'; SET @r1_ar := 'موظف';  SET @r1_desc := 'Basic employee role';
SET @r2 := 'ADMIN';    SET @r2_ar := 'مسؤول'; SET @r2_desc := 'Administrator with elevated privileges';
EXECUTE stmt USING @r1, @r1_ar, @r1_desc, @r2, @r2_ar, @r2_desc;
DEALLOCATE PREPARE stmt;

-- 2) Insert single admin user if not present (idempotent)
SET @sql := CONCAT(
  'INSERT INTO ', @T_USERS, ' (name, email, password_hash, role, employee_id, is_active) ',
  'SELECT ?, ?, ?, ''admin'', NULL, TRUE FROM DUAL ',
  'WHERE NOT EXISTS (SELECT 1 FROM ', @T_USERS, ' WHERE email = ?) ',
  'LIMIT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt USING @ADMIN_NAME, @ADMIN_EMAIL, @ADMIN_PASSWORD_HASH, @ADMIN_EMAIL;
DEALLOCATE PREPARE stmt;

-- 3) Ensure unique key (user_id, role_id) exists on user_roles (MySQL-safe)
SET @exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = @T_USER_ROLES
    AND index_name   = 'uq_user_roles_user_role'
);
SET @ddl := IF(@exists = 0,
  CONCAT('ALTER TABLE ', @T_USER_ROLES, ' ADD UNIQUE KEY uq_user_roles_user_role (user_id, role_id)'),
  'SELECT "uq_user_roles_user_role exists"'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Assign ADMIN role to the admin user if missing (idempotent)
SET @sql := CONCAT(
  'INSERT INTO ', @T_USER_ROLES, ' (user_id, role_id, assigned_by, is_active) ',
  'SELECT u.id, r.role_id, u.id, TRUE ',
  'FROM ', @T_USERS, ' u, ', @T_ROLES, ' r ',
  'WHERE u.email = ? AND r.role_name = ''ADMIN'' ',
  'AND NOT EXISTS (SELECT 1 FROM ', @T_USER_ROLES, ' ur WHERE ur.user_id = u.id AND ur.role_id = r.role_id) ',
  'LIMIT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt USING @ADMIN_EMAIL; DEALLOCATE PREPARE stmt;

-- 5) Normalize legacy statuses to canonical pending|approved|rejected
-- Pending variants (English)
UPDATE Onboarding_Requests SET status = 'pending' WHERE LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');
UPDATE Clearance_Requests  SET status = 'pending' WHERE LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');
UPDATE Delegation_Requests SET status = 'pending' WHERE LOWER(status) IN ('pending','awaiting','in_progress','submitted','new');

-- Pending variants (Arabic keywords)
UPDATE Onboarding_Requests SET status = 'pending' 
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%';
UPDATE Clearance_Requests SET status = 'pending'
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%';
UPDATE Delegation_Requests SET status = 'pending'
  WHERE status LIKE '%قيد%' OR status LIKE '%انتظار%' OR status LIKE '%مراجعة%' OR status LIKE '%معل%';

-- Approved variants (English)
UPDATE Onboarding_Requests SET status = 'approved' WHERE LOWER(status) IN ('approved','accepted','done','complete','completed');
UPDATE Clearance_Requests  SET status = 'approved' WHERE LOWER(status) IN ('approved','accepted','done','complete','completed');
UPDATE Delegation_Requests SET status = 'approved' WHERE LOWER(status) IN ('approved','accepted','done','complete','completed');

-- Approved variants (Arabic keywords)
UPDATE Onboarding_Requests SET status = 'approved' WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%';
UPDATE Clearance_Requests  SET status = 'approved' WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%';
UPDATE Delegation_Requests SET status = 'approved' WHERE status LIKE '%موافق%' OR status LIKE '%اعتماد%' OR status LIKE '%تمت موافق%';

-- Rejected variants (English)
UPDATE Onboarding_Requests SET status = 'rejected' WHERE LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');
UPDATE Clearance_Requests  SET status = 'rejected' WHERE LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');
UPDATE Delegation_Requests SET status = 'rejected' WHERE LOWER(status) IN ('rejected','declined','denied','cancelled','canceled');

-- Rejected variants (Arabic keywords)
UPDATE Onboarding_Requests SET status = 'rejected' WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%';
UPDATE Clearance_Requests  SET status = 'rejected' WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%';
UPDATE Delegation_Requests SET status = 'rejected' WHERE status LIKE '%مرفوض%' OR status LIKE '%رفض%';

-- Ensure only canonical values remain
UPDATE Onboarding_Requests SET status = 'pending' WHERE status NOT IN ('pending','approved','rejected');
UPDATE Clearance_Requests  SET status = 'pending' WHERE status NOT IN ('pending','approved','rejected');
UPDATE Delegation_Requests SET status = 'pending' WHERE status NOT IN ('pending','approved','rejected');
