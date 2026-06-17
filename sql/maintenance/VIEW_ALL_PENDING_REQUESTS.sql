-- View ALL pending requests across all request types

-- Unified view of all pending requests
SELECT 
    'Onboarding' AS type,
    id,
    reference_number,
    employee_name,
    employee_email,
    employee_dept,
    status,
    approved_count,
    total_approvers,
    CONCAT(approved_count, '/', total_approvers) AS progress,
    request_date,
    created_at
FROM Onboarding_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة', 'pending', 'submitted')

UNION ALL

SELECT 
    'Clearance' AS type,
    id,
    reference_number,
    employee_name,
    employee_email,
    employee_dept,
    status,
    approved_count,
    total_approvers,
    CONCAT(approved_count, '/', total_approvers) AS progress,
    request_date,
    created_at
FROM Clearance_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة', 'pending', 'submitted')

UNION ALL

SELECT 
    'Certificate' AS type,
    id,
    CONCAT('CRT-', id) AS reference_number,
    employee_name,
    employee_name AS employee_email,
    NULL AS employee_dept,
    status,
    approved_count,
    total_approvers,
    CONCAT(approved_count, '/', total_approvers) AS progress,
    created_at AS request_date,
    created_at
FROM Certificate_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending', 'submitted')

UNION ALL

SELECT 
    'Experience' AS type,
    id,
    CONCAT('EXP-', id) AS reference_number,
    employee_name,
    employee_name AS employee_email,
    NULL AS employee_dept,
    status,
    approved_count,
    total_approvers,
    CONCAT(approved_count, '/', total_approvers) AS progress,
    created_at AS request_date,
    created_at
FROM Experience_Certificate_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending', 'submitted')

ORDER BY created_at DESC;

-- Summary by type
SELECT 
    request_type,
    COUNT(*) AS pending_count,
    SUM(approved_count) AS total_approvals_received,
    SUM(total_approvers) AS total_approvals_needed
FROM (
    SELECT 'Onboarding' AS request_type, approved_count, total_approvers
    FROM Onboarding_Requests
    WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة', 'pending')
    
    UNION ALL
    
    SELECT 'Clearance' AS request_type, approved_count, total_approvers
    FROM Clearance_Requests
    WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة', 'pending')
    
    UNION ALL
    
    SELECT 'Certificate' AS request_type, approved_count, total_approvers
    FROM Certificate_Requests
    WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
    
    UNION ALL
    
    SELECT 'Experience' AS request_type, approved_count, total_approvers
    FROM Experience_Certificate_Requests
    WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
) AS all_pending
GROUP BY request_type
ORDER BY pending_count DESC;

-- Quick count by status
SELECT 
    'TOTAL PENDING' AS summary,
    COUNT(*) AS count
FROM (
    SELECT id FROM Onboarding_Requests WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
    UNION ALL
    SELECT id FROM Clearance_Requests WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
    UNION ALL
    SELECT id FROM Certificate_Requests WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
    UNION ALL
    SELECT id FROM Experience_Certificate_Requests WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
) AS total_pending;

