const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function checkJobDescriptions() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_management',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('📋 Checking Employee_Job_Descriptions table...\n');
    
    // Get all records
    const [all] = await connection.query(
      `SELECT * FROM Employee_Job_Descriptions ORDER BY created_at DESC`
    );
    
    console.log(`Total records: ${all.length}\n`);
    
    if (all.length > 0) {
      console.log('Records found:');
      all.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`);
        console.log(`   Employee ID: ${record.employee_id}`);
        console.log(`   Job Description: ${record.job_description.substring(0, 100)}...`);
        console.log(`   Verified: ${record.verified ? '✅ YES' : '❌ NO (PENDING)'}`);
        console.log(`   Created: ${record.created_at}`);
        if (record.verified_at) {
          console.log(`   Verified At: ${record.verified_at}`);
          console.log(`   Verified By: ${record.verified_by}`);
        }
      });
    } else {
      console.log('❌ No records found in Employee_Job_Descriptions table');
    }
    
    // Check pending ones specifically
    console.log('\n\n📊 Pending (unverified) job descriptions:');
    const [pending] = await connection.query(
      `SELECT jd.*, 
              u.name as employee_name,
              e.employee_number,
              e.full_name_ar
       FROM Employee_Job_Descriptions jd
       LEFT JOIN Employees e ON jd.employee_id = e.employee_id
       LEFT JOIN App_Users u ON e.employee_id = u.employee_id
       WHERE jd.verified = FALSE
       ORDER BY jd.created_at DESC`
    );
    
    console.log(`   Count: ${pending.length}`);
    if (pending.length > 0) {
      pending.forEach((record, index) => {
        console.log(`\n   ${index + 1}. ID: ${record.id}`);
        console.log(`      Employee: ${record.full_name_ar || record.employee_name}`);
        console.log(`      Employee Number: ${record.employee_number}`);
        console.log(`      Description: ${record.job_description.substring(0, 50)}...`);
      });
    }
    
  } finally {
    if (connection) await connection.end();
  }
}

checkJobDescriptions();

