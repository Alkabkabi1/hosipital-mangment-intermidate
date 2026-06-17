const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

async function seedComprehensiveDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    // Clear existing data first
    console.log('🧹 Clearing existing data...');
    await connection.query('DELETE FROM Request_Audit');
    await connection.query('DELETE FROM Delegation_Requests');
    await connection.query('DELETE FROM Clearance_Requests');
    await connection.query('DELETE FROM Onboarding_Requests');
    await connection.query('DELETE FROM App_Users WHERE id > 2'); // Keep admin and employee test users
    await connection.query('DELETE FROM Employees WHERE id > 2');

    // 1. SEED EMPLOYEES TABLE
    console.log('👥 Seeding Employees table...');
    const employees = [
      { name: 'أحمد محمد العلي', email: 'ahmed.ali@hospital.sa', department: 'قسم تقنية المعلومات', position: 'مطور برمجيات', phone: '0501234567', hire_date: '2020-01-15' },
      { name: 'فاطمة عبدالله النور', email: 'fatima.noor@hospital.sa', department: 'قسم الموارد البشرية', position: 'أخصائية موارد بشرية', phone: '0502345678', hire_date: '2019-03-20' },
      { name: 'سارة خالد المطيري', email: 'sara.mutairi@hospital.sa', department: 'قسم التمريض', position: 'ممرضة أولى', phone: '0503456789', hire_date: '2021-06-10' },
      { name: 'محمد عبدالعزيز الشمري', email: 'mohammed.shamri@hospital.sa', department: 'قسم الطوارئ', position: 'طبيب مقيم', phone: '0504567890', hire_date: '2022-02-01' },
      { name: 'نورا أحمد القحطاني', email: 'nora.qahtani@hospital.sa', department: 'قسم الإدارة', position: 'مديرة مشاريع', phone: '0505678901', hire_date: '2018-09-15' },
      { name: 'عبدالرحمن سعد العتيبي', email: 'abdulrahman.otaibi@hospital.sa', department: 'قسم الأشعة', position: 'فني أشعة', phone: '0506789012', hire_date: '2020-11-30' },
      { name: 'مريم عبدالله الدوسري', email: 'mariam.dosari@hospital.sa', department: 'قسم المختبر', position: 'أخصائية مختبر', phone: '0507890123', hire_date: '2021-04-12' },
      { name: 'خالد عبدالرحمن الغامدي', email: 'khalid.ghamdi@hospital.sa', department: 'قسم الصيدلة', position: 'صيدلي', phone: '0508901234', hire_date: '2019-08-25' },
      { name: 'ريم محمد البقمي', email: 'reem.baqami@hospital.sa', department: 'قسم الاستقبال', position: 'موظفة استقبال', phone: '0509012345', hire_date: '2022-01-10' },
      { name: 'يوسف أحمد الزهراني', email: 'youssef.zahrani@hospital.sa', department: 'قسم الأمن', position: 'ضابط أمن', phone: '0500123456', hire_date: '2020-07-20' }
    ];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      await connection.query(`
        INSERT INTO Employees (id, name, email, department, position, phone, hire_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
      `, [i + 3, emp.name, emp.email, emp.department, emp.position, emp.phone, emp.hire_date]);
    }
    console.log(`✅ Created ${employees.length} employees`);

    // 2. SEED APP_USERS TABLE
    console.log('👤 Seeding App_Users table...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      await connection.query(`
        INSERT INTO App_Users (id, email, password, employee_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [i + 3, emp.email, hashedPassword, i + 3]);
    }
    console.log(`✅ Created ${employees.length} app users (password: 123456)`);

    // 3. SEED CLEARANCE REQUESTS
    console.log('📄 Seeding Clearance Requests...');
    const clearanceRequests = [
      { emp_id: 3, reason: 'انتهاء فترة العقد', last_work_day: '2025-02-28', status: 'قيد الاعتماد' },
      { emp_id: 4, reason: 'الانتقال لوظيفة أخرى', last_work_day: '2025-03-15', status: 'مكتمل' },
      { emp_id: 5, reason: 'ظروف شخصية', last_work_day: '2025-01-30', status: 'مرفوض' },
      { emp_id: 6, reason: 'تغيير المسار المهني', last_work_day: '2025-04-10', status: 'قيد المراجعة' },
      { emp_id: 7, reason: 'العودة للدراسة', last_work_day: '2025-06-01', status: 'قيد الاعتماد' }
    ];

    for (let i = 0; i < clearanceRequests.length; i++) {
      const req = clearanceRequests[i];
      const emp = employees[req.emp_id - 3];
      const refNum = `CLR-${Date.now() + i}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await connection.query(`
        INSERT INTO Clearance_Requests (
          reference_number, employee_email, employee_name, employee_dept, 
          created_by_user, status, request_date, last_work_day, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW())
      `, [refNum, emp.email, emp.name, emp.department, req.emp_id, req.status, req.last_work_day, req.reason]);
    }
    console.log(`✅ Created ${clearanceRequests.length} clearance requests`);

    // 4. SEED ONBOARDING REQUESTS
    console.log('🎯 Seeding Onboarding Requests...');
    const onboardingRequests = [
      { emp_id: 8, position: 'صيدلي مساعد', start_date: '2025-02-01', status: 'قيد الاعتماد' },
      { emp_id: 9, position: 'موظفة استقبال أولى', start_date: '2025-01-15', status: 'مكتمل' },
      { emp_id: 10, position: 'ضابط أمن أول', start_date: '2025-03-01', status: 'قيد المراجعة' },
      { emp_id: 11, position: 'فني أشعة متقدم', start_date: '2025-02-15', status: 'مرفوض' },
      { emp_id: 12, position: 'أخصائية مختبر أولى', start_date: '2025-04-01', status: 'قيد الاعتماد' }
    ];

    for (let i = 0; i < onboardingRequests.length; i++) {
      const req = onboardingRequests[i];
      const emp = employees[req.emp_id - 3] || employees[req.emp_id - 8] || employees[0];
      const refNum = `ONB-${Date.now() + i + 1000}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await connection.query(`
        INSERT INTO Onboarding_Requests (
          reference_number, employee_email, employee_name, employee_dept,
          created_by_user, status, request_date, start_date, position, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW())
      `, [refNum, emp.email, emp.name, emp.department, 1, req.status, req.start_date, req.position]);
    }
    console.log(`✅ Created ${onboardingRequests.length} onboarding requests`);

    // 5. SEED DELEGATION REQUESTS
    console.log('🔄 Seeding Delegation Requests...');
    const delegationRequests = [
      { from_emp: 3, to_emp: 4, status: 'قيد الاعتماد' },
      { from_emp: 5, to_emp: 6, status: 'مكتمل' },
      { from_emp: 7, to_emp: 8, status: 'مرفوض' }
    ];

    for (let i = 0; i < delegationRequests.length; i++) {
      const req = delegationRequests[i];
      const fromEmp = employees[req.from_emp - 3];
      const toEmp = employees[req.to_emp - 3];
      const refNum = `DEL-${Date.now() + i + 2000}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      await connection.query(`
        INSERT INTO Delegation_Requests (
          reference_number, created_by_user, from_email, to_email, status, created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [refNum, req.from_emp, fromEmp.email, toEmp.email, req.status]);
    }
    console.log(`✅ Created ${delegationRequests.length} delegation requests`);

    // 6. SEED REQUEST_AUDIT TABLE (Permanent History)
    console.log('📚 Seeding Request_Audit table...');
    
    // Add clearance audit records
    for (let i = 0; i < clearanceRequests.length; i++) {
      const req = clearanceRequests[i];
      const emp = employees[req.emp_id - 3];
      const refNum = `CLR-AUDIT-${Date.now() + i}`;
      
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, employee_email, 
          employee_dept, status, created_at, request_data
        ) VALUES (?, 'clearance', ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        i + 1, refNum, emp.name, emp.email, emp.department, req.status,
        JSON.stringify({ reason: req.reason, last_work_day: req.last_work_day })
      ]);
    }

    // Add onboarding audit records  
    for (let i = 0; i < onboardingRequests.length; i++) {
      const req = onboardingRequests[i];
      const emp = employees[req.emp_id - 3] || employees[req.emp_id - 8] || employees[0];
      const refNum = `ONB-AUDIT-${Date.now() + i + 100}`;
      
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, employee_email,
          employee_dept, status, created_at, request_data
        ) VALUES (?, 'onboarding', ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        i + 1, refNum, emp.name, emp.email, emp.department, req.status,
        JSON.stringify({ position: req.position, start_date: req.start_date })
      ]);
    }

    // Add delegation audit records
    for (let i = 0; i < delegationRequests.length; i++) {
      const req = delegationRequests[i];
      const fromEmp = employees[req.from_emp - 3];
      const toEmp = employees[req.to_emp - 3];
      const refNum = `DEL-AUDIT-${Date.now() + i + 200}`;
      
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, employee_email,
          employee_dept, status, created_at, request_data
        ) VALUES (?, 'delegation', ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        i + 1, refNum, fromEmp.name, fromEmp.email, fromEmp.department, req.status,
        JSON.stringify({ from_employee: fromEmp.name, to_employee: toEmp.name })
      ]);
    }
    
    console.log(`✅ Created ${clearanceRequests.length + onboardingRequests.length + delegationRequests.length} audit records`);

    // 7. SEED DEPARTMENTS (if table exists)
    console.log('🏢 Seeding Departments table...');
    const departments = [
      'قسم تقنية المعلومات', 'قسم الموارد البشرية', 'قسم التمريض', 'قسم الطوارئ',
      'قسم الإدارة', 'قسم الأشعة', 'قسم المختبر', 'قسم الصيدلة', 'قسم الاستقبال', 'قسم الأمن'
    ];

    try {
      await connection.query('DELETE FROM Departments WHERE id > 0');
      for (let i = 0; i < departments.length; i++) {
        await connection.query(`
          INSERT INTO Departments (id, name_ar, name_en, created_at)
          VALUES (?, ?, ?, NOW())
        `, [i + 1, departments[i], departments[i].replace(/قسم /g, 'Department of '), ]);
      }
      console.log(`✅ Created ${departments.length} departments`);
    } catch (error) {
      console.log('⚠️ Departments table might not exist, skipping...');
    }

    // 8. FINAL VERIFICATION
    console.log('\n📊 Final Database Verification:');
    
    const [employeeCount] = await connection.query('SELECT COUNT(*) as count FROM Employees');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM App_Users');
    const [clearanceCount] = await connection.query('SELECT COUNT(*) as count FROM Clearance_Requests');
    const [onboardingCount] = await connection.query('SELECT COUNT(*) as count FROM Onboarding_Requests');
    const [delegationCount] = await connection.query('SELECT COUNT(*) as count FROM Delegation_Requests');
    const [auditCount] = await connection.query('SELECT COUNT(*) as count FROM Request_Audit');

    console.log(`👥 Employees: ${employeeCount[0].count}`);
    console.log(`👤 App Users: ${userCount[0].count}`);
    console.log(`📄 Clearance Requests: ${clearanceCount[0].count}`);
    console.log(`🎯 Onboarding Requests: ${onboardingCount[0].count}`);
    console.log(`🔄 Delegation Requests: ${delegationCount[0].count}`);
    console.log(`📚 Audit Records: ${auditCount[0].count}`);

    // Sample status breakdown
    const [statusBreakdown] = await connection.query(`
      SELECT status, COUNT(*) as count 
      FROM Request_Audit 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Request Status Breakdown:');
    statusBreakdown.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} requests`);
    });

    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    console.log('🚀 Your hospital management system is now fully populated with realistic Arabic data!');
    console.log('\n📋 Test Pages Now Available:');
    console.log('  - Employee Dashboard: Full data');
    console.log('  - Admin Dashboard: Full data');
    console.log('  - Admin Clearance Inbox: Full history');
    console.log('  - Admin Direct Inbox: Full history');
    console.log('  - Admin Employees: Full employee list');
    console.log('  - All request forms: Ready for new submissions');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await connection.end();
  }
}

seedComprehensiveDatabase();
