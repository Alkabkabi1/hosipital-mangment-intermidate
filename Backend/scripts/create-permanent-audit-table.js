const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function createPermanentAuditTable() {
  console.log('🗄️ Creating permanent audit table for all requests...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    // Create a unified audit table for ALL requests
    console.log('📊 Creating Request_Audit table...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Request_Audit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_id INT NOT NULL,
        request_type ENUM('clearance', 'onboarding', 'delegation') NOT NULL,
        reference_number VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255),
        employee_email VARCHAR(255),
        employee_dept VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        approved_at TIMESTAMP NULL,
        rejected_at TIMESTAMP NULL,
        approved_by VARCHAR(255),
        rejection_reason TEXT,
        request_data JSON,
        INDEX idx_type_status (request_type, status),
        INDEX idx_employee_email (employee_email),
        INDEX idx_reference (reference_number),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Request_Audit table created successfully');

    // Create sample data to test the inbox pages
    console.log('📊 Creating sample audit data...');
    
    const sampleRequests = [
      {
        original_id: 1,
        request_type: 'clearance',
        reference_number: 'CLR-SAMPLE-001',
        employee_name: 'أحمد محمد',
        employee_email: 'ahmed@hospital.com',
        employee_dept: 'قسم تقنية المعلومات',
        status: 'مكتمل',
        approved_at: new Date(),
        approved_by: 'Dev Admin',
        request_data: JSON.stringify({
          reason: 'انتهاء العقد',
          last_work_day: '2025-01-15'
        })
      },
      {
        original_id: 2,
        request_type: 'clearance',
        reference_number: 'CLR-SAMPLE-002',
        employee_name: 'فاطمة علي',
        employee_email: 'fatima@hospital.com',
        employee_dept: 'قسم الموارد البشرية',
        status: 'مرفوض',
        rejected_at: new Date(),
        rejection_reason: 'مستندات ناقصة',
        request_data: JSON.stringify({
          reason: 'تغيير المسار الوظيفي'
        })
      },
      {
        original_id: 3,
        request_type: 'onboarding',
        reference_number: 'ONB-SAMPLE-001',
        employee_name: 'سارة خالد',
        employee_email: 'sara@hospital.com',
        employee_dept: 'قسم التمريض',
        status: 'مكتمل',
        approved_at: new Date(),
        approved_by: 'Dev Admin',
        request_data: JSON.stringify({
          position: 'ممرضة',
          start_date: '2025-01-01'
        })
      },
      {
        original_id: 4,
        request_type: 'onboarding',
        reference_number: 'ONB-SAMPLE-002',
        employee_name: 'محمد عبدالله',
        employee_email: 'mohammed@hospital.com',
        employee_dept: 'قسم الطوارئ',
        status: 'قيد الاعتماد',
        request_data: JSON.stringify({
          position: 'طبيب',
          start_date: '2025-02-01'
        })
      },
      {
        original_id: 5,
        request_type: 'delegation',
        reference_number: 'DEL-SAMPLE-001',
        employee_name: 'نورا أحمد',
        employee_email: 'nora@hospital.com',
        employee_dept: 'قسم الإدارة',
        status: 'مكتمل',
        approved_at: new Date(),
        approved_by: 'Dev Admin',
        request_data: JSON.stringify({
          delegation_to: 'مدير القسم',
          duration: '30 يوم'
        })
      }
    ];

    for (const request of sampleRequests) {
      await connection.query(`
        INSERT INTO Request_Audit (
          original_id, request_type, reference_number, employee_name, 
          employee_email, employee_dept, status, approved_at, rejected_at,
          approved_by, rejection_reason, request_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        request.original_id,
        request.request_type,
        request.reference_number,
        request.employee_name,
        request.employee_email,
        request.employee_dept,
        request.status,
        request.approved_at || null,
        request.rejected_at || null,
        request.approved_by || null,
        request.rejection_reason || null,
        request.request_data
      ]);
    }

    console.log(`✅ Created ${sampleRequests.length} sample audit records`);

    // Verify the audit table
    const [auditRows] = await connection.query('SELECT * FROM Request_Audit ORDER BY created_at DESC');
    console.log('\n📋 Request_Audit Table Contents:');
    auditRows.forEach(row => {
      console.log(`  - ${row.request_type.toUpperCase()}: ${row.reference_number} (${row.status}) - ${row.employee_name}`);
    });

    console.log('\n🎉 Permanent audit system created successfully!');
    console.log('📊 Inbox pages can now query this table for complete request history');
    
  } catch (error) {
    console.error('❌ Audit table creation error:', error);
  } finally {
    await connection.end();
  }
}

createPermanentAuditTable();
