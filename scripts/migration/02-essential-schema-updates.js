// =====================================================
// ESSENTIAL SCHEMA UPDATES - NODE.JS EXECUTION
// =====================================================
// Executes critical database changes needed for unified system
// Adds missing fields to existing tables instead of creating new ones
// =====================================================

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'nora',
  password: 'nora123',
  database: 'nora_database'
};

async function executeEssentialUpdates() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);
    
    // Essential schema enhancements for unified system compatibility
    const enhancements = [
      // Support tables
      {
        name: 'Create status mapping table',
        sql: `CREATE TABLE IF NOT EXISTS Request_Status_Mapping (
          id INT AUTO_INCREMENT PRIMARY KEY,
          canonical_status VARCHAR(50) NOT NULL,
          display_status_ar VARCHAR(50) NOT NULL,
          display_status_en VARCHAR(50) NOT NULL,
          status_category ENUM('pending', 'approved', 'rejected', 'in_progress') NOT NULL,
          status_order INT NOT NULL DEFAULT 0,
          is_final BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_canonical_status (canonical_status)
        )`
      },
      
      {
        name: 'Insert standard status mappings',
        sql: `INSERT IGNORE INTO Request_Status_Mapping 
        (canonical_status, display_status_ar, display_status_en, status_category, status_order, is_final) 
        VALUES
        ('pending', 'قيد الاعتماد', 'Pending Approval', 'pending', 1, FALSE),
        ('in_review', 'قيد المراجعة', 'Under Review', 'in_progress', 2, FALSE),
        ('approved', 'مكتمل', 'Approved', 'approved', 3, TRUE),
        ('rejected', 'مرفوض', 'Rejected', 'rejected', 4, TRUE)`
      },
      
      // Clearance table enhancements (resolve conflicts)
      {
        name: 'Add multi-approval to Clearance_Requests',
        sql: `ALTER TABLE Clearance_Requests 
        ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`
      },
      
      // Onboarding table enhancements  
      {
        name: 'Add multi-approval to Onboarding_Requests',
        sql: `ALTER TABLE Onboarding_Requests 
        ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS approved_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`
      },
      
      // Certificate table enhancements
      {
        name: 'Add standard fields to Certificate_Requests', 
        sql: `ALTER TABLE Certificate_Requests 
        ADD COLUMN IF NOT EXISTS employee_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS employee_dept VARCHAR(150),
        ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`
      },
      
      // Experience table enhancements
      {
        name: 'Add standard fields to Experience_Certificate_Requests',
        sql: `ALTER TABLE Experience_Certificate_Requests 
        ADD COLUMN IF NOT EXISTS employee_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS employee_dept VARCHAR(150),
        ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`
      },
      
      // Delegation table enhancements
      {
        name: 'Add multi-approval to Delegation_Requests',
        sql: `ALTER TABLE Delegation_Requests 
        ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS total_approvers INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`
      },
      
      // Housing allowance table enhancements
      {
        name: 'Add standard fields to Housing_Allowance_Requests',
        sql: `ALTER TABLE Housing_Allowance_Requests 
        ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS approval_stage VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'`
      }
    ];
    
    console.log(`\n🔧 Executing ${enhancements.length} schema enhancements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < enhancements.length; i++) {
      const enhancement = enhancements[i];
      try {
        await connection.execute(enhancement.sql);
        console.log(`✅ ${i+1}/${enhancements.length}: ${enhancement.name}`);
        successCount++;
      } catch (error) {
        console.log(`⚠️ ${i+1}/${enhancements.length}: ${enhancement.name} - ${error.message}`);
        errorCount++;
      }
    }
    
    // Update reference numbers for existing records
    console.log('\n🔄 Updating reference numbers for existing records...');
    
    const referenceUpdates = [
      {
        table: 'Certificate_Requests',
        prefix: 'CRT'
      },
      {
        table: 'Experience_Certificate_Requests', 
        prefix: 'EXP'
      },
      {
        table: 'Housing_Allowance_Requests',
        prefix: 'HSG'
      }
    ];
    
    for (const update of referenceUpdates) {
      try {
        await connection.execute(`
          UPDATE ${update.table} 
          SET reference_number = CONCAT('${update.prefix}-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 4, '0'))
          WHERE reference_number IS NULL
        `);
        console.log(`✅ Updated reference numbers for ${update.table}`);
      } catch (error) {
        console.log(`⚠️ Could not update reference numbers for ${update.table}: ${error.message}`);
      }
    }
    
    // Final validation
    console.log('\n🔍 Validating schema updates...');
    
    const validationQueries = [
      'SELECT COUNT(*) as count FROM Request_Status_Mapping',
      'SELECT COUNT(*) as clearance_count FROM Clearance_Requests WHERE approval_stage IS NOT NULL',
      'SELECT COUNT(*) as onboarding_count FROM Onboarding_Requests WHERE approval_stage IS NOT NULL'
    ];
    
    for (const query of validationQueries) {
      try {
        const [result] = await connection.execute(query);
        console.log(`✅ Validation: ${JSON.stringify(result[0])}`);
      } catch (error) {
        console.log(`⚠️ Validation failed: ${error.message}`);
      }
    }
    
    console.log(`\n📊 SCHEMA UPDATE SUMMARY:`);
    console.log(`✅ Successful updates: ${successCount}`);
    console.log(`⚠️ Errors/skipped: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 ESSENTIAL SCHEMA UPDATES COMPLETED!');
      console.log('✅ Your existing tables now support the unified system');
      console.log('✅ All request types should work with enhanced backend');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Test the backend server: npm start (in Backend directory)');
      console.log('2. Test frontend dashboards: Open admin-dashboard.html and employee-dashboard.html');
      console.log('3. Test creating new requests through the forms');
    } else {
      console.log('\n⚠️ No updates were applied - this may indicate:');
      console.log('- Schema was already updated');
      console.log('- Database permissions issues');
      console.log('- Table structure differences');
    }
    
  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Execute updates
executeEssentialUpdates().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
