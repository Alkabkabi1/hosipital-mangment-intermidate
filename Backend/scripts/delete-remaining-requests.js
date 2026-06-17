const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function deleteRemainingRequests() {
  console.log('🗑️ Deleting remaining requests from database...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    // Check what's currently in the database
    console.log('📊 Checking current database content...');
    
    const [clearanceRows] = await connection.query('SELECT id, reference_number, status, employee_name FROM Clearance_Requests ORDER BY created_at DESC');
    const [onboardingRows] = await connection.query('SELECT id, reference_number, status, employee_name FROM Onboarding_Requests ORDER BY created_at DESC');
    const [delegationRows] = await connection.query('SELECT id, reference_number, status, from_email FROM Delegation_Requests ORDER BY created_at DESC');

    console.log('\n📋 Current Database Content:');
    console.log(`- Clearance Requests: ${clearanceRows.length}`);
    clearanceRows.forEach(row => console.log(`  ID: ${row.id}, Ref: ${row.reference_number}, Status: ${row.status}`));
    
    console.log(`- Onboarding Requests: ${onboardingRows.length}`);
    onboardingRows.forEach(row => console.log(`  ID: ${row.id}, Ref: ${row.reference_number}, Status: ${row.status}`));
    
    console.log(`- Delegation Requests: ${delegationRows.length}`);
    delegationRows.forEach(row => console.log(`  ID: ${row.id}, Ref: ${row.reference_number}, Status: ${row.status}`));

    // Delete ALL requests
    console.log('\n🗑️ Deleting all requests...');
    
    const [clearanceDelete] = await connection.query('DELETE FROM Clearance_Requests');
    console.log(`✅ Deleted ${clearanceDelete.affectedRows} clearance requests`);

    const [onboardingDelete] = await connection.query('DELETE FROM Onboarding_Requests');
    console.log(`✅ Deleted ${onboardingDelete.affectedRows} onboarding requests`);

    const [delegationDelete] = await connection.query('DELETE FROM Delegation_Requests');
    console.log(`✅ Deleted ${delegationDelete.affectedRows} delegation requests`);

    // Verify deletion
    const [finalCheck] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM Clearance_Requests) as clearance_count,
        (SELECT COUNT(*) FROM Onboarding_Requests) as onboarding_count,
        (SELECT COUNT(*) FROM Delegation_Requests) as delegation_count
    `);
    
    console.log('\n📊 Final Database Status:');
    console.log(`- Clearance Requests: ${finalCheck[0].clearance_count}`);
    console.log(`- Onboarding Requests: ${finalCheck[0].onboarding_count}`);
    console.log(`- Delegation Requests: ${finalCheck[0].delegation_count}`);

    console.log('\n🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Delete error:', error);
  } finally {
    await connection.end();
  }
}

deleteRemainingRequests();
