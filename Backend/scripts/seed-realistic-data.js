const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

async function seedRealisticData() {
  console.log('🌱 Seeding realistic Arabic hospital data...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    // 1. SEED EMPLOYEES TABLE (using correct column names)
    console.log('👥 Seeding Employees table...');
    const employees = [
      { 
        employee_number: 'EMP001', 
        full_name_ar: 'أحمد محمد العلي', 
        full_name_en: 'Ahmed Mohammed Al-Ali',
        email_work: 'ahmed.ali@hospital.sa', 
        job_title: 'مطور برمجيات', 
        phone_primary: '0501234567', 
        hire_date: '2020-01-15',
        department: 'قسم تقنية المعلومات'
      },
      { 
        employee_number: 'EMP002', 
        full_name_ar: 'فاطمة عبدالله النور', 
        full_name_en: 'Fatima Abdullah Al-Noor',
        email_work: 'fatima.noor@hospital.sa', 
        job_title: 'أخصائية موارد بشرية', 
        phone_primary: '0502345678', 
        hire_date: '2019-03-20',
        department: 'قسم الموارد البشرية'
      },
      { 
        employee_number: 'EMP003', 
        full_name_ar: 'سارة خالد المطيري', 
        full_name_en: 'Sara Khalid Al-Mutairi',
        email_work: 'sara.mutairi@hospital.sa', 
        job_title: 'ممرضة أولى', 
        phone_primary: '0503456789', 
        hire_date: '2021-06-10',
        department: 'قسم التمريض'
      },
      { 
        employee_number: 'EMP004', 
        full_name_ar: 'محمد عبدالعزيز الشمري', 
        full_name_en: 'Mohammed Abdulaziz Al-Shamri',
        email_work: 'mohammed.shamri@hospital.sa', 
        job_title: 'طبيب مقيم', 
        phone_primary: '0504567890', 
        hire_date: '2022-02-01',
        department: 'قسم الطوارئ'
      },
      { 
        employee_number: 'EMP005', 
        full_name_ar: 'نورا أحمد القحطاني', 
        full_name_en: 'Nora Ahmed Al-Qahtani',
        email_work: 'nora.qahtani@hospital.sa', 
        job_title: 'مديرة مشاريع', 
        phone_primary: '0505678901', 
        hire_date: '2018-09-15',
        department: 'قسم الإدارة'
      },
      { 
        employee_number: 'EMP006', 
        full_name_ar: 'عبدالرحمن سعد العتيبي', 
        full_name_en: 'Abdulrahman Saad Al-Otaibi',
        email_work: 'abdulrahman.otaibi@hospital.sa', 
        job_title: 'فني أشعة', 
        phone_primary: '0506789012', 
        hire_date: '2020-11-30',
        department: 'قسم الأشعة'
      },
      { 
        employee_number: 'EMP007', 
        full_name_ar: 'مريم عبدالله الدوسري', 
        full_name_en: 'Mariam Abdullah Al-Dosari',
        email_work: 'mariam.dosari@hospital.sa', 
        job_title: 'أخصائية مختبر', 
        phone_primary: '0507890123', 
        hire_date: '2021-04-12',
        department: 'قسم المختبر'
      },
      { 
        employee_number: 'EMP008', 
        full_name_ar: 'خالد عبدالرحمن الغامدي', 
        full_name_en: 'Khalid Abdulrahman Al-Ghamdi',
        email_work: 'khalid.ghamdi@hospital.sa', 
        job_title: 'صيدلي', 
        phone_primary: '0508901234', 
        hire_date: '2019-08-25',
        department: 'قسم الصيدلة'
      }
    ];

    // Clear existing data (using correct column names)
    console.log('🧹 Clearing existing data...');
    await connection.query('DELETE FROM Request_Audit');
    await connection.query('DELETE FROM Delegation_Requests');
    await connection.query('DELETE FROM Clearance_Requests');
    await connection.query('DELETE FROM Onboarding_Requests');
    await connection.query('DELETE FROM App_Users WHERE id > 2'); // Keep admin and test users
    await connection.query('DELETE FROM Employees WHERE employee_id > 2'); // Use correct column

    // Insert employees
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const empId = i + 3; // Start from 3 to avoid conflicts
      
      await connection.query(`
        INSERT INTO Employees (
          employee_id, employee_number, full_name_ar, full_name_en, 
          email_work, job_title, phone_primary, hire_date, employment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
      `, [empId, emp.employee_number, emp.full_name_ar, emp.full_name_en, emp.email_work, emp.job_title, emp.phone_primary, emp.hire_date]);
    }
    console.log(`✅ Created ${employees.length} employees`);

    // 2. SEED APP_USERS
    console.log('👤 Seeding App_Users...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const userId = i + 3;
      const empId = i + 3;
      
      await connection.query(`
        INSERT INTO App_Users (id, name, email, password_hash, role, employee_id, created_at)
        VALUES (?, ?, ?, ?, 'employee', ?, NOW())
      `, [userId, emp.full_name_ar, emp.email_work, hashedPassword, empId]);
    }
    console.log(`✅ Created ${employees.length} app users`);

    // 3. SEED CLEARANCE REQUESTS
    console.log('📄 Seeding Clearance Requests...');
    const clearanceRequests = [
      { emp_idx: 0, reason: 'انتهاء فترة العقد', last_work_day: '2025-02-28', status: 'قيد الاعتماد' },
      { emp_idx: 1, reason: 'الانتقال لوظيفة أخرى', last_work_day: '2025-03-15', status: 'مكتمل' },
      { emp_idx: 2, reason: 'ظروف شخصية', last_work_day: '2025-01-30', status: 'مرفوض' },
      { emp_idx: 3, reason: 'تغيير المسار المهني', last_work_day: '2025-04-10', status: 'قيد المراجعة' },
      { emp_idx: 4, reason: 'العودة للدراسة', last_work_day: '2025-06-01', status: 'قيد الاعتماد' }
    ];

    for (let i = 0; i < clearanceRequests.length; i++) {
      const req = clearanceRequests[i];
      const emp = employees[req.emp_idx];
      const refNum = `CLR-${Date.now() + i}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await connection.query(`
        INSERT INTO Clearance_Requests (
          reference_number, employee_email, employee_name, employee_dept, 
          created_by_user, status, request_date, last_work_day, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, NOW())
      `, [refNum, emp.email_work, emp.full_name_ar, emp.department, req.emp_idx + 3, req.status, req.last_work_day, req.reason]);
    }
    console.log(`✅ Created ${clearanceRequests.length} clearance requests`);

    // 4. SEED ONBOARDING REQUESTS  
    console.log('🎯 Seeding Onboarding Requests...');
    const onboardingRequests = [
      { emp_idx: 5, status: 'قيد الاعتماد' },
      { emp_idx: 6, status: 'مكتمل' },
      { emp_idx: 7, status: 'قيد المراجعة' },
      { emp_idx: 0, status: 'مرفوض' }, // Reuse employee for different request
      { emp_idx: 1, status: 'قيد الاعتماد' }
    ];

    for (let i = 0; i < onboardingRequests.length; i++) {
      const req = onboardingRequests[i];
      const emp = employees[req.emp_idx % employees.length];
      const refNum = `ONB-${Date.now() + i + 1000}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await connection.query(`
        INSERT INTO Onboarding_Requests (
          reference_number, employee_email, employee_name, employee_dept,
          created_by_user, status, request_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), NOW())
      `, [refNum, emp.email_work, emp.full_name_ar, emp.department, 1, req.status]);
    }
    console.log(`✅ Created ${onboardingRequests.length} onboarding requests`);

    // 5. SEED DELEGATION REQUESTS
    console.log('🔄 Seeding Delegation Requests...');
    const delegationRequests = [
      { from_idx: 0, to_idx: 1, status: 'قيد الاعتماد', start: '2025-01-01', end: '2025-01-31' },
      { from_idx: 2, to_idx: 3, status: 'مكتمل', start: '2024-12-01', end: '2024-12-31' },
      { from_idx: 4, to_idx: 5, status: 'مرفوض', start: '2025-02-01', end: '2025-02-28' }
    ];

    for (let i = 0; i < delegationRequests.length; i++) {
      const req = delegationRequests[i];
      const fromEmp = employees[req.from_idx];
      const toEmp = employees[req.to_idx];
      const refNum = `DEL-${Date.now() + i + 2000}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await connection.query(`
        INSERT INTO Delegation_Requests (
          reference_number, created_by_user, from_email, to_email, 
          status, start_date, end_date, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [refNum, req.from_idx + 3, fromEmp.email_work, toEmp.email_work, req.status, req.start, req.end, `تفويض صلاحيات من ${fromEmp.full_name_ar} إلى ${toEmp.full_name_ar}`]);
    }
    console.log(`✅ Created ${delegationRequests.length} delegation requests`);

    // 6. SEED REQUEST_AUDIT (Permanent History)
    console.log('📚 Seeding Request_Audit table...');
    
    // Get all created requests and add them to audit
    const [allClearance] = await connection.query('SELECT * FROM Clearance_Requests');
    const [allOnboarding] = await connection.query('SELECT * FROM Onboarding_Requests');
    const [allDelegation] = await connection.query('SELECT * FROM Delegation_Requests');

    // Add clearance to audit
    for (const req of allClearance) {
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, employee_email,
          employee_dept, status, created_at, request_data
        ) VALUES (?, 'clearance', ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        req.id, req.reference_number, req.employee_name, req.employee_email, 
        req.employee_dept, req.status, 
        JSON.stringify({ reason: req.reason, last_work_day: req.last_work_day })
      ]);
    }

    // Add onboarding to audit
    for (const req of allOnboarding) {
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, employee_email,
          employee_dept, status, created_at, request_data
        ) VALUES (?, 'onboarding', ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        req.id, req.reference_number, req.employee_name, req.employee_email,
        req.employee_dept, req.status,
        JSON.stringify({ request_date: req.request_date })
      ]);
    }

    // Add delegation to audit
    for (const req of allDelegation) {
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, employee_email,
          employee_dept, status, created_at, request_data
        ) VALUES (?, 'delegation', ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        req.id, req.reference_number, 'N/A', req.from_email,
        'N/A', req.status,
        JSON.stringify({ from_email: req.from_email, to_email: req.to_email, start_date: req.start_date, end_date: req.end_date })
      ]);
    }

    console.log(`✅ Created audit records for all requests`);

    // 7. FINAL VERIFICATION
    console.log('\n📊 Database Population Summary:');
    
    const [empCount] = await connection.query('SELECT COUNT(*) as count FROM Employees');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM App_Users');
    const [clearCount] = await connection.query('SELECT COUNT(*) as count FROM Clearance_Requests');
    const [onboardCount] = await connection.query('SELECT COUNT(*) as count FROM Onboarding_Requests');
    const [delegCount] = await connection.query('SELECT COUNT(*) as count FROM Delegation_Requests');
    const [auditCount] = await connection.query('SELECT COUNT(*) as count FROM Request_Audit');

    console.log(`👥 Employees: ${empCount[0].count}`);
    console.log(`👤 App Users: ${userCount[0].count}`);
    console.log(`📄 Clearance Requests: ${clearCount[0].count}`);
    console.log(`🎯 Onboarding Requests: ${onboardCount[0].count}`);
    console.log(`🔄 Delegation Requests: ${delegCount[0].count}`);
    console.log(`📚 Audit Records: ${auditCount[0].count}`);

    // Show status distribution
    const [statusDist] = await connection.query(`
      SELECT status, COUNT(*) as count 
      FROM Request_Audit 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Request Status Distribution:');
    statusDist.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} requests`);
    });

    console.log('\n🎉 COMPREHENSIVE DATABASE SEEDING COMPLETED!');
    console.log('🚀 All frontend pages now have realistic Arabic data!');
    console.log('\n🔍 Test These Pages:');
    console.log('  ✅ Employee Dashboard - Shows requests for logged-in user');
    console.log('  ✅ Admin Dashboard - Shows pending requests summary');
    console.log('  ✅ Admin Clearance Inbox - Shows all clearance history');
    console.log('  ✅ Admin Direct Inbox - Shows all onboarding history');
    console.log('  ✅ Admin Employees - Shows full employee list');
    console.log('  ✅ Request Forms - Ready for new submissions');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await connection.end();
  }
}

seedRealisticData();
