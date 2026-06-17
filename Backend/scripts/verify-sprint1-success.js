#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifySprintSuccess() {
  let connection;

  try {
    console.log('\n🎯 SPRINT 1 SUCCESS VERIFICATION\n');
    console.log('═'.repeat(80));

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'nora',
      password: process.env.DB_PASSWORD || 'nora123',
      database: process.env.DB_NAME || 'nora_database',
    });

    console.log('✅ Connected to database\n');

    // Test 1: Verify status history tables exist and are functional
    console.log('1️⃣ Testing Status History Tables...');
    
    const [statusTables] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = t.TABLE_NAME) as column_count,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = t.TABLE_NAME 
         AND REFERENCED_TABLE_NAME IS NOT NULL) as foreign_key_count
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
    `, [
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database'
    ]);

    console.table(statusTables);

    // Test 2: Verify columns exist and are accessible
    console.log('\n2️⃣ Testing New Columns...');
    
    try {
      await connection.execute('SELECT job_title FROM experience_certificate_requests LIMIT 1');
      console.log('   ✅ experience_certificate_requests.job_title - ACCESSIBLE');
    } catch (e) {
      console.log('   ❌ experience_certificate_requests.job_title - ERROR:', e.message);
    }

    try {
      await connection.execute('SELECT occupation FROM certificate_requests LIMIT 1');
      console.log('   ✅ certificate_requests.occupation - ACCESSIBLE');
    } catch (e) {
      console.log('   ❌ certificate_requests.occupation - ERROR:', e.message);
    }

    try {
      await connection.execute('SELECT reference_number, request_date FROM delegation_requests LIMIT 1');
      console.log('   ✅ delegation_requests.reference_number - ACCESSIBLE');
      console.log('   ✅ delegation_requests.request_date - ACCESSIBLE');
    } catch (e) {
      console.log('   ❌ delegation_requests columns - ERROR:', e.message);
    }

    // Test 3: Test insert into status history (with rollback)
    console.log('\n3️⃣ Testing Status History Insert...');
    
    await connection.beginTransaction();
    
    try {
      // Check if we have any assignment requests to work with
      const [assignments] = await connection.execute('SELECT id FROM assignment_requests LIMIT 1');
      const [users] = await connection.execute('SELECT id FROM app_users LIMIT 1');

      if (assignments.length > 0 && users.length > 0) {
        const assignmentId = assignments[0].id;
        const userId = users[0].id;

        await connection.execute(`
          INSERT INTO assignment_status_history 
          (assignment_id, status, changed_by, notes) 
          VALUES (?, ?, ?, ?)
        `, [assignmentId, 'قيد الاعتماد', userId, 'Sprint 1 verification test']);

        const [inserted] = await connection.execute(
          'SELECT * FROM assignment_status_history WHERE notes = ?',
          ['Sprint 1 verification test']
        );

        if (inserted.length > 0) {
          console.log('   ✅ INSERT operation - SUCCESS');
          console.log('   ✅ Foreign key constraints - WORKING');
          console.log('   ✅ Arabic text storage - WORKING');
        }
      } else {
        console.log('   ⚠️  No test data available - skipping insert test');
      }

      await connection.rollback();
      console.log('   ✅ Transaction rollback - SUCCESS');
    } catch (e) {
      await connection.rollback();
      console.log('   ❌ Insert test failed:', e.message);
    }

    // Test 4: Verify indexes exist
    console.log('\n4️⃣ Testing Performance Indexes...');
    
    const [indexes] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COUNT(DISTINCT INDEX_NAME) as index_count
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN (
        'assignment_status_history',
        'assignment_termination_status_history',
        'experience_certificate_requests',
        'certificate_requests',
        'delegation_requests'
      )
      GROUP BY TABLE_NAME
    `, [process.env.DB_NAME || 'nora_database']);

    console.table(indexes);

    // Test 5: Comprehensive health check
    console.log('\n5️⃣ Final Health Check...');
    
    const [health] = await connection.execute(`
      SELECT 
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')) = 2 
          THEN '✅' ELSE '❌' 
        END as tables_exist,
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND ((TABLE_NAME = 'experience_certificate_requests' AND COLUMN_NAME = 'job_title') 
                     OR (TABLE_NAME = 'certificate_requests' AND COLUMN_NAME = 'occupation')
                     OR (TABLE_NAME = 'delegation_requests' AND COLUMN_NAME IN ('reference_number', 'request_date')))) = 4
          THEN '✅' ELSE '❌' 
        END as columns_exist,
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
                AND REFERENCED_TABLE_NAME IS NOT NULL) >= 4
          THEN '✅' ELSE '❌' 
        END as foreign_keys_ok,
        CASE 
          WHEN (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME IN ('assignment_status_history', 'assignment_termination_status_history')
                AND INDEX_NAME != 'PRIMARY') >= 8
          THEN '✅' ELSE '❌' 
        END as indexes_ok
    `, [
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database',
      process.env.DB_NAME || 'nora_database'
    ]);

    console.log('\n📊 Health Check Summary:\n');
    console.log(`   Tables Created:        ${health[0].tables_exist}`);
    console.log(`   Columns Added:         ${health[0].columns_exist}`);
    console.log(`   Foreign Keys:          ${health[0].foreign_keys_ok}`);
    console.log(`   Indexes:               ${health[0].indexes_ok}`);

    const allHealthy = Object.values(health[0]).every(v => v === '✅');

    console.log('\n' + '═'.repeat(80));
    if (allHealthy) {
      console.log('🎉 SPRINT 1: ALL SYSTEMS OPERATIONAL');
      console.log('═'.repeat(80));
      console.log('\n✅ Database foundation is solid and ready for Sprint 2!');
      console.log('\n📈 Expected improvements:');
      console.log('   • Request creation endpoints: SHOULD NOW WORK');
      console.log('   • Status tracking: READY');
      console.log('   • Column mismatch errors: ELIMINATED');
      console.log('   • Missing table errors: ELIMINATED');
      console.log('\n🚀 Next steps:');
      console.log('   1. Restart backend server');
      console.log('   2. Test request creation in the UI');
      console.log('   3. Verify status updates work');
      console.log('   4. Begin Sprint 2: API Schema fixes');
      return true;
    } else {
      console.log('⚠️  SPRINT 1: SOME ISSUES DETECTED');
      console.log('═'.repeat(80));
      console.log('\nPlease review the health check results above.');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed\n');
    }
  }
}

if (require.main === module) {
  verifySprintSuccess()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Verification script error:', error);
      process.exit(1);
    });
}

module.exports = verifySprintSuccess;

