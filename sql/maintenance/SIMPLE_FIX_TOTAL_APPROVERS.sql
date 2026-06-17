-- Simple fix for total_approvers count (works with MySQL safe mode)
-- Run these one by one

-- Fix request #3
UPDATE Onboarding_Requests
SET total_approvers = 3
WHERE id = 3;

-- Fix request #4
UPDATE Onboarding_Requests
SET total_approvers = 3
WHERE id = 4;

-- Fix request #5
UPDATE Onboarding_Requests
SET total_approvers = 3
WHERE id = 5;

-- Fix request #6
UPDATE Onboarding_Requests
SET total_approvers = 3
WHERE id = 6;

-- Verify all fixes
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision
FROM Onboarding_Requests
WHERE id IN (3, 4, 5, 6);

-- Auto-complete requests where all approvers have approved
UPDATE Onboarding_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved',
    approved_at = NOW()
WHERE id = 3  -- Request 3 has 3/3 approved
  AND approved_count = 3
  AND total_approvers = 3
  AND status != 'مكتمل';

UPDATE Onboarding_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved',
    approved_at = NOW()
WHERE id = 5  -- Request 5 has 3/3 approved
  AND approved_count = 3
  AND total_approvers = 3
  AND status != 'مكتمل';

-- Final verification
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision,
    CONCAT(approved_count, '/', total_approvers) AS progress
FROM Onboarding_Requests
WHERE id IN (3, 4, 5, 6)
ORDER BY id;

-- Expected results:
-- Request 3: 3/3, status = 'مكتمل'
-- Request 4: 3/3, status = 'مرفوض' (already rejected, keep as is)
-- Request 5: 3/3, status = 'مكتمل'
-- Request 6: 1/3, status = 'قيد الاعتماد' (still pending, 2 more approvers needed)

