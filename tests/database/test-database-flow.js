const mysql = require('mysql2/promise');

async function testDatabaseFlow() {
  console.log('🧪 Testing complete database flow...');
  
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'nora',
    password: 'nora123',
    database: 'hospital_management'
  });

  try {
    // Test 1: Insert a new onboarding request
    console.log('\n1. Testing request insertion...');
    const testRef = 'TEST-' + Date.now();
    const insertQuery = `
      INSERT INTO Onboarding_Requests 
      (reference_number, employee_email, employee_name, status, request_date) 
      VALUES ('${testRef}', 'test@example.com', 'Test User', 'قيد الاعتماد', NOW())
    `;
    
    const [insertResult] = await conn.query(insertQuery);
    console.log('✅ Insert successful! ID:', insertResult.insertId);
    
    // Test 2: Fetch the inserted request
    console.log('\n2. Testing request retrieval...');
    const selectQuery = `
      SELECT id, reference_number, employee_email, employee_name, status, created_at 
      FROM Onboarding_Requests 
      WHERE employee_email = 'test@example.com' 
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    const [selectResult] = await conn.query(selectQuery);
    console.log('✅ Fetch successful! Found:', selectResult.length, 'requests');
    console.log('Latest request:', selectResult[0]);
    
    // Test 3: Check total counts
    console.log('\n3. Testing count queries...');
    const [countResult] = await conn.query('SELECT COUNT(*) as count FROM Onboarding_Requests');
    console.log('✅ Total onboarding requests:', countResult[0].count);
    
    const [clearanceCount] = await conn.query('SELECT COUNT(*) as count FROM Clearance_Requests');
    console.log('✅ Total clearance requests:', clearanceCount[0].count);
    
    console.log('\n🎉 Database flow test SUCCESSFUL!');
    console.log('✅ Insertion works');
    console.log('✅ Retrieval works');
    console.log('✅ Counting works');
    
  } catch (error) {
    console.error('❌ Database flow test FAILED:', error.message);
  } finally {
    await conn.end();
  }
}

testDatabaseFlow();
