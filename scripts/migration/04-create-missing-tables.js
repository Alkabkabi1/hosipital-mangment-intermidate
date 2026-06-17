// =====================================================
// CREATE MISSING DATABASE TABLES
// =====================================================
// Creates the assignment-related tables that are referenced by backend
// but don't exist in the database, causing errors
// =====================================================

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'nora',
  password: 'nora123',
  database: 'nora_database'
};

async function createMissingTables() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);
    
    console.log('\n🏗️ Creating missing assignment-related tables...');
    
    // Assignment Requests Table
    const assignmentTableSQL = `
      CREATE TABLE IF NOT EXISTS Assignment_Requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        employee_email VARCHAR(255),
        employee_dept VARCHAR(150),
        employee_number VARCHAR(50),
        national_id VARCHAR(50),
        
        -- Current position info
        current_department VARCHAR(100),
        current_position VARCHAR(255),
        current_location VARCHAR(100),
        
        -- Assignment details
        assignment_type ENUM('temporary', 'permanent', 'project_based', 'acting') DEFAULT 'temporary',
        new_role VARCHAR(255) NOT NULL,
        new_department VARCHAR(100),
        assignment_reason TEXT NOT NULL,
        
        -- Duration
        start_date DATE NOT NULL,
        end_date DATE,
        expected_duration VARCHAR(50),
        
        -- Additional info
        additional_benefits TEXT,
        financial_impact VARCHAR(100),
        requires_relocation BOOLEAN DEFAULT FALSE,
        request_notes TEXT,
        
        -- Status and approval
        status VARCHAR(50) DEFAULT 'قيد الاعتماد',
        approval_stage VARCHAR(50) DEFAULT 'pending',
        total_approvers INT DEFAULT 0,
        approved_count INT DEFAULT 0,
        final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        last_approval_at TIMESTAMP NULL,
        
        -- Decision tracking
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        rejected_by INT NULL,
        rejected_at TIMESTAMP NULL,
        decision_note TEXT,
        
        -- System timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        KEY idx_assignment_employee_id (employee_id),
        KEY idx_assignment_status (status),
        KEY idx_assignment_approval_stage (approval_stage),
        KEY idx_assignment_created_at (created_at)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    // Assignment Termination Requests Table  
    const assignmentTerminationTableSQL = `
      CREATE TABLE IF NOT EXISTS Assignment_Termination_Requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        employee_email VARCHAR(255),
        employee_dept VARCHAR(150),
        employee_number VARCHAR(50),
        national_id VARCHAR(50),
        
        -- Assignment termination details
        original_assignment_id INT NULL,
        assignment_role VARCHAR(255) NOT NULL,
        assignment_department VARCHAR(100),
        assignment_start_date DATE,
        termination_reason TEXT NOT NULL,
        termination_date DATE NOT NULL,
        early_termination BOOLEAN DEFAULT FALSE,
        
        -- Return details
        return_to_department VARCHAR(100),
        return_to_position VARCHAR(255),
        return_date DATE,
        
        -- Performance and feedback
        assignment_performance TEXT,
        lessons_learned TEXT,
        request_notes TEXT,
        
        -- Status and approval
        status VARCHAR(50) DEFAULT 'قيد الاعتماد',
        approval_stage VARCHAR(50) DEFAULT 'pending',
        total_approvers INT DEFAULT 0,
        approved_count INT DEFAULT 0,
        final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        last_approval_at TIMESTAMP NULL,
        
        -- Decision tracking
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        rejected_by INT NULL,
        rejected_at TIMESTAMP NULL,
        decision_note TEXT,
        
        -- System timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        KEY idx_assign_term_employee_id (employee_id),
        KEY idx_assign_term_status (status),
        KEY idx_assign_term_approval_stage (approval_stage),
        KEY idx_assign_term_created_at (created_at)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    // Internal Transfer Requests Table
    const internalTransferTableSQL = `
      CREATE TABLE IF NOT EXISTS Internal_Transfer_Requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        employee_email VARCHAR(255),
        employee_dept VARCHAR(150),
        employee_number VARCHAR(50),
        national_id VARCHAR(50),
        job_title VARCHAR(255) NOT NULL,
        
        -- Current position
        current_department VARCHAR(100) NOT NULL,
        current_position VARCHAR(255) NOT NULL,
        current_location VARCHAR(100),
        hire_date DATE,
        years_of_service VARCHAR(50),
        
        -- Transfer destination
        target_department VARCHAR(100) NOT NULL,
        target_position VARCHAR(255) NOT NULL,
        target_location VARCHAR(100),
        
        -- Transfer details
        transfer_type ENUM('permanent', 'temporary', 'secondment') DEFAULT 'permanent',
        transfer_reason TEXT NOT NULL,
        effective_date DATE NOT NULL,
        return_date DATE,
        
        -- Skills and training
        skills_match TEXT,
        training_needed TEXT,
        budget_impact VARCHAR(100),
        requires_relocation BOOLEAN DEFAULT FALSE,
        relocation_support_needed BOOLEAN DEFAULT FALSE,
        
        -- Approvals
        current_manager_approved BOOLEAN DEFAULT FALSE,
        target_manager_approved BOOLEAN DEFAULT FALSE,
        request_notes TEXT,
        
        -- Status and approval
        status VARCHAR(50) DEFAULT 'قيد الاعتماد',
        approval_stage VARCHAR(50) DEFAULT 'pending',
        total_approvers INT DEFAULT 0,
        approved_count INT DEFAULT 0,
        final_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        last_approval_at TIMESTAMP NULL,
        
        -- Decision tracking
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        rejected_by INT NULL,
        rejected_at TIMESTAMP NULL,
        decision_note TEXT,
        
        -- System timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Indexes
        KEY idx_transfer_employee_id (employee_id),
        KEY idx_transfer_current_dept (current_department),
        KEY idx_transfer_target_dept (target_department),
        KEY idx_transfer_status (status),
        KEY idx_transfer_approval_stage (approval_stage),
        KEY idx_transfer_created_at (created_at)
        
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    const tables = [
      { name: 'Assignment_Requests', sql: assignmentTableSQL },
      { name: 'Assignment_Termination_Requests', sql: assignmentTerminationTableSQL },
      { name: 'Internal_Transfer_Requests', sql: internalTransferTableSQL }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const table of tables) {
      try {
        console.log(`🏗️ Creating ${table.name}...`);
        await connection.execute(table.sql);
        console.log(`✅ Created ${table.name} successfully`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to create ${table.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying created tables...');
    
    for (const table of tables) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.name}`);
        console.log(`✅ ${table.name}: Table exists and accessible (${result[0].count} records)`);
      } catch (error) {
        console.log(`❌ ${table.name}: Table verification failed - ${error.message}`);
      }
    }
    
    console.log(`\n📊 TABLE CREATION SUMMARY:`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (successCount === tables.length) {
      console.log('\n🎉 ALL MISSING TABLES CREATED SUCCESSFULLY!');
      console.log('✅ Assignment requests can now be created');
      console.log('✅ Assignment termination requests can now be created');
      console.log('✅ Internal transfer requests can now be created');
      console.log('✅ Backend database errors should be resolved');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Restart the backend server to clear database errors');
      console.log('2. Test assignment request creation');
      console.log('3. Test assignment termination request creation');
      console.log('4. Test internal transfer request creation');
      console.log('5. Verify requests appear in dashboards');
    } else {
      console.log('\n⚠️ Some tables could not be created');
      console.log('Check the error messages above for details');
    }
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Execute table creation
createMissingTables().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
