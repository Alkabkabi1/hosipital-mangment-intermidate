-- ==========================================
-- Fix Certificate Request Type ENUM
-- This adds 'certificate' to ALL tables that need it
-- ==========================================

-- STEP 1: Fix Approval_Rules table
ALTER TABLE Approval_Rules 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate') NOT NULL;

-- STEP 2: Fix Request_Approvals table (THIS IS THE CRITICAL ONE!)
ALTER TABLE Request_Approvals 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate') NOT NULL;

-- STEP 3: Add approval rule for certificates
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active)
VALUES ('certificate', 'HR', 1, TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- STEP 4: Verify it worked
SELECT 'Approval_Rules check:' as step;
SELECT * FROM Approval_Rules WHERE request_type = 'certificate';

SELECT 'Request_Approvals structure check:' as step;
SHOW COLUMNS FROM Request_Approvals LIKE 'request_type';

