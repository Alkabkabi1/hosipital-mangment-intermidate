#!/usr/bin/env node
/**
 * Run Migration 008: Deprecate Legacy Role Column
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
  console.log('🔄 Starting Migration 008: Deprecate Legacy Role Column\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database',
    multipleStatements: true
  });

  try {
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/008_deprecate_legacy_role_column.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration...\n');
    const [results] = await connection.query(sql);

    // Show results
    console.log('✅ Migration completed successfully!\n');
    
    // Show verification data
    console.log('📊 Verification: Checking role assignments...');
    const [users] = await connection.query(`
      SELECT 
        u.id,
        u.email,
        u.role AS legacy_role,
        GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS assigned_roles,
        COUNT(ur.user_role_id) AS role_count
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
      WHERE u.is_active = TRUE
      GROUP BY u.id, u.email, u.role
      ORDER BY u.id
      LIMIT 10
    `);

    console.log('\nSample user role assignments:');
    console.table(users);

    // Check for orphaned legacy roles
    const [orphaned] = await connection.query(`
      SELECT 
        u.id,
        u.email,
        u.role AS legacy_role
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      WHERE u.role IS NOT NULL 
        AND u.is_active = TRUE
        AND ur.user_role_id IS NULL
    `);

    if (orphaned.length > 0) {
      console.log('\n⚠️  Warning: Found users with legacy roles but no user_roles entries:');
      console.table(orphaned);
    } else {
      console.log('\n✅ No orphaned legacy roles found');
    }

    console.log('\n🎉 Migration 008 completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update code to use user_roles table instead of App_Users.role');
    console.log('   2. Test all authentication and role-checking functionality');
    console.log('   3. After 30+ days, consider dropping the role column completely\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);

