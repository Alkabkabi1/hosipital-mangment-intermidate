/**
 * Reset Test User Passwords
 * Properly hashes passwords and updates them in the database
 * 
 * Usage: node Backend/scripts/reset-test-passwords.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SALT_ROUNDS = 12;

// Test user credentials
const TEST_USERS = [
  { email: 'admin@dev.local', password: 'admin123', name: 'Dev Admin' },
  { email: 'hradmin@hospital.sa', password: 'HRAdmin@123', name: 'HR Admin' },
  { email: 'hrmanager@hospital.sa', password: 'HRManager@123', name: 'HR Manager' },
  { email: 'hremployee@hospital.sa', password: 'HREmployee@123', name: 'HR Employee' },
  { email: 'employee@dev.local', password: 'employee123', name: 'Test Employee' },
];

async function resetPasswords() {
  console.log('\n🔐 RESETTING TEST USER PASSWORDS\n');
  console.log('═'.repeat(60));

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database'
  });

  console.log('✅ Connected to MySQL server\n');
  console.log('⏳ Hashing passwords and updating database...\n');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const user of TEST_USERS) {
      try {
        // Generate bcrypt hash
        console.log(`🔄 Processing: ${user.email}`);
        const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        
        // Update password in database
        const [result] = await connection.execute(
          'UPDATE App_Users SET password_hash = ? WHERE email = ?',
          [hash, user.email]
        );

        if (result.affectedRows > 0) {
          console.log(`   ✅ Password updated`);
          console.log(`   📧 Email: ${user.email}`);
          console.log(`   🔑 Password: ${user.password}`);
          console.log(`   🔐 Hash: ${hash.substring(0, 20)}...`);
          successCount++;
        } else {
          console.log(`   ⚠️  User not found in database`);
          errorCount++;
        }
        console.log();
      } catch (error) {
        console.error(`   ❌ Error updating ${user.email}:`, error.message);
        errorCount++;
        console.log();
      }
    }

    console.log('═'.repeat(60));
    console.log(`\n✅ Password reset complete!`);
    console.log(`   Updated: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} users`);
    }

    // Show all users
    console.log('\n📋 TEST USER CREDENTIALS:\n');
    const [users] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.email IN (?)
      GROUP BY u.id, u.name, u.email, u.is_active
      ORDER BY u.email
    `, [TEST_USERS.map(u => u.email)]);

    const credMap = {};
    TEST_USERS.forEach(u => { credMap[u.email] = u.password; });

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${credMap[user.email]}`);
      console.log(`   🎭 Roles: ${user.roles || 'None'}`);
      console.log(`   ${user.is_active ? '✅' : '❌'} Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log();
    });

    console.log('═'.repeat(60));
    console.log('\n🚀 You can now login with these credentials!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

resetPasswords()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

