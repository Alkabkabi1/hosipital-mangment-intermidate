// Direct API test for ticket creation
const http = require('http');

async function testCreateTicket() {
  console.log('=== TESTING TICKET CREATION API ===\n');
  
  // You need to replace this with actual admin token
  const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
  
  const postData = JSON.stringify({
    subjectUserId: 5,  // HR Employee
    scopes: ['clearance', 'onboarding'],
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  });

  const options = {
    hostname: 'localhost',
    port: 3037,
    path: '/api/commissioner/tickets',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length,
      'Authorization': `Bearer ${adminToken}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response headers:', res.headers);
        console.log('Response body:', data);
        
        try {
          const json = JSON.parse(data);
          console.log('\nParsed response:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.error('Failed to parse response:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      reject(e);
    });

    console.log('Sending POST request to:', options.path);
    console.log('Data:', postData);
    console.log('');

    req.write(postData);
    req.end();
  });
}

console.log('To test ticket creation:');
console.log('1. Login as admin in browser');
console.log('2. Open console and run: localStorage.getItem("authToken")');
console.log('3. Copy the token and replace YOUR_ADMIN_TOKEN_HERE in this script');
console.log('4. Run: node test-create-ticket.js');
console.log('');
console.log('OR simply try creating ticket through admin-commissioner.html');
console.log('and check the Network tab (F12) for any error responses.\n');

