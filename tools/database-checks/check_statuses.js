const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkStatuses() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database'
    });

    console.log('=== فحص الحالات الموجودة في قاعدة البيانات ===');

    const tables = ['Experience_Certificate_Requests', 'Onboarding_Requests', 'Clearance_Requests', 'Delegation_Requests'];

    for (const table of tables) {
      console.log(`\n📋 ${table}:`);
      try {
        const [rows] = await connection.query(`SELECT DISTINCT status, COUNT(*) as count FROM ${table} GROUP BY status ORDER BY status`);
        rows.forEach(row => {
          console.log(`   "${row.status}": ${row.count} طلب`);
        });
      } catch (e) {
        console.log(`   خطأ في قراءة الجدول: ${e.message}`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkStatuses();
