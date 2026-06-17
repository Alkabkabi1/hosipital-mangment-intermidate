#!/usr/bin/env node
/**
 * Run Migration 009: Create Permissions System
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
  console.log('🔄 Starting Migration 009: Create Permissions System\n');

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
    const migrationPath = path.join(__dirname, '../migrations/009_create_permissions_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration...\n');
    const [results] = await connection.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Show summary
    const [permCount] = await connection.query('SELECT COUNT(*) AS count FROM permissions WHERE is_active = TRUE');
    const [rpCount] = await connection.query('SELECT COUNT(*) AS count FROM role_permissions WHERE is_active = TRUE');
    
    console.log('📊 Summary:');
    console.log(`   - Permissions created: ${permCount[0].count}`);
    console.log(`   - Role-Permission mappings: ${rpCount[0].count}\n`);

    // Show permissions by role
    const [rolePerms] = await connection.query(`
      SELECT 
        r.role_name,
        COUNT(rp.role_permission_id) AS permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id AND rp.is_active = TRUE
      GROUP BY r.role_id, r.role_name
      ORDER BY permission_count DESC
    `);

    console.log('📊 Permissions per role:');
    console.table(rolePerms);

    console.log('\n🎉 Migration 009 completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create permission service and API endpoints');
    console.log('   2. Update frontend to fetch permissions from API');
    console.log('   3. Test permission-based access control\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);

