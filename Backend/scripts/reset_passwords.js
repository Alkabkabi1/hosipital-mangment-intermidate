// Resets passwords for all non-admin users to 'password123'
// Excludes users with role = 'admin' and users assigned the 'admin' role via user_roles/roles.

const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main() {
  // Load env from Backend/.env
  dotenv.config({ path: path.join(__dirname, '..', '.env') });

  const host = process.env.DB_HOST || '10.99.28.30';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hospital_management';

  const pool = await mysql.createPool({ host, user, password, database, waitForConnections: true });

  try {
    const newHash = await bcrypt.hash('password123', 12);

    const [result] = await pool.execute(
      `UPDATE App_Users u
       SET u.password_hash = ?
       WHERE (u.role IS NULL OR u.role <> 'admin')
         AND u.id NOT IN (
           SELECT ur.user_id
           FROM user_roles ur
           JOIN roles r ON r.role_id = ur.role_id
           WHERE r.role_name = 'admin'
         )`,
      [newHash]
    );

    console.log(`Updated ${result.affectedRows} user(s) to the new password`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error resetting passwords:', err);
  process.exit(1);
});

