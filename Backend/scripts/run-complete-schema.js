/**
 * Run the complete database schema
 * This script creates the entire database from scratch
 * 
 * Usage: node Backend/scripts/run-complete-schema.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runCompleteSchema() {
  console.log('🚀 Starting complete database schema creation...\n');

  // Read the comprehensive SQL file
  const sqlPath = path.resolve(__dirname, '../migrations/COMPLETE_DATABASE_SCHEMA.sql');
  let sql = fs.readFileSync(sqlPath, 'utf8');

  // Replace database name if needed
  const dbName = process.env.DB_NAME || 'nora_database';
  sql = sql.replace(/nora_database/g, dbName);

  console.log(`📊 Database: ${dbName}`);
  console.log(`📁 SQL File: ${sqlPath}`);
  console.log(`📝 File Size: ${(fs.statSync(sqlPath).size / 1024).toFixed(2)} KB\n`);

  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL server\n');

  try {
    // Execute the entire SQL file
    console.log('⏳ Executing schema creation (this may take 10-20 seconds)...\n');
    const [results] = await connection.query(sql);
    
    console.log('✅ Schema executed successfully!\n');

    // Show summary
    const [tables] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [dbName]
    );

    const [views] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_type = 'VIEW'`,
      [dbName]
    );

    const [roles] = await connection.query(
      `SELECT role_name FROM ${dbName}.roles ORDER BY role_name`
    );

    const [permissions] = await connection.query(
      `SELECT COUNT(*) as count FROM ${dbName}.permissions WHERE is_active = TRUE`
    );

    const [templates] = await connection.query(
      `SELECT COUNT(*) as count FROM ${dbName}.role_templates WHERE is_active = TRUE`
    );

    console.log('📊 ═══════════════════════════════════════════════════════');
    console.log('🎉 DATABASE SCHEMA CREATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`✅ Tables Created: ${tables[0].count}`);
    console.log(`✅ Views Created: ${views[0].count}`);
    console.log(`✅ Permissions: ${permissions[0].count}`);
    console.log(`✅ Role Templates: ${templates[0].count}`);
    console.log(`✅ Roles: ${roles.length}`);
    
    console.log('\n📋 Roles:');
    roles.forEach(r => console.log(`   - ${r.role_name}`));

    console.log('\n🔐 Default Admin User:');
    console.log('   Email: admin@dev.local');
    console.log('   Password: admin123');
    console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql.substring(0, 200) + '...');
    }
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
runCompleteSchema()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

