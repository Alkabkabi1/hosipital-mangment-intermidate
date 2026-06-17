-- Remove approvers who no longer have approval roles
-- This ensures requests don't wait for people who lost their ADMIN/MANAGER role

-- Step 1: Identify invalid approvers (users who lost their roles)
SELECT 
    ra.approval_id,
    ra.request_type,
    ra.request_id,
    ra.approver_id,
    u.name AS approver_name,
    ra.status AS approval_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM user_roles ur2
            INNER JOIN roles r2 ON r2.role_id = ur2.role_id
            WHERE ur2.user_id = ra.approver_id
              AND ur2.is_active = TRUE
              AND r2.role_name IN ('ADMIN', 'MANAGER')
        ) THEN '❌ No longer has approval role'
        ELSE '✅ Still has approval role'
    END AS validity_check
FROM Request_Approvals ra
LEFT JOIN App_Users u ON u.id = ra.approver_id
WHERE ra.status = 'pending'
ORDER BY ra.request_id, ra.approval_order;

-- Step 2: Delete invalid pending approvals
-- (Approvers who no longer have ADMIN or MANAGER role)
DELETE ra FROM Request_Approvals ra
WHERE ra.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    INNER JOIN roles r ON r.role_id = ur.role_id
    WHERE ur.user_id = ra.approver_id
      AND ur.is_active = TRUE
      AND r.role_name IN ('ADMIN', 'MANAGER')
  );

-- Step 3: Recalculate total_approvers for affected requests
-- Update Onboarding Requests
UPDATE Onboarding_Requests o
SET o.total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'onboarding' AND ra.request_id = o.id
),
o.approval_stage = CONCAT('In Progress (', o.approved_count, '/', (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'onboarding' AND ra.request_id = o.id
), ')')
WHERE EXISTS (
    SELECT 1 FROM Request_Approvals ra2
    WHERE ra2.request_type = 'onboarding' AND ra2.request_id = o.id
);

-- Update Clearance Requests
UPDATE Clearance_Requests c
SET c.total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'clearance' AND ra.request_id = c.id
),
c.approval_stage = CONCAT('In Progress (', c.approved_count, '/', (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'clearance' AND ra.request_id = c.id
), ')')
WHERE EXISTS (
    SELECT 1 FROM Request_Approvals ra2
    WHERE ra2.request_type = 'clearance' AND ra2.request_id = c.id
);

-- Step 4: Auto-complete requests where all remaining approvers have approved
UPDATE Onboarding_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved',
    approved_at = NOW()
WHERE approved_count >= total_approvers
  AND total_approvers > 0
  AND approved_count > 0
  AND status NOT IN ('مكتمل', 'مرفوض');

UPDATE Clearance_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved',
    approved_at = NOW()
WHERE approved_count >= total_approvers
  AND total_approvers > 0
  AND approved_count > 0
  AND status NOT IN ('مكتمل', 'مرفوض');

-- Step 5: Verification - Show updated requests
SELECT 
    'Onboarding' AS type,
    o.id,
    o.reference_number,
    o.status,
    o.approved_count,
    o.total_approvers,
    o.approval_stage,
    CONCAT(o.approved_count, '/', o.total_approvers) AS progress,
    COUNT(ra.approval_id) AS actual_approvers
FROM Onboarding_Requests o
LEFT JOIN Request_Approvals ra ON ra.request_type = 'onboarding' AND ra.request_id = o.id
WHERE o.status IN ('قيد الاعتماد', 'قيد الانتظار', 'مكتمل')
GROUP BY o.id, o.reference_number, o.status, o.approved_count, o.total_approvers, o.approval_stage

UNION ALL

SELECT 
    'Clearance' AS type,
    c.id,
    c.reference_number,
    c.status,
    c.approved_count,
    c.total_approvers,
    c.approval_stage,
    CONCAT(c.approved_count, '/', c.total_approvers) AS progress,
    COUNT(ra.approval_id) AS actual_approvers
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = c.id
WHERE c.status IN ('قيد الاعتماد', 'قيد الانتظار', 'مكتمل')
GROUP BY c.id, c.reference_number, c.status, c.approved_count, c.total_approvers, c.approval_stage;

