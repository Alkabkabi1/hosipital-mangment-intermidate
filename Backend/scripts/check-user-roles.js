// Quick script to check user roles in the database
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserRoles() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nora_database',
  });

  console.log('✅ Connected to database\n');

  // Get all users with their roles
  const [users] = await connection.execute(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role as legacy_role,
      GROUP_CONCAT(r.role_name) as roles
    FROM App_Users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
    LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
    GROUP BY u.id, u.name, u.email, u.role
    ORDER BY u.id
  `);

  console.log('📋 User Roles:\n');
  users.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Legacy Role: ${user.legacy_role || 'none'}`);
    console.log(`Active Roles: ${user.roles || 'none'}`);
    console.log('---');
  });

  // Check available roles
  const [availableRoles] = await connection.execute(`
    SELECT role_id, role_name, role_name_ar, is_active
    FROM roles
    ORDER BY role_name
  `);

  console.log('\n📜 Available Roles:\n');
  availableRoles.forEach(role => {
    console.log(`${role.role_id}: ${role.role_name} (${role.role_name_ar}) - ${role.is_active ? '✅ Active' : '❌ Inactive'}`);
  });

  await connection.end();
  console.log('\n✅ Done');
}

checkUserRoles().catch(console.error);

