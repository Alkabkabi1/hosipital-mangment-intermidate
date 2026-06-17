/**
 * Verify Excel Columns Added to Database
 * Checks that age, department_category, and staff_positioning columns exist
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function verifyColumns() {
  console.log('\n✅ VERIFYING COLUMNS ADDED TO DATABASE\n');
  console.log('═'.repeat(70));

  // Connect to database
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    multipleStatements: true
  });

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

  // Check columns
  const [columns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT, COLUMN_DEFAULT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Employees'
      AND COLUMN_NAME IN ('age', 'department_category', 'staff_positioning')
    ORDER BY COLUMN_NAME
  `, [foundDb]);

  console.log('📋 Checking for required columns:\n');

  const requiredColumns = ['age', 'department_category', 'staff_positioning'];
  const foundColumns = columns.map(c => c.COLUMN_NAME);
  const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

  if (missingColumns.length > 0) {
    console.log('❌ Missing columns:');
    missingColumns.forEach(col => console.log(`   - ${col}`));
    console.log('\n⚠️  Please run the migration first!');
    await connection.end();
    process.exit(1);
  }

  // Display found columns
  columns.forEach(col => {
    console.log(`✅ ${col.COLUMN_NAME}`);
    console.log(`   Type: ${col.DATA_TYPE}`);
    console.log(`   Nullable: ${col.IS_NULLABLE}`);
    console.log(`   Comment: ${col.COLUMN_COMMENT || 'No comment'}`);
    console.log();
  });

  // Check indexes
  console.log('📊 Checking indexes:\n');
  const [indexes] = await connection.query(`
    SELECT INDEX_NAME, COLUMN_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Employees'
      AND INDEX_NAME IN ('idx_employees_department_category', 'idx_employees_staff_positioning')
    ORDER BY INDEX_NAME, SEQ_IN_INDEX
  `, [foundDb]);

  if (indexes.length > 0) {
    indexes.forEach(idx => {
      console.log(`✅ Index: ${idx.INDEX_NAME} on ${idx.COLUMN_NAME}`);
    });
  } else {
    console.log('⚠️  No indexes found (may need to run migration)');
  }
  console.log();

  await connection.end();

  console.log('═'.repeat(70));
  console.log('✅ ALL COLUMNS VERIFIED - Ready to import Excel data!\n');
  process.exit(0);
}

verifyColumns()
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

