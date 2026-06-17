-- Fix for Safe Update Mode Error
-- These queries work with safe update mode enabled

-- Step 1: Recalculate total_approvers for Onboarding (SAFE MODE VERSION)
UPDATE Onboarding_Requests o
INNER JOIN (
    SELECT 
        request_id,
        COUNT(DISTINCT approver_id) AS actual_total
    FROM Request_Approvals
    WHERE request_type = 'onboarding'
    GROUP BY request_id
) ra ON ra.request_id = o.id
SET o.total_approvers = ra.actual_total;

-- Step 2: Recalculate total_approvers for Clearance (SAFE MODE VERSION)
UPDATE Clearance_Requests c
INNER JOIN (
    SELECT 
        request_id,
        COUNT(DISTINCT approver_id) AS actual_total
    FROM Request_Approvals
    WHERE request_type = 'clearance'
    GROUP BY request_id
) ra ON ra.request_id = c.id
SET c.total_approvers = ra.actual_total;

-- Step 3: Verify the fix worked
SELECT 
    'Onboarding' AS type,
    o.id,
    o.reference_number,
    o.status,
    o.approved_count,
    o.total_approvers AS updated_total,
    COUNT(DISTINCT ra.approver_id) AS actual_approvers,
    CASE 
        WHEN o.total_approvers = COUNT(DISTINCT ra.approver_id) THEN '✅ Correct'
        ELSE '❌ Mismatch'
    END AS status_check
FROM Onboarding_Requests o
LEFT JOIN Request_Approvals ra ON ra.request_type = 'onboarding' AND ra.request_id = o.id
WHERE o.status IN ('قيد الاعتماد', 'قيد الانتظار')
GROUP BY o.id, o.reference_number, o.status, o.approved_count, o.total_approvers
ORDER BY o.id;

-- Step 4: Same for Clearance
SELECT 
    'Clearance' AS type,
    c.id,
    c.reference_number,
    c.status,
    c.approved_count,
    c.total_approvers AS updated_total,
    COUNT(DISTINCT ra.approver_id) AS actual_approvers,
    CASE 
        WHEN c.total_approvers = COUNT(DISTINCT ra.approver_id) THEN '✅ Correct'
        ELSE '❌ Mismatch'
    END AS status_check
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = c.id
WHERE c.status IN ('قيد الاعتماد', 'قيد الانتظار')
GROUP BY c.id, c.reference_number, c.status, c.approved_count, c.total_approvers
ORDER BY c.id;

-- Step 5: Check if duplicates still exist
SELECT 
    ra.request_type,
    ra.request_id,
    ra.approver_id,
    u.name AS approver_name,
    COUNT(*) AS duplicate_count,
    GROUP_CONCAT(ra.approval_id ORDER BY ra.approval_id) AS approval_ids
FROM Request_Approvals ra
INNER JOIN App_Users u ON u.id = ra.approver_id
WHERE ra.status = 'pending'
GROUP BY ra.request_type, ra.request_id, ra.approver_id
HAVING duplicate_count > 1
ORDER BY duplicate_count DESC, ra.request_id;

-- If the above returns rows, duplicates still exist
-- If it returns 0 rows, duplicates are already fixed! ✅

