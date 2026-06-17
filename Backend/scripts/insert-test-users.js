/**
 * Insert Test Users Script
 * Creates test user accounts in nora_database
 * 
 * Usage: node Backend/scripts/insert-test-users.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function insertTestUsers() {
  console.log('\n👥 INSERTING TEST USERS\n');
  console.log('═'.repeat(60));

  // Read the SQL file
  const sqlPath = path.resolve(__dirname, '../migrations/INSERT_TEST_USERS.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log(`📁 SQL File: ${sqlPath}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'nora_database'}\n`);

  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL server\n');

  try {
    // Execute the SQL file
    console.log('⏳ Creating test users...\n');
    await connection.query(sql);
    
    console.log('✅ SQL executed successfully!\n');
    console.log('═'.repeat(60));

    // Show created users
    const [users] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role AS legacy_role,
        GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS assigned_roles,
        u.is_active
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.email IN (
        'admin@dev.local',
        'hradmin@hospital.sa',
        'hrmanager@hospital.sa',
        'hremployee@hospital.sa',
        'employee@dev.local'
      )
      GROUP BY u.id, u.name, u.email, u.role, u.is_active
      ORDER BY u.email
    `);

    console.log('\n📋 TEST USERS CREATED:\n');
    
    const credentials = {
      'admin@dev.local': 'admin123',
      'hradmin@hospital.sa': 'HRAdmin@123',
      'hrmanager@hospital.sa': 'HRManager@123',
      'hremployee@hospital.sa': 'HREmployee@123',
      'employee@dev.local': 'employee123'
    };

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${credentials[user.email]}`);
      console.log(`   🎭 Roles: ${user.assigned_roles || 'None'}`);
      console.log(`   ✅ Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log();
    });

    console.log('═'.repeat(60));
    console.log('\n✅ TEST ACCOUNTS READY!\n');
    console.log('You can now log in with any of the accounts above.\n');
    console.log('⚠️  Remember: These are TEST accounts with simple passwords.');
    console.log('   NEVER use these credentials in production!\n');

  } catch (error) {
    console.error('\n❌ Error inserting users:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql.substring(0, 200) + '...');
    }
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
insertTestUsers()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

