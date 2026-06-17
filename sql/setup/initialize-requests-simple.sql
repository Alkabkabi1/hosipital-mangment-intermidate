-- ============================================
-- Initialize Existing Requests (Simple Version)
-- ============================================
-- Purpose: Create Request_Approvals records for existing pending requests
-- No stored procedures needed - pure SQL
-- ============================================

-- Step 1: Check what we have
SELECT '=== Current State ===' as Info;

SELECT 'Approval Rules:' as Step1;
SELECT * FROM Approval_Rules ORDER BY request_type, approval_order;

SELECT 'Pending Clearance Requests:' as Step2;
SELECT id, reference_number, employee_email, status FROM Clearance_Requests WHERE status = 'قيد الاعتماد';

SELECT 'Pending Onboarding Requests:' as Step3;
SELECT id, reference_number, employee_email, status FROM Onboarding_Requests WHERE status = 'قيد الاعتماد';

SELECT 'Current Request_Approvals (should be empty):' as Step4;
SELECT * FROM Request_Approvals;

-- Step 2: Initialize Clearance Requests
SELECT '' as '';
SELECT '=== Initializing Clearance Requests ===' as Info;

-- Create approvals for each pending clearance request
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status)
SELECT 
  'clearance' as request_type,
  cr.id as request_id,
  u.id as approver_id,
  ar.approval_order,
  'pending' as status
FROM Clearance_Requests cr
CROSS JOIN Approval_Rules ar
INNER JOIN roles r ON ar.role_name = r.role_name
INNER JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = TRUE
INNER JOIN App_Users u ON ur.user_id = u.id AND u.is_active = TRUE
WHERE cr.status = 'قيد الاعتماد'
  AND ar.request_type = 'clearance'
  AND ar.is_active = TRUE
  AND ar.is_required = TRUE
ON DUPLICATE KEY UPDATE status = 'pending';

-- Update clearance requests with total approvers
UPDATE Clearance_Requests cr
SET 
  total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'clearance' AND ra.request_id = cr.id
  ),
  approved_count = 0,
  approval_stage = 'Pending Review',
  final_decision = 'pending'
WHERE cr.status = 'قيد الاعتماد';

SELECT CONCAT('✅ Initialized ', ROW_COUNT(), ' clearance request(s)') as Result;

-- Step 3: Initialize Onboarding Requests
SELECT '' as '';
SELECT '=== Initializing Onboarding Requests ===' as Info;

-- Create approvals for each pending onboarding request
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status)
SELECT 
  'onboarding' as request_type,
  onb.id as request_id,
  u.id as approver_id,
  ar.approval_order,
  'pending' as status
FROM Onboarding_Requests onb
CROSS JOIN Approval_Rules ar
INNER JOIN roles r ON ar.role_name = r.role_name
INNER JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = TRUE
INNER JOIN App_Users u ON ur.user_id = u.id AND u.is_active = TRUE
WHERE onb.status = 'قيد الاعتماد'
  AND ar.request_type = 'onboarding'
  AND ar.is_active = TRUE
  AND ar.is_required = TRUE
ON DUPLICATE KEY UPDATE status = 'pending';

-- Update onboarding requests with total approvers
UPDATE Onboarding_Requests onb
SET 
  total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'onboarding' AND ra.request_id = onb.id
  ),
  approved_count = 0,
  approval_stage = 'Pending Review',
  final_decision = 'pending'
WHERE onb.status = 'قيد الاعتماد';

SELECT CONCAT('✅ Initialized ', ROW_COUNT(), ' onboarding request(s)') as Result;

-- Step 4: Initialize Delegation Requests
SELECT '' as '';
SELECT '=== Initializing Delegation Requests ===' as Info;

-- Create approvals for each pending delegation request
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status)
SELECT 
  'delegation' as request_type,
  dr.id as request_id,
  u.id as approver_id,
  ar.approval_order,
  'pending' as status
FROM Delegation_Requests dr
CROSS JOIN Approval_Rules ar
INNER JOIN roles r ON ar.role_name = r.role_name
INNER JOIN user_roles ur ON r.role_id = ur.role_id AND ur.is_active = TRUE
INNER JOIN App_Users u ON ur.user_id = u.id AND u.is_active = TRUE
WHERE dr.status IN ('قيد الاعتماد', 'pending')
  AND ar.request_type = 'delegation'
  AND ar.is_active = TRUE
  AND ar.is_required = TRUE
ON DUPLICATE KEY UPDATE status = 'pending';

-- Update delegation requests with total approvers
UPDATE Delegation_Requests dr
SET 
  total_approvers = (
    SELECT COUNT(DISTINCT ra.approver_id)
    FROM Request_Approvals ra
    WHERE ra.request_type = 'delegation' AND ra.request_id = dr.id
  ),
  approved_count = 0,
  approval_stage = 'Pending Review',
  final_decision = 'pending'
WHERE dr.status IN ('قيد الاعتماد', 'pending');

SELECT CONCAT('✅ Initialized ', ROW_COUNT(), ' delegation request(s)') as Result;

-- Step 5: Verification
SELECT '' as '';
SELECT '=== VERIFICATION ===' as Info;

SELECT 'Total Request_Approvals created:' as Step5;
SELECT COUNT(*) as total_approvals FROM Request_Approvals;

SELECT 'Approvals by Request Type:' as Step6;
SELECT 
  request_type,
  COUNT(*) as approval_count,
  COUNT(DISTINCT request_id) as request_count,
  COUNT(DISTINCT approver_id) as approver_count
FROM Request_Approvals
GROUP BY request_type;

SELECT 'Pending Approvals by User:' as Step7;
SELECT 
  u.id,
  u.email,
  u.name,
  GROUP_CONCAT(DISTINCT r.role_name) as roles,
  COUNT(*) as pending_approvals,
  GROUP_CONCAT(DISTINCT ra.request_type) as can_approve
FROM Request_Approvals ra
JOIN App_Users u ON ra.approver_id = u.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id
WHERE ra.status = 'pending'
GROUP BY u.id, u.email, u.name
ORDER BY pending_approvals DESC;

SELECT '' as '';
SELECT '✅ DONE! Existing requests are now initialized.' as Status;
SELECT 'Restart your backend server: node server.js' as NextStep;
SELECT 'Then refresh employee-role-inbox.html to see requests!' as FinalStep;

