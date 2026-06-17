#!/usr/bin/env node
/**
 * Run New Forms Migrations
 * Executes the 3 new request type migrations
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations() {
  console.log('🚀 Starting New Forms Migrations...\n');

  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('✅ Connected to database:', process.env.DB_NAME);

  const migrations = [
    '202501_add_travel_order_tables.sql',
    '202501_add_reward_refund_tables.sql',
    '202501_add_airlines_ticket_tables.sql'
  ];

  for (const migrationFile of migrations) {
    try {
      console.log(`\n📄 Running: ${migrationFile}`);
      
      const migrationPath = path.resolve(__dirname, '../migrations', migrationFile);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await connection.query(sql);
      
      console.log(`✅ Success: ${migrationFile}`);
    } catch (error) {
      console.error(`❌ Error in ${migrationFile}:`, error.message);
      console.error('Full error:', error);
      process.exit(1);
    }
  }

  console.log('\n🎉 All migrations completed successfully!');
  console.log('\n📊 Verifying tables...');

  // Verify tables were created
  const [tables] = await connection.query(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME IN (
      'NonSaudi_Travel_Order_Requests',
      'NonSaudi_Travel_Order_Status_History',
      'Reward_Refund_Requests',
      'Reward_Refund_Status_History',
      'Saudi_Airlines_Ticket_Requests',
      'Saudi_Airlines_Ticket_Status_History'
    )
    ORDER BY TABLE_NAME
  `, [process.env.DB_NAME]);

  console.log('\n✅ Created tables:');
  tables.forEach(row => {
    console.log(`   - ${row.TABLE_NAME}`);
  });

  if (tables.length === 6) {
    console.log('\n✅ All 6 tables created successfully!');
  } else {
    console.log(`\n⚠️  Warning: Expected 6 tables but found ${tables.length}`);
  }

  await connection.end();
  console.log('\n✅ Database connection closed');
  console.log('🚀 Ready to restart backend server!\n');
}

runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

