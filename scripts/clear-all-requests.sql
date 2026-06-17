-- ==========================================
-- Clear All Request Forms for Fresh Testing
-- ==========================================
-- This script deletes all request data while preserving:
-- - App_Users table
-- - Employees table  
-- - Departments table
-- - Roles and permissions

-- ==========================================
-- 1. Clear Status History Tables First (Foreign Key Dependencies)
-- ==========================================

-- Clear all status history tables
DELETE FROM Exit_Request_Status_History;
DELETE FROM Leave_Request_Status_History;
DELETE FROM Assignment_Status_History;
DELETE FROM Assignment_Termination_Status_History;  
DELETE FROM Internal_Transfer_Status_History;

-- Clear certificate and experience history (if they exist)
DELETE FROM Certificate_Status_History WHERE 1=1;
DELETE FROM Experience_Status_History WHERE 1=1;

-- ==========================================
-- 2. Clear Request Approvals (Multi-Approval System)
-- ==========================================

-- Clear all approval records
DELETE FROM Request_Approvals;

-- ==========================================
-- 3. Clear All Main Request Tables
-- ==========================================

-- Core request types
DELETE FROM Clearance_Requests;
DELETE FROM Onboarding_Requests;
DELETE FROM Delegation_Requests;

-- Certificate types
DELETE FROM Certificate_Requests;
DELETE FROM Experience_Certificate_Requests;

-- Leave and exit types  
DELETE FROM Leave_Requests;
DELETE FROM Exit_Requests;

-- Assignment types (if tables exist)
DELETE FROM Assignment_Requests WHERE 1=1;
DELETE FROM Assignment_Termination_Requests WHERE 1=1;
DELETE FROM Internal_Transfer_Requests WHERE 1=1;

-- Additional request types (if tables exist)
DELETE FROM Maternity_Leave_Requests WHERE 1=1;
DELETE FROM Housing_Allowance_Requests WHERE 1=1;

-- ==========================================
-- 4. Clear Any Comment Tables (if they exist)
-- ==========================================

DELETE FROM Leave_Request_Comments WHERE 1=1;
DELETE FROM Certificate_Request_Comments WHERE 1=1;
DELETE FROM Experience_Request_Comments WHERE 1=1;

-- ==========================================
-- 5. Reset Auto-Increment Counters (Optional)
-- ==========================================

-- Reset primary key sequences to start fresh
ALTER TABLE Clearance_Requests AUTO_INCREMENT = 1;
ALTER TABLE Onboarding_Requests AUTO_INCREMENT = 1;
ALTER TABLE Delegation_Requests AUTO_INCREMENT = 1;
ALTER TABLE Certificate_Requests AUTO_INCREMENT = 1;
ALTER TABLE Experience_Certificate_Requests AUTO_INCREMENT = 1;
ALTER TABLE Leave_Requests AUTO_INCREMENT = 1;
ALTER TABLE Exit_Requests AUTO_INCREMENT = 1;
ALTER TABLE Request_Approvals AUTO_INCREMENT = 1;

-- Reset assignment tables if they exist
ALTER TABLE Assignment_Requests AUTO_INCREMENT = 1;
ALTER TABLE Assignment_Termination_Requests AUTO_INCREMENT = 1;
ALTER TABLE Internal_Transfer_Requests AUTO_INCREMENT = 1;

-- Reset history tables
ALTER TABLE Exit_Request_Status_History AUTO_INCREMENT = 1;
ALTER TABLE Leave_Request_Status_History AUTO_INCREMENT = 1;
ALTER TABLE Assignment_Status_History AUTO_INCREMENT = 1;
ALTER TABLE Assignment_Termination_Status_History AUTO_INCREMENT = 1;
ALTER TABLE Internal_Transfer_Status_History AUTO_INCREMENT = 1;

-- ==========================================
-- 6. Verification Queries
-- ==========================================

-- Count remaining records (should all be 0)
SELECT 
  'Clearance_Requests' as table_name, COUNT(*) as remaining_records FROM Clearance_Requests
UNION ALL
SELECT 
  'Onboarding_Requests' as table_name, COUNT(*) as remaining_records FROM Onboarding_Requests  
UNION ALL
SELECT 
  'Delegation_Requests' as table_name, COUNT(*) as remaining_records FROM Delegation_Requests
UNION ALL
SELECT 
  'Certificate_Requests' as table_name, COUNT(*) as remaining_records FROM Certificate_Requests
UNION ALL
SELECT 
  'Experience_Certificate_Requests' as table_name, COUNT(*) as remaining_records FROM Experience_Certificate_Requests
UNION ALL
SELECT 
  'Leave_Requests' as table_name, COUNT(*) as remaining_records FROM Leave_Requests
UNION ALL
SELECT 
  'Exit_Requests' as table_name, COUNT(*) as remaining_records FROM Exit_Requests
UNION ALL
SELECT 
  'Request_Approvals' as table_name, COUNT(*) as remaining_records FROM Request_Approvals;

-- Verify employees and users are preserved  
SELECT 
  'App_Users' as table_name, COUNT(*) as preserved_records FROM App_Users
UNION ALL
SELECT 
  'Employees' as table_name, COUNT(*) as preserved_records FROM Employees
UNION ALL  
SELECT 
  'Departments' as table_name, COUNT(*) as preserved_records FROM Departments;

-- ==========================================
-- 7. Clear localStorage Reminder (Frontend)
-- ==========================================

/*
IMPORTANT: After running this script, also clear browser localStorage:

In browser console, run:
localStorage.removeItem('requestsClearance');
localStorage.removeItem('requestsOnboarding');
localStorage.removeItem('requestsDelegation');
localStorage.removeItem('requestsCertificate');
localStorage.removeItem('requestsExperience');
localStorage.removeItem('requestsExit');
localStorage.removeItem('requestsLeave');
localStorage.removeItem('requestsAssignment');
localStorage.removeItem('requestsAssignmentTermination');
localStorage.removeItem('requestsInternalTransfer');

Or simply run: localStorage.clear();
*/

-- ==========================================
-- Execution Summary
-- ==========================================

SELECT 
    'Database cleared successfully!' as status,
    'All request forms deleted' as requests_status,
    'Employees and users preserved' as data_preservation,
    'Ready for fresh testing session' as next_step;
