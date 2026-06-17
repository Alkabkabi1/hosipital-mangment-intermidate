// Test script to check experience certificates in database
const mysql = require('mysql2/promise');

async function testExperienceDB() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'nora',
      password: 'nora123',
      database: 'nora_database'
    });

    console.log('Connected to database');

    // Check if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'Experience_Certificate_Requests'"
    );

    if (tables.length === 0) {
      console.log('❌ Experience_Certificate_Requests table does not exist');
      return;
    }

    console.log('✅ Experience_Certificate_Requests table exists');

    // Check table structure
    const [columns] = await connection.execute(
      "DESCRIBE Experience_Certificate_Requests"
    );
    console.log('Table columns:', columns.map(c => c.Field).join(', '));

    // Get all experience certificates
    const [experiences] = await connection.execute(
      'SELECT id, employee_name, position, department, status, created_at FROM Experience_Certificate_Requests ORDER BY id DESC LIMIT 10'
    );

    console.log(`Found ${experiences.length} experience certificates:`);
    experiences.forEach(exp => {
      console.log(`ID: ${exp.id}, Name: ${exp.employee_name}, Position: ${exp.position}, Status: ${exp.status}, Created: ${exp.created_at}`);
    });

    // Specifically check for ID 4
    if (experiences.some(exp => exp.id == 4)) {
      console.log('✅ Experience certificate with ID 4 exists');
    } else {
      console.log('❌ Experience certificate with ID 4 does NOT exist');
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

testExperienceDB();
