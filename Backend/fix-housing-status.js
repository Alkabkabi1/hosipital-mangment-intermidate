// Fix housing allowance request statuses
const mysql = require('mysql2/promise');
const path = require('path');

async function fixStatuses() {
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
  
  // Update existing requests to use Arabic status
  console.log('🔧 Updating status from "submitted" to "قيد الاعتماد"...\n');
  
  const [result] = await conn.query(`
    UPDATE Housing_Allowance_Requests 
    SET status = 'قيد الاعتماد'
    WHERE status = 'submitted'
  `);
  
  console.log(`✅ Updated ${result.affectedRows} request(s)\n`);
  
  // Show updated requests
  const [requests] = await conn.query(`
    SELECT id, reference_number, employee_name, status, created_at
    FROM Housing_Allowance_Requests
    ORDER BY id DESC
    LIMIT 5
  `);
  
  console.log('📋 Updated requests:\n');
  console.table(requests);
  
  await conn.end();
  console.log('\n✅ Status fix complete!');
  console.log('\n📝 Now refresh your dashboards - the requests should appear!');
}

fixStatuses().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

