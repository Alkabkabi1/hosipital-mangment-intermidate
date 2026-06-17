const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkClearanceData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database'
    });

    console.log('=== فحص بيانات الإخلاء ===');

    // فحص جدول Clearance_Requests
    console.log('\n📋 Clearance_Requests table:');
    try {
      const [rows] = await connection.query('SELECT id, employee_id, employee_name, status, created_at FROM Clearance_Requests ORDER BY id DESC LIMIT 10');
      console.log(`Found ${rows.length} clearance requests:`);
      rows.forEach(row => {
        console.log(`ID ${row.id}: ${row.employee_name} - Status: ${row.status}, Created: ${row.created_at}`);
      });
    } catch (e) {
      console.log('Error querying Clearance_Requests:', e.message);
    }

    // فحص جدول Request_Approvals للإخلاء
    console.log('\n📋 Request_Approvals for clearance:');
    try {
      const [approvals] = await connection.query(`
        SELECT ra.request_id, ra.request_type, ra.status, u.name as approver_name
        FROM Request_Approvals ra
        LEFT JOIN App_Users u ON ra.approver_id = u.id
        WHERE ra.request_type = 'clearance'
        ORDER BY ra.created_at DESC
        LIMIT 10
      `);
      console.log(`Found ${approvals.length} clearance approvals:`);
      approvals.forEach(row => {
        console.log(`Request ID ${row.request_id}: ${row.approver_name || 'Unknown'} - Status: ${row.status}`);
      });
    } catch (e) {
      console.log('Error querying Request_Approvals:', e.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkClearanceData();
