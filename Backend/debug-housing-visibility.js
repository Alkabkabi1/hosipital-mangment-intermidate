// Debug why housing requests aren't showing in dashboards
const mysql = require('mysql2/promise');
const path = require('path');

async function debug() {
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
  
  // 1. Check the requests exist with correct status
  console.log('1️⃣ Check housing requests with Arabic status:');
  const [requests] = await conn.query(`
    SELECT id, employee_id, employee_name, department, status, created_at
    FROM Housing_Allowance_Requests
    ORDER BY id DESC
  `);
  console.table(requests);
  
  // 2. Check if they match the pending statuses
  console.log('\n2️⃣ Check against pending statuses filter:');
  const pendingStatuses = ['قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة'];
  const [pendingCheck] = await conn.query(`
    SELECT id, status, 
           CASE 
             WHEN status IN (${pendingStatuses.map(s => `'${s}'`).join(',')}) THEN 'MATCHES'
             ELSE 'NO MATCH'
           END as matches_filter
    FROM Housing_Allowance_Requests
  `);
  console.table(pendingCheck);
  
  // 3. Check if they appear in getRecentPendingRequests query
  console.log('\n3️⃣ Check in pending requests union query:');
  const escapedStatuses = pendingStatuses.map(s => `'${s}'`).join(',');
  const [unionQuery] = await conn.query(`
    SELECT id, 'housing_allowance' AS type, 
           COALESCE(reference_number, CONCAT('HA-', id)) AS reference_number,
           employee_name,
           department AS employee_dept,
           status
    FROM Housing_Allowance_Requests
    WHERE status IN (${escapedStatuses})
    ORDER BY created_at DESC
  `);
  console.table(unionQuery);
  
  // 4. Check Request_Approvals table
  console.log('\n4️⃣ Check Request_Approvals for housing_allowance:');
  const [approvals] = await conn.query(`
    SELECT approval_id, request_type, request_id, approver_id, 
           approval_order, status
    FROM Request_Approvals
    WHERE request_type = 'housing_allowance'
    ORDER BY request_id, approval_order
  `);
  console.table(approvals);
  
  // 5. Check what admin API would return
  console.log('\n5️⃣ Simulate /admin/requests/recent query:');
  const [adminQuery] = await conn.query(`
    SELECT id, 'housing_allowance' AS type, 
           COALESCE(reference_number, CONCAT('HA-', id)) AS reference_number,
           (SELECT email FROM App_Users WHERE id = Housing_Allowance_Requests.employee_id) AS employee_email,
           employee_name,
           department AS employee_dept,
           status,
           DATE(created_at) AS request_date,
           created_at
    FROM Housing_Allowance_Requests
    WHERE status IN (${escapedStatuses})
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.log(`Found ${adminQuery.length} housing requests in admin query:`);
  console.table(adminQuery);
  
  // 6. Check employee dashboard query  
  console.log('\n6️⃣ Simulate employee /housing-allowance/mine query:');
  const employeeId = requests[0]?.employee_id;
  if (employeeId) {
    const [empQuery] = await conn.query(`
      SELECT id, employee_name, department, status, created_at
      FROM Housing_Allowance_Requests
      WHERE employee_id = ?
      ORDER BY created_at DESC
    `, [employeeId]);
    console.log(`Found ${empQuery.length} requests for employee ${employeeId}:`);
    console.table(empQuery);
  }
  
  await conn.end();
  
  console.log('\n\n📊 SUMMARY:');
  console.log(`✅ Housing requests exist: ${requests.length}`);
  console.log(`✅ With correct Arabic status: ${pendingCheck.filter(r => r.matches_filter === 'MATCHES').length}`);
  console.log(`✅ Appear in union query: ${unionQuery.length}`);
  console.log(`✅ Have approval records: ${approvals.length > 0 ? 'YES' : 'NO'}`);
  console.log(`✅ Would show in admin API: ${adminQuery.length}`);
  console.log(`\n💡 If dashboards are empty, the issue is:`);
  console.log(`   1. Frontend not calling the API correctly`);
  console.log(`   2. Authentication token expired (refresh your browser)`);
  console.log(`   3. API response not being parsed correctly`);
}

debug().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

