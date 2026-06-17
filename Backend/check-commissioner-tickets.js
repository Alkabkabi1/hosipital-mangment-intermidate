const mysql = require('mysql2/promise');

async function checkTickets() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'nora',
    password: 'nora123',
    database: 'nora_database'
  });

  console.log('=== CHECKING COMMISSIONER TICKETS ===\n');

  // Check users
  const [users] = await conn.execute(
    'SELECT id, email, name FROM App_Users WHERE email LIKE ? OR email LIKE ?',
    ['%hr%', '%employee%']
  );
  console.log('Users found:', users.length);
  users.forEach(u => console.log(`  - ID ${u.id}: ${u.name} (${u.email})`));
  console.log('');

  // Check all tickets
  const [allTickets] = await conn.execute(
    'SELECT * FROM Commissioner_Tickets ORDER BY created_at DESC'
  );
  console.log('Total tickets in database:', allTickets.length);
  
  if (allTickets.length > 0) {
    console.log('\nAll tickets:');
    allTickets.forEach(t => {
      console.log(`  - Ticket #${t.id}`);
      console.log(`    Issuer: User ID ${t.issuer_user_id}`);
      console.log(`    Subject: User ID ${t.subject_user_id}`);
      console.log(`    Scopes: ${t.scopes_json}`);
      console.log(`    Valid from: ${t.valid_from}`);
      console.log(`    Valid to: ${t.valid_to}`);
      console.log(`    Revoked: ${t.revoked_at || 'No'}`);
      console.log('');
    });
  } else {
    console.log('❌ NO TICKETS FOUND IN DATABASE!');
    console.log('\nTo create a ticket, use admin-commissioner.html:');
    console.log('1. Login as admin');
    console.log('2. Go to admin-commissioner.html');
    console.log('3. Select employee');
    console.log('4. Check scopes (clearance, onboarding, etc.)');
    console.log('5. Set validity period');
    console.log('6. Click "Issue Ticket"');
  }

  // Check active tickets for HR employee
  const hrEmployee = users.find(u => u.email.includes('hr'));
  if (hrEmployee) {
    console.log(`\nChecking active tickets for ${hrEmployee.name} (ID ${hrEmployee.id}):`);
    const [activeTickets] = await conn.execute(
      `SELECT * FROM Commissioner_Tickets
       WHERE subject_user_id = ? 
         AND revoked_at IS NULL 
         AND valid_from <= NOW() 
         AND valid_to >= NOW()`,
      [hrEmployee.id]
    );
    console.log('Active tickets:', activeTickets.length);
    if (activeTickets.length > 0) {
      activeTickets.forEach(t => {
        console.log(`  ✅ Ticket #${t.id}: scopes=${t.scopes_json}`);
      });
    } else {
      console.log('  ❌ No active tickets for this user');
      console.log(`  \nTroubleshooting:`);
      console.log(`  - Check if ticket was created for user ID ${hrEmployee.id}`);
      console.log(`  - Check if ticket is not revoked`);
      console.log(`  - Check if valid_from <= NOW() <= valid_to`);
    }
  }

  await conn.end();
  console.log('\n=== CHECK COMPLETE ===');
}

checkTickets().catch(console.error);

