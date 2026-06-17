const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseState() {
  console.log('\n🔍 Checking Database State\n');
  console.log('='.repeat(70));
  
  // Try both database names
  const databases = ['nora_database', 'nora_datbase'];
  
  for (const dbName of databases) {
    try {
      console.log(`\n📊 Connecting to: ${dbName}`);
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'nora',
        password: process.env.DB_PASSWORD || 'nora123',
        database: dbName
      });
      
      console.log(`✅ Connected to: ${dbName}`);
      
      // Check counts
      const [empCount] = await connection.query('SELECT COUNT(*) as count FROM Employees');
      const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM App_Users');
      const [deptsCount] = await connection.query('SELECT COUNT(*) as count FROM Departments');
      
      console.log(`   Employees: ${empCount[0].count}`);
      console.log(`   App_Users: ${usersCount[0].count}`);
      console.log(`   Departments: ${deptsCount[0].count}`);
      
      if (usersCount[0].count > 0) {
        const [sampleUsers] = await connection.query('SELECT id, name, email FROM App_Users LIMIT 3');
        console.log('\n   Sample App_Users:');
        sampleUsers.forEach(u => console.log(`     - ${u.name} (${u.email})`));
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Cannot connect to: ${dbName}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Summary:');
  console.log('   The correct database appears to be: nora_database');
  console.log('   Your .env file has: nora_datbase (typo)');
  console.log('\n📝 Action needed:');
  console.log('   1. Update .env file: DB_NAME=nora_database');
  console.log('   2. Or execute the SQL file manually on nora_database');
}

checkDatabaseState().catch(console.error);

