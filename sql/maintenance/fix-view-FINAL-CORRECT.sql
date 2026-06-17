-- FINAL CORRECT fix for V_Pending_Approvals view
-- ALL request tables use 'id' as primary key!

USE nora_database;

DROP VIEW IF EXISTS V_Pending_Approvals;

CREATE VIEW V_Pending_Approvals AS
SELECT 
  ra.approval_id,
  ra.request_type,
  ra.request_id,
  ra.approver_id,
  u.name AS approver_name,
  u.email AS approver_email,
  r.role_name AS approver_role,
  ra.approval_order,
  ra.status,
  ra.created_at,
  CASE 
    WHEN ra.request_type = 'clearance' THEN cr.employee_id
    WHEN ra.request_type = 'onboarding' THEN onb.employee_id
    WHEN ra.request_type = 'delegation' THEN dr.created_by_user
    ELSE NULL
  END AS request_owner_id
FROM Request_Approvals ra
INNER JOIN App_Users u ON ra.approver_id = u.id
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN Clearance_Requests cr ON ra.request_type = 'clearance' AND ra.request_id = cr.id
LEFT JOIN Onboarding_Requests onb ON ra.request_type = 'onboarding' AND ra.request_id = onb.id
LEFT JOIN Delegation_Requests dr ON ra.request_type = 'delegation' AND ra.request_id = dr.id
WHERE ra.status = 'pending' AND ur.is_active = TRUE;

SELECT '✅ View V_Pending_Approvals created successfully!' AS Status;

-- Test the view
SELECT COUNT(*) as total_pending_approvals FROM V_Pending_Approvals;

-- Show structure
DESCRIBE V_Pending_Approvals;

-- Verify view works with sample data (if any)
SELECT * FROM V_Pending_Approvals LIMIT 5;

