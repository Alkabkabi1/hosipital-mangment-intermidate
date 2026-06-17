-- Find requests that HR Admin (ID: 3) has NOT approved yet

-- Clearance requests you can still approve
SELECT 
    'CLEARANCE' AS type,
    c.id,
    c.reference_number,
    c.employee_name,
    c.status AS request_status,
    'You can approve this!' AS action
FROM Clearance_Requests c
INNER JOIN Request_Approvals ra ON ra.request_id = c.id AND ra.request_type = 'clearance'
WHERE ra.approver_id = 3
  AND ra.status = 'pending'
  AND c.status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
ORDER BY c.created_at DESC;

-- Onboarding requests you can still approve
SELECT 
    'ONBOARDING' AS type,
    o.id,
    o.reference_number,
    o.employee_name,
    o.status AS request_status,
    'You can approve this!' AS action
FROM Onboarding_Requests o
INNER JOIN Request_Approvals ra ON ra.request_id = o.id AND ra.request_type = 'onboarding'
WHERE ra.approver_id = 3
  AND ra.status = 'pending'
  AND o.status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
ORDER BY o.created_at DESC;

-- If no results, there are NO pending requests for you to approve
-- You've approved everything already!

