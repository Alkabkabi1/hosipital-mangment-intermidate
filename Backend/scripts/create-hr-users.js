/**
 * Create HR Users Script
 * Creates three HR users: HR ADMIN, HR MANAGER, HR EMPLOYEE
 * With proper role assignments and employee records
 */

const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_management'
};

const HR_USERS = [
  {
    name: 'HR Admin',
    email: 'hradmin@hospital.sa',
    password: 'HRAdmin@123',
    roles: ['ADMIN', 'HR'],
    legacyRole: 'admin',
    employeeNumber: 'HR-001',
    position: 'HR Administrator',
    department: 'Human Resources',
    phone: '+966501234567'
  },
  {
    name: 'HR Manager',
    email: 'hrmanager@hospital.sa',
    password: 'HRManager@123',
    roles: ['MANAGER', 'HR'],
    legacyRole: 'manager',
    employeeNumber: 'HR-002',
    position: 'HR Manager',
    department: 'Human Resources',
    phone: '+966501234568'
  },
  {
    name: 'HR Employee',
    email: 'hremployee@hospital.sa',
    password: 'HREmployee@123',
    roles: ['EMPLOYEE', 'HR'],
    legacyRole: 'employee',
    employeeNumber: 'HR-003',
    position: 'HR Specialist',
    department: 'Human Resources',
    phone: '+966501234569'
  }
];

async function createHRUsers() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Start transaction
    await connection.beginTransaction();

    // 1. Get or create HR Department
    console.log('📋 Step 1: Setting up HR Department...');
    const [deptRows] = await connection.execute(
      'SELECT department_id FROM Departments WHERE name_ar = ? OR name_en = ? LIMIT 1',
      ['الموارد البشرية', 'Human Resources']
    );

    let hrDepartmentId;
    if (deptRows.length === 0) {
      const [deptResult] = await connection.execute(
        `INSERT INTO Departments (name_ar, name_en, department_code) 
         VALUES (?, ?, ?)`,
        ['الموارد البشرية', 'Human Resources', 'HR']
      );
      hrDepartmentId = deptResult.insertId;
      console.log(`✅ Created HR Department with ID: ${hrDepartmentId}`);
    } else {
      hrDepartmentId = deptRows[0].department_id;
      console.log(`✅ HR Department exists with ID: ${hrDepartmentId}`);
    }

    // 2. Get or create required roles
    console.log('\n📋 Step 2: Setting up roles...');
    const roleNames = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'HR'];
    const roleMap = {};

    for (const roleName of roleNames) {
      const [roleRows] = await connection.execute(
        'SELECT role_id FROM roles WHERE role_name = ?',
        [roleName]
      );

      if (roleRows.length === 0) {
        const arabicNames = {
          'ADMIN': 'مدير النظام',
          'MANAGER': 'مدير',
          'EMPLOYEE': 'موظف',
          'HR': 'الموارد البشرية'
        };

        const [roleResult] = await connection.execute(
          `INSERT INTO roles (role_name, role_name_ar, description, is_active) 
           VALUES (?, ?, ?, TRUE)`,
          [roleName, arabicNames[roleName], `${roleName} role`, true]
        );
        roleMap[roleName] = roleResult.insertId;
        console.log(`✅ Created ${roleName} role with ID: ${roleResult.insertId}`);
      } else {
        roleMap[roleName] = roleRows[0].role_id;
        console.log(`✅ ${roleName} role exists with ID: ${roleRows[0].role_id}`);
      }
    }

    // 3. Create users
    console.log('\n📋 Step 3: Creating HR users...\n');
    const createdUsers = [];

    for (const userData of HR_USERS) {
      console.log(`   Creating: ${userData.name} (${userData.email})`);

      // Check if user already exists
      const [existingUser] = await connection.execute(
        'SELECT id FROM App_Users WHERE email = ?',
        [userData.email]
      );

      let userId;
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        console.log(`   ⚠️  User already exists, updating...`);
        
        // Update existing user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await connection.execute(
          `UPDATE App_Users 
           SET name = ?, password_hash = ?, role = ?, is_active = TRUE
           WHERE id = ?`,
          [userData.name, hashedPassword, userData.legacyRole, userId]
        );
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const [userResult] = await connection.execute(
          `INSERT INTO App_Users (name, email, password_hash, role, is_active)
           VALUES (?, ?, ?, ?, TRUE)`,
          [userData.name, userData.email, hashedPassword, userData.legacyRole]
        );
        userId = userResult.insertId;
        console.log(`   ✅ Created user with ID: ${userId}`);
      }

      // Create or update employee record
      const [existingEmployee] = await connection.execute(
        'SELECT employee_id FROM Employees WHERE employee_number = ?',
        [userData.employeeNumber]
      );

      let employeeId;
      if (existingEmployee.length > 0) {
        employeeId = existingEmployee[0].employee_id;
        await connection.execute(
          `UPDATE Employees 
           SET first_name = ?, last_name = ?, 
               position = ?, department_id = ?
           WHERE employee_id = ?`,
          [
            userData.name.split(' ')[0],
            userData.name.split(' ').slice(1).join(' '),
            userData.position,
            hrDepartmentId,
            employeeId
          ]
        );
        console.log(`   ✅ Updated employee record ID: ${employeeId}`);
      } else {
        const [empResult] = await connection.execute(
          `INSERT INTO Employees (
            employee_number, first_name, last_name,
            position, department_id, hire_date
          ) VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            userData.employeeNumber,
            userData.name.split(' ')[0],
            userData.name.split(' ').slice(1).join(' '),
            userData.position,
            hrDepartmentId
          ]
        );
        employeeId = empResult.insertId;
        console.log(`   ✅ Created employee record ID: ${employeeId}`);
      }

      // Link user to employee
      await connection.execute(
        `UPDATE App_Users SET employee_id = ? WHERE id = ?`,
        [employeeId, userId]
      );

      // Assign roles
      for (const roleName of userData.roles) {
        const roleId = roleMap[roleName];
        
        // Check if role assignment exists
        const [existingRole] = await connection.execute(
          'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
          [userId, roleId]
        );

        if (existingRole.length > 0) {
          await connection.execute(
            'UPDATE user_roles SET is_active = TRUE WHERE user_id = ? AND role_id = ?',
            [userId, roleId]
          );
        } else {
          await connection.execute(
            'INSERT INTO user_roles (user_id, role_id, is_active) VALUES (?, ?, TRUE)',
            [userId, roleId]
          );
        }
        console.log(`   ✅ Assigned ${roleName} role`);
      }

      createdUsers.push({
        userId,
        employeeId,
        ...userData
      });

      console.log(`   ✅ ${userData.name} setup completed!\n`);
    }

    // Commit transaction
    await connection.commit();

    // 4. Display summary
    console.log('\n✅ HR Users Created Successfully!\n');
    console.log('═'.repeat(70));
    console.log('LOGIN CREDENTIALS');
    console.log('═'.repeat(70));
    
    createdUsers.forEach(user => {
      console.log(`\n👤 ${user.name}`);
      console.log(`   Email:     ${user.email}`);
      console.log(`   Password:  ${user.password}`);
      console.log(`   Roles:     ${user.roles.join(', ')}`);
      console.log(`   Employee:  ${user.employeeNumber}`);
      console.log(`   Position:  ${user.position}`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log('\n📝 Notes:');
    console.log('   - All users are active and ready to use');
    console.log('   - Users are linked to employee records');
    console.log('   - Department: Human Resources');
    console.log('   - Save these credentials securely!');
    console.log('\n🔄 Next Steps:');
    console.log('   1. Restart your backend server if running');
    console.log('   2. Users can log in immediately with these credentials');
    console.log('   3. Test delegation and notification features');
    console.log('\n✅ Script completed successfully!\n');

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error creating HR users:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the script
createHRUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

