// =====================================================
// SAFE COLUMN ADDITIONS - MYSQL COMPATIBLE
// =====================================================
// Adds columns one by one with proper error handling
// Uses DESCRIBE to check if columns exist before adding
// =====================================================

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'nora',
  password: 'nora123',
  database: 'nora_database'
};

async function checkColumnExists(connection, table, column) {
  try {
    const [columns] = await connection.execute(`DESCRIBE ${table}`);
    return columns.some(col => col.Field === column);
  } catch (error) {
    return false; // Table doesn't exist
  }
}

async function addColumnSafely(connection, table, columnDef, columnName) {
  try {
    const exists = await checkColumnExists(connection, table, columnName);
    if (exists) {
      console.log(`⏭️ ${table}.${columnName}: Column already exists`);
      return true;
    }
    
    await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
    console.log(`✅ ${table}.${columnName}: Column added successfully`);
    return true;
  } catch (error) {
    console.log(`❌ ${table}.${columnName}: ${error.message}`);
    return false;
  }
}

async function addColumnsSafely() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);
    
    // Column additions for each table
    const columnAdditions = [
      // Clearance_Requests enhancements
      { table: 'Clearance_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Clearance_Requests', column: 'total_approvers', def: 'total_approvers INT DEFAULT 0' },
      { table: 'Clearance_Requests', column: 'approved_count', def: 'approved_count INT DEFAULT 0' },
      { table: 'Clearance_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      
      // Onboarding_Requests enhancements
      { table: 'Onboarding_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Onboarding_Requests', column: 'total_approvers', def: 'total_approvers INT DEFAULT 0' },
      { table: 'Onboarding_Requests', column: 'approved_count', def: 'approved_count INT DEFAULT 0' },
      { table: 'Onboarding_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      
      // Certificate_Requests standardization
      { table: 'Certificate_Requests', column: 'employee_email', def: 'employee_email VARCHAR(255)' },
      { table: 'Certificate_Requests', column: 'employee_dept', def: 'employee_dept VARCHAR(150)' },
      { table: 'Certificate_Requests', column: 'reference_number', def: 'reference_number VARCHAR(50)' },
      { table: 'Certificate_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Certificate_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      { table: 'Certificate_Requests', column: 'decision_note', def: 'decision_note TEXT' },
      
      // Experience_Certificate_Requests standardization
      { table: 'Experience_Certificate_Requests', column: 'employee_email', def: 'employee_email VARCHAR(255)' },
      { table: 'Experience_Certificate_Requests', column: 'employee_dept', def: 'employee_dept VARCHAR(150)' },
      { table: 'Experience_Certificate_Requests', column: 'reference_number', def: 'reference_number VARCHAR(50)' },
      { table: 'Experience_Certificate_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Experience_Certificate_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      { table: 'Experience_Certificate_Requests', column: 'decision_note', def: 'decision_note TEXT' },
      
      // Delegation_Requests enhancements  
      { table: 'Delegation_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Delegation_Requests', column: 'total_approvers', def: 'total_approvers INT DEFAULT 0' },
      { table: 'Delegation_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      
      // Housing_Allowance_Requests standardization
      { table: 'Housing_Allowance_Requests', column: 'reference_number', def: 'reference_number VARCHAR(50)' },
      { table: 'Housing_Allowance_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Housing_Allowance_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      
      // Exit_Requests standardization
      { table: 'Exit_Requests', column: 'reference_number', def: 'reference_number VARCHAR(50)' },
      { table: 'Exit_Requests', column: 'approval_stage', def: 'approval_stage VARCHAR(50) DEFAULT "pending"' },
      { table: 'Exit_Requests', column: 'final_decision', def: 'final_decision ENUM("pending", "approved", "rejected") DEFAULT "pending"' },
      { table: 'Exit_Requests', column: 'decision_note', def: 'decision_note TEXT' }
    ];
    
    console.log(`\n🔧 Adding ${columnAdditions.length} columns across tables...`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const addition of columnAdditions) {
      const success = await addColumnSafely(connection, addition.table, addition.def, addition.column);
      if (success) {
        const exists = await checkColumnExists(connection, addition.table, addition.column);
        if (exists) {
          successCount++;
        } else {
          skipCount++;
        }
      } else {
        errorCount++;
      }
    }
    
    // Update reference numbers where missing
    console.log('\n🔄 Generating reference numbers for existing records...');
    
    const tables = ['Certificate_Requests', 'Experience_Certificate_Requests', 'Housing_Allowance_Requests', 'Exit_Requests'];
    const prefixes = ['CRT', 'EXP', 'HSG', 'EXT'];
    
    for (let i = 0; i < tables.length; i++) {
      try {
        const columnExists = await checkColumnExists(connection, tables[i], 'reference_number');
        if (columnExists) {
          await connection.execute(`
            UPDATE ${tables[i]} 
            SET reference_number = CONCAT('${prefixes[i]}-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(id, 4, '0'))
            WHERE reference_number IS NULL OR reference_number = ''
          `);
          console.log(`✅ Updated reference numbers for ${tables[i]}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not update ${tables[i]}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 COLUMN ADDITION SUMMARY:`);
    console.log(`✅ Successfully added: ${successCount}`);
    console.log(`⏭️ Already existed: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    console.log('\n🎉 DATABASE ENHANCEMENT COMPLETED!');
    console.log('✅ Your database now supports the unified system');
    console.log('✅ Ready to test the enhanced backend and frontend');
    
  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Execute column additions
addColumnsSafely().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
