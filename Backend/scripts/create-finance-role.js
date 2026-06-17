#!/usr/bin/env node
/**
 * Create missing FINANCE role
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function createFinanceRole() {
  console.log('🔄 Creating FINANCE role...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database'
  });

  try {
    console.log('✅ Connected to database\n');

    // Check if FINANCE role already exists
    const [existing] = await connection.query(
      'SELECT role_id, role_name FROM roles WHERE role_name = ?',
      ['FINANCE']
    );

    if (existing.length > 0) {
      console.log('✅ FINANCE role already exists (ID:', existing[0].role_id, ')');
      return;
    }

    // Create FINANCE role
    await connection.query(`
      INSERT INTO roles (role_name, role_name_ar, description, is_active)
      VALUES ('FINANCE', 'المالية', 'Finance department role with financial approval permissions', TRUE)
    `);

    console.log('✅ FINANCE role created successfully\n');

    // Verify creation
    const [newRole] = await connection.query(
      'SELECT role_id, role_name, role_name_ar FROM roles WHERE role_name = ?',
      ['FINANCE']
    );

    if (newRole.length > 0) {
      console.log('📊 New role details:');
      console.table(newRole);
    }

    console.log('\n🎉 FINANCE role is now available for use!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createFinanceRole().catch(console.error);

