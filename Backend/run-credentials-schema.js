// Script to create Employee_Certificates and Employee_Licenses tables
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runSchema() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'nora',
    password: 'nora123',
    database: 'nora_database',
    multipleStatements: true
  });

  try {
    const sqlFile = fs.readFileSync(path.join(__dirname, '..', 'employee_credentials_schema.sql'), 'utf8');
    await connection.query(sqlFile);
    console.log('✅ Employee Certificates and Licenses tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runSchema().catch(console.error);

