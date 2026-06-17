-- ========================================
-- Migration 013: Create Role Templates System
-- ========================================
-- Purpose: Enable pre-defined role combinations for quick assignment
-- Author: System
-- Date: 2025-10-20
-- ========================================

-- Create role templates table
CREATE TABLE IF NOT EXISTS role_templates (
  template_id INT AUTO_INCREMENT PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Template name in English',
  template_name_ar VARCHAR(150) NOT NULL COMMENT 'Template name in Arabic',
  description TEXT COMMENT 'Template description',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether template is available for use',
  created_by INT NULL COMMENT 'User who created this template',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES App_Users(id) ON DELETE SET NULL,
  INDEX idx_template_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pre-defined role combination templates';

-- Create template-role mapping table
CREATE TABLE IF NOT EXISTS role_template_roles (
  template_role_id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL COMMENT 'Template ID',
  role_id INT NOT NULL COMMENT 'Role ID in this template',
  UNIQUE KEY uq_template_role (template_id, role_id),
  FOREIGN KEY (template_id) REFERENCES role_templates(template_id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  INDEX idx_template_id (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Roles included in each template';

-- Insert default templates
INSERT INTO role_templates (template_name, template_name_ar, description, created_by) VALUES
('Department Manager', 'مدير قسم', 'Manager role with department-level permissions', 1),
('HR Specialist', 'أخصائي موارد بشرية', 'HR role with employee management capabilities', 1),
('Finance Approver', 'مسؤول الموافقات المالية', 'Finance role with clearance approval permissions', 1),
('System Administrator', 'مدير النظام', 'Full admin access with IT permissions', 1),
('Basic Employee', 'موظف عادي', 'Standard employee with basic request permissions', 1);

-- Map roles to templates
-- Department Manager = MANAGER
INSERT INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'Department Manager'),
  role_id
FROM roles WHERE role_name = 'MANAGER';

-- HR Specialist = HR + some permissions
INSERT INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'HR Specialist'),
  role_id
FROM roles WHERE role_name IN ('HR', 'EMPLOYEE');

-- Finance Approver = FINANCE
INSERT INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'Finance Approver'),
  role_id
FROM roles WHERE role_name IN ('FINANCE', 'EMPLOYEE');

-- System Administrator = ADMIN + IT
INSERT INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'System Administrator'),
  role_id
FROM roles WHERE role_name IN ('ADMIN', 'IT');

-- Basic Employee = EMPLOYEE only
INSERT INTO role_template_roles (template_id, role_id)
SELECT 
  (SELECT template_id FROM role_templates WHERE template_name = 'Basic Employee'),
  role_id
FROM roles WHERE role_name = 'EMPLOYEE';

-- Create view for easy template querying
CREATE OR REPLACE VIEW role_template_details AS
SELECT 
  rt.template_id,
  rt.template_name,
  rt.template_name_ar,
  rt.description,
  rt.is_active,
  GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles,
  GROUP_CONCAT(r.role_name_ar ORDER BY r.role_name) AS roles_ar,
  COUNT(DISTINCT rtr.role_id) AS role_count,
  rt.created_at
FROM role_templates rt
LEFT JOIN role_template_roles rtr ON rtr.template_id = rt.template_id
LEFT JOIN roles r ON r.role_id = rtr.role_id
GROUP BY rt.template_id, rt.template_name, rt.template_name_ar, rt.description, rt.is_active, rt.created_at
ORDER BY rt.template_name;

-- Verify tables created
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('role_templates', 'role_template_roles');

-- Show default templates
SELECT * FROM role_template_details;

-- Migration complete
SELECT 'Migration 013: Role templates system created successfully' AS status;

-- ========================================
-- Usage Examples:
--
-- Get all active templates:
-- SELECT * FROM role_template_details WHERE is_active = TRUE;
--
-- Assign template to user:
-- INSERT INTO user_roles (user_id, role_id, assigned_by)
-- SELECT 123, rtr.role_id, 1
-- FROM role_template_roles rtr
-- WHERE rtr.template_id = ?;
--
-- Create custom template:
-- INSERT INTO role_templates (template_name, template_name_ar, description, created_by)
-- VALUES ('Custom Template', 'قالب مخصص', 'Description', 1);
-- ========================================

-- ========================================
-- Rollback Instructions:
-- DROP VIEW IF EXISTS role_template_details;
-- DROP TABLE IF EXISTS role_template_roles;
-- DROP TABLE IF EXISTS role_templates;
-- ========================================

