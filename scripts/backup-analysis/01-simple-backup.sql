-- =====================================================
-- SIMPLIFIED HOSPITAL REQUEST BACKUP
-- =====================================================
-- Simple backup script without variable declarations
-- Backs up all request tables for data preservation
-- =====================================================

-- 1. Onboarding Requests
CREATE TABLE IF NOT EXISTS backup_onboarding_requests AS 
SELECT * FROM Onboarding_Requests;

-- 2. Clearance Requests  
CREATE TABLE IF NOT EXISTS backup_clearance_requests AS 
SELECT * FROM Clearance_Requests;

-- 3. Delegation Requests
CREATE TABLE IF NOT EXISTS backup_delegation_requests AS 
SELECT * FROM Delegation_Requests;

-- 4. Certificate Requests
CREATE TABLE IF NOT EXISTS backup_certificate_requests AS 
SELECT * FROM Certificate_Requests;

-- 5. Experience Certificate Requests
CREATE TABLE IF NOT EXISTS backup_experience_certificate_requests AS 
SELECT * FROM Experience_Certificate_Requests;

-- 6. Exit Requests
CREATE TABLE IF NOT EXISTS backup_exit_requests AS 
SELECT * FROM Exit_Requests;

-- 7. Assignment Requests
CREATE TABLE IF NOT EXISTS backup_assignment_requests AS 
SELECT * FROM Assignment_Requests;

-- 8. Assignment Termination Requests
CREATE TABLE IF NOT EXISTS backup_assignment_termination_requests AS 
SELECT * FROM Assignment_Termination_Requests;

-- 9. Internal Transfer Requests
CREATE TABLE IF NOT EXISTS backup_internal_transfer_requests AS 
SELECT * FROM Internal_Transfer_Requests;

-- 10. Maternity Leave Requests
CREATE TABLE IF NOT EXISTS backup_maternity_leave_requests AS 
SELECT * FROM Maternity_Leave_Requests;

-- 11. Housing Allowance Requests
CREATE TABLE IF NOT EXISTS backup_housing_allowance_requests AS 
SELECT * FROM Housing_Allowance_Requests;

-- Backup multi-approval tables if they exist
CREATE TABLE IF NOT EXISTS backup_multi_approval_requests AS 
SELECT * FROM Multi_Approval_Requests;

CREATE TABLE IF NOT EXISTS backup_approval_steps AS 
SELECT * FROM Approval_Steps;

-- Show backup summary
SELECT 'BACKUP COMPLETED' as status, NOW() as timestamp;
