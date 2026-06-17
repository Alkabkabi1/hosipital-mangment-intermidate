-- ============================================
-- Insert Comprehensive Test Data
-- Creates HR users, Managers, and sample requests
-- ============================================

USE nora_database;

-- ============================================
-- 1. Ensure Roles Exist
-- ============================================
INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES
('HR', 'الموارد البشرية', 'Human Resources Role', TRUE),
('MANAGER', 'مدير', 'Manager Role', TRUE),
('EMPLOYEE', 'موظف', 'Employee Role', TRUE),
('ADMIN', 'مسؤول', 'Administrator Role', TRUE);

-- ============================================
-- 2. Get Role IDs
-- ============================================
SET @hr_role_id = (SELECT role_id FROM roles WHERE role_name = 'HR' LIMIT 1);
SET @manager_role_id = (SELECT role_id FROM roles WHERE role_name = 'MANAGER' LIMIT 1);
SET @employee_role_id = (SELECT role_id FROM roles WHERE role_name = 'EMPLOYEE' LIMIT 1);

-- ============================================
-- 3. Create HR Users (3 users)
-- ============================================

-- HR User 1: أحمد محمد
INSERT INTO App_Users (name, email, password_hash, role, is_active, created_at)
VALUES ('أحمد محمد السعيد', 'ahmed.hr@hospital.sa', '$2b$10$examplehash1', 'employee', TRUE, NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @hr_user_1 = LAST_INSERT_ID();
IF @hr_user_1 = 0 THEN
  SET @hr_user_1 = (SELECT id FROM App_Users WHERE email = 'ahmed.hr@hospital.sa');
END IF;

-- Assign HR role
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
VALUES (@hr_user_1, @hr_role_id, 1, NOW(), TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- HR User 2: سارة علي
INSERT INTO App_Users (name, email, password_hash, role, is_active, created_at)
VALUES ('سارة علي الأحمد', 'sara.hr@hospital.sa', '$2b$10$examplehash2', 'employee', TRUE, NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @hr_user_2 = LAST_INSERT_ID();
IF @hr_user_2 = 0 THEN
  SET @hr_user_2 = (SELECT id FROM App_Users WHERE email = 'sara.hr@hospital.sa');
END IF;

INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
VALUES (@hr_user_2, @hr_role_id, 1, NOW(), TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- HR User 3: فاطمة خالد
INSERT INTO App_Users (name, email, password_hash, role, is_active, created_at)
VALUES ('فاطمة خالد المطيري', 'fatima.hr@hospital.sa', '$2b$10$examplehash3', 'employee', TRUE, NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @hr_user_3 = LAST_INSERT_ID();
IF @hr_user_3 = 0 THEN
  SET @hr_user_3 = (SELECT id FROM App_Users WHERE email = 'fatima.hr@hospital.sa');
END IF;

INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
VALUES (@hr_user_3, @hr_role_id, 1, NOW(), TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- ============================================
-- 4. Create Manager Users (4 users)
-- ============================================

INSERT INTO App_Users (name, email, password_hash, role, is_active)
VALUES 
('خالد حسن القحطاني', 'khaled.manager@hospital.sa', '$2b$10$hash1', 'employee', TRUE),
('نورة عبدالله العتيبي', 'noura.manager@hospital.sa', '$2b$10$hash2', 'employee', TRUE),
('محمد سعيد الغامدي', 'mohammed.manager@hospital.sa', '$2b$10$hash3', 'employee', TRUE),
('ريم فهد الدوسري', 'reem.manager@hospital.sa', '$2b$10$hash4', 'employee', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Get manager IDs
SET @manager_1 = (SELECT id FROM App_Users WHERE email = 'khaled.manager@hospital.sa');
SET @manager_2 = (SELECT id FROM App_Users WHERE email = 'noura.manager@hospital.sa');
SET @manager_3 = (SELECT id FROM App_Users WHERE email = 'mohammed.manager@hospital.sa');
SET @manager_4 = (SELECT id FROM App_Users WHERE email = 'reem.manager@hospital.sa');

-- Assign Manager roles
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
VALUES 
(@manager_1, @manager_role_id, 1, DATE_SUB(NOW(), INTERVAL 6 MONTH), TRUE),
(@manager_2, @manager_role_id, 1, DATE_SUB(NOW(), INTERVAL 8 MONTH), TRUE),
(@manager_3, @manager_role_id, 1, DATE_SUB(NOW(), INTERVAL 4 MONTH), TRUE),
(@manager_4, @manager_role_id, 1, DATE_SUB(NOW(), INTERVAL 10 MONTH), TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- ============================================
-- 5. Create Regular Employees (5 users)
-- ============================================

INSERT INTO App_Users (name, email, password_hash, role, is_active)
VALUES 
('عبدالرحمن يوسف', 'abdulrahman.emp@hospital.sa', '$2b$10$hash5', 'employee', TRUE),
('منى إبراهيم', 'mona.emp@hospital.sa', '$2b$10$hash6', 'employee', TRUE),
('سلمان أحمد', 'salman.emp@hospital.sa', '$2b$10$hash7', 'employee', TRUE),
('لينا محمد', 'lina.emp@hospital.sa', '$2b$10$hash8', 'employee', TRUE),
('طارق عمر', 'tariq.emp@hospital.sa', '$2b$10$hash9', 'employee', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Get employee IDs
SET @emp_1 = (SELECT id FROM App_Users WHERE email = 'abdulrahman.emp@hospital.sa');
SET @emp_2 = (SELECT id FROM App_Users WHERE email = 'mona.emp@hospital.sa');
SET @emp_3 = (SELECT id FROM App_Users WHERE email = 'salman.emp@hospital.sa');
SET @emp_4 = (SELECT id FROM App_Users WHERE email = 'lina.emp@hospital.sa');
SET @emp_5 = (SELECT id FROM App_Users WHERE email = 'tariq.emp@hospital.sa');

-- Assign Employee roles
INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, is_active)
VALUES 
(@emp_1, @employee_role_id, 1, DATE_SUB(NOW(), INTERVAL 1 YEAR), TRUE),
(@emp_2, @employee_role_id, 1, DATE_SUB(NOW(), INTERVAL 2 YEAR), TRUE),
(@emp_3, @employee_role_id, 1, DATE_SUB(NOW(), INTERVAL 1 YEAR), TRUE),
(@emp_4, @employee_role_id, 1, DATE_SUB(NOW(), INTERVAL 6 MONTH), TRUE),
(@emp_5, @employee_role_id, 1, DATE_SUB(NOW(), INTERVAL 3 MONTH), TRUE)
ON DUPLICATE KEY UPDATE is_active = TRUE;

-- ============================================
-- 6. Create Sample Clearance Requests
-- ============================================

-- Clearance Request 1 (Pending - needs all approvals)
INSERT INTO Clearance_Requests (
  reference_number, employee_id, employee_email, employee_name, employee_dept,
  status, request_date, last_work_day, reason, created_by_user,
  approval_stage, total_approvers, approved_count, final_decision
) VALUES (
  CONCAT('CLR-', YEAR(NOW()), '-', LPAD(1, 4, '0')),
  @emp_1, 'abdulrahman.emp@hospital.sa', 'عبدالرحمن يوسف', 'الطوارئ',
  'قيد الاعتماد', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  'انتهاء فترة العقد', @emp_1,
  'Pending Review', 4, 0, 'pending'
);

SET @clearance_1 = LAST_INSERT_ID();

-- Clearance Request 2 (In Progress - 2/4 approved)
INSERT INTO Clearance_Requests (
  reference_number, employee_id, employee_email, employee_name, employee_dept,
  status, request_date, last_work_day, reason, created_by_user,
  approval_stage, total_approvers, approved_count, final_decision
) VALUES (
  CONCAT('CLR-', YEAR(NOW()), '-', LPAD(2, 4, '0')),
  @emp_2, 'mona.emp@hospital.sa', 'منى إبراهيم', 'العمليات',
  'قيد الاعتماد', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY),
  'نقل إلى مدينة أخرى', @emp_2,
  'In Progress (2/4)', 4, 2, 'pending'
);

SET @clearance_2 = LAST_INSERT_ID();

-- Clearance Request 3 (Fully Approved)
INSERT INTO Clearance_Requests (
  reference_number, employee_id, employee_email, employee_name, employee_dept,
  status, request_date, last_work_day, reason, created_by_user, approved_by,
  approval_stage, total_approvers, approved_count, final_decision, approved_at
) VALUES (
  CONCAT('CLR-', YEAR(NOW()), '-', LPAD(3, 4, '0')),
  @emp_3, 'salman.emp@hospital.sa', 'سلمان أحمد', 'الأشعة',
  'مكتمل', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY),
  'الحصول على فرصة أفضل', @emp_3, @manager_4,
  'Fully Approved', 4, 4, 'approved', DATE_SUB(NOW(), INTERVAL 1 DAY)
);

SET @clearance_3 = LAST_INSERT_ID();

-- ============================================
-- 7. Create Sample Onboarding Requests
-- ============================================

INSERT INTO Onboarding_Requests (
  reference_number, employee_id, employee_email, employee_name, employee_dept,
  status, request_date, created_by_user,
  approval_stage, total_approvers, approved_count, final_decision
) VALUES 
(
  CONCAT('ONB-', YEAR(NOW()), '-', LPAD(1, 4, '0')),
  @emp_4, 'lina.emp@hospital.sa', 'لينا محمد', 'المختبر',
  'قيد الاعتماد', CURDATE(), @emp_4,
  'HR Review', 4, 1, 'pending'
),
(
  CONCAT('ONB-', YEAR(NOW()), '-', LPAD(2, 4, '0')),
  @emp_5, 'tariq.emp@hospital.sa', 'طارق عمر', 'الصيدلية',
  'قيد الاعتماد', DATE_SUB(CURDATE(), INTERVAL 1 DAY), @emp_5,
  'Pending Review', 4, 0, 'pending'
);

SET @onboarding_1 = (SELECT id FROM Onboarding_Requests ORDER BY id DESC LIMIT 1 OFFSET 1);
SET @onboarding_2 = (SELECT id FROM Onboarding_Requests ORDER BY id DESC LIMIT 1);

-- ============================================
-- 8. Create Sample Delegation Requests
-- ============================================

INSERT INTO Delegation_Requests (
  reference_number, created_by_user, from_email, to_email,
  status, start_date, end_date, reason,
  approval_stage, total_approvers, approved_count, final_decision
) VALUES 
(
  CONCAT('DEL-', YEAR(NOW()), '-', LPAD(1, 4, '0')),
  @manager_1, 'khaled.manager@hospital.sa', 'mohammed.manager@hospital.sa',
  'قيد الاعتماد', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY),
  'إجازة سنوية',
  'Manager Review', 3, 1, 'pending'
),
(
  CONCAT('DEL-', YEAR(NOW()), '-', LPAD(2, 4, '0')),
  @manager_2, 'noura.manager@hospital.sa', 'reem.manager@hospital.sa',
  'مكتمل', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY),
  'مهمة عمل',
  'Fully Approved', 3, 3, 'approved'
);

SET @delegation_1 = (SELECT id FROM Delegation_Requests ORDER BY id DESC LIMIT 1 OFFSET 1);
SET @delegation_2 = (SELECT id FROM Delegation_Requests ORDER BY id DESC LIMIT 1);

-- ============================================
-- 9. Initialize Approval Records
-- ============================================

-- Clearance Request 1 (Pending - all pending)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status) VALUES
('clearance', @clearance_1, @hr_user_1, 1, 'pending'),
('clearance', @clearance_1, @manager_1, 2, 'pending'),
('clearance', @clearance_1, @manager_2, 2, 'pending'),
('clearance', @clearance_1, @manager_3, 2, 'pending');

-- Clearance Request 2 (In Progress - HR + 1 Manager approved)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status, decided_at, decision_note) VALUES
('clearance', @clearance_2, @hr_user_2, 1, 'approved', DATE_SUB(NOW(), INTERVAL 1 DAY), 'موافق - المستندات كاملة'),
('clearance', @clearance_2, @manager_1, 2, 'approved', DATE_SUB(NOW(), INTERVAL 12 HOUR), 'موافق'),
('clearance', @clearance_2, @manager_2, 2, 'pending', NULL, NULL),
('clearance', @clearance_2, @manager_3, 2, 'pending', NULL, NULL);

-- Clearance Request 3 (Fully Approved - all approved)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status, decided_at, decision_note) VALUES
('clearance', @clearance_3, @hr_user_3, 1, 'approved', DATE_SUB(NOW(), INTERVAL 2 DAY), 'موافق'),
('clearance', @clearance_3, @manager_1, 2, 'approved', DATE_SUB(NOW(), INTERVAL 36 HOUR), 'موافق'),
('clearance', @clearance_3, @manager_2, 2, 'approved', DATE_SUB(NOW(), INTERVAL 30 HOUR), 'موافق'),
('clearance', @clearance_3, @manager_4, 2, 'approved', DATE_SUB(NOW(), INTERVAL 24 HOUR), 'موافق');

-- Onboarding Request 1 (HR approved, managers pending)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status, decided_at, decision_note) VALUES
('onboarding', @onboarding_1, @hr_user_1, 1, 'approved', DATE_SUB(NOW(), INTERVAL 6 HOUR), 'موافق - المستندات مكتملة'),
('onboarding', @onboarding_1, @manager_1, 2, 'pending', NULL, NULL),
('onboarding', @onboarding_1, @manager_3, 2, 'pending', NULL, NULL),
('onboarding', @onboarding_1, @manager_4, 2, 'pending', NULL, NULL);

-- Onboarding Request 2 (All pending)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status) VALUES
('onboarding', @onboarding_2, @hr_user_2, 1, 'pending'),
('onboarding', @onboarding_2, @manager_2, 2, 'pending'),
('onboarding', @onboarding_2, @manager_3, 2, 'pending'),
('onboarding', @onboarding_2, @manager_4, 2, 'pending');

-- Delegation Request 1 (1 manager approved)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status, decided_at) VALUES
('delegation', @delegation_1, @manager_2, 1, 'approved', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('delegation', @delegation_1, @manager_3, 1, 'pending', NULL),
('delegation', @delegation_1, @manager_4, 1, 'pending', NULL);

-- Delegation Request 2 (All approved)
INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status, decided_at, decision_note) VALUES
('delegation', @delegation_2, @manager_1, 1, 'approved', DATE_SUB(NOW(), INTERVAL 3 DAY), 'موافق'),
('delegation', @delegation_2, @manager_3, 1, 'approved', DATE_SUB(NOW(), INTERVAL 2 DAY), 'موافق'),
('delegation', @delegation_2, @manager_4, 1, 'approved', DATE_SUB(NOW(), INTERVAL 2 DAY), 'موافق');

-- ============================================
-- 10. Create Notifications
-- ============================================

-- Notifications for employees about their requests
INSERT INTO Notifications (user_id, title_ar, message_ar, type, reference_id, is_read, created_at) VALUES
-- Employee 1 notifications
(@emp_1, 'تم إرسال طلبك', 'تم إرسال طلب إخلاء الطرف بنجاح وهو الآن قيد المراجعة', 'clearance_submitted', @clearance_1, FALSE, NOW()),

-- Employee 2 notifications
(@emp_2, 'موافقة جديدة على طلبك', 'وافق أحمد محمد السعيد (HR) على طلبك (1/4)', 'clearance_approved', @clearance_2, FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@emp_2, 'موافقة جديدة على طلبك', 'وافق خالد حسن القحطاني (Manager) على طلبك (2/4)', 'clearance_approved', @clearance_2, FALSE, DATE_SUB(NOW(), INTERVAL 12 HOUR)),

-- Employee 3 notifications
(@emp_3, 'تمت الموافقة على طلبك', 'تمت الموافقة على طلبك من جميع المدراء (4/4)', 'clearance_fully_approved', @clearance_3, TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Employee 4 notifications
(@emp_4, 'موافقة جديدة على طلبك', 'وافق أحمد محمد السعيد (HR) على طلب التعيين (1/4)', 'onboarding_approved', @onboarding_1, FALSE, DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- Notifications for HR/Managers about pending approvals
(@hr_user_1, 'طلب جديد يتطلب موافقتك', 'لديك طلب إخلاء طرف جديد يتطلب موافقتك', 'clearance_new_approval', @clearance_1, FALSE, NOW()),
(@hr_user_2, 'طلب جديد يتطلب موافقتك', 'لديك طلب تعيين جديد يتطلب موافقتك', 'onboarding_new_approval', @onboarding_2, FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY)),

(@manager_2, 'طلب جديد يتطلب موافقتك', 'لديك طلب إخلاء طرف يتطلب موافقتك (تقدم الموافقات: 2/4)', 'clearance_new_approval', @clearance_2, FALSE, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@manager_3, 'طلب جديد يتطلب موافقتك', 'لديك طلب إخلاء طرف يتطلب موافقتك (تقدم الموافقات: 2/4)', 'clearance_new_approval', @clearance_2, FALSE, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(@manager_3, 'طلب تفويض يتطلب موافقتك', 'لديك طلب تفويض جديد يتطلب موافقتك', 'delegation_new_approval', @delegation_1, FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- ============================================
-- 11. Create User Role History
-- ============================================

INSERT INTO User_Role_History (user_id, role_id, assigned_by, action, effective_date, reason) VALUES
(@hr_user_1, @hr_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 1 YEAR), 'تعيين في قسم الموارد البشرية'),
(@hr_user_2, @hr_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 2 YEAR), 'ترقية إلى منسق الموارد البشرية'),
(@hr_user_3, @hr_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 'انضمام جديد إلى قسم الموارد البشرية'),

(@manager_1, @manager_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 'ترقية إلى منصب المدير'),
(@manager_2, @manager_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 8 MONTH), 'ترقية إلى منصب المدير'),
(@manager_3, @manager_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 'تعيين كمدير قسم'),
(@manager_4, @manager_role_id, 1, 'assigned', DATE_SUB(CURDATE(), INTERVAL 10 MONTH), 'ترقية إلى منصب المدير');

-- ============================================
-- Summary
-- ============================================

SELECT '✅ Test Data Inserted Successfully!' AS Status;

SELECT 'Users Created:' AS Info, COUNT(*) AS Count FROM App_Users WHERE email LIKE '%@hospital.sa';
SELECT 'HR Users:' AS Info, COUNT(*) AS Count FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE r.role_name = 'HR';
SELECT 'Manager Users:' AS Info, COUNT(*) AS Count FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE r.role_name = 'MANAGER';
SELECT 'Clearance Requests:' AS Info, COUNT(*) AS Count FROM Clearance_Requests WHERE created_at >= CURDATE() - INTERVAL 7 DAY;
SELECT 'Onboarding Requests:' AS Info, COUNT(*) AS Count FROM Onboarding_Requests WHERE created_at >= CURDATE() - INTERVAL 7 DAY;
SELECT 'Delegation Requests:' AS Info, COUNT(*) AS Count FROM Delegation_Requests WHERE created_at >= CURDATE() - INTERVAL 7 DAY;
SELECT 'Approval Records:' AS Info, COUNT(*) AS Count FROM Request_Approvals;
SELECT 'Notifications:' AS Info, COUNT(*) AS Count FROM Notifications WHERE created_at >= CURDATE() - INTERVAL 7 DAY;

-- Show HR user emails for login
SELECT '🔑 HR User Credentials:' AS Info;
SELECT 
  email AS 'Email',
  name AS 'Name',
  'Password: (use your auth system)' AS 'Note'
FROM App_Users 
WHERE email IN ('ahmed.hr@hospital.sa', 'sara.hr@hospital.sa', 'fatima.hr@hospital.sa');

