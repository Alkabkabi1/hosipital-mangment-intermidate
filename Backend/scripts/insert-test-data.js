/**
 * Insert Comprehensive Test Data
 * Creates HR users, managers, employees, and sample requests with approvals
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function insertTestData() {
  console.log('\n🚀 Starting Test Data Insertion...\n');

  // Database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nora_database',
    multipleStatements: true
  });

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../../insert-test-data.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    console.log('📄 Executing SQL script...\n');

    // Execute the SQL
    const [results] = await connection.query(sqlContent);

    console.log('\n✅ SQL Script Executed Successfully!\n');

    // Display summary results
    if (Array.isArray(results)) {
      for (const result of results) {
        if (Array.isArray(result) && result.length > 0) {
          console.log('📊', result[0]);
        }
      }
    }

    console.log('\n✅ Test Data Insertion Complete!');
    console.log('\n📧 HR User Emails:');
    console.log('   - ahmed.hr@hospital.sa');
    console.log('   - sara.hr@hospital.sa');
    console.log('   - fatima.hr@hospital.sa');
    console.log('\n📧 Manager Emails:');
    console.log('   - khaled.manager@hospital.sa');
    console.log('   - noura.manager@hospital.sa');
    console.log('   - mohammed.manager@hospital.sa');
    console.log('   - reem.manager@hospital.sa');
    console.log('\n📧 Employee Emails:');
    console.log('   - abdulrahman.emp@hospital.sa');
    console.log('   - mona.emp@hospital.sa');
    console.log('   - salman.emp@hospital.sa');
    console.log('   - lina.emp@hospital.sa');
    console.log('   - tariq.emp@hospital.sa');
    console.log('\n💡 Note: Use password reset script to set passwords for these users\n');

  } catch (error) {
    console.error('❌ Error inserting test data:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
}

insertTestData();

