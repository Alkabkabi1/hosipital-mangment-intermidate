#!/usr/bin/env node
/**
 * Verify Employee Forms Tables
 * Shows the structure of the newly created tables
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function verifyTables() {
  console.log('🔍 Verifying Employee Forms Tables...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    const tables = [
      'contractor_housing_requests',
      'guarantee_detailed_requests',
      'guarantee_fine_requests',
      'guarantee_public_law_requests',
      'saudi_ticket_compensation_requests',
      'ticket_compensation_requests'
    ];

    for (const tableName of tables) {
      console.log(`\n📋 Table: ${tableName.toUpperCase()}`);
      console.log('='.repeat(60));
      
      // Get column information
      const [columns] = await connection.query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_KEY,
          COLUMN_DEFAULT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME, tableName]);

      console.log(`Columns: ${columns.length}`);
      columns.forEach((col, index) => {
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? ' (nullable)' : '';
        const defaultVal = col.COLUMN_DEFAULT ? ` = ${col.COLUMN_DEFAULT}` : '';
        console.log(`  ${index + 1}. ${col.COLUMN_NAME}: ${col.DATA_TYPE}${key}${nullable}${defaultVal}`);
      });

      // Get row count
      const [count] = await connection.query(`SELECT COUNT(*) as total FROM ${tableName}`);
      console.log(`\nCurrent Records: ${count[0].total}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All 6 Employee Forms Tables Verified Successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifyTables();

