-- ============================================
-- Configure Role-Based Multi-Approval System
-- ============================================
-- Purpose: Set approval rules so ALL approvers must approve
-- Date: 2025-10-20

-- Clear existing rules
DELETE FROM Approval_Rules WHERE request_type IN ('clearance', 'onboarding', 'delegation');

-- Clearance Approval Rules
-- Finance managers approve clearance, then HR, then Admin
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('clearance', 'FINANCE', 1, TRUE, TRUE),  -- Finance managers approve clearance first
('clearance', 'HR', 2, TRUE, TRUE),       -- HR approves second
('clearance', 'ADMIN', 3, TRUE, TRUE);    -- Admin gives final approval

-- Onboarding Approval Rules
-- HR approves onboarding, then Admin
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('onboarding', 'HR', 1, TRUE, TRUE),      -- HR approves first
('onboarding', 'ADMIN', 2, TRUE, TRUE);   -- Admin gives final approval

-- Delegation Approval Rules
-- Manager approves delegation, then Admin
INSERT INTO Approval_Rules (request_type, role_name, approval_order, is_required, is_active) VALUES
('delegation', 'MANAGER', 1, TRUE, TRUE), -- Manager approves first
('delegation', 'ADMIN', 2, TRUE, TRUE);   -- Admin gives final approval

-- Verify rules
SELECT 
  request_type,
  role_name,
  approval_order,
  is_required,
  is_active
FROM Approval_Rules
ORDER BY request_type, approval_order;

-- ============================================
-- Expected Result:
-- clearance  | FINANCE | 1 | TRUE | TRUE
-- clearance  | HR      | 2 | TRUE | TRUE
-- clearance  | ADMIN   | 3 | TRUE | TRUE
-- onboarding | HR      | 1 | TRUE | TRUE
-- onboarding | ADMIN   | 2 | TRUE | TRUE
-- delegation | MANAGER | 1 | TRUE | TRUE
-- delegation | ADMIN   | 2 | TRUE | TRUE
-- ============================================

