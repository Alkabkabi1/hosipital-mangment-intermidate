-- ============================================
-- Fix Approval Cascade Recalculation System
-- ============================================
-- Purpose: Automatically recalculate approval counts when approvers are deleted
-- Also handles auto-approval when the only approver for a role is deleted

-- ============================================
-- Part 1: Stored Procedure for Recalculation
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS SP_Recalculate_Request_Approvals$$

CREATE PROCEDURE SP_Recalculate_Request_Approvals(
  IN p_request_type VARCHAR(20),
  IN p_request_id INT
)
BEGIN
  DECLARE v_total_approvers INT DEFAULT 0;
  DECLARE v_approved_count INT DEFAULT 0;
  DECLARE v_pending_count INT DEFAULT 0;
  DECLARE v_rejected_count INT DEFAULT 0;
  DECLARE v_table_name VARCHAR(50);
  DECLARE v_id_column VARCHAR(50);
  DECLARE v_stage VARCHAR(50);
  DECLARE v_final_decision VARCHAR(20);
  
  -- Get current approval counts
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
  INTO v_total_approvers, v_approved_count, v_pending_count, v_rejected_count
  FROM Request_Approvals
  WHERE request_type = p_request_type AND request_id = p_request_id;
  
  -- Determine stage and final decision
  IF v_rejected_count > 0 THEN
    SET v_stage = 'Rejected';
    SET v_final_decision = 'rejected';
  ELSEIF v_approved_count = v_total_approvers AND v_total_approvers > 0 THEN
    SET v_stage = 'Fully Approved';
    SET v_final_decision = 'approved';
  ELSEIF v_approved_count >= v_total_approvers / 2 AND v_total_approvers > 0 THEN
    SET v_stage = 'Final Review';
    SET v_final_decision = 'pending';
  ELSE
    SET v_stage = 'In Progress';
    SET v_final_decision = 'pending';
  END IF;
  
  -- Determine table name and ID column
  CASE p_request_type
    WHEN 'clearance' THEN
      SET v_table_name = 'Clearance_Requests';
      SET v_id_column = 'id';
    WHEN 'onboarding' THEN
      SET v_table_name = 'Onboarding_Requests';
      SET v_id_column = 'id';
    WHEN 'delegation' THEN
      SET v_table_name = 'Delegation_Requests';
      SET v_id_column = 'id';
    WHEN 'certificate' THEN
      SET v_table_name = 'Certificate_Requests';
      SET v_id_column = 'id';
    WHEN 'experience' THEN
      SET v_table_name = 'Experience_Certificate_Requests';
      SET v_id_column = 'id';
    WHEN 'direct' THEN
      SET v_table_name = 'Direct_Requests';
      SET v_id_column = 'id';
    WHEN 'leave' THEN
      SET v_table_name = 'Leave_Requests';
      SET v_id_column = 'id';
    WHEN 'exit' THEN
      SET v_table_name = 'Exit_Requests';
      SET v_id_column = 'id';
    ELSE
      SET v_table_name = NULL;
  END CASE;
  
  -- Update the request table with new counts
  IF v_table_name IS NOT NULL THEN
    SET @update_sql = CONCAT(
      'UPDATE ', v_table_name,
      ' SET total_approvers = ', v_total_approvers,
      ', approved_count = ', v_approved_count,
      ', approval_stage = ''', v_stage, '''',
      ', final_decision = ''', v_final_decision, '''',
      ', last_approval_at = NOW()',
      CASE 
        WHEN v_final_decision = 'approved' THEN ', status = ''مكتمل'', approved_at = NOW()'
        WHEN v_final_decision = 'rejected' THEN ', status = ''مرفوض'''
        ELSE ''
      END,
      ' WHERE ', v_id_column, ' = ', p_request_id
    );
    
    PREPARE stmt FROM @update_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Log the recalculation
    INSERT INTO Approval_Recalculation_Log (request_type, request_id, old_total, new_total, recalculated_at)
    VALUES (p_request_type, p_request_id, 0, v_total_approvers, NOW())
    ON DUPLICATE KEY UPDATE new_total = v_total_approvers, recalculated_at = NOW();
  END IF;
END$$

-- ============================================
-- Part 2: Stored Procedure for Auto-Approve Check
-- ============================================

DROP PROCEDURE IF EXISTS SP_Check_Single_Approver_Auto_Approve$$

CREATE PROCEDURE SP_Check_Single_Approver_Auto_Approve(
  IN p_deleted_user_id INT,
  IN p_request_type VARCHAR(20),
  IN p_request_id INT
)
BEGIN
  DECLARE v_deleted_user_roles TEXT;
  DECLARE v_remaining_role_users INT;
  DECLARE v_all_others_approved BOOLEAN DEFAULT FALSE;
  DECLARE v_total_approvers INT;
  DECLARE v_approved_count INT;
  
  -- Get the roles of the deleted user for this request type
  SELECT GROUP_CONCAT(DISTINCT r.role_name)
  INTO v_deleted_user_roles
  FROM user_roles ur
  INNER JOIN roles r ON ur.role_id = r.role_id
  INNER JOIN Approval_Rules ar ON ar.role_name = r.role_name
  WHERE ur.user_id = p_deleted_user_id
    AND ar.request_type = p_request_type
    AND ar.is_active = TRUE
    AND ar.is_required = TRUE;
  
  -- Check if there are any remaining users with those roles
  IF v_deleted_user_roles IS NOT NULL THEN
    SELECT COUNT(DISTINCT u.id)
    INTO v_remaining_role_users
    FROM App_Users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.role_id
    WHERE FIND_IN_SET(r.role_name, v_deleted_user_roles) > 0
      AND ur.is_active = TRUE
      AND u.is_active = TRUE
      AND u.id != p_deleted_user_id;
    
    -- If no remaining users with required role, check if we should auto-approve
    IF v_remaining_role_users = 0 THEN
      -- Check current approval status (excluding the deleted user)
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
      INTO v_total_approvers, v_approved_count
      FROM Request_Approvals
      WHERE request_type = p_request_type 
        AND request_id = p_request_id
        AND approver_id != p_deleted_user_id;
      
      -- If all remaining approvers have approved, auto-approve the request
      IF v_total_approvers > 0 AND v_approved_count = v_total_approvers THEN
        -- Update the approval record for deleted user to approved
        UPDATE Request_Approvals
        SET status = 'approved',
            decision_note = 'Auto-approved: Last approver with required role removed',
            decided_at = NOW()
        WHERE request_type = p_request_type
          AND request_id = p_request_id
          AND approver_id = p_deleted_user_id
          AND status = 'pending';
        
        -- Recalculate will handle updating the request status
      END IF;
    END IF;
  END IF;
END$$

-- ============================================
-- Part 3: Helper Procedure to Find Stuck Requests
-- ============================================

DROP PROCEDURE IF EXISTS SP_Find_Stuck_Requests$$

CREATE PROCEDURE SP_Find_Stuck_Requests()
BEGIN
  -- Find requests where approved_count < total_approvers but no pending approvals exist
  -- Or where total_approvers doesn't match actual count in Request_Approvals
  
  SELECT 
    'clearance' as request_type,
    cr.clearance_id as request_id,
    cr.status,
    cr.total_approvers,
    cr.approved_count,
    COUNT(ra.approval_id) as actual_total,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as actual_approved,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
    'Mismatch in approver counts' as issue
  FROM Clearance_Requests cr
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = cr.clearance_id
  WHERE cr.final_decision = 'pending'
    AND cr.status NOT IN ('مكتمل', 'مرفوض')
  GROUP BY cr.clearance_id
  HAVING cr.total_approvers != actual_total
     OR cr.approved_count != actual_approved
     OR (actual_pending = 0 AND cr.approved_count < cr.total_approvers)
  
  UNION ALL
  
  SELECT 
    'onboarding' as request_type,
    ob.onboarding_id as request_id,
    ob.status,
    ob.total_approvers,
    ob.approved_count,
    COUNT(ra.approval_id) as actual_total,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as actual_approved,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
    'Mismatch in approver counts' as issue
  FROM Onboarding_Requests ob
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'onboarding' AND ra.request_id = ob.onboarding_id
  WHERE ob.final_decision = 'pending'
    AND ob.status NOT IN ('مكتمل', 'مرفوض')
  GROUP BY ob.onboarding_id
  HAVING ob.total_approvers != actual_total
     OR ob.approved_count != actual_approved
     OR (actual_pending = 0 AND ob.approved_count < ob.total_approvers)
  
  UNION ALL
  
  SELECT 
    'delegation' as request_type,
    dr.delegation_id as request_id,
    dr.status,
    dr.total_approvers,
    dr.approved_count,
    COUNT(ra.approval_id) as actual_total,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as actual_approved,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
    'Mismatch in approver counts' as issue
  FROM Delegation_Requests dr
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'delegation' AND ra.request_id = dr.delegation_id
  WHERE dr.final_decision = 'pending'
    AND dr.status NOT IN ('مكتمل', 'مرفوض')
  GROUP BY dr.delegation_id
  HAVING dr.total_approvers != actual_total
     OR dr.approved_count != actual_approved
     OR (actual_pending = 0 AND dr.approved_count < dr.total_approvers)
  
  UNION ALL
  
  SELECT 
    'certificate' as request_type,
    cr.id as request_id,
    cr.status,
    cr.total_approvers,
    cr.approved_count,
    COUNT(ra.approval_id) as actual_total,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as actual_approved,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
    'Mismatch in approver counts' as issue
  FROM Certificate_Requests cr
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'certificate' AND ra.request_id = cr.id
  WHERE cr.final_decision = 'pending'
    AND cr.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY cr.id
  HAVING cr.total_approvers != actual_total
     OR cr.approved_count != actual_approved
     OR (actual_pending = 0 AND cr.approved_count < cr.total_approvers)
  
  UNION ALL
  
  SELECT 
    'experience' as request_type,
    er.id as request_id,
    er.status,
    er.total_approvers,
    er.approved_count,
    COUNT(ra.approval_id) as actual_total,
    SUM(CASE WHEN ra.status = 'approved' THEN 1 ELSE 0 END) as actual_approved,
    SUM(CASE WHEN ra.status = 'pending' THEN 1 ELSE 0 END) as actual_pending,
    'Mismatch in approver counts' as issue
  FROM Experience_Certificate_Requests er
  LEFT JOIN Request_Approvals ra ON ra.request_type = 'experience' AND ra.request_id = er.id
  WHERE er.final_decision = 'pending'
    AND er.status NOT IN ('approved', 'rejected', 'مكتمل', 'مرفوض')
  GROUP BY er.id
  HAVING er.total_approvers != actual_total
     OR er.approved_count != actual_approved
     OR (actual_pending = 0 AND er.approved_count < er.total_approvers);
END$$

DELIMITER ;

-- ============================================
-- Part 4: Create Logging Table
-- ============================================

CREATE TABLE IF NOT EXISTS Approval_Recalculation_Log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type VARCHAR(20) NOT NULL,
  request_id INT NOT NULL,
  old_total INT,
  new_total INT,
  recalculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  triggered_by VARCHAR(100) DEFAULT 'system',
  
  INDEX idx_request (request_type, request_id),
  INDEX idx_recalculated_at (recalculated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Part 5: Trigger on Request_Approvals AFTER DELETE
-- ============================================

DELIMITER $$

DROP TRIGGER IF EXISTS TR_Request_Approvals_After_Delete$$

CREATE TRIGGER TR_Request_Approvals_After_Delete
AFTER DELETE ON Request_Approvals
FOR EACH ROW
BEGIN
  -- Recalculate approval counts for the affected request
  CALL SP_Recalculate_Request_Approvals(OLD.request_type, OLD.request_id);
END$$

DELIMITER ;

-- ============================================
-- Part 6: One-Time Fix for Existing Stuck Requests
-- ============================================

-- Note: This should be run manually after the stored procedures are created
-- Uncomment and run this block to fix existing stuck requests:

/*
DELIMITER $$

DROP PROCEDURE IF EXISTS Fix_All_Stuck_Requests$$

CREATE PROCEDURE Fix_All_Stuck_Requests()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_request_type VARCHAR(20);
  DECLARE v_request_id INT;
  DECLARE v_fixed_count INT DEFAULT 0;
  
  DECLARE stuck_cursor CURSOR FOR
    SELECT request_type, request_id FROM (
      SELECT 'clearance' as request_type, cr.clearance_id as request_id
      FROM Clearance_Requests cr
      LEFT JOIN Request_Approvals ra ON ra.request_type = 'clearance' AND ra.request_id = cr.clearance_id
      WHERE cr.final_decision = 'pending' AND cr.status NOT IN ('مكتمل', 'مرفوض')
      GROUP BY cr.clearance_id
      HAVING cr.total_approvers != COUNT(ra.approval_id)
      
      UNION ALL
      
      SELECT 'onboarding', ob.onboarding_id
      FROM Onboarding_Requests ob
      LEFT JOIN Request_Approvals ra ON ra.request_type = 'onboarding' AND ra.request_id = ob.onboarding_id
      WHERE ob.final_decision = 'pending' AND ob.status NOT IN ('مكتمل', 'مرفوض')
      GROUP BY ob.onboarding_id
      HAVING ob.total_approvers != COUNT(ra.approval_id)
      
      UNION ALL
      
      SELECT 'delegation', dr.delegation_id
      FROM Delegation_Requests dr
      LEFT JOIN Request_Approvals ra ON ra.request_type = 'delegation' AND ra.request_id = dr.delegation_id
      WHERE dr.final_decision = 'pending' AND dr.status NOT IN ('مكتمل', 'مرفوض')
      GROUP BY dr.delegation_id
      HAVING dr.total_approvers != COUNT(ra.approval_id)
      
      UNION ALL
      
      SELECT 'certificate', cr.id
      FROM Certificate_Requests cr
      LEFT JOIN Request_Approvals ra ON ra.request_type = 'certificate' AND ra.request_id = cr.id
      WHERE cr.final_decision = 'pending' AND cr.status NOT IN ('approved', 'rejected')
      GROUP BY cr.id
      HAVING cr.total_approvers != COUNT(ra.approval_id)
      
      UNION ALL
      
      SELECT 'experience', er.id
      FROM Experience_Certificate_Requests er
      LEFT JOIN Request_Approvals ra ON ra.request_type = 'experience' AND ra.request_id = er.id
      WHERE er.final_decision = 'pending' AND er.status NOT IN ('approved', 'rejected')
      GROUP BY er.id
      HAVING er.total_approvers != COUNT(ra.approval_id)
    ) AS stuck_requests;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN stuck_cursor;
  
  fix_loop: LOOP
    FETCH stuck_cursor INTO v_request_type, v_request_id;
    IF done THEN
      LEAVE fix_loop;
    END IF;
    
    CALL SP_Recalculate_Request_Approvals(v_request_type, v_request_id);
    SET v_fixed_count = v_fixed_count + 1;
  END LOOP;
  
  CLOSE stuck_cursor;
  
  SELECT CONCAT('Fixed ', v_fixed_count, ' stuck requests') AS result;
END$$

DELIMITER ;

-- To fix all existing stuck requests, run:
-- CALL Fix_All_Stuck_Requests();
*/

-- ============================================
-- Grant Permissions
-- ============================================

GRANT EXECUTE ON PROCEDURE hospital_management.SP_Recalculate_Request_Approvals TO 'nora'@'localhost';
GRANT EXECUTE ON PROCEDURE hospital_management.SP_Check_Single_Approver_Auto_Approve TO 'nora'@'localhost';
GRANT EXECUTE ON PROCEDURE hospital_management.SP_Find_Stuck_Requests TO 'nora'@'localhost';

-- ============================================
-- Success Message
-- ============================================

SELECT '✅ Approval Recalculation System Created Successfully!' AS Status,
       'Triggers and stored procedures are now active.' AS Info,
       'Run Fix_All_Stuck_Requests() to fix existing stuck requests.' AS Action;

