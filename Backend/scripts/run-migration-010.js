/**
 * Migration Script: Run migration 010 - Create role hierarchy
 * Creates role_hierarchy table and sets ADMIN as parent of all roles
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  let connection;

  try {
    console.log('🔄 Starting Migration 010: Create role hierarchy...\n');

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
    const migrationPath = path.join(__dirname, '..', 'migrations', '010_create_role_hierarchy.sql');
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

    // Verify hierarchy
    console.log('\n📊 Verifying role hierarchy...');
    const [hierarchyRows] = await connection.execute(`
      SELECT 
        p.role_name AS parent_role,
        c.role_name AS child_role,
        h.inheritance_level
      FROM role_hierarchy h
      INNER JOIN roles p ON h.parent_role_id = p.role_id
      INNER JOIN roles c ON h.child_role_id = c.role_id
      ORDER BY h.inheritance_level, p.role_name, c.role_name
    `);

    if (hierarchyRows.length > 0) {
      console.log('\n✅ Role Hierarchy:');
      console.table(hierarchyRows);
    } else {
      console.log('⚠️ No hierarchy entries found');
    }

    console.log('\n✅ Migration 010 completed successfully!');
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

