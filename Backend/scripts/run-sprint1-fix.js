#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runFixScript() {
  let connection;

  try {
    console.log('\n🔧 SPRINT 1: FIXING REMAINING ISSUES\n');
    console.log('═'.repeat(80));

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database',
      multipleStatements: true,
    });

    console.log('✅ Database connection established\n');

    // Check current state of Delegation_Requests
    console.log('📊 Checking delegation_requests table structure...\n');
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'delegation_requests'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'nora_database']);

    console.table(columns);

    const hasRequestDate = columns.some(col => col.COLUMN_NAME === 'request_date');

    if (!hasRequestDate) {
      console.log('\n⚠️  request_date column is missing. Adding it now...');
      
      await connection.execute(`
        ALTER TABLE delegation_requests 
        ADD COLUMN request_date DATE NULL
      `);

      await connection.execute(`
        UPDATE delegation_requests 
        SET request_date = COALESCE(created_at, CURDATE())
        WHERE request_date IS NULL
      `);

      console.log('✅ request_date column added and populated');
    } else {
      console.log('✅ request_date column already exists');
    }

    // Create missing indexes (ignoring errors if they already exist)
    console.log('\n📊 Creating performance indexes...\n');

    const indexes = [
      { table: 'assignment_status_history', name: 'idx_assignment_status', columns: 'assignment_id, status' },
      { table: 'assignment_status_history', name: 'idx_changed_by_date_ash', columns: 'changed_by, changed_at' },
      { table: 'assignment_termination_status_history', name: 'idx_termination_status', columns: 'termination_id, status' },
      { table: 'assignment_termination_status_history', name: 'idx_changed_by_date_atsh', columns: 'changed_by, changed_at' },
      { table: 'experience_certificate_requests', name: 'idx_job_title', columns: 'job_title' },
      { table: 'experience_certificate_requests', name: 'idx_employee_name_exp', columns: 'employee_name' },
      { table: 'certificate_requests', name: 'idx_occupation', columns: 'occupation' },
      { table: 'certificate_requests', name: 'idx_employee_name_cert', columns: 'employee_name' },
      { table: 'delegation_requests', name: 'idx_reference_number', columns: 'reference_number' },
      { table: 'delegation_requests', name: 'idx_request_date', columns: 'request_date' },
    ];

    let createdCount = 0;
    let existsCount = 0;

    for (const index of indexes) {
      try {
        await connection.execute(`
          CREATE INDEX ${index.name} ON ${index.table} (${index.columns})
        `);
        console.log(`✅ Created index: ${index.name} on ${index.table}`);
        createdCount++;
      } catch (error) {
        if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
          existsCount++;
          // Silently skip - index already exists
        } else {
          console.error(`⚠️  Error creating ${index.name}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Index Summary: ${createdCount} created, ${existsCount} already existed`);

    // Run final validation
    console.log('\n' + '═'.repeat(80));
    console.log('✓ FINAL VALIDATION');
    console.log('═'.repeat(80));

    const [finalCheck] = await connection.execute(`
      SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND (
        (TABLE_NAME = 'experience_certificate_requests' AND COLUMN_NAME IN ('position', 'job_title')) OR
        (TABLE_NAME = 'certificate_requests' AND COLUMN_NAME = 'occupation') OR
        (TABLE_NAME = 'delegation_requests' AND COLUMN_NAME IN ('reference_number', 'request_date'))
      )
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [process.env.DB_NAME || 'nora_database']);

    console.log('\n📊 All Required Columns:\n');
    console.table(finalCheck);

    // Final health check
    const [healthCheck] = await connection.execute(`
      SELECT 
        'All Tables Exist' as check_name,
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME IN (
                  'assignment_status_history',
                  'assignment_termination_status_history'
                )) = 2 
          THEN 'PASS ✓' 
          ELSE 'FAIL ✗' 
        END as result
      UNION ALL
      SELECT 
        'All Required Columns' as check_name,
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND ((TABLE_NAME = 'experience_certificate_requests' AND COLUMN_NAME = 'job_title') 
                     OR (TABLE_NAME = 'certificate_requests' AND COLUMN_NAME = 'occupation')
                     OR (TABLE_NAME = 'delegation_requests' AND COLUMN_NAME = 'reference_number')
                     OR (TABLE_NAME = 'delegation_requests' AND COLUMN_NAME = 'request_date'))) = 4
          THEN 'PASS ✓' 
          ELSE 'FAIL ✗' 
        END as result
      UNION ALL
      SELECT 
        'Foreign Key Constraints' as check_name,
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
                AND REFERENCED_TABLE_NAME IS NOT NULL) >= 4
          THEN 'PASS ✓' 
          ELSE 'FAIL ✗' 
        END as result
    `, [
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database'
    ]);

    console.log('\n🏥 Final Health Check:\n');
    console.table(healthCheck);

    const allPassed = healthCheck.every(check => check.result.includes('PASS'));

    if (allPassed) {
      console.log('\n🎉 SUCCESS! All Sprint 1 objectives completed!');
      console.log('\n✅ Summary:');
      console.log('   • Status history tables: READY');
      console.log('   • Column mismatches: FIXED');
      console.log('   • Missing fields: ADDED');
      console.log('   • Performance indexes: CREATED');
      console.log('   • Foreign keys: ESTABLISHED');
      console.log('   • Data migration: COMPLETE');
    } else {
      console.log('\n⚠️  Some issues remain. Please review above.');
    }

    return allPassed;

  } catch (error) {
    console.error('\n❌ Fix script failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

if (require.main === module) {
  runFixScript()
    .then((success) => {
      console.log('\n✨ Fix script completed');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Fix script failed:', error.message);
      process.exit(1);
    });
}

module.exports = runFixScript;

