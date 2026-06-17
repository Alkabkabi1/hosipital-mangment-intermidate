const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkRequestsStatus() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database'
    });

    console.log('=== فحص الطلبات المذكورة ===');

    // فحص طلبات الخبرة
    console.log('\n📋 Experience Certificate Requests:');
    const [expReqs] = await connection.query('SELECT id, status, final_decision, employee_name FROM Experience_Certificate_Requests ORDER BY id DESC LIMIT 10');
    expReqs.forEach(r => console.log(`ID ${r.id}: ${r.employee_name} - Status: ${r.status}, Final: ${r.final_decision || 'N/A'}`));

    // فحص طلبات المباشرة
    console.log('\n📋 Onboarding Requests:');
    const [onboardReqs] = await connection.query('SELECT id, status, final_decision, employee_name FROM Onboarding_Requests ORDER BY id DESC LIMIT 10');
    onboardReqs.forEach(r => console.log(`ID ${r.id}: ${r.employee_name || 'N/A'} - Status: ${r.status}, Final: ${r.final_decision || 'N/A'}`));

    // فحص طلبات الإخلاء
    console.log('\n📋 Clearance Requests:');
    const [clearReqs] = await connection.query('SELECT id, status, final_decision, employee_name FROM Clearance_Requests ORDER BY id DESC LIMIT 10');
    clearReqs.forEach(r => console.log(`ID ${r.id}: ${r.employee_name} - Status: ${r.status}, Final: ${r.final_decision || 'N/A'}`));

    // فحص طلبات الشهادات (إذا كانت موجودة)
    console.log('\n📋 Certificate Requests:');
    try {
      const [certReqs] = await connection.query('SELECT id, status, final_decision, employee_name FROM Certificate_Requests ORDER BY id DESC LIMIT 10');
      certReqs.forEach(r => console.log(`ID ${r.id}: ${r.employee_name || 'N/A'} - Status: ${r.status}, Final: ${r.final_decision || 'N/A'}`));
    } catch (e) {
      console.log('Certificate_Requests table may not exist or different name');
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkRequestsStatus();
