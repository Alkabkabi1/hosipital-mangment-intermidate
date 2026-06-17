-- ULTRA SAFE VERSION - Works even with strictest safe update mode
-- Updates each request individually using primary key

-- Step 1: Update Onboarding Requests (one by one using ID)
UPDATE Onboarding_Requests
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id)
    FROM Request_Approvals
    WHERE request_type = 'onboarding' 
      AND request_id = Onboarding_Requests.id
)
WHERE id IN (
    SELECT DISTINCT request_id 
    FROM Request_Approvals 
    WHERE request_type = 'onboarding'
);

-- Step 2: Update Clearance Requests (one by one using ID)
UPDATE Clearance_Requests
SET total_approvers = (
    SELECT COUNT(DISTINCT approver_id)
    FROM Request_Approvals
    WHERE request_type = 'clearance' 
      AND request_id = Clearance_Requests.id
)
WHERE id IN (
    SELECT DISTINCT request_id 
    FROM Request_Approvals 
    WHERE request_type = 'clearance'
);

-- Step 3: Verify Onboarding
SELECT 
    'Onboarding' AS type,
    o.id,
    o.reference_number,
    o.status,
    o.approved_count,
    o.total_approvers,
    (SELECT COUNT(DISTINCT approver_id) 
     FROM Request_Approvals 
     WHERE request_type = 'onboarding' AND request_id = o.id) AS actual_count,
    CASE 
        WHEN o.total_approvers = (SELECT COUNT(DISTINCT approver_id) 
                                   FROM Request_Approvals 
                                   WHERE request_type = 'onboarding' AND request_id = o.id)
        THEN '✅ Match'
        ELSE '❌ Mismatch'
    END AS status
FROM Onboarding_Requests o
WHERE o.status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
ORDER BY o.id;

-- Step 4: Verify Clearance
SELECT 
    'Clearance' AS type,
    c.id,
    c.reference_number,
    c.status,
    c.approved_count,
    c.total_approvers,
    (SELECT COUNT(DISTINCT approver_id) 
     FROM Request_Approvals 
     WHERE request_type = 'clearance' AND request_id = c.id) AS actual_count,
    CASE 
        WHEN c.total_approvers = (SELECT COUNT(DISTINCT approver_id) 
                                   FROM Request_Approvals 
                                   WHERE request_type = 'clearance' AND request_id = c.id)
        THEN '✅ Match'
        ELSE '❌ Mismatch'
    END AS status
FROM Clearance_Requests c
WHERE c.status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
ORDER BY c.id;

-- Step 5: Final check for any remaining duplicates
SELECT 
    ra.request_type,
    ra.request_id,
    ra.approver_id,
    u.name AS approver_name,
    COUNT(*) AS approval_count,
    GROUP_CONCAT(ra.approval_id) AS approval_ids,
    GROUP_CONCAT(ra.status) AS statuses
FROM Request_Approvals ra
INNER JOIN App_Users u ON u.id = ra.approver_id
GROUP BY ra.request_type, ra.request_id, ra.approver_id, u.name
HAVING approval_count > 1
ORDER BY approval_count DESC;

-- Step 6: Show summary of all pending approvals
SELECT 
    request_type,
    COUNT(DISTINCT CONCAT(request_type, '-', request_id)) AS unique_requests,
    COUNT(DISTINCT approver_id) AS unique_approvers,
    COUNT(*) AS total_approval_records,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_approvals
FROM Request_Approvals
GROUP BY request_type
ORDER BY request_type;

