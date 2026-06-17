const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function cleanupStuckRequests() {
  console.log('🧹 Starting cleanup of stuck requests...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    console.log('📊 Checking current requests in database...');
    
    // Check current clearance requests
    const [clearanceRows] = await connection.query('SELECT id, reference_number, status, employee_name FROM Clearance_Requests ORDER BY created_at DESC');
    console.log('📋 Current Clearance Requests:', clearanceRows.length);
    clearanceRows.forEach(row => {
      console.log(`  - ID: ${row.id}, Ref: ${row.reference_number}, Status: ${row.status}, Employee: ${row.employee_name}`);
    });

    // Check current onboarding requests  
    const [onboardingRows] = await connection.query('SELECT id, reference_number, status, employee_name FROM Onboarding_Requests ORDER BY created_at DESC');
    console.log('📋 Current Onboarding Requests:', onboardingRows.length);
    onboardingRows.forEach(row => {
      console.log(`  - ID: ${row.id}, Ref: ${row.reference_number}, Status: ${row.status}, Employee: ${row.employee_name}`);
    });

    // Update all pending requests to approved status
    console.log('\n🔄 Updating all pending requests to approved...');
    
    const [clearanceUpdate] = await connection.query(`
      UPDATE Clearance_Requests 
      SET status = 'مكتمل', updated_at = NOW() 
      WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
    `);
    console.log(`✅ Updated ${clearanceUpdate.affectedRows} clearance requests`);

    const [onboardingUpdate] = await connection.query(`
      UPDATE Onboarding_Requests 
      SET status = 'مكتمل', updated_at = NOW() 
      WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
    `);
    console.log(`✅ Updated ${onboardingUpdate.affectedRows} onboarding requests`);

    // Verify the updates
    console.log('\n📊 Checking requests after update...');
    const [pendingCheck] = await connection.query(`
      SELECT 
        'clearance' as type, COUNT(*) as count 
      FROM Clearance_Requests 
      WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
      UNION ALL
      SELECT 
        'onboarding' as type, COUNT(*) as count 
      FROM Onboarding_Requests 
      WHERE status IN ('قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة')
    `);
    
    console.log('📋 Remaining pending requests:');
    pendingCheck.forEach(row => {
      console.log(`  - ${row.type}: ${row.count} pending`);
    });

    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await connection.end();
  }
}

cleanupStuckRequests();
