// Ensure Employees table has a password_hash column and set it to bcrypt('password123') for all employees.

const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function columnExists(conn, dbName, table, column) {
  const [rows] = await conn.execute(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [dbName, table, column]
  );
  return rows.length > 0;
}

async function main() {
  const host = process.env.DB_HOST || '10.99.28.30';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hospital_management';

  const conn = await mysql.createConnection({ host, user, password, database });
  try {
    // Add password_hash column if missing
    const exists = await columnExists(conn, database, 'Employees', 'password_hash');
    if (!exists) {
      await conn.execute(`ALTER TABLE Employees ADD COLUMN password_hash VARCHAR(255) NULL AFTER email_work`);
      console.log('Added Employees.password_hash column');
    }

    const hash = await bcrypt.hash('password123', 12);
    const [result] = await conn.execute(`UPDATE Employees SET password_hash = ?`, [hash]);
    console.log(`Updated ${result.affectedRows} employee(s) password_hash.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Error resetting employee passwords:', err);
  process.exit(1);
});

