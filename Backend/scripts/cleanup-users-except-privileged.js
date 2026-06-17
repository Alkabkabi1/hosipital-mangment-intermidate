/**
 * Cleanup Users Script
 * Deletes all users from App_Users and Employees tables except:
 * - HR Employee(s)
 * - Manager(s)
 * - Admin(s)
 * 
 * Usage: node Backend/scripts/cleanup-users-except-privileged.js [--dry-run]
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

async function cleanupUsers() {
  console.log('\n🧹 CLEANUP USERS - KEEPING HR, MANAGER, ADMIN ONLY\n');
  console.log('═'.repeat(70));
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // First, connect without database to find the correct one
  const preferredDbName = process.env.DB_NAME || 'nora_database';
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL server\n');

  // Find database with App_Users table
  let dbName = preferredDbName;
  const [databases] = await connection.query(`SHOW DATABASES`);
  
  // Check if preferred database exists and has App_Users table
  const preferredExists = databases.some(db => db.Database === preferredDbName);
  
  if (preferredExists) {
    await connection.query(`USE \`${preferredDbName}\``);
    const [tables] = await connection.query(
      `SHOW TABLES LIKE 'App_Users'`
    );
    if (tables.length > 0) {
      dbName = preferredDbName;
    }
  }
  
  // If preferred database doesn't have App_Users, search for it
  if (!preferredExists || dbName !== preferredDbName) {
    console.log(`⚠️  Database '${preferredDbName}' not found or missing App_Users table.`);
    console.log('   Searching for database with App_Users table...\n');
    
    for (const db of databases) {
      const dbNameCandidate = db.Database;
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbNameCandidate)) {
        continue;
      }
      
      try {
        await connection.query(`USE \`${dbNameCandidate}\``);
        const [tables] = await connection.query(
          `SHOW TABLES LIKE 'App_Users'`
        );
        if (tables.length > 0) {
          dbName = dbNameCandidate;
          console.log(`✅ Found App_Users table in database: ${dbName}\n`);
          break;
        }
      } catch (err) {
        // Skip databases we can't access
        continue;
      }
    }
  }

  if (!dbName) {
    console.error(`❌ Could not find database with App_Users table!`);
    await connection.end();
    process.exit(1);
  }

  // Reconnect with the correct database
  await connection.end();
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: dbName,
    multipleStatements: true
  });

  console.log(`✅ Using database: ${dbName}\n`);

  try {
    // Step 1: Identify users to keep (HR, MANAGER, ADMIN roles)
    console.log('📋 Step 1: Identifying users to preserve...\n');
    
    const [usersToKeep] = await connection.query(`
      SELECT DISTINCT
        u.id AS user_id,
        u.email,
        u.name,
        u.employee_id,
        GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
      FROM App_Users u
      INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      INNER JOIN roles r ON ur.role_id = r.role_id
      WHERE r.role_name IN ('HR', 'MANAGER', 'ADMIN')
      GROUP BY u.id, u.email, u.name, u.employee_id
      ORDER BY u.email
    `);

    console.log(`✅ Found ${usersToKeep.length} users to preserve:\n`);
    usersToKeep.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Roles: ${user.roles}`);
      console.log(`      Employee ID: ${user.employee_id || 'N/A'}`);
      console.log();
    });

    if (usersToKeep.length === 0) {
      console.log('⚠️  WARNING: No users with HR, MANAGER, or ADMIN roles found!');
      console.log('   This would delete ALL users. Exiting for safety.\n');
      await connection.end();
      process.exit(1);
    }

    const userIdsToKeep = usersToKeep.map(u => u.user_id);
    const employeeIdsToKeep = usersToKeep
      .map(u => u.employee_id)
      .filter(id => id !== null);

    // Step 2: Count users to delete
    console.log('📊 Step 2: Counting users to delete...\n');
    
    const [usersToDelete] = await connection.query(`
      SELECT COUNT(*) AS count
      FROM App_Users
      WHERE id NOT IN (?)
    `, [userIdsToKeep.length > 0 ? userIdsToKeep : [0]]);

    const [employeesToDelete] = await connection.query(`
      SELECT COUNT(*) AS count
      FROM Employees
      WHERE employee_id NOT IN (?)
    `, [employeeIdsToKeep.length > 0 ? employeeIdsToKeep : [0]]);

    console.log(`   Users to delete: ${usersToDelete[0].count}`);
    console.log(`   Employees to delete: ${employeesToDelete[0].count}\n`);

    if (usersToDelete[0].count === 0 && employeesToDelete[0].count === 0) {
      console.log('✅ No users or employees to delete. Database is already clean.\n');
      await connection.end();
      return;
    }

    // Step 3: Show preview of what will be deleted
    console.log('📋 Step 3: Preview of users to be deleted...\n');
    
    const [usersPreview] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.employee_id,
        GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.id NOT IN (?)
      GROUP BY u.id, u.name, u.email, u.employee_id
      ORDER BY u.email
      LIMIT 20
    `, [userIdsToKeep.length > 0 ? userIdsToKeep : [0]]);

    if (usersPreview.length > 0) {
      console.log('   First 20 users to be deleted:');
      usersPreview.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Roles: ${user.roles || 'None'}`);
      });
      if (usersToDelete[0].count > 20) {
        console.log(`   ... and ${usersToDelete[0].count - 20} more users\n`);
      } else {
        console.log();
      }
    }

    // Step 4: Execute deletion (if not dry run)
    if (DRY_RUN) {
      console.log('═'.repeat(70));
      console.log('✅ DRY RUN COMPLETE - No changes made\n');
      console.log('Run without --dry-run to execute the deletion.\n');
      await connection.end();
      return;
    }

    console.log('═'.repeat(70));
    console.log('⚠️  WARNING: About to delete users and employees!');
    console.log('   This action cannot be undone.\n');
    
    // Start transaction
    await connection.beginTransaction();

    try {
      // Step 4a: Delete related records that have RESTRICT constraints
      console.log('🗑️  Deleting related records with foreign key constraints...\n');
      
      // Delete Commissioner_Tickets that reference users to be deleted
      console.log('   - Deleting Commissioner_Tickets...');
      const [deleteCommTickets] = await connection.query(`
        DELETE FROM Commissioner_Tickets
        WHERE issuer_user_id NOT IN (?)
           OR subject_user_id NOT IN (?)
      `, [
        userIdsToKeep.length > 0 ? userIdsToKeep : [0],
        userIdsToKeep.length > 0 ? userIdsToKeep : [0]
      ]);
      console.log(`     ✅ Deleted ${deleteCommTickets.affectedRows} commissioner tickets\n`);

      // Step 4b: Delete user_roles for users to be deleted
      console.log('🗑️  Deleting user_roles for deleted users...');
      const [deleteUserRoles] = await connection.query(`
        DELETE FROM user_roles
        WHERE user_id NOT IN (?)
      `, [userIdsToKeep.length > 0 ? userIdsToKeep : [0]]);
      console.log(`   ✅ Deleted ${deleteUserRoles.affectedRows} user role assignments\n`);

      // Step 4c: Delete users from App_Users
      // Note: Other tables with ON DELETE SET NULL or CASCADE should handle themselves
      console.log('🗑️  Deleting users from App_Users...');
      const [deleteUsers] = await connection.query(`
        DELETE FROM App_Users
        WHERE id NOT IN (?)
      `, [userIdsToKeep.length > 0 ? userIdsToKeep : [0]]);
      console.log(`   ✅ Deleted ${deleteUsers.affectedRows} users\n`);

      // Delete employees (only those not linked to preserved users)
      if (employeeIdsToKeep.length > 0) {
        console.log('🗑️  Deleting employees...');
        const [deleteEmployees] = await connection.query(`
          DELETE FROM Employees
          WHERE employee_id NOT IN (?)
        `, [employeeIdsToKeep]);
        console.log(`   ✅ Deleted ${deleteEmployees.affectedRows} employees\n`);
      } else {
        // If no employee_ids to keep, delete all employees
        console.log('🗑️  Deleting all employees...');
        const [deleteEmployees] = await connection.query(`DELETE FROM Employees`);
        console.log(`   ✅ Deleted ${deleteEmployees.affectedRows} employees\n`);
      }

      // Commit transaction
      await connection.commit();
      console.log('✅ Transaction committed successfully\n');

      // Step 5: Verify final state
      console.log('📊 Step 5: Verifying final state...\n');
      
      const [finalUsers] = await connection.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
        FROM App_Users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
        LEFT JOIN roles r ON ur.role_id = r.role_id
        GROUP BY u.id, u.name, u.email
        ORDER BY u.email
      `);

      console.log(`✅ Remaining users: ${finalUsers.length}\n`);
      finalUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      Roles: ${user.roles || 'None'}`);
        console.log();
      });

      const [finalEmployees] = await connection.query(`SELECT COUNT(*) AS count FROM Employees`);
      console.log(`✅ Remaining employees: ${finalEmployees[0].count}\n`);

      console.log('═'.repeat(70));
      console.log('✅ CLEANUP COMPLETE!\n');

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql.substring(0, 200) + '...');
    }
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the script
cleanupUsers()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

