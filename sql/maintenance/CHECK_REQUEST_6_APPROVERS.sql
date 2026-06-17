-- Fixed SQL query for request #6 approvals (fixes ambiguous column error)

SELECT 
    ra.approval_id,
    ra.approver_id,
    u.name AS approver_name,
    r.role_name,
    ra.approval_order,
    ra.status,
    ra.decision_note,
    ra.decided_at,
    ra.created_at  -- Explicitly use ra.created_at
FROM Request_Approvals ra
LEFT JOIN App_Users u ON u.id = ra.approver_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE ra.request_type = 'onboarding' 
  AND ra.request_id = 6
ORDER BY ra.approval_order, ra.approver_id;

-- This will show you:
-- - Who has approved (status = 'approved')
-- - Who is pending (status = 'pending')
-- - Who needs to approve next

