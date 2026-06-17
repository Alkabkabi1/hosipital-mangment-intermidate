-- ==========================================
-- Add 50 New Employees with Password 123456
-- Date: October 26, 2025
-- ==========================================

-- First, we need to get a department ID to use
-- We'll use an existing department or create a new one

-- Insert 50 new employees
-- Password hash for "123456": $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TbxFQAJLIBoIwhoQvbfd

-- Note: We'll create simple employees with basic info
-- You can customize departments, job titles, etc.

INSERT INTO Employees (
    employee_number,
    full_name_ar,
    first_name_ar,
    second_name_ar,
    third_name_ar,
    family_name_ar,
    email_work,
    phone_primary,
    department_id,
    job_title,
    position,
    hire_date,
    employment_status,
    contract_type,
    nationality,
    gender
) VALUES
-- Employee 1-10
('EMP2001', 'محمد أحمد علي السعيد', 'محمد', 'أحمد', 'علي', 'السعيد', 'employee2001@hospital.sa', '0501111001', 1, 'موظف', 'administrative', '2024-01-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2002', 'فاطمة خالد محمد القحطاني', 'فاطمة', 'خالد', 'محمد', 'القحطاني', 'employee2002@hospital.sa', '0501111002', 1, 'ممرضة', 'nurse', '2024-01-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2003', 'عبدالله سعد عمر المطيري', 'عبدالله', 'سعد', 'عمر', 'المطيري', 'employee2003@hospital.sa', '0501111003', 1, 'فني', 'technician', '2024-01-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2004', 'نورة سليمان عبدالعزيز العتيبي', 'نورة', 'سليمان', 'عبدالعزيز', 'العتيبي', 'employee2004@hospital.sa', '0501111004', 1, 'أخصائية', 'specialist', '2024-01-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2005', 'يوسف عمر فهد الدوسري', 'يوسف', 'عمر', 'فهد', 'الدوسري', 'employee2005@hospital.sa', '0501111005', 1, 'طبيب', 'doctor', '2024-01-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2006', 'سارة عبدالله حسن الشمري', 'سارة', 'عبدالله', 'حسن', 'الشمري', 'employee2006@hospital.sa', '0501111006', 1, 'صيدلانية', 'specialist', '2024-01-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2007', 'خالد فيصل صالح الحربي', 'خالد', 'فيصل', 'صالح', 'الحربي', 'employee2007@hospital.sa', '0501111007', 1, 'مهندس', 'administrative', '2024-01-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2008', 'هند ناصر محمد الغامدي', 'هند', 'ناصر', 'محمد', 'الغامدي', 'employee2008@hospital.sa', '0501111008', 1, 'محاسبة', 'administrative', '2024-01-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2009', 'أحمد ماجد سعيد الزهراني', 'أحمد', 'ماجد', 'سعيد', 'الزهراني', 'employee2009@hospital.sa', '0501111009', 1, 'أخصائي', 'specialist', '2024-01-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2010', 'منى عبدالرحمن علي القرني', 'منى', 'عبدالرحمن', 'علي', 'القرني', 'employee2010@hospital.sa', '0501111010', 1, 'ممرضة', 'nurse', '2024-01-01', 'active', 'permanent', 'سعودي', 'female'),

-- Employee 11-20
('EMP2011', 'عمر فهد أحمد الشهري', 'عمر', 'فهد', 'أحمد', 'الشهري', 'employee2011@hospital.sa', '0501111011', 1, 'فني', 'technician', '2024-01-15', 'active', 'permanent', 'سعودي', 'male'),
('EMP2012', 'ريم محمد سعد العنزي', 'ريم', 'محمد', 'سعد', 'العنزي', 'employee2012@hospital.sa', '0501111012', 1, 'أخصائية تمريض', 'nurse', '2024-01-15', 'active', 'permanent', 'سعودي', 'female'),
('EMP2013', 'سعد عبدالله يوسف الجهني', 'سعد', 'عبدالله', 'يوسف', 'الجهني', 'employee2013@hospital.sa', '0501111013', 1, 'طبيب أسنان', 'doctor', '2024-01-15', 'active', 'permanent', 'سعودي', 'male'),
('EMP2014', 'لطيفة خالد عمر البقمي', 'لطيفة', 'خالد', 'عمر', 'البقمي', 'employee2014@hospital.sa', '0501111014', 1, 'صيدلانية', 'specialist', '2024-01-15', 'active', 'permanent', 'سعودي', 'female'),
('EMP2015', 'ماجد سليمان فهد العمري', 'ماجد', 'سليمان', 'فهد', 'العمري', 'employee2015@hospital.sa', '0501111015', 1, 'مشرف', 'management', '2024-01-15', 'active', 'permanent', 'سعودي', 'male'),
('EMP2016', 'أمل حسن عبدالله الثبيتي', 'أمل', 'حسن', 'عبدالله', 'الثبيتي', 'employee2016@hospital.sa', '0501111016', 1, 'سكرتيرة', 'administrative', '2024-01-15', 'active', 'permanent', 'سعودي', 'female'),
('EMP2017', 'فهد محمد خالد السلمي', 'فهد', 'محمد', 'خالد', 'السلمي', 'employee2017@hospital.sa', '0501111017', 1, 'فني أشعة', 'technician', '2024-01-15', 'active', 'permanent', 'سعودي', 'male'),
('EMP2018', 'نوال سعد عمر الأحمدي', 'نوال', 'سعد', 'عمر', 'الأحمدي', 'employee2018@hospital.sa', '0501111018', 1, 'أخصائية تغذية', 'specialist', '2024-01-15', 'active', 'permanent', 'سعودي', 'female'),
('EMP2019', 'طارق ناصر محمد العسيري', 'طارق', 'ناصر', 'محمد', 'العسيري', 'employee2019@hospital.sa', '0501111019', 1, 'فني مختبر', 'technician', '2024-01-15', 'active', 'permanent', 'سعودي', 'male'),
('EMP2020', 'هيفاء أحمد علي الغانمي', 'هيفاء', 'أحمد', 'علي', 'الغانمي', 'employee2020@hospital.sa', '0501111020', 1, 'ممرضة', 'nurse', '2024-01-15', 'active', 'permanent', 'سعودي', 'female'),

-- Employee 21-30
('EMP2021', 'حسن عبدالعزيز سعيد الشريف', 'حسن', 'عبدالعزيز', 'سعيد', 'الشريف', 'employee2021@hospital.sa', '0501111021', 1, 'طبيب', 'doctor', '2024-02-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2022', 'جواهر محمد فهد الدغيثر', 'جواهر', 'محمد', 'فهد', 'الدغيثر', 'employee2022@hospital.sa', '0501111022', 1, 'أخصائية نفسية', 'specialist', '2024-02-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2023', 'سلطان خالد عبدالله الرشيدي', 'سلطان', 'خالد', 'عبدالله', 'الرشيدي', 'employee2023@hospital.sa', '0501111023', 1, 'فني', 'technician', '2024-02-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2024', 'لينا سعد محمد اليامي', 'لينا', 'سعد', 'محمد', 'اليامي', 'employee2024@hospital.sa', '0501111024', 1, 'صيدلانية', 'specialist', '2024-02-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2025', 'راشد فيصل أحمد المالكي', 'راشد', 'فيصل', 'أحمد', 'المالكي', 'employee2025@hospital.sa', '0501111025', 1, 'مهندس طبي', 'administrative', '2024-02-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2026', 'عبير عمر سليمان الشهراني', 'عبير', 'عمر', 'سليمان', 'الشهراني', 'employee2026@hospital.sa', '0501111026', 1, 'ممرضة', 'nurse', '2024-02-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2027', 'بندر ناصر فهد القحطاني', 'بندر', 'ناصر', 'فهد', 'القحطاني', 'employee2027@hospital.sa', '0501111027', 1, 'أخصائي علاج طبيعي', 'specialist', '2024-02-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2028', 'ريناد خالد محمد العوفي', 'ريناد', 'خالد', 'محمد', 'العوفي', 'employee2028@hospital.sa', '0501111028', 1, 'فنية مختبر', 'technician', '2024-02-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2029', 'فيصل عبدالله أحمد الحازمي', 'فيصل', 'عبدالله', 'أحمد', 'الحازمي', 'employee2029@hospital.sa', '0501111029', 1, 'إداري', 'administrative', '2024-02-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2030', 'غادة سعيد عبدالعزيز الشمراني', 'غادة', 'سعيد', 'عبدالعزيز', 'الشمراني', 'employee2030@hospital.sa', '0501111030', 1, 'ممرضة', 'nurse', '2024-02-01', 'active', 'permanent', 'سعودي', 'female'),

-- Employee 31-40
('EMP2031', 'ناصر محمد سعد البلوي', 'ناصر', 'محمد', 'سعد', 'البلوي', 'employee2031@hospital.sa', '0501111031', 1, 'طبيب', 'doctor', '2024-03-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2032', 'مها فهد عبدالله الصالح', 'مها', 'فهد', 'عبدالله', 'الصالح', 'employee2032@hospital.sa', '0501111032', 1, 'صيدلانية', 'specialist', '2024-03-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2033', 'تركي عبدالعزيز خالد الفهد', 'تركي', 'عبدالعزيز', 'خالد', 'الفهد', 'employee2033@hospital.sa', '0501111033', 1, 'فني', 'technician', '2024-03-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2034', 'جميلة أحمد سعيد الزهراني', 'جميلة', 'أحمد', 'سعيد', 'الزهراني', 'employee2034@hospital.sa', '0501111034', 1, 'ممرضة', 'nurse', '2024-03-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2035', 'عبدالرحمن خالد محمد العجمي', 'عبدالرحمن', 'خالد', 'محمد', 'العجمي', 'employee2035@hospital.sa', '0501111035', 1, 'مشرف', 'management', '2024-03-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2036', 'لمى سليمان عمر الشهري', 'لمى', 'سليمان', 'عمر', 'الشهري', 'employee2036@hospital.sa', '0501111036', 1, 'أخصائية', 'specialist', '2024-03-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2037', 'وليد فهد ناصر المري', 'وليد', 'فهد', 'ناصر', 'المري', 'employee2037@hospital.sa', '0501111037', 1, 'فني أشعة', 'technician', '2024-03-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2038', 'رهف أحمد محمد السبيعي', 'رهف', 'أحمد', 'محمد', 'السبيعي', 'employee2038@hospital.sa', '0501111038', 1, 'ممرضة', 'nurse', '2024-03-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2039', 'مشعل سعد فيصل الدوسري', 'مشعل', 'سعد', 'فيصل', 'الدوسري', 'employee2039@hospital.sa', '0501111039', 1, 'موظف', 'administrative', '2024-03-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2040', 'شذى عبدالله خالد العتيبي', 'شذى', 'عبدالله', 'خالد', 'العتيبي', 'employee2040@hospital.sa', '0501111040', 1, 'صيدلانية', 'specialist', '2024-03-01', 'active', 'permanent', 'سعودي', 'female'),

-- Employee 41-50
('EMP2041', 'بدر محمد عبدالعزيز المطيري', 'بدر', 'محمد', 'عبدالعزيز', 'المطيري', 'employee2041@hospital.sa', '0501111041', 1, 'طبيب', 'doctor', '2024-04-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2042', 'دانة فهد سعد الشمري', 'دانة', 'فهد', 'سعد', 'الشمري', 'employee2042@hospital.sa', '0501111042', 1, 'ممرضة', 'nurse', '2024-04-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2043', 'عادل سليمان أحمد الحربي', 'عادل', 'سليمان', 'أحمد', 'الحربي', 'employee2043@hospital.sa', '0501111043', 1, 'فني', 'technician', '2024-04-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2044', 'آلاء ناصر محمد الغامدي', 'آلاء', 'ناصر', 'محمد', 'الغامدي', 'employee2044@hospital.sa', '0501111044', 1, 'أخصائية', 'specialist', '2024-04-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2045', 'سلمان خالد فيصل الشهراني', 'سلمان', 'خالد', 'فيصل', 'الشهراني', 'employee2045@hospital.sa', '0501111045', 1, 'مهندس', 'administrative', '2024-04-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2046', 'إيمان عبدالله سعيد القرني', 'إيمان', 'عبدالله', 'سعيد', 'القرني', 'employee2046@hospital.sa', '0501111046', 1, 'محاسبة', 'administrative', '2024-04-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2047', 'محمد أحمد عمر الزهراني', 'محمد', 'أحمد', 'عمر', 'الزهراني', 'employee2047@hospital.sa', '0501111047', 1, 'فني', 'technician', '2024-04-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2048', 'سمر فهد محمد السعيد', 'سمر', 'فهد', 'محمد', 'السعيد', 'employee2048@hospital.sa', '0501111048', 1, 'ممرضة', 'nurse', '2024-04-01', 'active', 'permanent', 'سعودي', 'female'),
('EMP2049', 'عبدالمجيد سعد خالد الحربي', 'عبدالمجيد', 'سعد', 'خالد', 'الحربي', 'employee2049@hospital.sa', '0501111049', 1, 'موظف', 'administrative', '2024-04-01', 'active', 'permanent', 'سعودي', 'male'),
('EMP2050', 'تهاني عبدالله أحمد العمري', 'تهاني', 'عبدالله', 'أحمد', 'العمري', 'employee2050@hospital.sa', '0501111050', 1, 'صيدلانية', 'specialist', '2024-04-01', 'active', 'permanent', 'سعودي', 'female');

-- Now create App_Users for all 50 employees with password "123456"
-- Bcrypt hash for "123456": $2b$12$HrOGpvrvkeM/tE09H87WeemgYGzcO3Q3YbPF1upRq2zPyUPBPI6wy

INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
SELECT 
    full_name_ar,
    email_work,
    '$2b$12$HrOGpvrvkeM/tE09H87WeemgYGzcO3Q3YbPF1upRq2zPyUPBPI6wy' as password_hash,
    'employee' as role,
    employee_id,
    1 as is_active
FROM Employees
WHERE employee_number IN (
    'EMP2001', 'EMP2002', 'EMP2003', 'EMP2004', 'EMP2005',
    'EMP2006', 'EMP2007', 'EMP2008', 'EMP2009', 'EMP2010',
    'EMP2011', 'EMP2012', 'EMP2013', 'EMP2014', 'EMP2015',
    'EMP2016', 'EMP2017', 'EMP2018', 'EMP2019', 'EMP2020',
    'EMP2021', 'EMP2022', 'EMP2023', 'EMP2024', 'EMP2025',
    'EMP2026', 'EMP2027', 'EMP2028', 'EMP2029', 'EMP2030',
    'EMP2031', 'EMP2032', 'EMP2033', 'EMP2034', 'EMP2035',
    'EMP2036', 'EMP2037', 'EMP2038', 'EMP2039', 'EMP2040',
    'EMP2041', 'EMP2042', 'EMP2043', 'EMP2044', 'EMP2045',
    'EMP2046', 'EMP2047', 'EMP2048', 'EMP2049', 'EMP2050'
)
AND email_work IS NOT NULL;

-- Assign EMPLOYEE role to all new users
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT 
    u.id,
    r.role_id,
    1 as assigned_by,
    1 as is_active
FROM App_Users u
CROSS JOIN roles r
WHERE u.email LIKE 'employee20%@hospital.sa'
  AND r.role_name = 'EMPLOYEE'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.id AND ur.role_id = r.role_id
  );

-- Verify the import
SELECT 'Employees Added:' as summary, COUNT(*) as count 
FROM Employees 
WHERE employee_number LIKE 'EMP20%';

SELECT 'App_Users Created:' as summary, COUNT(*) as count 
FROM App_Users 
WHERE email LIKE 'employee20%@hospital.sa';

SELECT 'Role Assignments:' as summary, COUNT(*) as count 
FROM user_roles ur
INNER JOIN App_Users u ON ur.user_id = u.id
WHERE u.email LIKE 'employee20%@hospital.sa';

COMMIT;

