// Make exactly one admin: the given email. Others become employees.
// Usage: node scripts/set_admin_only.js admin@moh.gov.sa

const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function getOrCreateRoleId(conn, roleNameUpper) {
  const [rows] = await conn.execute('SELECT role_id FROM roles WHERE UPPER(role_name) = ?', [roleNameUpper]);
  if (rows.length) return rows[0].role_id;
  const [res] = await conn.execute('INSERT INTO roles (role_name, role_name_ar, is_active) VALUES (?, ?, 1)', [roleNameUpper, roleNameUpper]);
  return res.insertId;
}

async function main() {
  const targetEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@moh.gov.sa').trim();

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hospital_management_unified';

  const conn = await mysql.createConnection({ host, user, password, database, multipleStatements: true });
  try {
    await conn.beginTransaction();

    const adminRoleId = await getOrCreateRoleId(conn, 'ADMIN');
    const employeeRoleId = await getOrCreateRoleId(conn, 'EMPLOYEE');

    // Find target admin user
    let [rows] = await conn.execute('SELECT id, email, role FROM App_Users WHERE email = ? LIMIT 1', [targetEmail]);
    let adminUserId;
    if (rows.length) {
      adminUserId = rows[0].id;
    } else {
      // Try to repoint existing admin to new email
      const [adminsByColumn] = await conn.execute("SELECT id FROM App_Users WHERE role = 'admin' ORDER BY id DESC LIMIT 1");
      const [adminsByMapping] = await conn.execute(
        'SELECT u.id FROM App_Users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.role_id=ur.role_id WHERE UPPER(r.role_name)=\'ADMIN\' LIMIT 1'
      );
      const candidate = adminsByColumn[0]?.id || adminsByMapping[0]?.id;
      if (candidate) {
        await conn.execute('UPDATE App_Users SET email = ? WHERE id = ?', [targetEmail, candidate]);
        adminUserId = candidate;
      } else {
        throw new Error(`No existing admin user found to set as ${targetEmail}`);
      }
    }

    // Update string role column
    await conn.execute("UPDATE App_Users SET role = 'employee' WHERE id <> ?", [adminUserId]);
    await conn.execute("UPDATE App_Users SET role = 'admin' WHERE id = ?", [adminUserId]);

    // Remove ADMIN role from others
    await conn.execute(
      'DELETE ur FROM user_roles ur JOIN roles r ON r.role_id=ur.role_id WHERE UPPER(r.role_name)=\'ADMIN\' AND ur.user_id <> ?',
      [adminUserId]
    );
    // Ensure ADMIN role for target
    const [hasAdmin] = await conn.execute('SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1', [adminUserId, adminRoleId]);
    if (!hasAdmin.length) {
      await conn.execute('INSERT INTO user_roles (user_id, role_id, is_active) VALUES (?, ?, 1)', [adminUserId, adminRoleId]);
    }

    // Optionally ensure EMPLOYEE mapping for others (best-effort)
    await conn.execute(
      'INSERT IGNORE INTO user_roles (user_id, role_id, is_active) SELECT id, ? , 1 FROM App_Users WHERE id <> ?',
      [employeeRoleId, adminUserId]
    );

    await conn.commit();
    console.log(`Admin set to ${targetEmail}. All other users are employees.`);
  } catch (err) {
    await conn.rollback();
    console.error('Failed to set admin:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();

