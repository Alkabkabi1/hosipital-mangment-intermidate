#!/usr/bin/env node
/**
 * JavaScript version of migration script (for direct execution)
 * Migration Script: Employee Forms Tables
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
// Load .env from project root (Backend/../.env)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  console.log('🚀 Starting Employee Forms Migration...\n');

  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db',
    multipleStatements: true
  });

  try {
    console.log('✅ Database connection established\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/create-employee-forms-tables.sql');
    console.log(`📂 Reading SQL file: ${sqlFilePath}\n`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }

    let sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Remove comments
    sqlContent = sqlContent
      // Remove single-line comments
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split by semicolons to get individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out empty or very short statements

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Extract table name for logging
      const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      const tableName = tableMatch ? tableMatch[1] : `Statement ${i + 1}`;
      
      try {
        console.log(`⏳ Creating table: ${tableName}...`);
        await connection.query(statement);
        console.log(`✅ Successfully created: ${tableName}\n`);
        successCount++;
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_DUPLICATE') {
          console.log(`⚠️  Table already exists: ${tableName} (skipping)\n`);
          skipCount++;
        } else {
          console.error(`❌ Error creating ${tableName}:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created: ${successCount} tables`);
    console.log(`⚠️  Already existed: ${skipCount} tables`);
    console.log(`📝 Total statements: ${statements.length}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Employee Forms Migration Completed Successfully!\n');

    // List the tables created
    console.log('📋 Tables Available:');
    console.log('   1. Contractor_Housing_Requests');
    console.log('   2. Guarantee_Detailed_Requests');
    console.log('   3. Guarantee_Fine_Requests');
    console.log('   4. Guarantee_Public_Law_Requests');
    console.log('   5. Saudi_Ticket_Compensation_Requests');
    console.log('   6. Ticket_Compensation_Requests');
    console.log('');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME LIKE '%_Requests'
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'hospital_db']);

    console.log('📊 All Request Tables in Database:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration Failed!');
    console.error('Error:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql.substring(0, 200) + '...');
    }
    process.exit(1);
  } finally {
    await connection.end();
    console.log('✅ Database connection closed\n');
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

