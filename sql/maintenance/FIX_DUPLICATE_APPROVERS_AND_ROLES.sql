-- Fix 1: Check who has what roles (find the problem)
SELECT 
    u.id,
    u.name,
    u.email,
    GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name) AS all_roles,
    COUNT(DISTINCT r.role_id) AS role_count
FROM App_Users u
INNER JOIN user_roles ur ON ur.user_id = u.id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE ur.is_active = TRUE
GROUP BY u.id, u.name, u.email
ORDER BY role_count DESC, u.name;

-- Fix 2: Check specifically HR Manager's roles
SELECT 
    u.id,
    u.name,
    u.email,
    r.role_name,
    ur.assigned_at,
    ur.assigned_by
FROM App_Users u
INNER JOIN user_roles ur ON ur.user_id = u.id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE u.name LIKE '%HR Manager%'
  AND ur.is_active = TRUE
ORDER BY ur.assigned_at;

-- Fix 3: Remove FINANCE role from HR Manager (if it shouldn't be there)
-- ONLY RUN THIS IF HR Manager should NOT have FINANCE role!
DELETE ur FROM user_roles ur
INNER JOIN App_Users u ON u.id = ur.user_id
INNER JOIN roles r ON r.role_id = ur.role_id
WHERE u.name LIKE '%HR Manager%'
  AND r.role_name = 'FINANCE'
  AND ur.is_active = TRUE;

-- Fix 4: Check duplicate approvers in Request_Approvals table
SELECT 
    ra.request_type,
    ra.request_id,
    ra.approver_id,
    u.name AS approver_name,
    COUNT(*) AS approval_count,
    GROUP_CONCAT(DISTINCT r.role_name) AS roles_in_approvals
FROM Request_Approvals ra
INNER JOIN App_Users u ON u.id = ra.approver_id
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE ra.status = 'pending'
GROUP BY ra.request_type, ra.request_id, ra.approver_id, u.name
HAVING approval_count > 1
ORDER BY ra.request_id, approval_count DESC;

-- Fix 5: Remove duplicate approvers (keep only one per user per request)
DELETE ra1 FROM Request_Approvals ra1
INNER JOIN (
    SELECT 
        request_type,
        request_id,
        approver_id,
        MIN(approval_id) AS keep_id
    FROM Request_Approvals
    WHERE status = 'pending'
    GROUP BY request_type, request_id, approver_id
    HAVING COUNT(*) > 1
) ra2 ON ra1.request_type = ra2.request_type 
    AND ra1.request_id = ra2.request_id 
    AND ra1.approver_id = ra2.approver_id
WHERE ra1.approval_id != ra2.keep_id;

-- Fix 6: Recalculate total_approvers after removing duplicates
UPDATE Onboarding_Requests o
SET o.total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'onboarding' AND ra.request_id = o.id
)
WHERE EXISTS (
    SELECT 1 FROM Request_Approvals ra2
    WHERE ra2.request_type = 'onboarding' AND ra2.request_id = o.id
);

UPDATE Clearance_Requests c
SET c.total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'clearance' AND ra.request_id = c.id
)
WHERE EXISTS (
    SELECT 1 FROM Request_Approvals ra2
    WHERE ra2.request_type = 'clearance' AND ra2.request_id = c.id
);

-- Fix 7: Verify the fix
SELECT 
    ra.request_type,
    ra.request_id,
    ra.approver_id,
    u.name AS approver_name,
    COUNT(*) AS approval_count,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) AS approved_count
FROM Request_Approvals ra
INNER JOIN App_Users u ON u.id = ra.approver_id
GROUP BY ra.request_type, ra.request_id, ra.approver_id, u.name
HAVING approval_count > 1
ORDER BY ra.request_id;

-- Should return 0 rows if fixed!

