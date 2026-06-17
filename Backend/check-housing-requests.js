// Check housing allowance requests in database
const mysql = require('mysql2/promise');
const path = require('path');

async function checkRequests() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kauh_db'
  };
  
  const conn = await mysql.createConnection(config);
  console.log('✅ Connected to database\n');
  
  // Check housing requests
  const [requests] = await conn.query(`
    SELECT 
      id, 
      reference_number,
      employee_name, 
      department, 
      status, 
      created_at,
      approval_stage,
      final_decision
    FROM Housing_Allowance_Requests 
    ORDER BY id DESC 
    LIMIT 5
  `);
  
  console.log('📋 Recent Housing Allowance Requests:\n');
  console.table(requests);
  
  // Check if they appear in the unified query
  console.log('\n🔍 Checking if they appear in admin/requests/recent query...\n');
  
  const [unified] = await conn.query(`
    SELECT id, 'housing_allowance' AS type, 
           COALESCE(reference_number, CONCAT('HA-', id)) AS reference_number,
           (SELECT email FROM App_Users WHERE id = Housing_Allowance_Requests.employee_id) AS employee_email,
           employee_name,
           department AS employee_dept,
           status,
           DATE(created_at) AS request_date,
           created_at
    FROM Housing_Allowance_Requests
    ORDER BY created_at DESC
    LIMIT 5
  `);
  
  console.log('📊 Housing requests in unified query:\n');
  console.table(unified);
  
  await conn.end();
  console.log('\n✅ Check complete');
}

checkRequests().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

