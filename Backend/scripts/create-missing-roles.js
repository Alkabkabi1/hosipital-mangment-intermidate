#!/usr/bin/env node
/**
 * Create all missing roles
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function createMissingRoles() {
  console.log('🔄 Creating missing roles...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database'
  });

  try {
    console.log('✅ Connected to database\n');

    // Define all standard roles
    const standardRoles = [
      { name: 'ADMIN', name_ar: 'مدير النظام', desc: 'System administrator with full access' },
      { name: 'EMPLOYEE', name_ar: 'موظف', desc: 'Standard employee role' },
      { name: 'MANAGER', name_ar: 'مدير القسم', desc: 'Department manager role' },
      { name: 'HR', name_ar: 'الموارد البشرية', desc: 'Human resources specialist' },
      { name: 'FINANCE', name_ar: 'المالية', desc: 'Finance department role' },
      { name: 'IT', name_ar: 'تقنية المعلومات', desc: 'IT department role' }
    ];

    console.log('📊 Checking existing roles...');
    const [existing] = await connection.query('SELECT role_name FROM roles');
    const existingNames = existing.map(r => r.role_name);
    console.log('   Existing roles:', existingNames.join(', '), '\n');

    let created = 0;
    let skipped = 0;

    for (const role of standardRoles) {
      if (existingNames.includes(role.name)) {
        console.log(`⏭️  ${role.name} already exists`);
        skipped++;
        continue;
      }

      await connection.query(`
        INSERT INTO roles (role_name, role_name_ar, description, is_active)
        VALUES (?, ?, ?, TRUE)
      `, [role.name, role.name_ar, role.desc]);

      console.log(`✅ Created ${role.name}`);
      created++;
    }

    console.log(`\n📊 Summary:
   - Created: ${created}
   - Skipped (already exist): ${skipped}
   - Total: ${standardRoles.length}\n`);

    // Show final state
    const [allRoles] = await connection.query(`
      SELECT role_id, role_name, role_name_ar 
      FROM roles 
      ORDER BY role_id
    `);

    console.log('📊 All roles in database:');
    console.table(allRoles);

    console.log('\n🎉 All standard roles are now available!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createMissingRoles().catch(console.error);

