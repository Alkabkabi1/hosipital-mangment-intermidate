#!/usr/bin/env node
/**
 * Fix orphaned roles - sync legacy App_Users.role to user_roles table
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function fixOrphanedRoles() {
  console.log('🔄 Fixing orphaned legacy roles...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database'
  });

  try {
    console.log('✅ Connected to database\n');

    // Find orphaned users
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

    if (orphaned.length === 0) {
      console.log('✅ No orphaned roles found!');
      return;
    }

    console.log(`Found ${orphaned.length} user(s) with orphaned roles:`);
    console.table(orphaned);

    // Fix each orphaned role
    for (const user of orphaned) {
      console.log(`\n🔧 Fixing user: ${user.email} (${user.legacy_role})`);

      // Find the role_id for the legacy role
      const [roles] = await connection.query(`
        SELECT role_id FROM roles 
        WHERE UPPER(role_name) = UPPER(?)
        LIMIT 1
      `, [user.legacy_role]);

      if (roles.length === 0) {
        console.log(`⚠️  Warning: Role "${user.legacy_role}" not found in roles table, skipping`);
        continue;
      }

      const roleId = roles[0].role_id;

      // Insert into user_roles
      await connection.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
        VALUES (?, ?, 1, 'Auto-fixed orphaned legacy role', TRUE)
        ON DUPLICATE KEY UPDATE is_active = TRUE
      `, [user.id, roleId]);

      console.log(`✅ Assigned role ${user.legacy_role} to ${user.email}`);
    }

    console.log('\n🎉 All orphaned roles fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixOrphanedRoles().catch(console.error);

