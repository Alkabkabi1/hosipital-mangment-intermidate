#!/usr/bin/env node

/**
 * Clear All Request Forms Database Script
 * Deletes all request data while preserving employees and users
 */

const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration (matches backend config)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'nora',
  password: process.env.DB_PASSWORD || 'nora123',
  database: process.env.DB_NAME || 'nora_database',
  multipleStatements: true
};

async function clearRequestsDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    console.log(`Database: ${dbConfig.host}:${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Step 1: Clear Status History Tables (Foreign Key Dependencies)
    console.log('\n📋 Step 1: Clearing status history tables...');
    
    const historyTables = [
      'Exit_Request_Status_History',
      'Leave_Request_Status_History', 
      'Assignment_Status_History',
      'Assignment_Termination_Status_History',
      'Internal_Transfer_Status_History',
      'Certificate_Status_History',
      'Experience_Status_History'
    ];

    for (const table of historyTables) {
      try {
        const [result] = await connection.execute(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}: ${result.affectedRows} records deleted`);
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  Table ${table} doesn't exist (skipping)`);
        } else {
          console.log(`  ❌ Error clearing ${table}: ${error.message}`);
        }
      }
    }

    // Step 2: Clear Request Approvals
    console.log('\n🔐 Step 2: Clearing approval records...');
    try {
      const [result] = await connection.execute('DELETE FROM Request_Approvals');
      console.log(`  ✅ Cleared Request_Approvals: ${result.affectedRows} records deleted`);
    } catch (error) {
      console.log(`  ❌ Error clearing Request_Approvals: ${error.message}`);
    }

    // Step 3: Clear Main Request Tables
    console.log('\n📝 Step 3: Clearing main request tables...');
    
    const requestTables = [
      'Clearance_Requests',
      'Onboarding_Requests', 
      'Delegation_Requests',
      'Certificate_Requests',
      'Experience_Certificate_Requests',
      'Leave_Requests',
      'Exit_Requests',
      'Assignment_Requests',
      'Assignment_Termination_Requests',
      'Internal_Transfer_Requests',
      'Maternity_Leave_Requests',
      'Housing_Allowance_Requests'
    ];

    let totalRequestsDeleted = 0;
    for (const table of requestTables) {
      try {
        const [result] = await connection.execute(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}: ${result.affectedRows} records deleted`);
        totalRequestsDeleted += result.affectedRows;
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  Table ${table} doesn't exist (skipping)`);
        } else {
          console.log(`  ❌ Error clearing ${table}: ${error.message}`);
        }
      }
    }

    // Step 4: Clear Comment Tables
    console.log('\n💬 Step 4: Clearing comment tables...');
    
    const commentTables = [
      'Leave_Request_Comments',
      'Certificate_Request_Comments', 
      'Experience_Request_Comments'
    ];

    for (const table of commentTables) {
      try {
        const [result] = await connection.execute(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleared ${table}: ${result.affectedRows} records deleted`);
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  Table ${table} doesn't exist (skipping)`);
        } else {
          console.log(`  ❌ Error clearing ${table}: ${error.message}`);
        }
      }
    }

    // Step 5: Reset Auto-Increment Counters
    console.log('\n🔢 Step 5: Resetting auto-increment counters...');
    
    const resetTables = [
      ...requestTables,
      ...historyTables,
      'Request_Approvals'
    ];

    for (const table of resetTables) {
      try {
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`  ✅ Reset ${table} auto-increment`);
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          // Table doesn't exist, skip silently
        } else {
          console.log(`  ⚠️  Could not reset ${table}: ${error.message}`);
        }
      }
    }

    // Step 6: Verification
    console.log('\n🔍 Step 6: Verification...');
    
    // Check request tables are empty
    const verifyTables = [
      'Clearance_Requests',
      'Onboarding_Requests',
      'Delegation_Requests', 
      'Certificate_Requests',
      'Experience_Certificate_Requests',
      'Leave_Requests',
      'Exit_Requests',
      'Request_Approvals'
    ];

    console.log('\n📊 Request Tables Status:');
    for (const table of verifyTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        if (count === 0) {
          console.log(`  ✅ ${table}: ${count} records (cleared)`);
        } else {
          console.log(`  ⚠️  ${table}: ${count} records (not fully cleared)`);
        }
      } catch (error) {
        console.log(`  ❌ ${table}: Could not verify (${error.message})`);
      }
    }

    // Check preserved tables
    console.log('\n👥 Preserved Data Status:');
    const preservedTables = [
      { table: 'App_Users', description: 'Users' },
      { table: 'Employees', description: 'Employees' },
      { table: 'Departments', description: 'Departments' },
      { table: 'roles', description: 'Roles' }
    ];

    for (const {table, description} of preservedTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`  ✅ ${description}: ${count} records (preserved)`);
      } catch (error) {
        console.log(`  ❌ ${description}: Could not verify (${error.message})`);
      }
    }

    // Summary
    console.log('\n🎉 DATABASE CLEANUP COMPLETED!');
    console.log(`📊 Total request records deleted: ${totalRequestsDeleted}`);
    console.log('✅ All request forms cleared');  
    console.log('✅ Employees and users preserved');
    console.log('✅ Ready for fresh testing session');

    console.log('\n🌐 NEXT STEPS:');
    console.log('1. Clear browser localStorage: localStorage.clear()');
    console.log('2. Restart backend server: npm start');
    console.log('3. Begin fresh testing with all 11 request types');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the script
if (require.main === module) {
  console.log('🧹 Starting database cleanup...');
  console.log('🎯 Target: Clear all request forms while preserving employees/users');
  console.log('=' .repeat(60));
  
  clearRequestsDatabase()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { clearRequestsDatabase };
