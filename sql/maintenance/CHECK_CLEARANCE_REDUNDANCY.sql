-- Check if clearance requests #1-5 are redundant (completed, rejected, or have no pending approvals)

-- Step 1: Check the actual status of these clearance requests
SELECT 
    id,
    reference_number,
    employee_name,
    status,
    approved_count,
    total_approvers,
    CONCAT(approved_count, '/', total_approvers) AS progress,
    final_decision,
    approval_stage,
    created_at,
    CASE 
        WHEN status IN ('مكتمل', 'completed', 'approved') THEN '✅ مكتمل - يجب إخفاؤه'
        WHEN status IN ('مرفوض', 'rejected') THEN '❌ مرفوض - يجب إخفاؤه'
        WHEN approved_count >= total_approvers AND total_approvers > 0 THEN '✅ مكتمل - يجب تحديثه'
        WHEN status IN ('قيد الاعتماد', 'pending', 'قيد الانتظار') THEN '⏳ معلق - عرضه صحيح'
        ELSE '❓ حالة غير واضحة'
    END AS should_display
FROM Clearance_Requests
WHERE id IN (1, 2, 3, 4, 5)
ORDER BY id;

-- Step 2: Check if there are any pending approvals for these requests
SELECT 
    c.id,
    c.reference_number,
    c.status,
    COUNT(ra.approval_id) AS total_approvals,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) AS approved_approvals,
    SUM(CASE WHEN ra.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_approvals,
    CASE 
        WHEN SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) = 0 THEN '⚠️ لا توجد موافقات معلقة - لا يجب عرضه'
        WHEN SUM(CASE WHEN ra.status = 'rejected' THEN 1 ELSE 0 END) > 0 THEN '❌ تم رفضه - لا يجب عرضه'
        WHEN COUNT(ra.approval_id) = 0 THEN '⚠️ لا توجد موافقات - خطأ في النظام'
        ELSE '✅ معلق - عرضه صحيح'
    END AS display_recommendation
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = c.id
WHERE c.id IN (1, 2, 3, 4, 5)
GROUP BY c.id, c.reference_number, c.status
ORDER BY c.id;

-- Step 3: List approvers for each request
SELECT 
    c.id,
    c.reference_number,
    u.name AS approver_name,
    r.role_name,
    ra.approval_order,
    ra.status AS approval_status,
    ra.decided_at
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = c.id
LEFT JOIN App_Users u ON u.id = ra.approver_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.role_id = ur.role_id
WHERE c.id IN (1, 2, 3, 4, 5)
ORDER BY c.id, ra.approval_order;

-- Step 4: Recommendations
SELECT 
    id,
    reference_number,
    CASE 
        -- If completed/rejected, should not appear in admin-approval-status
        WHEN status IN ('مكتمل', 'مرفوض', 'completed', 'rejected', 'approved') 
            THEN '❌ REDUNDANT - Remove from pending view'
        
        -- If approved_count >= total_approvers, mark as complete
        WHEN approved_count >= total_approvers AND total_approvers > 0 
            THEN '✅ AUTO-COMPLETE - Update status to مكتمل'
        
        -- If no pending approvals in Request_Approvals table
        WHEN NOT EXISTS (
            SELECT 1 FROM Request_Approvals ra2 
            WHERE ra2.request_type = 'clearance' 
              AND ra2.request_id = Clearance_Requests.id 
              AND ra2.status = 'pending'
        ) THEN '⚠️ NO PENDING APPROVALS - Hide from pending view'
        
        -- Otherwise, it's a valid pending request
        ELSE '✅ VALID PENDING - Should show in admin-approval-status'
    END AS recommendation,
    status,
    approved_count,
    total_approvers,
    final_decision
FROM Clearance_Requests
WHERE id IN (1, 2, 3, 4, 5)
ORDER BY id;

-- Step 5: Fix any that should be completed
UPDATE Clearance_Requests
SET status = 'مكتمل',
    final_decision = 'approved',
    approval_stage = 'Fully Approved',
    approved_at = NOW()
WHERE id IN (1, 2, 3, 4, 5)
  AND approved_count >= total_approvers
  AND total_approvers > 0
  AND status NOT IN ('مكتمل', 'مرفوض');

-- Step 6: Final verification
SELECT 
    id,
    reference_number,
    status,
    approved_count,
    total_approvers,
    final_decision,
    CASE 
        WHEN status IN ('مكتمل', 'مرفوض') THEN '✅ Hidden from pending'
        WHEN status IN ('قيد الاعتماد', 'pending') THEN '👁️ Visible in pending'
        ELSE '❓ Unknown'
    END AS visibility
FROM Clearance_Requests
WHERE id IN (1, 2, 3, 4, 5)
ORDER BY id;

