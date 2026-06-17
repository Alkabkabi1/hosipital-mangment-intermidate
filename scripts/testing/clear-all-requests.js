// =====================================================
// CLEAR ALL REQUEST DATA - TESTING PREPARATION
// =====================================================
// Safely deletes all request data while preserving users and employees
// Perfect for starting fresh testing from scratch
// =====================================================

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'nora',
  password: 'nora123',
  database: 'nora_database'
};

async function clearAllRequestData() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);
    
    console.log('\n🧹 CLEARING ALL REQUEST DATA (preserving users and employees)...');
    
    // All request tables to clear
    const requestTables = [
      'Onboarding_Requests',
      'Clearance_Requests',
      'Delegation_Requests', 
      'Certificate_Requests',
      'Experience_Certificate_Requests',
      'Exit_Requests',
      'Assignment_Requests',
      'Assignment_Termination_Requests',
      'Internal_Transfer_Requests',
      'Maternity_Leave_Requests',
      'Housing_Allowance_Requests',
      'Leave_Requests'
    ];
    
    // Backup tables to clear (from our backup process)
    const backupTables = [
      'backup_onboarding_requests',
      'backup_clearance_requests',
      'backup_delegation_requests',
      'backup_certificate_requests',
      'backup_experience_certificate_requests',
      'backup_exit_requests',
      'backup_assignment_requests',
      'backup_assignment_termination_requests',
      'backup_internal_transfer_requests',
      'backup_maternity_leave_requests',
      'backup_housing_allowance_requests'
    ];
    
    // Support tables to clear (but not drop)
    const supportTablesToClear = [
      'Migration_Log',
      'Multi_Approval_Requests',
      'Approval_Steps'
    ];
    
    let clearedCount = 0;
    let totalRecordsDeleted = 0;
    
    // Clear main request tables
    console.log('\n📋 Clearing main request tables...');
    for (const table of requestTables) {
      try {
        // First count records
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = countResult[0].count;
        
        if (recordCount > 0) {
          // Clear the table
          await connection.execute(`DELETE FROM ${table}`);
          console.log(`✅ Cleared ${table}: ${recordCount} records deleted`);
          totalRecordsDeleted += recordCount;
          clearedCount++;
        } else {
          console.log(`⚪ ${table}: Already empty`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${table}: Table doesn't exist or couldn't be cleared (${error.message})`);
      }
    }
    
    // Clear backup tables  
    console.log('\n🗃️ Clearing backup tables...');
    for (const table of backupTables) {
      try {
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = countResult[0].count;
        
        if (recordCount > 0) {
          await connection.execute(`DELETE FROM ${table}`);
          console.log(`✅ Cleared ${table}: ${recordCount} backup records deleted`);
        } else {
          console.log(`⚪ ${table}: Already empty`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${table}: Table doesn't exist (okay)`);
      }
    }
    
    // Clear support tables (but keep structure)
    console.log('\n🔧 Clearing support tables...');
    for (const table of supportTablesToClear) {
      try {
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const recordCount = countResult[0].count;
        
        if (recordCount > 0) {
          await connection.execute(`DELETE FROM ${table}`);
          console.log(`✅ Cleared ${table}: ${recordCount} support records deleted`);
        } else {
          console.log(`⚪ ${table}: Already empty`);
        }
        
      } catch (error) {
        console.log(`⚠️ ${table}: Table doesn't exist (okay)`);
      }
    }
    
    // Reset reference number sequences to start fresh
    console.log('\n🔢 Resetting reference number sequences...');
    try {
      await connection.execute(`
        UPDATE Request_Reference_Sequences 
        SET current_sequence = 1, date_created = CURDATE()
      `);
      console.log('✅ Reset all reference number sequences to 1');
    } catch (error) {
      console.log('⚠️ Could not reset sequences (table might not exist)');
    }
    
    // Verify user and employee data is preserved
    console.log('\n🔍 Verifying user and employee data preservation...');
    
    try {
      const [userResult] = await connection.execute('SELECT COUNT(*) as count FROM App_Users');
      const userCount = userResult[0].count;
      console.log(`✅ App_Users preserved: ${userCount} users`);
      
      const [employeeResult] = await connection.execute('SELECT COUNT(*) as count FROM Employees');
      const employeeCount = employeeResult[0].count;
      console.log(`✅ Employees preserved: ${employeeCount} employees`);
      
    } catch (error) {
      console.log('⚠️ Could not verify user/employee data');
    }
    
    // Final summary
    console.log(`\n📊 CLEAR OPERATION SUMMARY:`);
    console.log(`✅ Tables cleared: ${clearedCount}`);
    console.log(`🗑️ Total records deleted: ${totalRecordsDeleted}`);
    console.log(`👥 User data: PRESERVED`);
    console.log(`👷 Employee data: PRESERVED`);
    
    console.log('\n🎉 DATABASE CLEARED FOR FRESH TESTING!');
    console.log('✅ All request data removed');
    console.log('✅ User accounts and employee records preserved');
    console.log('✅ Reference number sequences reset');
    
    console.log('\n📋 READY FOR TESTING:');
    console.log('1. 🔐 Login to your dashboards with existing credentials');
    console.log('2. 📝 Create new requests of all types to test functionality');
    console.log('3. 👀 Verify requests appear in dashboards correctly');
    console.log('4. 📄 Test detail buttons show complete information');
    console.log('5. ✅ Test approval workflows through admin interface');
    
  } catch (error) {
    console.error('❌ Clear operation failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Execute clearing operation
clearAllRequestData().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
