-- Clearance #6 has 2/2 approvals but status is still pending!
-- Let's check the approvals and fix it

-- Step 1: Check approval details
SELECT 
    ra.approval_id,
    ra.approver_id,
    u.name AS approver_name,
    ra.status,
    ra.decision_note,
    ra.decided_at
FROM Request_Approvals ra
LEFT JOIN App_Users u ON u.id = ra.approver_id
WHERE ra.request_type = 'clearance' 
  AND ra.request_id = 6
ORDER BY ra.approval_order, ra.decided_at;

-- Step 2: Check current status
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision,
    approval_stage,
    approved_at
FROM Clearance_Requests
WHERE id = 6;

-- Step 3: If all approved, mark as complete
UPDATE Clearance_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved',
    approved_at = NOW()
WHERE id = 6
  AND approved_count >= total_approvers
  AND total_approvers > 0
  AND status != 'مكتمل';

-- Step 4: Verify the fix
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision,
    approval_stage,
    CASE 
        WHEN status = 'مكتمل' THEN '✅ Complete'
        WHEN approved_count >= total_approvers THEN '⚠️ Should be complete!'
        ELSE '⏳ Still pending'
    END AS result
FROM Clearance_Requests
WHERE id = 6;

