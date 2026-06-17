/**
 * Import All Employees Script
 * 
 * 1. First creates/updates 4 authorized employees (System Admin, HR Admin, HR Manager, HR Employee)
 * 2. Then reads Excel file "بيانات الموظفين (2).xlsx" and imports all employees with password "123456"
 */

const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Try to use xlsx library if available, otherwise throw error
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.error('❌ xlsx library not found. Please install it: npm install xlsx');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_management'
};

// Authorized employees data (from user's request)
// These users will be created/updated with password "123456" (bcrypt rounds 12)
const AUTHORIZED_USERS = [
  {
    id: 1,
    name: 'System Admin',
    email: 'admin@hospital.sa',
    username: 'admin',
    password: '123456', // Will be hashed with bcrypt rounds 12
    role: 'admin',
    employee_id: null,
    is_active: 1
  },
  {
    id: 3,
    name: 'HR Admin',
    email: 'hradmin@hospital.sa',
    username: 'hradmin',
    password: '123456', // Will be hashed with bcrypt rounds 12
    role: 'admin',
    employee_id: null,
    is_active: 1
  },
  {
    id: 4,
    name: 'HR Manager',
    email: 'hrmanager@hospital.sa',
    username: 'hrmanager',
    password: '123456', // Will be hashed with bcrypt rounds 12
    role: 'manager',
    employee_id: null,
    is_active: 1
  },
  {
    id: 5,
    name: 'HR Employee',
    email: 'hremployee@hospital.sa',
    username: 'hremployee',
    password: '123456', // Will be hashed with bcrypt rounds 12
    role: 'employee',
    employee_id: null,
    is_active: 1
  }
];

// Generate bcrypt hash for password "123456"
async function generatePasswordHash(password) {
  return await bcrypt.hash(password, 12);
}

// Create or update authorized users
async function createAuthorizedUsers(connection) {
  console.log('\n🔐 STEP 1: Creating/Updating Authorized Employees\n');
  
  const passwordHash = await generatePasswordHash('123456');
  console.log(`   Generated password hash for "123456": ${passwordHash.substring(0, 30)}...`);
  
  for (const user of AUTHORIZED_USERS) {
    try {
      // Check if user exists
      const [existing] = await connection.execute(
        'SELECT id FROM App_Users WHERE id = ? OR email = ?',
        [user.id, user.email]
      );
      
      // Extract role-based defaults for Excel columns
      const defaults = {
        nationality: 'سعودي',
        department_name: user.role === 'admin' ? 'تقنية المعلومات' : 'الموارد البشرية',
        job_title: user.role === 'admin' ? 'مدير نظام' : user.role === 'manager' ? 'مدير' : 'موظف',
        employment_type: 'permanent'
      };
      
      if (existing.length > 0) {
        // Update existing user with Excel columns
        await connection.execute(
          `UPDATE App_Users 
           SET name = ?, email = ?, username = ?, password_hash = ?, role = ?, is_active = ?,
           nationality = COALESCE(nationality, ?),
           department_name = COALESCE(department_name, ?),
           job_title = COALESCE(job_title, ?),
           employment_type = COALESCE(employment_type, ?),
           updated_at = NOW()
           WHERE id = ? OR email = ?`,
          [
            user.name, user.email, user.username, passwordHash, user.role, user.is_active,
            defaults.nationality, defaults.department_name, defaults.job_title, defaults.employment_type,
            user.id, user.email
          ]
        );
        console.log(`   ✅ Updated: ${user.name} (${user.email})`);
      } else {
        // Insert new user with Excel columns
        await connection.execute(
          `INSERT INTO App_Users (id, name, email, username, password_hash, role, employee_id, is_active,
           nationality, department_name, job_title, employment_type,
           created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            user.id, user.name, user.email, user.username, passwordHash, user.role, user.employee_id, user.is_active,
            defaults.nationality, defaults.department_name, defaults.job_title, defaults.employment_type
          ]
        );
        console.log(`   ✅ Created: ${user.name} (${user.email})`);
      }
    } catch (error) {
      console.error(`   ❌ Error with ${user.name}: ${error.message}`);
    }
  }
}

// Read Excel file
function readExcelFile(filePath) {
  console.log(`\n📊 STEP 2: Reading Excel file: ${filePath}\n`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
  
  console.log(`   Found ${rows.length} rows in sheet "${sheetName}"`);
  console.log(`   Columns: ${Object.keys(rows[0] || {}).join(', ')}`);
  
  return rows;
}

// Parse employee data from Excel row
function parseEmployeeRow(row, index) {
  // Expected columns based on Excel structure:
  // Column 0: Full Name (Arabic)
  // Column 1: National ID
  // Column 2: Employee Number
  // Column 3: Nationality
  // Column 4: Department
  // Column 5: Job Title
  // Column 6: Phone
  // Column 7: Email
  // Column 8: Job Type (1=Saudi/permanent, 2=Resident/contract, etc.)
  
  const getValue = (key) => {
    // Try different possible column names
    const possibleKeys = Object.keys(row).filter(k => 
      k.toLowerCase().includes(key.toLowerCase()) || 
      k.includes(key)
    );
    return possibleKeys.length > 0 ? (row[possibleKeys[0]] || '').toString().trim() : '';
  };
  
  // Also try by index as fallback
  const values = Object.values(row);
  const fullName = getValue('الاسم') || getValue('name') || getValue('full_name') || (values[0] && values[0].toString().trim()) || '';
  const nationalId = getValue('الهوية') || getValue('national_id') || getValue('id') || (values[1] && values[1].toString().trim()) || '';
  const employeeNumber = getValue('الرقم') || getValue('employee_number') || getValue('number') || (values[2] && values[2].toString().trim()) || '';
  const nationality = getValue('الجنسية') || getValue('nationality') || (values[3] && values[3].toString().trim()) || 'سعودي';
  const department = getValue('القسم') || getValue('department') || (values[4] && values[4].toString().trim()) || '';
  const jobTitle = getValue('المسمى') || getValue('job_title') || getValue('position') || (values[5] && values[5].toString().trim()) || '';
  const phone = getValue('الهاتف') || getValue('phone') || getValue('mobile') || (values[6] && values[6].toString().trim()) || '';
  const email = getValue('البريد') || getValue('email') || (values[7] && values[7].toString().trim()) || '';
  const jobType = getValue('النوع') || getValue('type') || (values[8] && values[8].toString().trim()) || '';
  
  // Split Arabic name into components
  const nameParts = fullName.split(' ').filter(p => p.trim());
  const first_name_ar = nameParts[0] || '';
  const second_name_ar = nameParts[1] || '';
  const third_name_ar = nameParts[2] || '';
  const family_name_ar = nameParts.slice(3).join(' ') || '';
  
  // Determine gender from name or job title
  const gender = guessGender(fullName, jobTitle);
  
  // Map contract type
  const contractType = mapContractType(jobType);
  const identityType = mapIdentityType(jobType);
  
  return {
    employee_number: employeeNumber || `EMP${String(index + 1).padStart(4, '0')}`,
    full_name_ar: fullName,
    first_name_ar,
    second_name_ar,
    third_name_ar,
    family_name_ar,
    national_id: nationalId,
    identity_type: identityType,
    nationality: nationality || 'سعودي',
    gender,
    email_work: email.toLowerCase(),
    phone_primary: phone,
    department_name: department,
    job_title_name: jobTitle,
    contract_type: contractType
  };
}

function guessGender(name, jobTitle) {
  const femaleHints = ['ة', 'ى', 'ممرضة', 'أخصائية', 'سكرتيرة', 'منسقة', 'مشرفة', 'كاتبة', 'عاملة', 'فنية', 'محاسبة', 'مدخلة', 'قابلة'];
  const maleHints = ['ممرض', 'أخصائي', 'سكرتير', 'منسق', 'مشرف', 'كاتب', 'عامل', 'فني', 'محاسب', 'مدير', 'سائق'];
  
  const text = (name + ' ' + jobTitle).toLowerCase();
  if (femaleHints.some(h => text.includes(h))) return 'female';
  if (maleHints.some(h => text.includes(h))) return 'male';
  return null; // Unknown
}

function mapContractType(jobType) {
  if (!jobType) return 'permanent';
  
  // Handle numeric codes from Excel (column I)
  const typeStr = jobType.toString().trim();
  
  // Numeric mapping (based on Excel data)
  if (typeStr === '1') return 'permanent'; // Saudi/permanent
  if (typeStr === '2') return 'contract'; // Resident/contract
  if (typeStr === '3') return 'part_time'; // Part-time
  if (typeStr === '4') return 'temporary'; // Temporary
  
  // Text-based mapping (fallback)
  const typeLower = typeStr.toLowerCase();
  if (typeLower.includes('عقد') || typeLower.includes('مؤقت') || typeLower.includes('contract')) return 'contract';
  if (typeLower.includes('جزئي') || typeLower.includes('part')) return 'part_time';
  if (typeLower.includes('دائم') || typeLower.includes('permanent')) return 'permanent';
  
  return 'permanent';
}

function mapIdentityType(jobType) {
  if (!jobType) return 'national_id';
  
  // Handle numeric codes from Excel
  const typeStr = jobType.toString().trim();
  
  // Numeric mapping: 1 = Saudi (national_id), 2 = Resident (residence_id)
  if (typeStr === '1') return 'national_id';
  if (typeStr === '2') return 'residence_id';
  
  // Text-based mapping (fallback)
  const typeLower = typeStr.toLowerCase();
  if (typeLower.includes('مقيم') || typeLower.includes('residence')) return 'residence_id';
  
  return 'national_id';
}

// Ensure department exists and return ID
async function ensureDepartment(connection, departmentName) {
  if (!departmentName) return null;
  
  // Try to find existing department
  const [depts] = await connection.execute(
    'SELECT department_id FROM Departments WHERE name_ar = ? OR name_en = ? LIMIT 1',
    [departmentName, departmentName]
  );
  
  if (depts.length > 0) {
    return depts[0].department_id;
  }
  
  // Create new department if doesn't exist
  const [result] = await connection.execute(
    'INSERT INTO Departments (name_ar, name_en, is_active, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
    [departmentName, departmentName]
  );
  
  return result.insertId;
}

// Ensure job title exists and return ID
async function ensureJobTitle(connection, jobTitleName) {
  if (!jobTitleName) return null;
  
  // Try to find existing job title
  const [titles] = await connection.execute(
    'SELECT job_title_id FROM Job_Titles WHERE title_ar = ? OR title_en = ? LIMIT 1',
    [jobTitleName, jobTitleName]
  );
  
  if (titles.length > 0) {
    return titles[0].job_title_id;
  }
  
  // Create new job title if doesn't exist
  // Generate shorter title code (max 20 chars)
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  const titleCode = `JT${timestamp}${random}`.substring(0, 20);
  
  const [result] = await connection.execute(
    'INSERT INTO Job_Titles (title_code, title_ar, title_en, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
    [titleCode, jobTitleName, jobTitleName]
  );
  
  return result.insertId;
}

// Import employees from Excel
async function importEmployees(connection, rows) {
  console.log(`\n👥 STEP 3: Importing ${rows.length} Employees\n`);
  
  const passwordHash = await generatePasswordHash('123456');
  let created = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      const empData = parseEmployeeRow(row, i);
      
      // Skip if no name or employee number
      if (!empData.full_name_ar && !empData.first_name_ar) {
        skipped++;
        continue;
      }
      
      // Ensure department and job title exist
      const departmentId = await ensureDepartment(connection, empData.department_name);
      const jobTitleId = await ensureJobTitle(connection, empData.job_title_name);
      
      // Check if employee already exists
      const [existing] = await connection.execute(
        'SELECT employee_id FROM Employees WHERE employee_number = ? OR national_id = ?',
        [empData.employee_number, empData.national_id]
      );
      
      let employeeId;
      if (existing.length > 0) {
        // Update existing employee
        employeeId = existing[0].employee_id;
        await connection.execute(
          `UPDATE Employees SET
           full_name_ar = ?, first_name_ar = ?, second_name_ar = ?, third_name_ar = ?, family_name_ar = ?,
           national_id = ?, identity_type = ?, nationality = ?, gender = ?,
           email_work = ?, phone_primary = ?, department_id = ?, job_title = ?, job_title_id = ?,
           updated_at = NOW()
           WHERE employee_id = ?`,
          [
            empData.full_name_ar, empData.first_name_ar, empData.second_name_ar, empData.third_name_ar, empData.family_name_ar,
            empData.national_id || null, empData.identity_type, empData.nationality, empData.gender || null,
            empData.email_work || null, empData.phone_primary || null, departmentId, empData.job_title_name, jobTitleId,
            employeeId
          ]
        );
        updated++;
      } else {
        // Insert new employee
        const [result] = await connection.execute(
          `INSERT INTO Employees (
           employee_number, full_name_ar, first_name_ar, second_name_ar, third_name_ar, family_name_ar,
           national_id, identity_type, nationality, gender,
           email_work, phone_primary, department_id, job_title, job_title_id,
           employment_status, contract_type, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
          [
            empData.employee_number, empData.full_name_ar, empData.first_name_ar, empData.second_name_ar, empData.third_name_ar, empData.family_name_ar,
            empData.national_id || null, empData.identity_type, empData.nationality, empData.gender || null,
            empData.email_work || null, empData.phone_primary || null, departmentId, empData.job_title_name, jobTitleId,
            empData.contract_type
          ]
        );
        employeeId = result.insertId;
        created++;
      }
      
      // Create or update App_Users account if email exists
      if (empData.email_work) {
        const [existingUser] = await connection.execute(
          'SELECT id FROM App_Users WHERE email = ?',
          [empData.email_work]
        );
        
        if (existingUser.length === 0) {
          await connection.execute(
            `INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active, 
             national_id, employee_number, nationality, department_name, job_title, phone, employment_type,
             created_at, updated_at)
             VALUES (?, ?, ?, 'employee', ?, 1, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              empData.full_name_ar || empData.first_name_ar, 
              empData.email_work, 
              passwordHash, 
              employeeId,
              empData.national_id || null,
              empData.employee_number || null,
              empData.nationality || null,
              empData.department_name || null,
              empData.job_title_name || null,
              empData.phone_primary || null,
              empData.contract_type || null
            ]
          );
        } else {
          // Update existing user with all Excel data
          await connection.execute(
            `UPDATE App_Users SET 
             password_hash = ?, 
             employee_id = ?, 
             national_id = ?,
             employee_number = ?,
             nationality = ?,
             department_name = ?,
             job_title = ?,
             phone = ?,
             employment_type = ?,
             updated_at = NOW() 
             WHERE email = ?`,
            [
              passwordHash, 
              employeeId, 
              empData.national_id || null,
              empData.employee_number || null,
              empData.nationality || null,
              empData.department_name || null,
              empData.job_title_name || null,
              empData.phone_primary || null,
              empData.contract_type || null,
              empData.email_work
            ]
          );
        }
      }
      
      if ((created + updated) % 50 === 0) {
        console.log(`   ... Processed ${created + updated} employees`);
      }
      
    } catch (error) {
      console.error(`   ❌ Row ${i + 1}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Created: ${created} employees`);
  console.log(`   🔄 Updated: ${updated} employees`);
  console.log(`   ⏭️  Skipped: ${skipped} employees`);
  console.log(`   ❌ Failed: ${failed} employees`);
  console.log(`   🔐 All accounts have password: 123456`);
}

// Main function
async function main() {
  let connection;
  
  try {
    console.log('🚀 Starting Employee Import Process\n');
    console.log(`📡 Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    
    // Step 1: Create authorized users
    await createAuthorizedUsers(connection);
    
    // Step 2: Read Excel file
    const excelPath = path.resolve(__dirname, '../../بيانات الموظفين (2).xlsx');
    const rows = readExcelFile(excelPath);
    
    // Step 3: Import employees
    await importEmployees(connection, rows);
    
    // Commit transaction
    await connection.commit();
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) {
      await connection.rollback();
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
main().catch(console.error);

