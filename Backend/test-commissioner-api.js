// Test Commissioner API Endpoint
const mysql = require('mysql2/promise');

async function testAPI() {
  console.log('=== TESTING COMMISSIONER API ===\n');
  
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'nora',
    password: 'nora123',
    database: 'nora_database'
  });

  // Step 1: Check table exists
  const [tables] = await conn.query("SHOW TABLES LIKE 'Commissioner_Tickets'");
  console.log('1. Commissioner_Tickets table exists:', tables.length > 0);
  
  if (tables.length === 0) {
    console.log('❌ TABLE DOES NOT EXIST!');
    console.log('Run this SQL to create it:');
    console.log(`
CREATE TABLE Commissioner_Tickets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  issuer_user_id INT NOT NULL,
  subject_user_id INT NOT NULL,
  scopes_json LONGTEXT NOT NULL,
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_comm_subject_valid_to (subject_user_id, valid_to),
  FOREIGN KEY (issuer_user_id) REFERENCES App_Users(id),
  FOREIGN KEY (subject_user_id) REFERENCES App_Users(id)
);
    `);
    await conn.end();
    return;
  }

  // Step 2: Check all tickets
  const [allTickets] = await conn.execute('SELECT * FROM Commissioner_Tickets');
  console.log('\n2. Total tickets in table:', allTickets.length);
  
  if (allTickets.length > 0) {
    console.log('\nAll tickets:');
    allTickets.forEach(t => {
      console.log(`  Ticket #${t.id}:`);
      console.log(`    Issuer: ${t.issuer_user_id}`);
      console.log(`    Subject: ${t.subject_user_id}`);
      console.log(`    Scopes: ${t.scopes_json}`);
      console.log(`    Valid from: ${t.valid_from}`);
      console.log(`    Valid to: ${t.valid_to}`);
      console.log(`    Revoked: ${t.revoked_at || 'No'}`);
    });
  }

  // Step 3: Test the exact query used by API
  const userId = 5; // HR Employee
  console.log(`\n3. Testing API query for user ID ${userId}:`);
  console.log('   Query: SELECT * FROM Commissioner_Tickets');
  console.log('   WHERE subject_user_id = ? AND revoked_at IS NULL');
  console.log('   AND valid_from <= NOW() AND valid_to >= NOW()');
  console.log(`   Parameters: [${userId}]`);
  
  const [activeTickets] = await conn.execute(
    `SELECT * FROM Commissioner_Tickets
     WHERE subject_user_id = ? AND revoked_at IS NULL AND valid_from <= NOW() AND valid_to >= NOW()
     ORDER BY valid_to DESC`,
    [userId]
  );
  
  console.log('\n   Results:', activeTickets.length, 'tickets');
  
  if (activeTickets.length > 0) {
    console.log('   ✅ API should return these tickets:');
    activeTickets.forEach(t => {
      console.log(`      - Ticket #${t.id}: ${t.scopes_json}`);
    });
  } else {
    console.log('   ❌ No active tickets found for this user');
    console.log('\n   Possible reasons:');
    console.log('   - revoked_at is not NULL');
    console.log('   - valid_from is in the future');
    console.log('   - valid_to is in the past');
    console.log('   - wrong subject_user_id');
  }

  // Step 4: Check current timestamp
  const [time] = await conn.execute('SELECT NOW() as current_time');
  console.log('\n4. Server time:', time[0].current_time);

  await conn.end();
  console.log('\n=== TEST COMPLETE ===');
}

testAPI().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

