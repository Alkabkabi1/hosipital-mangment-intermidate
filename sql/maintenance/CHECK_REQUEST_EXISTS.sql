-- Check if onboarding request ID 5 exists in the database

SELECT 
    id,
    reference_number,
    employee_name,
    employee_email,
    status,
    request_date,
    start_date,
    created_at
FROM Onboarding_Requests
WHERE id = 5;

-- If this returns no rows, the request doesn't exist
-- You can also check all onboarding requests:

SELECT 
    id,
    reference_number,
    employee_name,
    status,
    created_at
FROM Onboarding_Requests
ORDER BY created_at DESC
LIMIT 20;

-- This will show you all recent onboarding requests and their IDs

