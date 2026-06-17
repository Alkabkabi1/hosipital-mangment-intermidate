// Diagnose the gap between Employees and App_Users
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

async function main() {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hospital_management_unified';

  const pool = await mysql.createPool({ host, user, password, database, waitForConnections: true });

  try {
    console.log('🔍 DIAGNOSIS: Employee vs App_Users Gap Analysis\n');
    
    // 1. Count totals
    const [empCount] = await pool.execute('SELECT COUNT(*) as total FROM Employees WHERE email_work IS NOT NULL AND email_work != ""');
    const [userCount] = await pool.execute('SELECT COUNT(*) as total FROM App_Users');
    
    console.log(`📊 TOTALS:`);
    console.log(`   Employees with email: ${empCount[0].total}`);
    console.log(`   App_Users accounts: ${userCount[0].total}`);
    console.log(`   Gap: ${empCount[0].total - userCount[0].total}\n`);

    // 2. Check specific email
    const testEmail = 'oamer@moh.gov.sa';
    const [empExists] = await pool.execute('SELECT employee_id, full_name_ar FROM Employees WHERE email_work = ?', [testEmail]);
    const [userExists] = await pool.execute('SELECT id, name FROM App_Users WHERE email = ?', [testEmail]);
    
    console.log(`🎯 SPECIFIC CHECK: ${testEmail}`);
    console.log(`   In Employees: ${empExists.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   In App_Users: ${userExists.length > 0 ? '✅ YES' : '❌ NO'}`);
    if (empExists.length > 0) {
      console.log(`   Employee: ${empExists[0].full_name_ar} (ID: ${empExists[0].employee_id})`);
    }
    console.log('');

    // 3. Find first 10 employees without App_Users
    const [missingUsers] = await pool.execute(`
      SELECT e.employee_number, e.full_name_ar, e.email_work, e.position
      FROM Employees e
      LEFT JOIN App_Users u ON e.email_work = u.email
      WHERE u.email IS NULL 
        AND e.email_work IS NOT NULL 
        AND e.email_work != ''
      ORDER BY e.employee_number
      LIMIT 10
    `);

    console.log(`🔍 SAMPLE MISSING ACCOUNTS (first 10):`);
    if (missingUsers.length === 0) {
      console.log('   ✅ All employees have App_Users accounts!');
    } else {
      console.log('   Employee# | Name | Email | Position');
      console.log('   ---------|------|-------|----------');
      missingUsers.forEach(emp => {
        console.log(`   ${emp.employee_number} | ${emp.full_name_ar} | ${emp.email_work} | ${emp.position || 'N/A'}`);
      });
    }

    console.log(`\n📋 RECOMMENDATION:`);
    if (missingUsers.length > 0) {
      console.log('   ➡️  Run: node scripts/create_missing_users.js');
      console.log('   This will create App_Users accounts for employees without them.');
    } else {
      console.log('   ✅ All employees already have accounts. Check for other issues.');
    }

  } finally {
    await pool.end();
  }
}

main().catch(console.error);
