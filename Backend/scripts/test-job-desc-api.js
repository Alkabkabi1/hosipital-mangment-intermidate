const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 3037}`;

async function testAPI() {
  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@hospital.com', 
        password: 'Admin@2024' 
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;
    console.log('✅ Logged in\n');
    
    // Test pending endpoint
    console.log('2. Testing GET /api/admin/job-descriptions/pending');
    const pendingResponse = await fetch(`${BASE_URL}/api/admin/job-descriptions/pending`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('   Status:', pendingResponse.status);
    const pendingData = await pendingResponse.json();
    console.log('   Response:', JSON.stringify(pendingData, null, 2));
    
    if (pendingData.data || pendingData.success) {
      const pending = pendingData.data || [];
      console.log(`   ✅ Found ${pending.length} pending job descriptions`);
      if (pending.length > 0) {
        console.log('   First record:', pending[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();

