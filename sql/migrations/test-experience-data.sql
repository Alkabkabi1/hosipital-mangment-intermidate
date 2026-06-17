-- Test if experience certificate data exists
SELECT * FROM Experience_Certificate_Requests ORDER BY id DESC LIMIT 5;

-- Check which user created the requests
SELECT 
    id, 
    employee_id, 
    employee_name, 
    position,
    status,
    created_at
FROM Experience_Certificate_Requests 
ORDER BY id DESC;

-- Check the user who's logged in (from terminal logs: user 5)
SELECT id, name, email FROM App_Users WHERE id = 5;

-- Verify the query that the API uses
SELECT id, employee_name, employee_number, position, department, nationality, 
       service_type, start_date, end_date, reason_for_leaving,
       status, approval_stage, total_approvers, approved_count, final_decision,
       request_notes, admin_notes, created_at, updated_at, approved_at
FROM Experience_Certificate_Requests 
WHERE employee_id = 5
ORDER BY created_at DESC;

