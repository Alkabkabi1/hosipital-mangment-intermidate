-- =====================================================
-- Migration: Deprecate Legacy Role Column
-- =====================================================
-- This migration deprecates the App_Users.role column
-- in favor of the proper user_roles table.
--
-- Version: 1.0
-- Date: October 20, 2025
-- =====================================================

USE nora_database;

-- Phase 1: Make App_Users.role nullable and add deprecation comment
ALTER TABLE App_Users 
MODIFY COLUMN role VARCHAR(50) NULL 
COMMENT 'DEPRECATED: Use user_roles table instead. This column is kept for backward compatibility only.';

-- Phase 2: Verify all users have at least one role in user_roles table
-- Get users who have a role in App_Users but no entry in user_roles
SELECT 
    u.id, 
    u.email, 
    u.role AS legacy_role,
    COUNT(ur.user_role_id) AS role_count
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
WHERE u.role IS NOT NULL AND u.is_active = TRUE
GROUP BY u.id, u.email, u.role
HAVING role_count = 0;

-- Phase 3: Sync legacy roles to user_roles table (if any missing)
-- This is a safety measure to ensure no user loses their role
INSERT INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
SELECT 
    u.id,
    r.role_id,
    1, -- System assignment
    CONCAT('Migrated from legacy App_Users.role column: ', u.role),
    TRUE
FROM App_Users u
INNER JOIN roles r ON UPPER(u.role) = UPPER(r.role_name)
LEFT JOIN user_roles ur ON u.id = ur.user_id AND r.role_id = ur.role_id
WHERE u.role IS NOT NULL 
  AND u.is_active = TRUE
  AND ur.user_role_id IS NULL; -- Only insert if not already present

-- Phase 4: Log the migration in audit table (if exists)
-- Note: Skipped - role_audit_log table will be created in future migration
-- INSERT INTO role_audit_log (user_id, role_id, performed_by, action, created_at)
-- SELECT 
--     u.id,
--     r.role_id,
--     1, -- System
--     'MIGRATED_FROM_LEGACY',
--     NOW()
-- FROM App_Users u
-- INNER JOIN roles r ON UPPER(u.role) = UPPER(r.role_name)
-- WHERE u.role IS NOT NULL 
--   AND u.is_active = TRUE
--   AND NOT EXISTS (
--     SELECT 1 FROM role_audit_log ral
--     WHERE ral.user_id = u.id 
--       AND ral.role_id = r.role_id 
--       AND ral.action = 'MIGRATED_FROM_LEGACY'
--   );

-- Phase 5: Create a view for backward compatibility
-- This view provides the legacy role field based on user_roles table
CREATE OR REPLACE VIEW User_With_Legacy_Role AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.password_hash,
    u.employee_id,
    u.is_active,
    u.created_at,
    u.updated_at,
    u.last_login,
    u.login_count,
    -- Primary role (first alphabetically, with ADMIN prioritized)
    COALESCE(
        CASE 
            WHEN MAX(CASE WHEN r.role_name = 'ADMIN' THEN 1 ELSE 0 END) = 1 THEN 'admin'
            ELSE LOWER(MIN(r.role_name))
        END,
        'employee'
    ) AS role,
    -- All roles as comma-separated string
    GROUP_CONCAT(r.role_name ORDER BY r.role_name SEPARATOR ',') AS all_roles
FROM App_Users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
WHERE u.is_active = TRUE
GROUP BY u.id, u.name, u.email, u.password_hash, u.employee_id, 
         u.is_active, u.created_at, u.updated_at, u.last_login, u.login_count;

-- Verification queries (run manually to check migration success)
-- 
-- 1. Check users with legacy role but no user_roles entry:
-- SELECT u.id, u.email, u.role, COUNT(ur.user_role_id) AS role_entries
-- FROM App_Users u
-- LEFT JOIN user_roles ur ON u.id = ur.user_id
-- WHERE u.role IS NOT NULL
-- GROUP BY u.id, u.email, u.role
-- HAVING role_entries = 0;
--
-- 2. Check users with mismatched roles:
-- SELECT u.id, u.email, u.role AS legacy_role, GROUP_CONCAT(r.role_name) AS new_roles
-- FROM App_Users u
-- LEFT JOIN user_roles ur ON u.id = ur.user_id
-- LEFT JOIN roles r ON ur.role_id = r.role_id
-- WHERE u.role IS NOT NULL
-- GROUP BY u.id, u.email, u.role;

-- =====================================================
-- FUTURE PHASE: Complete removal of legacy column
-- =====================================================
-- After verification period (recommended: 30+ days), the column can be dropped:
-- 
-- ALTER TABLE App_Users DROP COLUMN role;
--
-- ⚠️ WARNING: Only run this after:
-- 1. All code has been updated to use user_roles table
-- 2. All integrations have been tested
-- 3. Backup of database has been created
-- =====================================================

SELECT 'Migration 008: Deprecate legacy role column completed' AS status;

