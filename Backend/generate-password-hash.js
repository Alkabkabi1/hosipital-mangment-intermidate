/**
 * Generate bcrypt hash for password "123456"
 * Run this to get the correct hash
 */

const bcrypt = require('bcrypt');

const password = '123456';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('\n✅ Password Hash Generated!\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n📋 SQL to update employees:\n');
  console.log(`UPDATE App_Users SET password_hash = '${hash}' WHERE email LIKE 'employee20%@hospital.sa';\n`);
});

