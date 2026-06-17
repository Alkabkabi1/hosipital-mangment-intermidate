-- Debug why request #6 status is not updating to 'مكتمل'

-- 1. Check current status of request #6
SELECT 
    id,
    reference_number,
    employee_name,
    status,
    approval_stage,
    approved_count,
    total_approvers,
    final_decision,
    approved_by,
    approved_at
FROM Onboarding_Requests
WHERE id = 6;

-- 2. Check ALL approval records for request #6
SELECT 
    approval_id,
    approver_id,
    u.name AS approver_name,
    r.role_name,
    approval_order,
    status,
    decision_note,
    decided_at,
    created_at
FROM Request_Approvals ra
LEFT JOIN App_Users u ON u.id = ra.approver_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE ra.request_type = 'onboarding' 
  AND ra.request_id = 6
ORDER BY ra.approval_order, ra.approver_id;

-- 3. Count approvals
SELECT 
    COUNT(*) AS total_approvers,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
FROM Request_Approvals
WHERE request_type = 'onboarding' AND request_id = 6;

-- 4. Check if columns exist in Onboarding_Requests
DESCRIBE Onboarding_Requests;

-- 5. If status is still 'قيد الاعتماد', manually update it to test
-- (Only run this if you want to manually fix request #6)
/*
UPDATE Onboarding_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved'
WHERE id = 6 
  AND approved_count = total_approvers;
*/

