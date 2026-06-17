const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function testQuery() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_management',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('Testing the exact query used in getPendingJobDescriptions...\n');
    
    const [rows] = await connection.query(`
      SELECT jd.*, 
              u.name as employee_name, 
              u.email as employee_email,
              e.employee_number,
              e.full_name_ar,
              e.position,
              d.name_ar as department_name
       FROM Employee_Job_Descriptions jd
       JOIN Employees e ON jd.employee_id = e.employee_id
       JOIN App_Users u ON e.employee_id = u.employee_id
       LEFT JOIN Departments d ON e.department_id = d.department_id
       WHERE jd.verified = FALSE
       ORDER BY jd.created_at DESC
    `);
    
    console.log(`Results: ${rows.length} records\n`);
    
    if (rows.length === 0) {
      console.log('❌ Query returned 0 results!');
      console.log('\nLet\'s debug the JOINs...\n');
      
      // Check what's in the table
      const [jdRecords] = await connection.query('SELECT * FROM Employee_Job_Descriptions');
      console.log('Employee_Job_Descriptions records:', jdRecords.length);
      if (jdRecords.length > 0) {
        console.log('   employee_id in jd table:', jdRecords[0].employee_id);
      }
      
      // Check App_Users
      const [users] = await connection.query('SELECT id, employee_id FROM App_Users WHERE employee_id = ?', [jdRecords[0]?.employee_id]);
      console.log('\nApp_Users with employee_id =', jdRecords[0]?.employee_id, ':', users.length, 'records');
      if (users.length > 0) {
        console.log('   User IDs:', users.map(u => u.id));
      }
      
      console.log('\n⚠️ THE PROBLEM: The JOIN is using jd.employee_id = u.id');
      console.log('   But jd.employee_id is the EMPLOYEE record ID (4582)');
      console.log('   And u.id is the USER record ID (6457)');
      console.log('   These don\'t match!\n');
      
      console.log('🔧 CORRECT JOIN should be:');
      console.log('   Employee_Job_Descriptions jd');
      console.log('   JOIN Employees e ON jd.employee_id = e.employee_id');
      console.log('   JOIN App_Users u ON e.employee_id = u.employee_id');
    } else {
      rows.forEach(row => {
        console.log('Record:', row);
      });
    }
    
  } finally {
    if (connection) await connection.end();
  }
}

testQuery();

