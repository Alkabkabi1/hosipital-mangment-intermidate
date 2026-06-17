-- Fix inconsistent statuses where status='مكتمل' but approved_count < total_approvers

-- Check current state
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision,
    CASE 
        WHEN status IN ('مكتمل', 'موافق عليه') AND approved_count < total_approvers THEN '❌ INCONSISTENT'
        WHEN approved_count = total_approvers AND status != 'مكتمل' THEN '❌ SHOULD BE COMPLETED'
        ELSE '✅ OK'
    END AS data_status
FROM Onboarding_Requests
WHERE id IN (3, 4, 5, 6);

-- Fix request #3: Has 1/3 but marked complete - FIX to pending
UPDATE Onboarding_Requests
SET status = 'قيد الاعتماد',
    final_decision = 'pending',
    approval_stage = 'In Progress (1/3)'
WHERE id = 3
  AND approved_count < total_approvers
  AND status = 'مكتمل';

-- Fix request #5: Has 1/3 but marked complete - FIX to pending  
UPDATE Onboarding_Requests
SET status = 'قيد الاعتماد',
    final_decision = 'pending',
    approval_stage = 'In Progress (1/3)'
WHERE id = 5
  AND approved_count < total_approvers
  AND status = 'مكتمل';

-- Verify fixes
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision,
    approval_stage,
    CONCAT(approved_count, '/', total_approvers) AS progress,
    CASE 
        WHEN approved_count = total_approvers THEN '✅ Ready to complete'
        WHEN approved_count < total_approvers THEN '⏳ Still pending'
        ELSE '❌ Error'
    END AS status_check
FROM Onboarding_Requests
WHERE id IN (3, 4, 5, 6)
ORDER BY id;

-- Expected results after fix:
-- Request 3: status='قيد الاعتماد', 1/3, pending ✅
-- Request 4: status='مرفوض', 0/3, rejected ✅
-- Request 5: status='قيد الاعتماد', 1/3, pending ✅
-- Request 6: status='قيد الاعتماد', 1/3, pending ✅

