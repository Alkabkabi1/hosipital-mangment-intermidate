/**
 * Migration Script: Run migration 012 - Add role expiration support
 * Adds expires_at column and views for expiring/expired roles
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  let connection;

  try {
    console.log('🔄 Starting Migration 012: Add role expiration support...\n');

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
    const migrationPath = path.join(__dirname, '..', 'migrations', '012_add_role_expiration.sql');
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

    // Verify columns added
    console.log('\n📊 Verifying new columns...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM user_roles WHERE Field IN ('expires_at', 'expiration_notified')
    `);

    if (columns.length > 0) {
      console.log('\n✅ Columns Added:');
      console.table(columns);
    }

    // Verify views
    console.log('\n📊 Verifying views...');
    const [views] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('expiring_roles', 'expired_roles')
    `);

    if (views.length > 0) {
      console.log('\n✅ Views Created:');
      console.table(views);
    }

    console.log('\n✅ Migration 012 completed successfully!');
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

