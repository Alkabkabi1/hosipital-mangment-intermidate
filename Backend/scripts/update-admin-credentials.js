const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

async function updateAdminCredentials() {
  console.log('🔐 Updating admin credentials...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('203040', 10);
    
    // Update the admin user
    const [result] = await connection.query(`
      UPDATE App_Users 
      SET username = 'sadmin', password_hash = ?, email = 'admin@hospital.sa'
      WHERE email = 'admin@dev.local' OR id = 1
    `, [hashedPassword]);
    
    console.log(`✅ Updated admin credentials:`);
    console.log(`   Username: sadmin`);
    console.log(`   Password: 203040`);
    console.log(`   Email: admin@hospital.sa`);
    console.log(`   Affected rows: ${result.affectedRows}`);

    // Verify the update
    const [adminUser] = await connection.query(`
      SELECT id, name, email, username, role 
      FROM App_Users 
      WHERE username = 'sadmin' OR id = 1
    `);
    
    if (adminUser.length > 0) {
      console.log('\n📋 Updated Admin User:');
      console.log(`   ID: ${adminUser[0].id}`);
      console.log(`   Name: ${adminUser[0].name}`);
      console.log(`   Email: ${adminUser[0].email}`);
      console.log(`   Username: ${adminUser[0].username}`);
      console.log(`   Role: ${adminUser[0].role}`);
    }

    console.log('\n🎉 Admin credentials updated successfully!');
    console.log('🔐 New login: username="sadmin", password="203040"');
    
  } catch (error) {
    console.error('❌ Update error:', error);
  } finally {
    await connection.end();
  }
}

updateAdminCredentials();
