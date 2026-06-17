/**
 * Parse Excel file and generate SQL import script
 * Reads الجديد هاني.xlsx and creates comprehensive SQL for mass employee import
 * 
 * Usage: node Backend/scripts/parse-excel-to-sql.js
 */

const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'nora',
  password: process.env.DB_PASSWORD || 'nora123',
  database: process.env.DB_NAME || 'nora_datbase'
};

// Excel file path
const excelPath = path.resolve(__dirname, '../../الجديد هاني.xlsx');

// Output SQL file path
const outputPath = path.resolve(__dirname, '../migrations/import_all_employees_from_excel.sql');

// Helper: Sanitize string
function sanitize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Helper: Get value from row by column name (with multiple possible names)
function getValue(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return sanitize(row[name]);
    }
  }
  return '';
}

// Helper: Split Arabic name into components
function splitArabicName(fullName) {
  const parts = fullName.split(/\s+/).filter(p => p.trim());
  
  return {
    first_name_ar: parts[0] || '',
    second_name_ar: parts[1] || '',
    third_name_ar: parts[2] || '',
    family_name_ar: parts.slice(3).join(' ') || parts[parts.length - 1] || ''
  };
}

// Helper: Guess gender from name and job title
function guessGender(name, jobTitle) {
  const text = (name + ' ' + jobTitle).toLowerCase();
  
  // Female indicators
  const femaleHints = ['ة', 'ى', 'ممرضة', 'أخصائية', 'سكرتيرة', 'منسقة', 'مشرفة', 'كاتبة', 'عاملة', 'فنية', 'محاسبة', 'مدخلة', 'قابلة'];
  if (femaleHints.some(hint => text.includes(hint))) return 'female';
  
  // Male indicators
  const maleHints = ['ممرض', 'أخصائي', 'سكرتير', 'منسق', 'مشرف', 'كاتب', 'عامل', 'فني', 'محاسب', 'مدير', 'سائق'];
  if (maleHints.some(hint => text.includes(hint))) return 'male';
  
  return null;
}

// Helper: Map contract type from employment type code
function mapContractType(employmentType) {
  const type = sanitize(employmentType);
  if (type === '1') return 'permanent';
  if (type === '2') return 'contract';
  if (type === '3') return 'part_time';
  if (type === '4') return 'temporary';
  return 'permanent';
}

// Helper: Map identity type from employment type code
function mapIdentityType(employmentType) {
  const type = sanitize(employmentType);
  if (type === '1') return 'national_id';
  if (type === '2') return 'residence_id';
  return 'national_id';
}

// Helper: SQL escape string
function sqlEscape(str) {
  if (!str) return 'NULL';
  return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Helper: SQL escape for safe strings
function sqlValue(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  return sqlEscape(value);
}

// Main function
async function generateSQL() {
  console.log('🚀 Starting Employee Import SQL Generation\n');
  console.log('='.repeat(70));
  
  let connection;
  
  try {
    // Step 1: Read Excel file
    console.log('\n📊 STEP 1: Reading Excel file...');
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`);
    }
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`   ✅ Found ${rows.length} employee rows`);
    console.log(`   📋 Columns: ${Object.keys(rows[0] || {}).slice(0, 5).join(', ')}...`);
    
    // Step 2: Connect to database and get departments
    console.log('\n🔌 STEP 2: Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log(`   ✅ Connected to: ${dbConfig.database}`);
    
    // Get existing departments and their codes
    console.log('\n🏢 STEP 3: Loading existing departments...');
    const [departments] = await connection.execute(
      'SELECT department_id, department_code, name_ar, name_en FROM Departments'
    );
    console.log(`   ✅ Found ${departments.length} departments`);
    
    // Create department lookup map
    const deptMap = new Map();
    const existingCodes = new Set();
    departments.forEach(dept => {
      if (dept.name_ar) deptMap.set(dept.name_ar.trim(), dept.department_id);
      if (dept.name_en) deptMap.set(dept.name_en.trim(), dept.department_id);
      if (dept.department_code) existingCodes.add(dept.department_code);
    });
    
    // Find next available department code number
    let maxDeptNum = 0;
    existingCodes.forEach(code => {
      const match = code.match(/DEPT(\d+)/);
      if (match) {
        maxDeptNum = Math.max(maxDeptNum, parseInt(match[1], 10));
      }
    });
    let nextDeptNum = maxDeptNum + 1;
    console.log(`   📋 Next department code will start at: DEPT${String(nextDeptNum).padStart(4, '0')}`);
    
    // Step 3: Generate password hash
    console.log('\n🔐 STEP 4: Generating password hash for "123456"...');
    const passwordHash = await bcrypt.hash('123456', 12);
    console.log(`   ✅ Hash: ${passwordHash.substring(0, 30)}...`);
    
    // Step 4: Parse employee data
    console.log('\n👥 STEP 5: Parsing employee data...');
    const employees = [];
    const uniqueEmails = new Set();
    const newDepartments = new Set();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Extract data from Excel columns
      const fullName = getValue(row, ['إسم الموظف', 'اسم الموظف', 'name', 'full_name']);
      const nationalId = getValue(row, ['رقم هوية الموظف', 'رقم الهوية', 'national_id']);
      const employeeNumber = getValue(row, ['رقم الموظف', 'رقم التسجيل المهني', 'employee_number']) || `EMP${String(i + 1).padStart(6, '0')}`;
      const nationality = getValue(row, ['الجنسية', 'nationality']) || 'سعودي';
      const departmentName = getValue(row, ['القسم/الإدارة', 'القسم', 'department']);
      const jobTitle = getValue(row, ['المسمى الوظيفي', 'المسمى الوظيفى موارد', 'job_title']);
      const phone = getValue(row, ['رقم جوال الموظف', 'phone', 'mobile']).replace(/\D/g, '');
      const email = getValue(row, ['إيميل الموظف', 'email', 'email_work']).toLowerCase();
      const employmentType = getValue(row, ['نوع التوظيف', 'employment_type']);
      const position = getValue(row, ['المرتبة', 'position']);
      const gender = getValue(row, ['الجنس', 'gender']) || guessGender(fullName, jobTitle);
      
      // Skip rows without name
      if (!fullName) continue;
      
      // Split name
      const nameParts = splitArabicName(fullName);
      
      // Get or create department_id
      let departmentId = 'NULL';
      if (departmentName) {
        if (deptMap.has(departmentName)) {
          departmentId = deptMap.get(departmentName);
        } else {
          newDepartments.add(departmentName);
          departmentId = 'NULL';
        }
      }
      
      // Generate email if missing
      let finalEmail = email;
      if (!email || email === 'mobile' || email.includes('name@moh')) {
        finalEmail = `emp${employeeNumber.replace(/\D/g, '')}@hospital.sa`.toLowerCase();
      }
      
      // Check for duplicate emails
      if (uniqueEmails.has(finalEmail)) {
        finalEmail = `emp${employeeNumber.replace(/\D/g, '')}_${i}@hospital.sa`.toLowerCase();
      }
      uniqueEmails.add(finalEmail);
      
      const contractType = mapContractType(employmentType);
      const identityType = mapIdentityType(employmentType);
      
      employees.push({
        employeeNumber,
        nationalId,
        fullName,
        ...nameParts,
        departmentName,
        departmentId,
        jobTitle,
        position,
        phone,
        email: finalEmail,
        gender,
        nationality,
        contractType,
        identityType,
        employmentType
      });
    }
    
    console.log(`   ✅ Parsed ${employees.length} employees`);
    console.log(`   📧 Unique emails: ${uniqueEmails.size}`);
    console.log(`   🏢 New departments to create: ${newDepartments.size}`);
    
    // Step 5: Generate SQL
    console.log('\n📝 STEP 6: Generating SQL script...');
    
    let sql = `-- ============================================================================
-- EMPLOYEE MASS IMPORT SQL SCRIPT
-- ============================================================================
-- Generated: ${new Date().toISOString()}
-- Source: الجديد هاني.xlsx
-- Total Employees: ${employees.length}
-- Password (all accounts): 123456
-- Default Role: EMPLOYEE
-- ============================================================================

-- IMPORTANT: This script will import ALL employees from Excel
-- Make sure you have backed up your database before running this!

-- Password hash for "123456" (bcrypt rounds=12):
-- ${passwordHash}

SET FOREIGN_KEY_CHECKS = 0;
SET AUTOCOMMIT = 0;

START TRANSACTION;

-- ============================================================================
-- PART 1: Create missing departments
-- ============================================================================

`;

    // Add new departments
    if (newDepartments.size > 0) {
      sql += `-- Creating ${newDepartments.size} new departments\n\n`;
      for (const deptName of newDepartments) {
        const deptCode = `DEPT${String(nextDeptNum).padStart(4, '0')}`;
        sql += `INSERT INTO Departments (department_code, name_ar, name_en, is_active, created_at, updated_at)
VALUES (${sqlEscape(deptCode)}, ${sqlEscape(deptName)}, ${sqlEscape(deptName)}, 1, NOW(), NOW());\n\n`;
        nextDeptNum++;
      }
    }

    sql += `-- ============================================================================
-- PART 2: Insert employees into Employees table
-- ============================================================================

-- Inserting ${employees.length} employees in batches of 500

`;

    // Generate Employees INSERT statements (batch of 500)
    const batchSize = 500;
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      
      sql += `-- Batch ${Math.floor(i / batchSize) + 1} (rows ${i + 1} to ${Math.min(i + batchSize, employees.length)})\n`;
      sql += `INSERT INTO Employees (
  employee_number, full_name_ar, first_name_ar, second_name_ar, third_name_ar, family_name_ar,
  national_id, identity_type, nationality, gender,
  email_work, phone_primary, department_id, job_title, position,
  employment_status, contract_type, created_at, updated_at
) VALUES\n`;
      
      const values = batch.map((emp) => {
        const deptId = emp.departmentName && deptMap.has(emp.departmentName) 
          ? deptMap.get(emp.departmentName) 
          : `(SELECT department_id FROM Departments WHERE name_ar = ${sqlEscape(emp.departmentName)} LIMIT 1)`;
        
        return `  (${sqlValue(emp.employeeNumber)}, ${sqlValue(emp.fullName)}, ${sqlValue(emp.first_name_ar)}, ${sqlValue(emp.second_name_ar)}, ${sqlValue(emp.third_name_ar)}, ${sqlValue(emp.family_name_ar)}, ${sqlValue(emp.nationalId)}, ${sqlValue(emp.identityType)}, ${sqlValue(emp.nationality)}, ${sqlValue(emp.gender)}, ${sqlValue(emp.email)}, ${sqlValue(emp.phone)}, ${emp.departmentId === 'NULL' ? deptId : emp.departmentId}, ${sqlValue(emp.jobTitle)}, ${sqlValue(emp.position)}, 'active', ${sqlValue(emp.contractType)}, NOW(), NOW())`;
      }).join(',\n');
      
      sql += values + ';\n\n';
    }

    sql += `-- ============================================================================
-- PART 3: Insert users into App_Users table
-- ============================================================================

-- Creating login accounts for all ${employees.length} employees
-- All accounts will have password: 123456

`;

    // Generate App_Users INSERT statements (batch of 500)
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      
      sql += `-- Batch ${Math.floor(i / batchSize) + 1} (rows ${i + 1} to ${Math.min(i + batchSize, employees.length)})\n`;
      sql += `INSERT INTO App_Users (
  name, email, password_hash, role, employee_id, is_active,
  national_id, employee_number, nationality, department_name, job_title, phone, employment_type,
  created_at, updated_at
) VALUES\n`;
      
      const values = batch.map((emp) => {
        return `  (${sqlValue(emp.fullName)}, ${sqlValue(emp.email)}, ${sqlEscape(passwordHash)}, 'employee', (SELECT employee_id FROM Employees WHERE employee_number = ${sqlValue(emp.employeeNumber)} LIMIT 1), 1, ${sqlValue(emp.nationalId)}, ${sqlValue(emp.employeeNumber)}, ${sqlValue(emp.nationality)}, ${sqlValue(emp.departmentName)}, ${sqlValue(emp.jobTitle)}, ${sqlValue(emp.phone)}, ${sqlValue(emp.employmentType)}, NOW(), NOW())`;
      }).join(',\n');
      
      sql += values + ';\n\n';
    }

    sql += `-- ============================================================================
-- PART 4: Assign EMPLOYEE role to all users
-- ============================================================================

-- Assigning EMPLOYEE role to all ${employees.length} users

INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
SELECT 
  u.id,
  (SELECT role_id FROM roles WHERE role_name = 'EMPLOYEE' LIMIT 1),
  1,
  1,
  NOW()
FROM App_Users u
WHERE u.email IN (
${employees.map(emp => `  ${sqlValue(emp.email)}`).join(',\n')}
)
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id 
  AND ur.role_id = (SELECT role_id FROM roles WHERE role_name = 'EMPLOYEE' LIMIT 1)
);

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
SET AUTOCOMMIT = 1;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check employees count
SELECT COUNT(*) as total_employees FROM Employees;

-- Check App_Users count
SELECT COUNT(*) as total_users FROM App_Users;

-- Check role assignments
SELECT COUNT(*) as total_employee_roles 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.role_id
WHERE r.role_name = 'EMPLOYEE';

-- Sample verification
SELECT 
  e.employee_number,
  e.full_name_ar,
  e.email_work,
  u.email,
  GROUP_CONCAT(r.role_name) as roles
FROM Employees e
LEFT JOIN App_Users u ON e.employee_id = u.employee_id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
GROUP BY e.employee_id, e.employee_number, e.full_name_ar, e.email_work, u.email
LIMIT 10;

-- ============================================================================
-- IMPORT SUMMARY
-- ============================================================================

/*
SUMMARY:
- Total Employees Imported: ${employees.length}
- Total App_Users Created: ${employees.length}
- Total Role Assignments: ${employees.length}
- Default Password: 123456
- Default Role: EMPLOYEE

ALL EMPLOYEES CAN NOW LOGIN WITH:
- Email: (from Excel or generated emp{number}@hospital.sa)
- Password: 123456

Next steps:
1. Review this SQL file carefully
2. Execute in MySQL Workbench or command line
3. Verify using the queries above
4. Test login with sample employee accounts
*/

-- ============================================================================
-- END OF IMPORT SCRIPT
-- ============================================================================
`;

    // Write SQL file
    console.log('\n💾 STEP 7: Writing SQL file...');
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`   ✅ SQL file created: ${outputPath}`);
    console.log(`   📏 File size: ${(sql.length / 1024).toFixed(2)} KB`);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ SQL GENERATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Employees to import: ${employees.length}`);
    console.log(`   - App_Users to create: ${employees.length}`);
    console.log(`   - Role assignments: ${employees.length}`);
    console.log(`   - New departments: ${newDepartments.size}`);
    console.log(`   - Password for all: 123456`);
    console.log(`   - Default role: EMPLOYEE`);
    console.log('\n📁 Output file:');
    console.log(`   ${outputPath}`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Review the generated SQL file');
    console.log('   2. Execute in MySQL Workbench or command line');
    console.log('   3. Verify using the queries at the end of the file');
    console.log('   4. Test login with any employee email and password: 123456');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
generateSQL().catch(console.error);

