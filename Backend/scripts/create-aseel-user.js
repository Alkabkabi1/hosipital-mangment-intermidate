/**
 * Create Aseel Test User
 * Creates aseelma@moh.gov.sa for test scripts
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createAseelUser() {
  console.log('\n👤 CREATING ASEEL TEST USER\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database'
  });

  console.log('✅ Connected to MySQL\n');

  try {
    // Hash password
    const hash = await bcrypt.hash('password123', 12);
    
    // Insert test user
    await connection.execute(`
      INSERT INTO App_Users (name, email, username, password_hash, role, is_active, department_name, employee_number, nationality)
      VALUES ('اسيل محمود عربي المغربي', 'aseelma@moh.gov.sa', 'aseelma', ?, 'employee', 1, 'IT Department', '12345', 'سعودي')
      ON DUPLICATE KEY UPDATE password_hash = ?, is_active = 1
    `, [hash, hash]);

    console.log('✅ Aseel test user created/updated');
    console.log('   📧 Email: aseelma@moh.gov.sa');
    console.log('   🔑 Password: password123');
    console.log('   👤 Name: اسيل محمود عربي المغربي\n');

    // Get user ID
    const [users] = await connection.execute(
      'SELECT id FROM App_Users WHERE email = ?',
      ['aseelma@moh.gov.sa']
    );
    const userId = users[0].id;

    // Get EMPLOYEE role ID
    const [roles] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      ['EMPLOYEE']
    );
    
    if (roles.length > 0) {
      const roleId = roles[0].role_id;

      // Assign EMPLOYEE role
      await connection.execute(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
        VALUES (?, ?, ?, 'Test user creation', 1)
        ON DUPLICATE KEY UPDATE is_active = 1
      `, [userId, roleId, userId]);

      console.log('✅ EMPLOYEE role assigned\n');
    } else {
      console.log('⚠️ EMPLOYEE role not found - user created without role assignment\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createAseelUser()
  .then(() => {
    console.log('✅ Complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
