-- Fix existing requests that have incorrect total_approvers count
-- This happens when users have multiple roles and were counted multiple times

-- Step 1: Identify requests with incorrect totals
SELECT 
    ra.request_type,
    ra.request_id,
    COUNT(DISTINCT ra.approver_id) AS actual_unique_approvers,
    CASE ra.request_type
        WHEN 'clearance' THEN c.total_approvers
        WHEN 'onboarding' THEN o.total_approvers
        WHEN 'delegation' THEN d.total_approvers
    END AS current_total_approvers,
    CASE ra.request_type
        WHEN 'clearance' THEN c.status
        WHEN 'onboarding' THEN o.status
        WHEN 'delegation' THEN d.status
    END AS status
FROM Request_Approvals ra
LEFT JOIN Clearance_Requests c ON c.id = ra.request_id AND ra.request_type = 'clearance'
LEFT JOIN Onboarding_Requests o ON o.id = ra.request_id AND ra.request_type = 'onboarding'
LEFT JOIN Delegation_Requests d ON d.id = ra.request_id AND ra.request_type = 'delegation'
GROUP BY ra.request_type, ra.request_id
HAVING actual_unique_approvers != current_total_approvers;

-- Step 2: Fix onboarding requests
UPDATE Onboarding_Requests o
SET o.total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'onboarding' AND ra.request_id = o.id
)
WHERE o.id IN (
    SELECT request_id FROM (
        SELECT ra2.request_id
        FROM Request_Approvals ra2
        WHERE ra2.request_type = 'onboarding'
        GROUP BY ra2.request_id
        HAVING COUNT(DISTINCT ra2.approver_id) != (
            SELECT o2.total_approvers 
            FROM Onboarding_Requests o2 
            WHERE o2.id = ra2.request_id
        )
    ) AS temp
);

-- Step 3: Fix clearance requests
UPDATE Clearance_Requests c
SET c.total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'clearance' AND ra.request_id = c.id
)
WHERE c.id IN (
    SELECT request_id FROM (
        SELECT ra2.request_id
        FROM Request_Approvals ra2
        WHERE ra2.request_type = 'clearance'
        GROUP BY ra2.request_id
        HAVING COUNT(DISTINCT ra2.approver_id) != (
            SELECT c2.total_approvers 
            FROM Clearance_Requests c2 
            WHERE c2.id = ra2.request_id
        )
    ) AS temp
);

-- Step 4: Verify fixes
SELECT 
    'Onboarding' AS type,
    o.id,
    o.reference_number,
    o.status,
    o.approved_count,
    o.total_approvers,
    COUNT(DISTINCT ra.approver_id) AS actual_approvers
FROM Onboarding_Requests o
LEFT JOIN Request_Approvals ra ON ra.request_id = o.id AND ra.request_type = 'onboarding'
WHERE o.id IN (5, 6, 7)
GROUP BY o.id, o.reference_number, o.status, o.approved_count, o.total_approvers

UNION ALL

SELECT 
    'Clearance' AS type,
    c.id,
    c.reference_number,
    c.status,
    c.approved_count,
    c.total_approvers,
    COUNT(DISTINCT ra.approver_id) AS actual_approvers
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_id = c.id AND ra.request_type = 'clearance'
WHERE c.id IN (4, 5)
GROUP BY c.id, c.reference_number, c.status, c.approved_count, c.total_approvers;

-- Step 5: Check if any requests can now be auto-completed
-- (Where approved_count now equals corrected total_approvers)
UPDATE Onboarding_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved'
WHERE approved_count = total_approvers
  AND approved_count > 0
  AND status != 'مكتمل'
  AND status != 'مرفوض';

UPDATE Clearance_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved'
WHERE approved_count = total_approvers
  AND approved_count > 0
  AND status != 'مكتمل'
  AND status != 'مرفوض';

-- Final verification
SELECT 'Fixed!' AS message, id, status, approved_count, total_approvers
FROM Onboarding_Requests
WHERE id = 6;

