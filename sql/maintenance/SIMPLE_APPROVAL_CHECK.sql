-- Simple queries to check approval system (run one at a time)

-- Query 1: Check clearance requests
SELECT 
    id,
    reference_number,
    employee_name,
    status,
    approved_by,
    approved_at,
    rejected_by,
    rejected_at,
    created_at
FROM Clearance_Requests
ORDER BY created_at DESC
LIMIT 10;

-- Query 2: Check onboarding requests
SELECT 
    id,
    reference_number,
    employee_name,
    status,
    approved_by,
    approved_at,
    rejected_by,
    rejected_at,
    created_at
FROM Onboarding_Requests
ORDER BY created_at DESC
LIMIT 10;

-- Query 3: Find requests you CAN approve (HR Admin, ID: 3)
SELECT 
    ra.request_type,
    ra.request_id,
    ra.approval_order,
    ra.status AS your_approval_status,
    ra.created_at
FROM Request_Approvals ra
WHERE ra.approver_id = 3
  AND ra.status = 'pending'
ORDER BY ra.created_at DESC;

-- Query 4: Check request #5 approval status
SELECT 
    approver_id,
    approval_order,
    status,
    decision_note,
    decided_at
FROM Request_Approvals
WHERE request_type = 'clearance' 
  AND request_id = 5
ORDER BY approval_order;

-- Query 5: Check if HR Admin (ID: 3) already approved request #5
SELECT 
    approver_id,
    status,
    decision_note,
    decided_at
FROM Request_Approvals
WHERE request_type = 'clearance'
  AND request_id = 5
  AND approver_id = 3;

