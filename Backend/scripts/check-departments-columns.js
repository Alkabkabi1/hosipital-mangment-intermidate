const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function checkColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_management',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('Departments table columns:');
    const [columns] = await connection.query('SHOW COLUMNS FROM Departments');
    columns.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });
    
  } finally {
    if (connection) await connection.end();
  }
}

checkColumns();

