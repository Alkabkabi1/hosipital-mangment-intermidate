-- Check Approval System Database State

-- 1. Check current request statuses
SELECT 
    'Clearance' AS type,
    id,
    reference_number,
    employee_name,
    status,
    approved_by,
    approved_at,
    rejected_by,
    rejected_at
FROM Clearance_Requests
ORDER BY created_at DESC
LIMIT 5

UNION ALL

SELECT 
    'Onboarding' AS type,
    id,
    reference_number,
    employee_name,
    status,
    approved_by,
    approved_at,
    rejected_by,
    rejected_at
FROM Onboarding_Requests
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check multi-approval records for clearance requests
SELECT 
    ra.approval_id,
    ra.request_type,
    ra.request_id,
    r.reference_number,
    ra.approver_id,
    u.name AS approver_name,
    role.role_name,
    ra.approval_order,
    ra.status AS approval_status,
    ra.decision_note,
    ra.decided_at,
    ra.created_at
FROM Request_Approvals ra
LEFT JOIN Clearance_Requests r ON r.id = ra.request_id AND ra.request_type = 'clearance'
LEFT JOIN App_Users u ON u.id = ra.approver_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles role ON role.role_id = ur.role_id
WHERE ra.request_type = 'clearance'
ORDER BY ra.request_id DESC, ra.approval_order
LIMIT 20;

-- 3. Check approval rules configuration
SELECT 
    ar.rule_id,
    ar.request_type,
    ar.role_name,
    ar.approval_order,
    ar.is_required,
    ar.is_active,
    COUNT(ur.user_id) AS users_with_role
FROM Approval_Rules ar
LEFT JOIN roles r ON r.role_name = ar.role_name
LEFT JOIN user_roles ur ON ur.role_id = r.role_id AND ur.is_active = 1
WHERE ar.request_type IN ('clearance', 'onboarding')
  AND ar.is_active = 1
GROUP BY ar.rule_id, ar.request_type, ar.role_name, ar.approval_order, ar.is_required, ar.is_active
ORDER BY ar.request_type, ar.approval_order;

-- 4. Check if clearance request 5 has approval records
SELECT 
    'For Request ID 5:' AS info,
    COUNT(*) AS total_approvals,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
FROM Request_Approvals
WHERE request_type = 'clearance' AND request_id = 5;

-- 5. Who can approve clearance request 5?
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    GROUP_CONCAT(r.role_name) AS roles,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM Request_Approvals ra 
            WHERE ra.request_id = 5 
              AND ra.request_type = 'clearance' 
              AND ra.approver_id = u.id
        ) THEN 'YES - In Approval Queue'
        ELSE 'NO'
    END AS can_approve_request_5
FROM App_Users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = 1
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE u.is_active = 1
GROUP BY u.id, u.name, u.email
HAVING roles IS NOT NULL
ORDER BY can_approve_request_5 DESC, u.name;

