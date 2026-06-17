-- ========================================
-- Migration 010: Role Hierarchy System
-- ========================================
-- Purpose: Implement role hierarchy where ADMIN inherits all role permissions
-- Author: System
-- Date: 2025-10-20
-- ========================================

-- Create role hierarchy table
CREATE TABLE IF NOT EXISTS role_hierarchy (
  hierarchy_id INT AUTO_INCREMENT PRIMARY KEY,
  parent_role_id INT NOT NULL COMMENT 'Parent role that inherits child permissions',
  child_role_id INT NOT NULL COMMENT 'Child role whose permissions are inherited',
  inheritance_level INT DEFAULT 1 COMMENT 'Level of inheritance (1=direct, 2=indirect, etc)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL COMMENT 'User who created this hierarchy',
  UNIQUE KEY uq_hierarchy (parent_role_id, child_role_id),
  FOREIGN KEY (parent_role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (child_role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  INDEX idx_parent_role (parent_role_id),
  INDEX idx_child_role (child_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Role hierarchy for permission inheritance';

-- Set ADMIN as parent of all other roles (direct inheritance)
INSERT IGNORE INTO role_hierarchy (parent_role_id, child_role_id, inheritance_level)
SELECT 
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1) AS parent_role_id,
  role_id AS child_role_id,
  1 AS inheritance_level
FROM roles 
WHERE role_name != 'ADMIN' AND is_active = TRUE;

-- Verify hierarchy creation
SELECT 
  p.role_name AS parent_role,
  c.role_name AS child_role,
  h.inheritance_level
FROM role_hierarchy h
INNER JOIN roles p ON h.parent_role_id = p.role_id
INNER JOIN roles c ON h.child_role_id = c.role_id
ORDER BY h.inheritance_level, p.role_name, c.role_name;

-- ========================================
-- Expected Result:
-- ADMIN -> EMPLOYEE (level 1)
-- ADMIN -> MANAGER (level 1)
-- ADMIN -> HR (level 1)
-- ADMIN -> FINANCE (level 1)
-- ADMIN -> IT (level 1)
-- ========================================

-- Migration complete
SELECT 'Migration 010: Role hierarchy created successfully' AS status;

-- ========================================
-- Rollback Instructions:
-- DROP TABLE IF EXISTS role_hierarchy;
-- ========================================

