-- Check which clearance requests actually exist in the database

SELECT 
    id,
    reference_number,
    employee_name,
    employee_email,
    status,
    created_at
FROM Clearance_Requests
ORDER BY id;

-- Check if there are any clearance requests at all
SELECT COUNT(*) AS total_clearance_requests
FROM Clearance_Requests;

-- Check pending clearance with approvals
SELECT 
    c.id,
    c.reference_number,
    c.employee_name,
    c.status,
    c.total_approvers,
    c.approved_count,
    COUNT(DISTINCT ra.approver_id) AS actual_approvers
FROM Clearance_Requests c
LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = c.id
WHERE c.status IN ('قيد الاعتماد', 'pending')
GROUP BY c.id, c.reference_number, c.employee_name, c.status, c.total_approvers, c.approved_count;

