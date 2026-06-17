/**
 * Import Excel Data: الجديد هاني.xlsx
 * Imports employee data from the new Excel file into Employees and App_Users tables
 * 
 * Usage: node Backend/scripts/import-excel-new-data.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Try to use xlsx library
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.error('❌ xlsx library not found. Please install it: npm install xlsx');
  process.exit(1);
}

async function importExcelData() {
  console.log('\n📊 IMPORTING EXCEL DATA: الجديد هاني.xlsx\n');
  console.log('═'.repeat(70));

  // Step 1: Connect to database
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    multipleStatements: true
  });

  // Find database
  const [databases] = await connection.query(`SHOW DATABASES`);
  let foundDb = null;
  
  for (const db of databases) {
    const dbNameCandidate = db.Database;
    if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbNameCandidate)) {
      continue;
    }
    
    try {
      await connection.query(`USE \`${dbNameCandidate}\``);
      const [tables] = await connection.query(`SHOW TABLES LIKE 'Employees'`);
      if (tables.length > 0) {
        foundDb = dbNameCandidate;
        break;
      }
    } catch (err) {
      continue;
    }
  }

  if (!foundDb) {
    console.error('❌ Could not find database with Employees table!');
    await connection.end();
    process.exit(1);
  }

  await connection.query(`USE \`${foundDb}\``);
  console.log(`✅ Connected to database: ${foundDb}\n`);

  // Step 2: Read Excel file
  const excelPath = path.resolve(__dirname, '../../الجديد هاني.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Excel file not found: ${excelPath}`);
    await connection.end();
    process.exit(1);
  }

  console.log(`📁 Reading Excel file: ${path.basename(excelPath)}\n`);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read as JSON with headers
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
  
  console.log(`✅ Found ${rows.length} rows in sheet "${sheetName}"\n`);

  if (rows.length === 0) {
    console.log('⚠️  No data rows found in Excel file');
    await connection.end();
    return;
  }

  // Step 3: Helper functions
  function getValue(row, keys) {
    for (const key of keys) {
      const found = Object.keys(row).find(k => 
        k.includes(key) || k.toLowerCase().includes(key.toLowerCase())
      );
      if (found && row[found]) {
        return String(row[found]).trim();
      }
    }
    return '';
  }

  function splitArabicName(fullName) {
    const parts = fullName.split(' ').filter(p => p.trim());
    return {
      first_name_ar: parts[0] || '',
      second_name_ar: parts[1] || '',
      third_name_ar: parts[2] || '',
      family_name_ar: parts.slice(3).join(' ') || ''
    };
  }

  function guessGender(name, jobTitle) {
    const text = (name + ' ' + jobTitle).toLowerCase();
    const femaleHints = ['ة', 'أنثى', 'ممرضة', 'أخصائية', 'سكرتيرة'];
    const maleHints = ['ممرض', 'أخصائي', 'سكرتير'];
    if (femaleHints.some(h => text.includes(h))) return 'أنثى';
    if (maleHints.some(h => text.includes(h))) return 'ذكر';
    return null;
  }

  function parseHijriDate(hijriStr) {
    if (!hijriStr) return null;
    // Format: YYYY/MM/DD or YYYY-MM-DD
    const match = hijriStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (!match) return null;
    
    // Simple conversion: approximate by subtracting 579 years
    // For accurate conversion, use a proper Hijri-to-Gregorian library
    const hijriYear = parseInt(match[1]);
    const hijriMonth = parseInt(match[2]);
    const hijriDay = parseInt(match[3]);
    
    // Approximate conversion (Hijri is lunar, so this is rough)
    const gregorianYear = hijriYear + 579; // Approximate offset
    const gregorianMonth = hijriMonth;
    const gregorianDay = hijriDay;
    
    // Return as string in YYYY-MM-DD format (MySQL will parse it)
    try {
      const date = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  // Ensure department exists
  async function ensureDepartment(conn, deptName) {
    if (!deptName) return null;
    
    const [depts] = await conn.query(
      'SELECT department_id FROM Departments WHERE name_ar = ? OR name_en = ? LIMIT 1',
      [deptName, deptName]
    );
    
    if (depts.length > 0) {
      return depts[0].department_id;
    }
    
    // Generate department code
    const [maxCode] = await conn.query(
      'SELECT MAX(CAST(SUBSTRING(department_code, 4) AS UNSIGNED)) as max_num FROM Departments WHERE department_code LIKE "DEPT%"'
    );
    const nextNum = (maxCode[0]?.max_num || 0) + 1;
    const deptCode = `DEPT${String(nextNum).padStart(4, '0')}`;
    
    // Create new department
    const [result] = await conn.query(
      'INSERT INTO Departments (department_code, name_ar, name_en, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
      [deptCode, deptName, deptName]
    );
    
    return result.insertId;
  }

  // Ensure job title exists
  async function ensureJobTitle(conn, jobTitleName) {
    if (!jobTitleName) return null;
    
    const [titles] = await conn.query(
      'SELECT job_title_id FROM Job_Titles WHERE title_ar = ? OR title_en = ? LIMIT 1',
      [jobTitleName, jobTitleName]
    );
    
    if (titles.length > 0) {
      return titles[0].job_title_id;
    }
    
    // Generate job title code
    const [maxCode] = await conn.query(
      'SELECT MAX(CAST(SUBSTRING(title_code, 3) AS UNSIGNED)) as max_num FROM Job_Titles WHERE title_code LIKE "JT%"'
    );
    const nextNum = (maxCode[0]?.max_num || 0) + 1;
    const titleCode = `JT${String(nextNum).padStart(4, '0')}`;
    
    // Create new job title
    const [result] = await conn.query(
      'INSERT INTO Job_Titles (title_code, title_ar, title_en, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
      [titleCode, jobTitleName, jobTitleName]
    );
    
    return result.insertId;
  }

  // Step 4: Process rows
  console.log('⏳ Processing rows...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  await connection.beginTransaction();

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Extract data based on verified column mappings
        const employeeNumber = getValue(row, ['رقم الموظف', 'رقم التسجيل المهني', 'employee_number']) || `EMP${String(i + 1).padStart(6, '0')}`;
        const nationalId = getValue(row, ['رقم هوية الموظف', 'national_id', 'id']);
        const fullName = getValue(row, ['إسم الموظف', 'name', 'full_name']);
        const gender = getValue(row, ['الجنس', 'gender']) || guessGender(fullName, getValue(row, ['المسمى الوظيفي', 'job_title']));
        const nationality = getValue(row, ['الجنسية', 'nationality']) || 'سعودي';
        const ageStr = getValue(row, ['العمر', 'age']);
        const phone = getValue(row, ['رقم جوال الموظف', 'phone', 'mobile']).replace(/\D/g, '');
        const email = getValue(row, ['إيميل الموظف', 'email', 'email_work']).toLowerCase().trim();
        const hireDateHijri = getValue(row, ['تاريخ التعيين', 'hire_date']);
        const birthDateHijri = getValue(row, ['تاريخ الميلاد', 'birth_date']);
        const contractType = getValue(row, ['نوع التوظيف', 'contract_type', 'employment_type']);
        const jobLevel = getValue(row, ['المرتبة', 'position', 'job_level']);
        const jobTitle = getValue(row, ['المسمى الوظيفي', 'المسمى الوظيفى موارد', 'job_title']);
        const departmentCategory = getValue(row, ['المجموعة', 'department_category']);
        const staffPositioning = getValue(row, ['الملاك الوظيفي', 'staff_positioning']);
        const departmentName = getValue(row, ['القسم/الإدارة', 'department', 'department_name']);

        // Parse name
        const nameParts = splitArabicName(fullName);

        // Convert dates
        const hireDate = parseHijriDate(hireDateHijri);
        const birthDate = parseHijriDate(birthDateHijri);
        
        // Calculate age if birth_date exists
        let age = null;
        if (ageStr) {
          age = parseInt(ageStr);
        } else if (birthDate) {
          const birth = new Date(birthDate);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
        }

        // Get department and job title IDs
        const departmentId = await ensureDepartment(connection, departmentName);
        const jobTitleId = await ensureJobTitle(connection, jobTitle);

        // Map contract type
        let contractTypeMapped = 'permanent';
        if (contractType) {
          const ctLower = contractType.toLowerCase();
          if (ctLower.includes('تشغيل ذاتي') || ctLower.includes('contract')) contractTypeMapped = 'contract';
          else if (ctLower.includes('permanent') || ctLower.includes('دائم')) contractTypeMapped = 'permanent';
        }

        // Insert or update employee
        const [existing] = await connection.query(
          'SELECT employee_id FROM Employees WHERE employee_number = ? OR national_id = ?',
          [employeeNumber, nationalId]
        );

        let employeeId;
        if (existing.length > 0) {
          // Update existing
          await connection.query(`
            UPDATE Employees SET
              full_name_ar = ?, first_name_ar = ?, second_name_ar = ?, third_name_ar = ?, family_name_ar = ?,
              national_id = ?, gender = ?, nationality = ?, age = ?,
              phone_primary = ?, email_work = ?,
              birth_date = ?, hire_date = ?,
              department_id = ?, department_category = ?,
              job_title = ?, job_title_id = ?, position = ?, staff_positioning = ?,
              contract_type = ?, employment_status = 'active',
              updated_at = NOW()
            WHERE employee_id = ?
          `, [
            fullName, nameParts.first_name_ar, nameParts.second_name_ar, nameParts.third_name_ar, nameParts.family_name_ar,
            nationalId, gender, nationality, age,
            phone, email,
            birthDate, hireDate,
            departmentId, departmentCategory,
            jobTitle, jobTitleId, jobLevel, staffPositioning,
            contractTypeMapped,
            existing[0].employee_id
          ]);
          employeeId = existing[0].employee_id;
        } else {
          // Insert new
          const [result] = await connection.query(`
            INSERT INTO Employees (
              employee_number, full_name_ar, first_name_ar, second_name_ar, third_name_ar, family_name_ar,
              national_id, gender, nationality, age,
              phone_primary, email_work,
              birth_date, hire_date,
              department_id, department_category,
              job_title, job_title_id, position, staff_positioning,
              contract_type, employment_status,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
          `, [
            employeeNumber, fullName, nameParts.first_name_ar, nameParts.second_name_ar, nameParts.third_name_ar, nameParts.family_name_ar,
            nationalId, gender, nationality, age,
            phone, email,
            birthDate, hireDate,
            departmentId, departmentCategory,
            jobTitle, jobTitleId, jobLevel, staffPositioning,
            contractTypeMapped
          ]);
          employeeId = result.insertId;
        }

        // Create App_Users record if email exists
        if (email && email.includes('@')) {
          const passwordHash = await bcrypt.hash('123456', 12);
          
          const [existingUser] = await connection.query(
            'SELECT id FROM App_Users WHERE email = ?',
            [email]
          );

          if (existingUser.length > 0) {
            await connection.query(`
              UPDATE App_Users SET
                name = ?, employee_id = ?, national_id = ?, employee_number = ?,
                nationality = ?, department_name = ?, job_title = ?, phone = ?, employment_type = ?,
                updated_at = NOW()
              WHERE id = ?
            `, [
              fullName, employeeId, nationalId, employeeNumber,
              nationality, departmentName, jobTitle, phone, contractTypeMapped,
              existingUser[0].id
            ]);
          } else {
            await connection.query(`
              INSERT INTO App_Users (
                name, email, password_hash, role, employee_id, national_id, employee_number,
                nationality, department_name, job_title, phone, employment_type,
                is_active, created_at, updated_at
              ) VALUES (?, ?, ?, 'employee', ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            `, [
              fullName, email, passwordHash, employeeId, nationalId, employeeNumber,
              nationality, departmentName, jobTitle, phone, contractTypeMapped
            ]);
          }
        }

        successCount++;
        if ((i + 1) % 100 === 0) {
          console.log(`   Processed ${i + 1}/${rows.length} rows...`);
        }

      } catch (error) {
        errorCount++;
        errors.push({ row: i + 1, error: error.message });
        console.error(`   ⚠️  Error in row ${i + 1}: ${error.message}`);
      }
    }

    await connection.commit();
    console.log('\n✅ Transaction committed successfully\n');

  } catch (error) {
    await connection.rollback();
    throw error;
  }

  // Step 5: Summary
  console.log('═'.repeat(70));
  console.log('📊 IMPORT SUMMARY\n');
  console.log(`   Total rows processed: ${rows.length}`);
  console.log(`   ✅ Successfully imported: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\n   Error details:');
    errors.forEach(e => {
      console.log(`      Row ${e.row}: ${e.error}`);
    });
  } else if (errors.length > 10) {
    console.log(`\n   First 10 errors:`);
    errors.slice(0, 10).forEach(e => {
      console.log(`      Row ${e.row}: ${e.error}`);
    });
  }

  console.log('\n═'.repeat(70));
  console.log('✅ Import completed!\n');

  await connection.end();
}

// Run the import
importExcelData()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });

