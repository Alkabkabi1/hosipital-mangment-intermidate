const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function checkTableStructure() {
  console.log('🔍 Checking database table structures...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'hospital_management',
    charset: 'utf8mb4'
  });

  try {
    const tables = ['Employees', 'App_Users', 'Clearance_Requests', 'Onboarding_Requests', 'Delegation_Requests', 'Request_Audit', 'Experience_Certificate_Requests'];
    
    for (const table of tables) {
      try {
        console.log(`\n📊 ${table} Table Structure:`);
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        columns.forEach(col => {
          console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
        });
        
        // Show sample data
        const [sampleData] = await connection.query(`SELECT * FROM ${table} LIMIT 3`);
        console.log(`📋 Sample Data (${sampleData.length} rows):`);
        if (sampleData.length > 0) {
          console.log('  First row keys:', Object.keys(sampleData[0]).join(', '));
        }
      } catch (error) {
        console.log(`❌ Table ${table} error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Structure check error:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure();
