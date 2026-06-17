/**
 * Add Admin User
 * Creates admin@dev.local if it doesn't exist
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function addAdminUser() {
  console.log('\n👤 ADDING ADMIN USER\n');

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
    const hash = await bcrypt.hash('admin123', 12);
    
    // Insert admin user
    await connection.execute(`
      INSERT INTO App_Users (name, email, username, password_hash, role, is_active)
      VALUES ('Dev Admin', 'admin@dev.local', 'admin', ?, 'admin', 1)
      ON DUPLICATE KEY UPDATE password_hash = ?, username = 'admin'
    `, [hash, hash]);

    console.log('✅ Admin user created/updated');
    console.log('   📧 Email: admin@dev.local');
    console.log('   🔑 Password: admin123\n');

    // Get user ID
    const [users] = await connection.execute(
      'SELECT id FROM App_Users WHERE email = ?',
      ['admin@dev.local']
    );
    const userId = users[0].id;

    // Get ADMIN role ID
    const [roles] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      ['ADMIN']
    );
    const roleId = roles[0].role_id;

    // Assign ADMIN role
    await connection.execute(`
      INSERT INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
      VALUES (?, ?, ?, 'System bootstrap', 1)
      ON DUPLICATE KEY UPDATE is_active = 1
    `, [userId, roleId, userId]);

    console.log('✅ ADMIN role assigned\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

addAdminUser()
  .then(() => {
    console.log('✅ Complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

