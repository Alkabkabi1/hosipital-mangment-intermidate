/**
 * Fix Admin Permissions Script
 * Ensures admin user has the correct ADMIN role in the database
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_management'
};

async function fixAdminPermissions() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // 1. Check if ADMIN role exists
    console.log('📋 Step 1: Checking if ADMIN role exists...');
    const [roleRows] = await connection.execute(
      'SELECT role_id, role_name FROM roles WHERE role_name = ?',
      ['ADMIN']
    );

    let adminRoleId;
    
    if (roleRows.length === 0) {
      console.log('⚠️  ADMIN role not found. Creating it...');
      const [result] = await connection.execute(
        `INSERT INTO roles (role_name, role_name_ar, description, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, TRUE, NOW(), NOW())`,
        ['ADMIN', 'مدير النظام', 'System Administrator with full access']
      );
      adminRoleId = result.insertId;
      console.log(`✅ Created ADMIN role with ID: ${adminRoleId}`);
    } else {
      adminRoleId = roleRows[0].role_id;
      console.log(`✅ ADMIN role exists with ID: ${adminRoleId}`);
      
      // Make sure it's active
      await connection.execute(
        'UPDATE roles SET is_active = TRUE WHERE role_id = ?',
        [adminRoleId]
      );
    }

    // 2. Find all admin users
    console.log('\n📋 Step 2: Finding admin users...');
    const [adminUsers] = await connection.execute(
      `SELECT id, email, name, role FROM App_Users WHERE role = 'admin' OR email LIKE '%admin%'`
    );

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found!');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // 3. Assign ADMIN role to all admin users
    console.log('\n📋 Step 3: Assigning ADMIN role to users...');
    
    for (const user of adminUsers) {
      // Check if user already has ADMIN role
      const [existingRole] = await connection.execute(
        'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
        [user.id, adminRoleId]
      );

      if (existingRole.length > 0) {
        // Update to ensure it's active
        await connection.execute(
          'UPDATE user_roles SET is_active = TRUE WHERE user_id = ? AND role_id = ?',
          [user.id, adminRoleId]
        );
        console.log(`   ✅ Updated ADMIN role for: ${user.email}`);
      } else {
        // Insert new role assignment
        await connection.execute(
          `INSERT INTO user_roles (user_id, role_id, is_active)
           VALUES (?, ?, TRUE)`,
          [user.id, adminRoleId]
        );
        console.log(`   ✅ Assigned ADMIN role to: ${user.email}`);
      }
    }

    // 4. Verify the assignments
    console.log('\n📋 Step 4: Verifying role assignments...');
    for (const user of adminUsers) {
      const [roles] = await connection.execute(
        `SELECT r.role_name, r.role_name_ar, ur.is_active
         FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.role_id
         WHERE ur.user_id = ? AND ur.is_active = TRUE`,
        [user.id]
      );

      console.log(`\n   User: ${user.email}`);
      console.log(`   Active Roles: ${roles.map(r => r.role_name).join(', ') || 'NONE'}`);
    }

    // 5. Check for any other common role names that should be ADMIN
    console.log('\n📋 Step 5: Checking for other admin-related roles...');
    const [otherRoles] = await connection.execute(
      `SELECT role_id, role_name FROM roles 
       WHERE role_name IN ('admin', 'Admin', 'administrator', 'Administrator')
       AND role_name != 'ADMIN'`
    );

    if (otherRoles.length > 0) {
      console.log('⚠️  Found other admin-related roles:');
      otherRoles.forEach(role => {
        console.log(`   - ${role.role_name} (ID: ${role.role_id})`);
      });
      console.log('\n   These should probably be consolidated to use ADMIN instead.');
    } else {
      console.log('✅ No conflicting admin roles found.');
    }

    console.log('\n✅ Admin permissions fix completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - ADMIN role ID: ${adminRoleId}`);
    console.log(`   - Admin users updated: ${adminUsers.length}`);
    console.log('\n🔄 Please restart your backend server and try logging in again.');

  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the script
fixAdminPermissions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

