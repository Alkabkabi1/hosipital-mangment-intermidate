-- Check ALL requests across all types to see what actually exists

-- 1. ONBOARDING REQUESTS
SELECT 
    'Onboarding' AS type,
    id,
    reference_number,
    employee_name,
    status,
    approved_count,
    total_approvers,
    created_at,
    CONCAT('http://localhost:3037/Frontend/HTML/admin-direct-detail.html?id=', id) AS url
FROM Onboarding_Requests
ORDER BY id;

-- 2. CLEARANCE REQUESTS
SELECT 
    'Clearance' AS type,
    id,
    reference_number,
    employee_name,
    status,
    approved_count,
    total_approvers,
    created_at,
    CONCAT('http://localhost:3037/Frontend/HTML/admin-clearance-detail.html?id=', id) AS url
FROM Clearance_Requests
ORDER BY id;

-- 3. CERTIFICATE REQUESTS
-- Note: admin-certificate-detail.html doesn't exist yet
-- View certificates from: http://localhost:3037/Frontend/HTML/admin-certificate-inbox.html
SELECT 
    'Certificate' AS type,
    id,
    CONCAT('CERT-', id) AS reference_number,
    employee_name,
    status,
    approved_count,
    total_approvers,
    created_at,
    'Use admin-certificate-inbox.html to view' AS url
FROM Certificate_Requests
ORDER BY id;

-- 4. EXPERIENCE REQUESTS
-- Note: No detail page exists for experience certificates yet
SELECT 
    'Experience' AS type,
    id,
    CONCAT('EXP-', id) AS reference_number,
    employee_name,
    status,
    approved_count,
    total_approvers,
    created_at,
    'No detail page - view from inbox' AS url
FROM Experience_Certificate_Requests
ORDER BY id;

-- 5. DELEGATION REQUESTS
SELECT 
    'Delegation' AS type,
    id,
    CONCAT('DEL-', id) AS reference_number,
    from_user_id AS employee_name,
    status,
    0 AS approved_count,
    0 AS total_approvers,
    created_at,
    CONCAT('http://localhost:3037/Frontend/HTML/admin-delegation-detail.html?id=', id) AS url
FROM Delegations
ORDER BY id;

-- 6. SUMMARY COUNT
SELECT 
    'SUMMARY' AS info,
    (SELECT COUNT(*) FROM Onboarding_Requests) AS onboarding_total,
    (SELECT COUNT(*) FROM Clearance_Requests) AS clearance_total,
    (SELECT COUNT(*) FROM Certificate_Requests) AS certificate_total,
    (SELECT COUNT(*) FROM Experience_Certificate_Requests) AS experience_total,
    (SELECT COUNT(*) FROM Delegations) AS delegation_total,
    (SELECT COUNT(*) FROM Onboarding_Requests) + 
    (SELECT COUNT(*) FROM Clearance_Requests) + 
    (SELECT COUNT(*) FROM Certificate_Requests) + 
    (SELECT COUNT(*) FROM Experience_Certificate_Requests) + 
    (SELECT COUNT(*) FROM Delegations) AS grand_total;

-- 7. PENDING REQUESTS ONLY
SELECT 
    'Onboarding' AS type,
    id,
    reference_number,
    employee_name,
    status
FROM Onboarding_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
UNION ALL
SELECT 
    'Clearance' AS type,
    id,
    reference_number,
    employee_name,
    status
FROM Clearance_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
UNION ALL
SELECT 
    'Certificate' AS type,
    id,
    CONCAT('CERT-', id),
    employee_name,
    status
FROM Certificate_Requests
WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'pending')
ORDER BY type, id;

