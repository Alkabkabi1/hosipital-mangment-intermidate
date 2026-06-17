-- ============================================
-- Add Multi-Approval Support for Leave and Exit Requests
-- ============================================

-- Step 1: Modify Request_Approvals table to include leave and exit types
ALTER TABLE Request_Approvals 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit') NOT NULL;

-- Step 2: Modify Approval_Rules table to include leave and exit types
ALTER TABLE Approval_Rules 
MODIFY COLUMN request_type ENUM('clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit') NOT NULL;

-- Step 3: Add approval rules for Leave requests
-- Leave requires HR approval
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('leave', 'HR', 1, TRUE, TRUE),
('leave', 'MANAGER', 2, TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- Step 4: Add approval rules for Exit requests  
-- Exit requires HR and Manager approval (critical process)
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('exit', 'HR', 1, TRUE, TRUE),
('exit', 'MANAGER', 2, TRUE, TRUE),
('exit', 'ADMIN', 3, TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- Step 5: Ensure Leave_Requests has all required columns
-- (These should already exist from the schema, but adding as safety)
ALTER TABLE Leave_Requests 
ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'Pending Review',
ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;

-- Step 6: Ensure Exit_Requests has all required columns
-- (These should already exist, adding as safety)
ALTER TABLE Exit_Requests 
ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL;

-- Update final_decision to ENUM if it's VARCHAR
ALTER TABLE Exit_Requests 
MODIFY COLUMN final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- Step 7: Update existing Leave requests to initialize approval workflow (optional)
-- Uncomment below if you want to retroactively add approvals to existing requests:
/*
UPDATE Leave_Requests 
SET approval_stage = 'Pending Review',
    total_approvers = 0,
    approved_count = 0,
    final_decision = 'pending'
WHERE status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  AND total_approvers = 0;
*/

-- Step 8: Update existing Exit requests (optional)
/*
UPDATE Exit_Requests 
SET approval_stage = 'Pending Review',
    total_approvers = 0,
    approved_count = 0,
    final_decision = 'pending'
WHERE status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  AND total_approvers = 0;
*/

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_approval_stage_leave ON Leave_Requests(approval_stage);
CREATE INDEX IF NOT EXISTS idx_final_decision_leave ON Leave_Requests(final_decision);
CREATE INDEX IF NOT EXISTS idx_approval_stage_exit ON Exit_Requests(approval_stage);
CREATE INDEX IF NOT EXISTS idx_final_decision_exit ON Exit_Requests(final_decision);

-- Success message
SELECT '✅ Leave and Exit Multi-Approval Support Added Successfully!' AS Status,
       'Leave and Exit requests now support multi-approval workflow' AS Info,
       'Approval Rules: Leave (HR+MANAGER), Exit (HR+MANAGER+ADMIN)' AS Details;

