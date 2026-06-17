/**
 * Migration Script: Run migration 013 - Create role templates system
 * Creates role_templates tables and populates with default templates
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  let connection;

  try {
    console.log('🔄 Starting Migration 013: Create role templates system...\n');

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
    const migrationPath = path.join(__dirname, '..', 'migrations', '013_create_role_templates.sql');
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

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('role_templates', 'role_template_roles')
    `);

    if (tables.length > 0) {
      console.log('\n✅ Tables Created:');
      console.table(tables);
    }

    // Verify templates
    console.log('\n📊 Verifying default templates...');
    const [templates] = await connection.execute(`
      SELECT template_id, template_name, template_name_ar, role_count, roles
      FROM role_template_details
    `);

    if (templates.length > 0) {
      console.log('\n✅ Default Templates:');
      console.table(templates);
    }

    console.log('\n✅ Migration 013 completed successfully!');
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

