/**
 * Verify Database Schema
 * This script checks which database has tables and shows what's in each
 * 
 * Usage: node Backend/scripts/verify-database.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifyDatabases() {
  console.log('\n🔍 DATABASE VERIFICATION TOOL\n');
  console.log('═'.repeat(60));

  // Create connection without specifying a database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD
  });

  console.log('✅ Connected to MySQL server\n');

  try {
    // Get all databases
    const [databases] = await connection.query(
      "SHOW DATABASES WHERE `Database` LIKE '%nora%' OR `Database` LIKE '%hospital%'"
    );

    console.log(`📊 Found ${databases.length} relevant databases:\n`);

    for (const db of databases) {
      const dbName = db.Database;
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📁 Database: ${dbName}`);
      console.log(`${'─'.repeat(60)}`);

      // Use this database
      await connection.query(`USE \`${dbName}\``);

      // Count tables
      const [tables] = await connection.query(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = "BASE TABLE"',
        [dbName]
      );

      const tableCount = tables[0].count;
      console.log(`   Tables: ${tableCount}`);

      if (tableCount > 0) {
        // Show table names
        const [tableList] = await connection.query(
          'SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = ? AND table_type = "BASE TABLE" ORDER BY table_name',
          [dbName]
        );

        console.log(`\n   📋 Table List:`);
        tableList.forEach((t, i) => {
          console.log(`      ${(i + 1).toString().padStart(2, ' ')}. ${t.table_name.padEnd(30, ' ')} (${t.table_rows} rows)`);
        });

        // Check for key tables
        const keyTables = ['App_Users', 'roles', 'user_roles', 'permissions', 'role_permissions'];
        const [keyCheck] = await connection.query(
          'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN (?) ORDER BY table_name',
          [dbName, keyTables]
        );

        console.log(`\n   🔑 Key Tables Present: ${keyCheck.length}/${keyTables.length}`);

        // Check for admin user
        try {
          const [adminCheck] = await connection.query(
            'SELECT COUNT(*) as count FROM App_Users WHERE role = "admin" OR email LIKE "%admin%"'
          );
          console.log(`   👤 Admin Users: ${adminCheck[0].count}`);
        } catch (e) {
          // Table might not exist
        }

        // Check for roles
        try {
          const [roleCheck] = await connection.query('SELECT COUNT(*) as count FROM roles');
          console.log(`   🎭 Roles Defined: ${roleCheck[0].count}`);
        } catch (e) {
          // Table might not exist
        }

        // Check for permissions
        try {
          const [permCheck] = await connection.query('SELECT COUNT(*) as count FROM permissions');
          console.log(`   🔐 Permissions Defined: ${permCheck[0].count}`);
        } catch (e) {
          // Table might not exist
        }

        console.log(`\n   ✅ This database is ${tableCount >= 20 ? 'COMPLETE' : 'INCOMPLETE'}`);
      } else {
        console.log('   ⚠️  This database is EMPTY');
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('\n📌 RECOMMENDATION:');
    
    // Find the most complete database
    let bestDb = null;
    let maxTables = 0;
    
    for (const db of databases) {
      const dbName = db.Database;
      await connection.query(`USE \`${dbName}\``);
      const [tables] = await connection.query(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = "BASE TABLE"',
        [dbName]
      );
      if (tables[0].count > maxTables) {
        maxTables = tables[0].count;
        bestDb = dbName;
      }
    }

    if (bestDb && maxTables >= 20) {
      console.log(`\n✅ Use database: ${bestDb}`);
      console.log(`   It has ${maxTables} tables and appears complete.`);
      console.log(`\n   Update your .env file:`);
      console.log(`   DB_NAME=${bestDb}`);
      
      // Show other databases that can be deleted
      const otherDbs = databases.filter(d => d.Database !== bestDb);
      if (otherDbs.length > 0) {
        console.log(`\n   You can safely delete these empty/incomplete databases:`);
        otherDbs.forEach(d => {
          console.log(`   DROP DATABASE IF EXISTS \`${d.Database}\`;`);
        });
      }
    } else {
      console.log('\n⚠️  No complete database found. Run the schema creation script.');
      console.log('   node Backend/scripts/run-complete-schema.js');
    }

    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifyDatabases()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

