-- Check if certificates were added
SELECT * FROM Employee_Certificates ORDER BY created_at DESC LIMIT 10;

-- Check if licenses were added  
SELECT * FROM Employee_Licenses ORDER BY created_at DESC LIMIT 10;

-- Count by employee
SELECT employee_id, COUNT(*) as certificate_count 
FROM Employee_Certificates 
GROUP BY employee_id;

SELECT employee_id, COUNT(*) as license_count 
FROM Employee_Licenses 
GROUP BY employee_id;

