/**
 * Migration Script: Add Job Description Field
 * Adds job_description field to Employees table
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function addJobDescriptionField() {
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
    
    // Check if column already exists
    console.log('🔍 Checking if job_description column exists...');
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM Employees WHERE Field = 'job_description'`
    );
    
    if (columns.length > 0) {
      console.log('⚠️  job_description column already exists!');
      console.log('   Skipping migration...\n');
      return;
    }
    
    console.log('📝 Adding job_description column to Employees table...');
    
    // Add the column
    await connection.query(`
      ALTER TABLE Employees 
      ADD COLUMN job_description TEXT NULL 
      COMMENT 'Functional job description (الوصف الوظيفي)' 
      AFTER job_title_id
    `);
    
    console.log('✅ Column added successfully!\n');
    
    // Verify the column was added
    console.log('🔍 Verifying column...');
    const [verify] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'Employees'
        AND COLUMN_NAME = 'job_description'
    `);
    
    if (verify.length > 0) {
      console.log('✅ Verification successful!');
      console.log('   Column Name:', verify[0].COLUMN_NAME);
      console.log('   Column Type:', verify[0].COLUMN_TYPE);
      console.log('   Nullable:', verify[0].IS_NULLABLE);
      console.log('   Comment:', verify[0].COLUMN_COMMENT);
    } else {
      console.error('❌ Verification failed - column not found!');
      process.exit(1);
    }
    
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

addJobDescriptionField();

