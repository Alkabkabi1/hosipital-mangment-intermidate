-- Manual fix for each request (safe mode compatible)
-- Run these individually if safe mode can't be disabled

-- First, check which IDs need fixing:
SELECT 
    o.id,
    o.reference_number,
    o.total_approvers AS current_total,
    COUNT(DISTINCT ra.approver_id) AS actual_total,
    CASE 
        WHEN o.total_approvers = COUNT(DISTINCT ra.approver_id) THEN '✅'
        ELSE '❌ Needs update'
    END AS status
FROM Onboarding_Requests o
LEFT JOIN Request_Approvals ra ON ra.request_type = 'onboarding' AND ra.request_id = o.id
WHERE o.status IN ('قيد الاعتماد', 'قيد الانتظار')
GROUP BY o.id, o.reference_number, o.total_approvers
ORDER BY o.id;

-- Then update each one individually:
-- Replace X with the actual ID from above query

-- For Onboarding Request ID 3:
UPDATE Onboarding_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'onboarding' AND request_id = 3
)
WHERE id = 3;

-- For Onboarding Request ID 4:
UPDATE Onboarding_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'onboarding' AND request_id = 4
)
WHERE id = 4;

-- For Onboarding Request ID 5:
UPDATE Onboarding_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'onboarding' AND request_id = 5
)
WHERE id = 5;

-- For Onboarding Request ID 6:
UPDATE Onboarding_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'onboarding' AND request_id = 6
)
WHERE id = 6;

-- Check Clearance IDs:
SELECT 
    c.id,
    c.reference_number,
    c.total_approvers AS current_total,
    COUNT(DISTINCT ra.approver_id) AS actual_total,
    CASE 
        WHEN c.total_approvers = COUNT(DISTINCT ra.approver_id) THEN '✅'
        ELSE '❌ Needs update'
    END AS status
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = c.id
WHERE c.status IN ('قيد الاعتماد', 'قيد الانتظار')
GROUP BY c.id, c.reference_number, c.total_approvers
ORDER BY c.id;

-- For Clearance Request ID 1:
UPDATE Clearance_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'clearance' AND request_id = 1
)
WHERE id = 1;

-- For Clearance Request ID 2:
UPDATE Clearance_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'clearance' AND request_id = 2
)
WHERE id = 2;

-- For Clearance Request ID 3:
UPDATE Clearance_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'clearance' AND request_id = 3
)
WHERE id = 3;

-- For Clearance Request ID 4:
UPDATE Clearance_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'clearance' AND request_id = 4
)
WHERE id = 4;

-- For Clearance Request ID 5:
UPDATE Clearance_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'clearance' AND request_id = 5
)
WHERE id = 5;

-- For Clearance Request ID 6:
UPDATE Clearance_Requests 
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id) 
    FROM Request_Approvals 
    WHERE request_type = 'clearance' AND request_id = 6
)
WHERE id = 6;

-- Final verification:
SELECT 'Onboarding' AS type, id, reference_number, approved_count, total_approvers
FROM Onboarding_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار')
UNION ALL
SELECT 'Clearance' AS type, id, reference_number, approved_count, total_approvers
FROM Clearance_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار')
ORDER BY type, id;

