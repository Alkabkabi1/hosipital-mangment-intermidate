-- ============================================
-- Multi-Manager Approval System
-- ============================================

-- Create Request Approvals Tracking Table
CREATE TABLE IF NOT EXISTS Request_Approvals (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('clearance', 'onboarding', 'delegation', 'direct') NOT NULL,
  request_id INT NOT NULL,
  approver_id INT NOT NULL,
  approval_order INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  decision_note TEXT,
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_request (request_type, request_id),
  INDEX idx_approver (approver_id),
  INDEX idx_status (status),
  INDEX idx_order (approval_order),
  
  FOREIGN KEY (approver_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_approval (request_type, request_id, approver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Approval Rules Table (defines who needs to approve)
CREATE TABLE IF NOT EXISTS Approval_Rules (
  rule_id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('clearance', 'onboarding', 'delegation', 'direct') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  approval_order INT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (request_type),
  INDEX idx_role (role_name),
  UNIQUE KEY unique_rule (request_type, role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default approval rules (ALL managers and HR must approve)
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required) VALUES
-- Clearance requests require HR and all Managers
('clearance', 'HR', 1, TRUE),
('clearance', 'MANAGER', 2, TRUE),

-- Onboarding requests require HR and all Managers  
('onboarding', 'HR', 1, TRUE),
('onboarding', 'MANAGER', 2, TRUE),

-- Delegation requests require all Managers
('delegation', 'MANAGER', 1, TRUE),

-- Direct requests require HR approval
('direct', 'HR', 1, TRUE),
('direct', 'MANAGER', 2, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create User Role Assignments History
CREATE TABLE IF NOT EXISTS User_Role_History (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT NOT NULL,
  action ENUM('assigned', 'removed', 'activated', 'deactivated') NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_role (role_id),
  INDEX idx_date (effective_date, expiry_date),
  
  FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES App_Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add approval tracking columns to existing request tables
ALTER TABLE Clearance_Requests 
  ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
  ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
  ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
  ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp';

ALTER TABLE Onboarding_Requests
  ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
  ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
  ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
  ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp';

ALTER TABLE Delegation_Requests
  ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending' COMMENT 'Current approval stage',
  ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0 COMMENT 'Total number of required approvers',
  ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0 COMMENT 'Number of approvals received',
  ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_approval_at TIMESTAMP NULL COMMENT 'Last approval timestamp';

-- Create view for current user roles
CREATE OR REPLACE VIEW V_User_Roles_Current AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  r.role_id,
  r.role_name,
  r.role_name_ar,
  r.description,
  ur.assigned_by,
  ur.assigned_at,
  ab.name AS assigned_by_name,
  ur.is_active
FROM App_Users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN App_Users ab ON ur.assigned_by = ab.id
WHERE ur.is_active = TRUE AND r.is_active = TRUE;

-- Create view for pending approvals
CREATE OR REPLACE VIEW V_Pending_Approvals AS
SELECT 
  ra.approval_id,
  ra.request_type,
  ra.request_id,
  ra.approver_id,
  u.name AS approver_name,
  u.email AS approver_email,
  r.role_name AS approver_role,
  ra.approval_order,
  ra.status,
  ra.created_at,
  CASE 
    WHEN ra.request_type = 'clearance' THEN cr.employee_id
    WHEN ra.request_type = 'onboarding' THEN onb.employee_id
    WHEN ra.request_type = 'delegation' THEN dr.employee_id
    ELSE NULL
  END AS request_owner_id
FROM Request_Approvals ra
INNER JOIN App_Users u ON ra.approver_id = u.id
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.role_id
LEFT JOIN Clearance_Requests cr ON ra.request_type = 'clearance' AND ra.request_id = cr.clearance_id
LEFT JOIN Onboarding_Requests onb ON ra.request_type = 'onboarding' AND ra.request_id = onb.onboarding_id  
LEFT JOIN Delegation_Requests dr ON ra.request_type = 'delegation' AND ra.request_id = dr.delegation_id
WHERE ra.status = 'pending' AND ur.is_active = TRUE;

-- Create stored procedure to initialize approvals for a request
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS SP_Initialize_Request_Approvals(
  IN p_request_type VARCHAR(20),
  IN p_request_id INT
)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_approver_id INT;
  DECLARE v_order INT;
  DECLARE cur CURSOR FOR 
    SELECT DISTINCT u.id, ar.approval_order
    FROM Approval_Rules ar
    INNER JOIN roles r ON ar.role_name = r.role_name
    INNER JOIN user_roles ur ON r.role_id = ur.role_id
    INNER JOIN App_Users u ON ur.user_id = u.id
    WHERE ar.request_type = p_request_type
      AND ar.is_active = TRUE
      AND ar.is_required = TRUE
      AND ur.is_active = TRUE
      AND u.is_active = TRUE
    ORDER BY ar.approval_order, u.id;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- Delete existing approvals for this request (in case of reinitialization)
  DELETE FROM Request_Approvals 
  WHERE request_type = p_request_type AND request_id = p_request_id;

  -- Create approval records for each approver
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_approver_id, v_order;
    IF done THEN
      LEAVE read_loop;
    END IF;

    INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status)
    VALUES (p_request_type, p_request_id, v_approver_id, v_order, 'pending')
    ON DUPLICATE KEY UPDATE status = 'pending', decided_at = NULL, decision_note = NULL;
  END LOOP;
  CLOSE cur;

  -- Update the request table with total approvers count
  SET @total_approvers = (SELECT COUNT(*) FROM Request_Approvals 
                          WHERE request_type = p_request_type AND request_id = p_request_id);
  
  CASE p_request_type
    WHEN 'clearance' THEN
      UPDATE Clearance_Requests 
      SET total_approvers = @total_approvers, approved_count = 0, approval_stage = 'HR Review'
      WHERE clearance_id = p_request_id;
    WHEN 'onboarding' THEN
      UPDATE Onboarding_Requests
      SET total_approvers = @total_approvers, approved_count = 0, approval_stage = 'HR Review'
      WHERE onboarding_id = p_request_id;
    WHEN 'delegation' THEN
      UPDATE Delegation_Requests
      SET total_approvers = @total_approvers, approved_count = 0, approval_stage = 'Manager Review'
      WHERE delegation_id = p_request_id;
  END CASE;
END$$

-- Create stored procedure to process an approval
CREATE PROCEDURE IF NOT EXISTS SP_Process_Approval(
  IN p_request_type VARCHAR(20),
  IN p_request_id INT,
  IN p_approver_id INT,
  IN p_decision ENUM('approved', 'rejected'),
  IN p_note TEXT
)
BEGIN
  DECLARE v_approved_count INT;
  DECLARE v_total_approvers INT;
  DECLARE v_next_stage VARCHAR(50);
  
  -- Update the approval record
  UPDATE Request_Approvals
  SET status = p_decision,
      decision_note = p_note,
      decided_at = NOW()
  WHERE request_type = p_request_type 
    AND request_id = p_request_id 
    AND approver_id = p_approver_id
    AND status = 'pending';
  
  -- If rejected, mark all other approvals as obsolete and update request
  IF p_decision = 'rejected' THEN
    UPDATE Request_Approvals
    SET status = 'rejected'
    WHERE request_type = p_request_type 
      AND request_id = p_request_id 
      AND status = 'pending';
    
    CASE p_request_type
      WHEN 'clearance' THEN
        UPDATE Clearance_Requests 
        SET final_decision = 'rejected', 
            approval_stage = 'Rejected',
            status = 'مرفوض',
            approved_by = p_approver_id,
            approved_at = NOW(),
            rejection_reason = p_note,
            last_approval_at = NOW()
        WHERE clearance_id = p_request_id;
      WHEN 'onboarding' THEN
        UPDATE Onboarding_Requests
        SET final_decision = 'rejected',
            approval_stage = 'Rejected', 
            status = 'مرفوض',
            last_approval_at = NOW()
        WHERE onboarding_id = p_request_id;
      WHEN 'delegation' THEN
        UPDATE Delegation_Requests
        SET final_decision = 'rejected',
            approval_stage = 'Rejected',
            status = 'مرفوض', 
            last_approval_at = NOW()
        WHERE delegation_id = p_request_id;
    END CASE;
  ELSE
    -- Get approval counts
    SELECT 
      COUNT(CASE WHEN status = 'approved' THEN 1 END),
      COUNT(*)
    INTO v_approved_count, v_total_approvers
    FROM Request_Approvals
    WHERE request_type = p_request_type AND request_id = p_request_id;
    
    -- Determine next stage
    IF v_approved_count = v_total_approvers THEN
      SET v_next_stage = 'Fully Approved';
    ELSEIF v_approved_count >= v_total_approvers / 2 THEN
      SET v_next_stage = 'Final Review';
    ELSE
      SET v_next_stage = 'In Progress';
    END IF;
    
    -- Update request with approval progress
    CASE p_request_type
      WHEN 'clearance' THEN
        UPDATE Clearance_Requests
        SET approved_count = v_approved_count,
            approval_stage = v_next_stage,
            final_decision = IF(v_approved_count = v_total_approvers, 'approved', 'pending'),
            status = IF(v_approved_count = v_total_approvers, 'مكتمل', status),
            approved_by = IF(v_approved_count = v_total_approvers, p_approver_id, approved_by),
            approved_at = IF(v_approved_count = v_total_approvers, NOW(), approved_at),
            last_approval_at = NOW()
        WHERE clearance_id = p_request_id;
      WHEN 'onboarding' THEN
        UPDATE Onboarding_Requests
        SET approved_count = v_approved_count,
            approval_stage = v_next_stage,
            final_decision = IF(v_approved_count = v_total_approvers, 'approved', 'pending'),
            status = IF(v_approved_count = v_total_approvers, 'مكتمل', status),
            last_approval_at = NOW()
        WHERE onboarding_id = p_request_id;
      WHEN 'delegation' THEN
        UPDATE Delegation_Requests
        SET approved_count = v_approved_count,
            approval_stage = v_next_stage,
            final_decision = IF(v_approved_count = v_total_approvers, 'approved', 'pending'),
            status = IF(v_approved_count = v_total_approvers, 'مكتمل', status),
            last_approval_at = NOW()
        WHERE delegation_id = p_request_id;
    END CASE;
  END IF;
END$$

DELIMITER ;

-- Grant execute permissions on stored procedures
GRANT EXECUTE ON PROCEDURE hospital_management.SP_Initialize_Request_Approvals TO 'nora'@'localhost';
GRANT EXECUTE ON PROCEDURE hospital_management.SP_Process_Approval TO 'nora'@'localhost';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_approval_stage ON Clearance_Requests(approval_stage);
CREATE INDEX IF NOT EXISTS idx_final_decision ON Clearance_Requests(final_decision);
CREATE INDEX IF NOT EXISTS idx_approval_stage_onb ON Onboarding_Requests(approval_stage);
CREATE INDEX IF NOT EXISTS idx_final_decision_onb ON Onboarding_Requests(final_decision);

-- Insert sample data for testing (optional)
-- This will be done via the backend when requests are created

SELECT '✅ Multi-Approval System Database Schema Created Successfully!' AS Status;

