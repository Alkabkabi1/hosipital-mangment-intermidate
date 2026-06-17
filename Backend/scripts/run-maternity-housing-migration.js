#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
  let connection;

  try {
    console.log('🚀 Starting Migration: Maternity Leave & Housing Allowance Forms...\n');
    console.log('═'.repeat(70));

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database',
      multipleStatements: true,
    });

    console.log('✅ Database connection established');
    console.log(`📊 Database: ${process.env.DB_NAME || 'nora_database'}\n`);

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_maternity_housing_requests.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', path.basename(migrationPath));
    console.log('📝 File size:', (fs.statSync(migrationPath).size / 1024).toFixed(2), 'KB');
    console.log('⏳ Executing migration...\n');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify table creation
    console.log('📊 Verifying tables were created...\n');

    const tables = [
      'Maternity_Leave_Requests',
      'Maternity_Leave_Status_History', 
      'Housing_Allowance_Requests',
      'Housing_Allowance_Status_History'
    ];

    for (const table of tables) {
      try {
        const [result] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          console.log(`✅ Table created: ${table}`);
          
          // Show column count
          const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
          console.log(`   └─ Columns: ${columns.length}`);
        } else {
          console.log(`❌ Table missing: ${table}`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }

    // Verify approval rules were added
    console.log('\n📋 Verifying approval rules...\n');
    
    const [rules] = await connection.execute(`
      SELECT request_type, role_name, approval_order, is_active 
      FROM Approval_Rules 
      WHERE request_type IN ('maternity_leave', 'housing_allowance')
      ORDER BY request_type, approval_order
    `);

    if (rules.length > 0) {
      console.log('✅ Approval rules created:');
      console.table(rules);
    } else {
      console.log('⚠️  No approval rules found - check Approval_Rules table exists');
    }

    // Verify enum updates
    console.log('\n🔧 Verifying enum updates...\n');
    
    try {
      const [requestApprovals] = await connection.execute(`SHOW COLUMNS FROM Request_Approvals LIKE 'request_type'`);
      if (requestApprovals.length > 0) {
        const enumValues = requestApprovals[0].Type;
        if (enumValues.includes('maternity_leave') && enumValues.includes('housing_allowance')) {
          console.log('✅ Request_Approvals enum updated successfully');
        } else {
          console.log('⚠️  Request_Approvals enum may not be fully updated');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not verify Request_Approvals enum:', error.message);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test the new forms in the employee dashboard');
    console.log('3. Submit test requests to verify the approval workflow');
    console.log('\n🔗 Access forms at:');
    console.log('   • Employee Dashboard → طلب جديد → 👶 طلب إجازة رعاية مولود');
    console.log('   • Employee Dashboard → طلب جديد → 🏠 بدل سكن أطباء سعوديين');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = runMigration;
