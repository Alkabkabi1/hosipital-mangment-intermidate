const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function checkEmployeeRecord() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_management',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('Checking user ID 6457...\n');
    
    // Check App_Users
    const [users] = await connection.query(
      'SELECT id, name, email, employee_id FROM App_Users WHERE id = 6457'
    );
    
    if (users.length > 0) {
      console.log('✅ User found in App_Users:');
      console.log('   ID:', users[0].id);
      console.log('   Name:', users[0].name);
      console.log('   Email:', users[0].email);
      console.log('   Employee ID (FK):', users[0].employee_id);
      console.log();
      
      if (users[0].employee_id) {
        // Check if employee exists
        const [employees] = await connection.query(
          'SELECT employee_id, employee_number, full_name_ar FROM Employees WHERE employee_id = ?',
          [users[0].employee_id]
        );
        
        if (employees.length > 0) {
          console.log('✅ Employee record found:');
          console.log('   Employee ID:', employees[0].employee_id);
          console.log('   Employee Number:', employees[0].employee_number);
          console.log('   Name:', employees[0].full_name_ar);
        } else {
          console.log('❌ Employee record NOT found!');
          console.log('   App_Users.employee_id points to:', users[0].employee_id);
          console.log('   But no record exists in Employees table');
        }
      } else {
        console.log('❌ User has NO employee_id (NULL)');
        console.log('   Cannot create job description without employee record');
      }
    } else {
      console.log('❌ User ID 6457 not found in App_Users');
    }
    
  } finally {
    if (connection) await connection.end();
  }
}

checkEmployeeRecord();

