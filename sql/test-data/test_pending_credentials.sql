-- ==========================================
-- Test Data for Credentials Approval System
-- Creates sample pending credentials for testing
-- Date: November 11, 2025
-- ==========================================

-- NOTE: This script automatically finds existing employees and creates test data
-- No need to manually specify employee IDs!

-- First, let's check which employees exist
SELECT '--- CHECKING EXISTING EMPLOYEES ---' as info;

SELECT id, name, email, role 
FROM App_Users 
WHERE role IN ('employee', 'manager', 'hr', 'admin')
ORDER BY id 
LIMIT 5;

-- Get the first two employee IDs dynamically
SET @emp1_id = (SELECT id FROM App_Users WHERE role IN ('employee', 'manager', 'hr', 'admin') ORDER BY id LIMIT 1);
SET @emp2_id = (SELECT id FROM App_Users WHERE role IN ('employee', 'manager', 'hr', 'admin') ORDER BY id LIMIT 1 OFFSET 1);

-- If only one employee exists, use it for both
SET @emp2_id = IFNULL(@emp2_id, @emp1_id);

SELECT CONCAT('Using Employee IDs: ', @emp1_id, ' and ', @emp2_id) as info;

-- Insert test certificates (unverified by default)
INSERT INTO Employee_Certificates (
    employee_id, 
    certificate_name, 
    issuing_institution, 
    certificate_type, 
    field_of_study, 
    issue_date, 
    description,
    verified
) VALUES
-- First employee's certificates
(
    @emp1_id, 
    'دبلوم التمريض المتقدم', 
    'جامعة الملك فهد', 
    'diploma',
    'التمريض المتقدم', 
    '2023-06-15', 
    'دبلوم تدريبي في التمريض المتقدم والعناية المركزة',
    FALSE
),
(
    @emp1_id, 
    'دورة الإسعافات الأولية المتقدمة', 
    'الهلال الأحمر السعودي', 
    'training',
    'الإسعافات الأولية', 
    '2024-03-20', 
    'دورة معتمدة في الإسعافات الأولية المتقدمة',
    FALSE
),
-- Second employee's certificate
(
    @emp2_id, 
    'بكالوريوس إدارة الموارد البشرية', 
    'جامعة الملك عبدالعزيز', 
    'bachelor',
    'إدارة الموارد البشرية', 
    '2020-05-10', 
    'شهادة بكالوريوس في إدارة الموارد البشرية',
    FALSE
)
ON DUPLICATE KEY UPDATE id=id;

-- Insert test licenses (unverified by default)
INSERT INTO Employee_Licenses (
    employee_id, 
    license_name, 
    license_number, 
    issuing_authority, 
    license_type, 
    issue_date, 
    expiry_date, 
    renewal_reminder_days, 
    status,
    description,
    verified
) VALUES
-- First employee's licenses
(
    @emp1_id, 
    'ترخيص التمريض المتخصص', 
    'NUR-ADV-2024-54321', 
    'الهيئة السعودية للتخصصات الصحية',
    'nursing', 
    '2024-01-15', 
    '2026-01-15', 
    45, 
    'active',
    'ترخيص مزاولة مهنة التمريض المتخصص في العناية المركزة',
    FALSE
),
(
    @emp1_id, 
    'شهادة ACLS - دعم الحياة القلبي المتقدم', 
    'ACLS-2024-11223', 
    'جمعية القلب الأمريكية',
    'professional', 
    '2024-08-01', 
    '2026-08-01', 
    60, 
    'active',
    'شهادة معتمدة في دعم الحياة القلبي المتقدم',
    FALSE
),
-- Second employee's license
(
    @emp2_id, 
    'ترخيص ممارس الموارد البشرية المعتمد', 
    'HRCI-2024-98765', 
    'معهد اعتماد الموارد البشرية',
    'professional', 
    '2024-02-01', 
    '2027-02-01', 
    90, 
    'active',
    'ترخيص ممارس الموارد البشرية المعتمد دولياً',
    FALSE
)
ON DUPLICATE KEY UPDATE id=id;

-- Show what was created
SELECT '--- TEST CREDENTIALS CREATED ---' as info;

SELECT 
  'Pending Certificates' as type,
  COUNT(*) as count
FROM Employee_Certificates
WHERE verified = FALSE;

SELECT 
  'Pending Licenses' as type,
  COUNT(*) as count
FROM Employee_Licenses
WHERE verified = FALSE;

-- Show details
SELECT 
  c.id,
  c.certificate_name,
  e.name as employee_name,
  c.created_at
FROM Employee_Certificates c
JOIN App_Users e ON c.employee_id = e.id
WHERE c.verified = FALSE
ORDER BY c.created_at DESC;

SELECT 
  l.id,
  l.license_name,
  e.name as employee_name,
  l.created_at
FROM Employee_Licenses l
JOIN App_Users e ON l.employee_id = e.id
WHERE l.verified = FALSE
ORDER BY l.created_at DESC;

SELECT '
✅ Test data created successfully!

To test the approval system:
1. Open admin-dashboard.html as admin
2. Check the "🎓 الشهادات والتراخيص المعلقة" box
3. You should see the test credentials
4. Try approving or rejecting them

To clean up test data:
DELETE FROM Employee_Certificates WHERE verified = FALSE AND description LIKE "%تدريبي%";
DELETE FROM Employee_Licenses WHERE verified = FALSE AND description LIKE "%معتمدة%";
' as instructions;

