#!/usr/bin/env node
/**
 * Migration Script: Employee Forms Tables
 * 
 * This script creates the 6 new employee forms tables:
 * - Contractor_Housing_Requests
 * - Guarantee_Detailed_Requests
 * - Guarantee_Fine_Requests
 * - Guarantee_Public_Law_Requests
 * - Saudi_Ticket_Compensation_Requests
 * - Ticket_Compensation_Requests
 */

import * as fs from 'fs';
import * as path from 'path';
import { dbPool } from '../src/core/database';

async function runMigration() {
  console.log('🚀 Starting Employee Forms Migration...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/create-employee-forms-tables.sql');
    console.log(`📂 Reading SQL file: ${sqlFilePath}`);
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Split by semicolons to get individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Get a connection from the pool
    const connection = await dbPool.getConnection();
    
    try {
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
        } catch (error: any) {
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

    } finally {
      connection.release();
    }

    // Close the pool
    await dbPool.end();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Migration Failed!');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    
    await dbPool.end();
    process.exit(1);
  }
}

// Run the migration
runMigration();

