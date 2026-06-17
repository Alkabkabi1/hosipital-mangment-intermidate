// Create App_Users accounts for employees who don't have them
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main() {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });

  const host = process.env.DB_HOST || '10.99.28.30';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hospital_management';

  const pool = await mysql.createPool({ host, user, password, database, waitForConnections: true });

  try {
    console.log('🔧 CREATING MISSING APP_USERS ACCOUNTS\n');

    // Find employees without App_Users accounts
    const [missingEmployees] = await pool.execute(`
      SELECT e.employee_id, e.employee_number, e.first_name, e.last_name, 
             e.full_name_ar, e.email_work, e.position
      FROM Employees e
      LEFT JOIN App_Users u ON e.email_work = u.email
      WHERE u.email IS NULL 
        AND e.email_work IS NOT NULL 
        AND e.email_work != ''
        AND e.email_work LIKE '%@%'
      ORDER BY e.employee_number
    `);

    console.log(`📊 Found ${missingEmployees.length} employees without App_Users accounts\n`);

    if (missingEmployees.length === 0) {
      console.log('✅ All employees already have App_Users accounts!');
      return;
    }

    // Generate password hash once
    const passwordHash = await bcrypt.hash('password123', 12);
    console.log('🔐 All new accounts will have password: password123\n');

    let created = 0;
    let failed = 0;

    // Create accounts in batches
    for (const emp of missingEmployees) {
      const name = emp.full_name_ar || `${emp.first_name} ${emp.last_name}` || 'Employee';
      
      try {
        await pool.execute(`
          INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
          VALUES (?, ?, ?, 'employee', ?, 1)
        `, [name, emp.email_work, passwordHash, emp.employee_id]);
        
        console.log(`✅ ${emp.employee_number}: ${emp.email_work} (${name})`);
        created++;
        
        // Add small delay to avoid overwhelming the database
        if (created % 100 === 0) {
          console.log(`   ... ${created} accounts created so far`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (err) {
        console.log(`❌ ${emp.employee_number}: ${emp.email_work} - ${err.message}`);
        failed++;
      }
    }

    console.log(`\n🎉 SUMMARY:`);
    console.log(`   ✅ Successfully created: ${created} accounts`);
    console.log(`   ❌ Failed: ${failed} accounts`);
    console.log(`   🔐 All accounts have password: password123`);
    
    if (created > 0) {
      console.log(`\n🧪 TEST LOGIN:`);
      console.log(`   Try: oamer@moh.gov.sa / password123`);
    }

  } finally {
    await pool.end();
  }
}

main().catch(console.error);
