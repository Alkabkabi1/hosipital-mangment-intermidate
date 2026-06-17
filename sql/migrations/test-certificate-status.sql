-- Check all certificate requests and their statuses
SELECT 
    id,
    employee_name,
    status,
    approval_stage,
    final_decision,
    created_at,
    approved_at
FROM Certificate_Requests
ORDER BY id DESC;

-- Check which ones should appear in "pending" query
SELECT 
    id,
    employee_name,
    status,
    (status = 'pending' OR status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')) as should_show_in_pending
FROM Certificate_Requests
ORDER BY id DESC;

