/**
 * Migration Script: Run migration 011 - Create access audit table
 * Creates role_access_audit table and summary views for security monitoring
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  let connection;

  try {
    console.log('🔄 Starting Migration 011: Create access audit table...\n');

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database',
      multipleStatements: true,
    });

    console.log('✅ Database connection established');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '011_create_access_audit_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('⏳ Executing migration...\n');

    // Execute migration
    const [results] = await connection.query(migrationSQL);

    console.log('✅ Migration executed successfully\n');

    // Display results
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.log(`Result set ${index + 1}:`);
          console.table(result);
        }
      });
    }

    // Verify table creation
    console.log('\n📊 Verifying table structure...');
    const [tableInfo] = await connection.execute(`
      SHOW CREATE TABLE role_access_audit
    `);

    if (tableInfo.length > 0) {
      console.log('\n✅ Table Created: role_access_audit');
      console.log('Columns:', tableInfo[0]['Create Table'].split('\n').slice(1, -1).join('\n'));
    }

    // Verify views
    console.log('\n📊 Verifying views...');
    const [views] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('access_audit_summary', 'denied_access_summary')
    `);

    if (views.length > 0) {
      console.log('\n✅ Views Created:');
      console.table(views);
    }

    console.log('\n✅ Migration 011 completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Database connection closed');
    }
  }
}

// Run migration
runMigration();

