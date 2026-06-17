-- Check ALL approval records for clearance request #4

SELECT 
    ra.approval_id,
    ra.approver_id,
    u.name AS approver_name,
    u.email AS approver_email,
    r.role_name,
    ra.approval_order,
    ra.status,
    ra.decision_note,
    ra.decided_at,
    ra.created_at
FROM Request_Approvals ra
LEFT JOIN App_Users u ON u.id = ra.approver_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE ra.request_type = 'clearance' 
  AND ra.request_id = 4
ORDER BY ra.approval_order, ra.approver_id;

-- This will show ALL approvers for request #4
-- Check if there are multiple records for approver_id = 3

