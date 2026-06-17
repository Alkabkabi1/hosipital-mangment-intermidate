-- ============================================
-- Initialize Multi-Approval for Existing Requests
-- ============================================
-- Purpose: Create approval records for existing pending requests
-- Date: 2025-10-20
-- 
-- This script initializes the multi-approval workflow for requests
-- that were created before the auto-initialization was added.
-- ============================================

-- First, make sure approval rules exist
SELECT 'Checking Approval Rules...' as Status;
SELECT * FROM Approval_Rules ORDER BY request_type, approval_order;

-- Initialize approvals for all pending clearance requests
SELECT '' as '';
SELECT 'Initializing Clearance Requests...' as Status;

-- Loop through each pending clearance request
SET @clearance_ids = NULL;
SELECT GROUP_CONCAT(id) INTO @clearance_ids FROM Clearance_Requests WHERE status = 'قيد الاعتماد';

-- For each clearance request, call the stored procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS Init_All_Clearance_Approvals()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE req_id INT;
  DECLARE cur CURSOR FOR SELECT id FROM Clearance_Requests WHERE status = 'قيد الاعتماد';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO req_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Call the initialization procedure
    CALL SP_Initialize_Request_Approvals('clearance', req_id);
    SELECT CONCAT('✅ Initialized clearance request #', req_id) as Message;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;

CALL Init_All_Clearance_Approvals();
DROP PROCEDURE IF EXISTS Init_All_Clearance_Approvals;

-- Initialize approvals for all pending onboarding requests
SELECT '' as '';
SELECT 'Initializing Onboarding Requests...' as Status;

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS Init_All_Onboarding_Approvals()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE req_id INT;
  DECLARE cur CURSOR FOR SELECT id FROM Onboarding_Requests WHERE status = 'قيد الاعتماد';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO req_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    CALL SP_Initialize_Request_Approvals('onboarding', req_id);
    SELECT CONCAT('✅ Initialized onboarding request #', req_id) as Message;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;

CALL Init_All_Onboarding_Approvals();
DROP PROCEDURE IF EXISTS Init_All_Onboarding_Approvals;

-- Initialize approvals for all pending delegation requests
SELECT '' as '';
SELECT 'Initializing Delegation Requests...' as Status;

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS Init_All_Delegation_Approvals()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE req_id INT;
  DECLARE cur CURSOR FOR SELECT id FROM Delegation_Requests WHERE status = 'قيد الاعتماد' OR status = 'pending';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO req_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    CALL SP_Initialize_Request_Approvals('delegation', req_id);
    SELECT CONCAT('✅ Initialized delegation request #', req_id) as Message;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;

CALL Init_All_Delegation_Approvals();
DROP PROCEDURE IF EXISTS Init_All_Delegation_Approvals;

-- Verify approvals were created
SELECT '' as '';
SELECT 'Verification - Request_Approvals created:' as Status;
SELECT 
  request_type,
  request_id,
  COUNT(*) as approver_count,
  GROUP_CONCAT(approver_id ORDER BY approval_order) as approvers
FROM Request_Approvals
GROUP BY request_type, request_id
ORDER BY request_type, request_id;

-- Show pending approvals per user
SELECT '' as '';
SELECT 'Pending Approvals by User:' as Status;
SELECT 
  u.email,
  u.name,
  COUNT(*) as pending_count,
  GROUP_CONCAT(DISTINCT ra.request_type) as request_types
FROM Request_Approvals ra
JOIN App_Users u ON ra.approver_id = u.id
WHERE ra.status = 'pending'
GROUP BY u.id, u.email, u.name
ORDER BY pending_count DESC;

-- ============================================
-- Done!
-- ============================================
SELECT '' as '';
SELECT '✅ Initialization complete! Check the results above.' as Status;
SELECT 'Now restart your backend server and refresh the role inbox page.' as NextStep;

