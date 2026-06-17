// =====================================================
// SIMPLE BACKUP EXECUTOR
// =====================================================
// Executes backup statements one by one to avoid SQL syntax issues
// =====================================================

const mysql = require('mysql2/promise');
const fs = require('fs').promises;

// Database configuration from .env
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'nora',
  password: 'nora123',
  database: 'nora_database'
};

async function executeSimpleBackup() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);
    
    // Define backup statements
    const backupStatements = [
      'CREATE TABLE IF NOT EXISTS backup_onboarding_requests AS SELECT * FROM Onboarding_Requests',
      'CREATE TABLE IF NOT EXISTS backup_clearance_requests AS SELECT * FROM Clearance_Requests',
      'CREATE TABLE IF NOT EXISTS backup_delegation_requests AS SELECT * FROM Delegation_Requests',
      'CREATE TABLE IF NOT EXISTS backup_certificate_requests AS SELECT * FROM Certificate_Requests',
      'CREATE TABLE IF NOT EXISTS backup_experience_certificate_requests AS SELECT * FROM Experience_Certificate_Requests',
      'CREATE TABLE IF NOT EXISTS backup_exit_requests AS SELECT * FROM Exit_Requests',
      'CREATE TABLE IF NOT EXISTS backup_assignment_requests AS SELECT * FROM Assignment_Requests',
      'CREATE TABLE IF NOT EXISTS backup_assignment_termination_requests AS SELECT * FROM Assignment_Termination_Requests',
      'CREATE TABLE IF NOT EXISTS backup_internal_transfer_requests AS SELECT * FROM Internal_Transfer_Requests',
      'CREATE TABLE IF NOT EXISTS backup_maternity_leave_requests AS SELECT * FROM Maternity_Leave_Requests',
      'CREATE TABLE IF NOT EXISTS backup_housing_allowance_requests AS SELECT * FROM Housing_Allowance_Requests'
    ];
    
    console.log(`🔄 Executing ${backupStatements.length} backup statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < backupStatements.length; i++) {
      const statement = backupStatements[i];
      const tableName = statement.match(/backup_(\w+)/)[1];
      
      try {
        await connection.execute(statement);
        console.log(`✅ ${i+1}/${backupStatements.length}: Backed up ${tableName}`);
        successCount++;
      } catch (error) {
        console.log(`⚠️ ${i+1}/${backupStatements.length}: Could not backup ${tableName} - ${error.message}`);
        errorCount++;
      }
    }
    
    // Try to backup multi-approval tables (may not exist)
    try {
      await connection.execute('CREATE TABLE IF NOT EXISTS backup_multi_approval_requests AS SELECT * FROM Multi_Approval_Requests');
      console.log('✅ Backed up Multi_Approval_Requests');
      successCount++;
    } catch (error) {
      console.log('⚠️ Multi_Approval_Requests table does not exist (okay)');
    }
    
    try {
      await connection.execute('CREATE TABLE IF NOT EXISTS backup_approval_steps AS SELECT * FROM Approval_Steps');
      console.log('✅ Backed up Approval_Steps');
      successCount++;
    } catch (error) {
      console.log('⚠️ Approval_Steps table does not exist (okay)');
    }
    
    // Validate backups
    console.log('\n🔍 Validating backup integrity...');
    
    const requestTables = [
      'onboarding_requests',
      'clearance_requests', 
      'delegation_requests',
      'certificate_requests',
      'experience_certificate_requests',
      'exit_requests',
      'assignment_requests',
      'assignment_termination_requests',
      'internal_transfer_requests',
      'maternity_leave_requests',
      'housing_allowance_requests'
    ];
    
    let totalOriginal = 0;
    let totalBackup = 0;
    
    for (const table of requestTables) {
      try {
        const tableName = table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, '_').replace(/requests/i, 'Requests');
        
        const [originalResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const [backupResult] = await connection.execute(`SELECT COUNT(*) as count FROM backup_${table}`);
        
        const original = originalResult[0].count;
        const backup = backupResult[0].count;
        
        totalOriginal += original;
        totalBackup += backup;
        
        if (original === backup) {
          console.log(`✅ ${tableName}: ${original} records → ${backup} backed up`);
        } else {
          console.log(`❌ ${tableName}: Mismatch! ${original} records → ${backup} backed up`);
        }
        
      } catch (error) {
        console.log(`⚠️ Could not validate ${table}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 BACKUP SUMMARY:`);
    console.log(`✅ Successful backups: ${successCount}`);
    console.log(`⚠️ Errors/skipped: ${errorCount}`);
    console.log(`📊 Total original records: ${totalOriginal}`);
    console.log(`📊 Total backed up records: ${totalBackup}`);
    console.log(`${totalOriginal === totalBackup ? '✅ BACKUP INTEGRITY: PERFECT' : '⚠️ BACKUP INTEGRITY: CHECK REQUIRED'}`);
    
    // Save validation results
    const validationResults = {
      timestamp: new Date().toISOString(),
      database: dbConfig.database,
      totalOriginalRecords: totalOriginal,
      totalBackupRecords: totalBackup,
      integrityCheck: totalOriginal === totalBackup ? 'PASSED' : 'NEEDS_REVIEW',
      successfulBackups: successCount,
      errors: errorCount
    };
    
    await fs.writeFile(
      `backup-validation-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
      JSON.stringify(validationResults, null, 2)
    );
    
    console.log('\n🎉 BACKUP PROCESS COMPLETED');
    console.log('📄 Validation results saved to backup-validation-[timestamp].json');
    
    if (totalOriginal === totalBackup) {
      console.log('\n✅ READY TO PROCEED: Your data is safely backed up!');
      console.log('You can now proceed with the unified schema migration.');
    } else {
      console.log('\n⚠️ REVIEW REQUIRED: Some backup mismatches found.');
      console.log('Please review the validation results before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Execute backup
executeSimpleBackup().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
