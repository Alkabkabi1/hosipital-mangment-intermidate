/**
 * Migration Script: Create Employee Job Descriptions Table
 * Creates table for employee-submitted job descriptions with admin approval workflow
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function createJobDescriptionsTable() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_management',
      port: parseInt(process.env.DB_PORT || '3306'),
      multipleStatements: true
    });
    
    console.log('✅ Connected to database\n');
    
    // Check if table already exists
    console.log('🔍 Checking if Employee_Job_Descriptions table exists...');
    const [tables] = await connection.query(
      `SHOW TABLES LIKE 'Employee_Job_Descriptions'`
    );
    
    if (tables.length > 0) {
      console.log('⚠️  Employee_Job_Descriptions table already exists!');
      console.log('   Skipping creation...\n');
    } else {
      console.log('📝 Creating Employee_Job_Descriptions table...');
      
      await connection.query(`
        CREATE TABLE Employee_Job_Descriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employee_id INT NOT NULL,
          job_description TEXT NOT NULL COMMENT 'The functional job description',
          submission_notes TEXT NULL COMMENT 'Notes from employee when submitting',
          verified TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether admin has approved it',
          verified_by INT NULL COMMENT 'Admin user ID who verified',
          verified_at TIMESTAMP NULL COMMENT 'When it was verified',
          rejection_reason TEXT NULL COMMENT 'Reason if rejected',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_employee_job_desc_employee (employee_id),
          KEY idx_employee_job_desc_verified (verified),
          CONSTRAINT fk_employee_job_desc_employee FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
          CONSTRAINT fk_employee_job_desc_verified_by FOREIGN KEY (verified_by) REFERENCES App_Users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Table created successfully!\n');
    }
    
    // Check if Employees.job_description column exists and needs migration
    console.log('🔍 Checking for old job_description column in Employees table...');
    const [employeesColumns] = await connection.query(
      `SHOW COLUMNS FROM Employees WHERE Field = 'job_description'`
    );
    
    if (employeesColumns.length > 0) {
      console.log('📋 Found old job_description column in Employees table');
      console.log('🔄 Migrating existing data to new table...');
      
      const [migrateResult] = await connection.query(`
        INSERT INTO Employee_Job_Descriptions (employee_id, job_description, verified, verified_at)
        SELECT employee_id, job_description, 1, NOW()
        FROM Employees 
        WHERE job_description IS NOT NULL AND job_description != ''
      `);
      
      console.log(`✅ Migrated ${migrateResult.affectedRows} job descriptions`);
      
      console.log('🗑️  Dropping old job_description column from Employees...');
      await connection.query(`ALTER TABLE Employees DROP COLUMN job_description`);
      console.log('✅ Old column removed\n');
    } else {
      console.log('✓ No old column to migrate\n');
    }
    
    // Verify final state
    console.log('🔍 Verifying table structure...');
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM Employee_Job_Descriptions`
    );
    
    console.log('✅ Verification successful!');
    console.log('   Columns:', columns.map(c => c.Field).join(', '));
    
    const [count] = await connection.query(
      `SELECT COUNT(*) as total FROM Employee_Job_Descriptions`
    );
    console.log(`   Total records: ${count[0].total}`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createJobDescriptionsTable();

