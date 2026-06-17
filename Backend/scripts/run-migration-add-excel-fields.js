/**
 * Run Migration: Add Excel Additional Fields
 * Executes the migration to add age, department_category, and staff_positioning columns
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
  console.log('\n📊 RUNNING MIGRATION: Add Excel Additional Fields\n');
  console.log('═'.repeat(70));

  // Connect to database
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL server\n');

  // Find database with Employees table
  const [databases] = await connection.query(`SHOW DATABASES`);
  let foundDb = null;
  
  for (const db of databases) {
    const dbNameCandidate = db.Database;
    if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbNameCandidate)) {
      continue;
    }
    
    try {
      await connection.query(`USE \`${dbNameCandidate}\``);
      const [tables] = await connection.query(`SHOW TABLES LIKE 'Employees'`);
      if (tables.length > 0) {
        foundDb = dbNameCandidate;
        break;
      }
    } catch (err) {
      continue;
    }
  }

  if (!foundDb) {
    console.error('❌ Could not find database with Employees table!');
    await connection.end();
    process.exit(1);
  }

  await connection.query(`USE \`${foundDb}\``);
  console.log(`✅ Using database: ${foundDb}\n`);

  // Read and execute migration
  const migrationPath = path.resolve(__dirname, '../migrations/add_excel_additional_fields.sql');
  console.log(`📁 Reading migration file: ${path.basename(migrationPath)}\n`);
  
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('⏳ Executing migration...\n');
    await connection.query(sql);
    console.log('✅ Migration executed successfully!\n');

    // Verify columns were added
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Employees'
        AND COLUMN_NAME IN ('age', 'department_category', 'staff_positioning')
      ORDER BY COLUMN_NAME
    `, [foundDb]);

    console.log('📋 Verified columns added:');
    columns.forEach(col => {
      console.log(`   ✅ ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.COLUMN_COMMENT || 'No comment'}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    if (error.sql) {
      console.error('Failed SQL:', error.sql.substring(0, 200) + '...');
    }
    throw error;
  } finally {
    await connection.end();
  }

  console.log('═'.repeat(70));
  console.log('✅ Migration completed successfully!\n');
}

// Run the migration
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

