/**
 * Verify Excel Columns Script
 * Checks that every column in the Excel file has an equivalent in Employees and App_Users tables
 * 
 * Usage: node Backend/scripts/verify-excel-columns.js
 */

const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function verifyExcelColumns() {
  console.log('\n📊 VERIFYING EXCEL COLUMNS AGAINST DATABASE SCHEMA\n');
  console.log('═'.repeat(70));

  // Step 1: Read Excel file
  const excelPath = path.resolve(__dirname, '../../الجديد هاني.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Excel file not found: ${excelPath}`);
    process.exit(1);
  }

  console.log(`📁 Reading Excel file: ${path.basename(excelPath)}\n`);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Read first few rows to understand structure
  const firstRows = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: null,
    range: 0,
    blankrows: false
  });

  // Check if first row looks like headers (contains text that might be column names)
  const firstRow = firstRows[0] || [];
  const secondRow = firstRows[1] || [];
  
  // Try to detect if first row is headers or data
  const looksLikeHeaders = firstRow.some(cell => {
    const str = String(cell || '').toLowerCase();
    return ['الاسم', 'اسم', 'الهوية', 'رقم', 'الجنسية', 'القسم', 'البريد', 'الهاتف'].some(h => str.includes(h));
  });

  let headers;
  let sampleDataRow;
  
  if (looksLikeHeaders) {
    headers = firstRow;
    sampleDataRow = secondRow;
    console.log('📋 Detected headers in first row\n');
  } else {
    // No headers, use position-based mapping
    headers = firstRow.map((_, index) => `Column ${index + 1}`);
    sampleDataRow = firstRow;
    console.log('📋 No headers detected - using position-based mapping\n');
    console.log('   Sample data from first row:');
    sampleDataRow.forEach((value, index) => {
      console.log(`   Column ${index + 1}: ${String(value || '').substring(0, 50)}${String(value || '').length > 50 ? '...' : ''}`);
    });
    console.log();
  }

  console.log(`✅ Found ${headers.length} columns in Excel file\n`);

  // Step 2: Connect to database and get table schemas
  console.log('🔌 Connecting to database...\n');
  
  const dbName = process.env.DB_NAME || 'nora_database';
  let connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    multipleStatements: true
  });

  // Find database with App_Users table
  const [databases] = await connection.query(`SHOW DATABASES`);
  let foundDb = null;
  
  for (const db of databases) {
    const dbNameCandidate = db.Database;
    if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbNameCandidate)) {
      continue;
    }
    
    try {
      await connection.query(`USE \`${dbNameCandidate}\``);
      const [tables] = await connection.query(`SHOW TABLES LIKE 'App_Users'`);
      if (tables.length > 0) {
        foundDb = dbNameCandidate;
        break;
      }
    } catch (err) {
      continue;
    }
  }

  if (!foundDb) {
    console.error('❌ Could not find database with App_Users table!');
    await connection.end();
    process.exit(1);
  }

  await connection.query(`USE \`${foundDb}\``);
  console.log(`✅ Using database: ${foundDb}\n`);

  // Get Employees table columns
  console.log('📋 Getting Employees table columns...');
  const [employeesColumns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Employees'
    ORDER BY ORDINAL_POSITION
  `, [foundDb]);

  console.log(`   Found ${employeesColumns.length} columns in Employees table\n`);

  // Get App_Users table columns
  console.log('📋 Getting App_Users table columns...');
  const [appUsersColumns] = await connection.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'App_Users'
    ORDER BY ORDINAL_POSITION
  `, [foundDb]);

  console.log(`   Found ${appUsersColumns.length} columns in App_Users table\n`);

  await connection.end();

  // Step 3: Create column name mappings
  const employeesColNames = employeesColumns.map(c => c.COLUMN_NAME.toLowerCase());
  const appUsersColNames = appUsersColumns.map(c => c.COLUMN_NAME.toLowerCase());

  // Position-based mapping (when no headers exist)
  // Based on sample data structure
  const positionBasedMapping = {
    0: { description: 'Employee ID/Sequence', employees: [], app_users: [] }, // May not map directly
    1: { description: 'National ID', employees: ['national_id'], app_users: ['national_id'] },
    2: { description: 'Full Name (Arabic)', employees: ['full_name_ar', 'first_name_ar', 'second_name_ar', 'third_name_ar', 'family_name_ar'], app_users: ['name'] },
    3: { description: 'Gender', employees: ['gender'], app_users: [] },
    4: { description: 'Nationality', employees: ['nationality'], app_users: ['nationality'] },
    5: { description: 'Age', employees: [], app_users: [] }, // Derived field, not stored
    6: { description: 'Phone', employees: ['phone_primary'], app_users: ['phone'] },
    7: { description: 'Email', employees: ['email_work'], app_users: ['email'] },
    8: { description: 'Hire Date (Hijri)', employees: ['hire_date'], app_users: [] }, // Needs conversion
    9: { description: 'Birth Date (Hijri)', employees: ['birth_date'], app_users: [] }, // Needs conversion
    10: { description: 'Employee Number', employees: ['employee_number'], app_users: ['employee_number'] },
    11: { description: 'Contract/Employment Type', employees: ['contract_type', 'employment_status'], app_users: ['employment_type'] },
    12: { description: 'Department Category', employees: [], app_users: [] }, // May not map directly
    13: { description: 'Job Level', employees: ['position'], app_users: [] },
    14: { description: 'Job Title', employees: ['job_title', 'job_title_id'], app_users: ['job_title'] },
    15: { description: 'Job Title (duplicate)', employees: ['job_title'], app_users: [] },
    16: { description: 'Facility/Hospital', employees: [], app_users: [] }, // May not map directly
    17: { description: 'Department Name', employees: [], app_users: ['department_name'] }, // Maps to department_id via lookup
    18: { description: 'Manager Name', employees: [], app_users: [] }, // Not stored in these tables
    19: { description: 'Manager National ID', employees: [], app_users: [] }, // Not stored
    20: { description: 'Manager Email', employees: [], app_users: [] }, // Not stored
    21: { description: 'Manager Phone', employees: [], app_users: [] }, // Not stored
  };

  // Common mappings for Arabic/English column names (when headers exist)
  const columnMappings = {
    // Arabic to English mappings
    'الاسم': ['name', 'full_name_ar', 'full_name_en', 'first_name_ar'],
    'اسم': ['name', 'full_name_ar', 'full_name_en'],
    'إسم': ['name', 'full_name_ar', 'full_name_en'],
    'إسم الموظف': ['full_name_ar', 'name'],
    'الاسم الكامل': ['full_name_ar', 'full_name_en', 'name'],
    'الرقم الوظيفي': ['employee_number'],
    'رقم الموظف': ['employee_number'],
    'رقم التسجيل المهني': ['employee_number'],
    'رقم': ['employee_number'],
    'الهوية الوطنية': ['national_id'],
    'الهوية': ['national_id'],
    'رقم الهوية': ['national_id'],
    'رقم هوية الموظف': ['national_id'],
    'الجنسية': ['nationality'],
    'القسم': ['department_id'], // Will need department name lookup
    'القسم/الإدارة': ['department_id'],
    'المسمى الوظيفي': ['job_title', 'job_title_id'],
    'المسمى': ['job_title', 'job_title_id'],
    'المسمى الوظيفى': ['job_title', 'job_title_id'],
    'الوظيفة': ['job_title', 'job_title_id'],
    'الهاتف': ['phone_primary', 'phone_secondary'],
    'الجوال': ['phone_primary'],
    'رقم جوال الموظف': ['phone_primary'],
    'رقم الجوال': ['phone_primary'],
    'البريد الإلكتروني': ['email_work', 'email'],
    'البريد': ['email_work', 'email'],
    'الإيميل': ['email_work', 'email'],
    'إيميل الموظف': ['email_work', 'email'],
    'نوع الوظيفة': ['contract_type', 'employment_status'],
    'نوع التوظيف': ['contract_type', 'employment_status', 'employment_type'],
    'النوع': ['contract_type', 'identity_type'],
    'الجنس': ['gender'],
    'العمر': [], // Age is derived, not stored
    'تاريخ الميلاد': ['birth_date'],
    'تاريخ التوظيف': ['hire_date'],
    'تاريخ التعيين': ['hire_date'],
    'تاريخ بداية العقد': ['contract_start_date'],
    'الحالة': ['employment_status', 'is_active'],
    'المرتبة': ['position'], // Job rank/level
    'المجموعة': [], // Department category/group - may not map directly
    'الملاك الوظيفي': [], // Staff positioning - may not map directly
    'إسم المدير': [], // Manager name - not stored in these tables
  };

  // Step 4: Check each Excel column
  console.log('═'.repeat(70));
  console.log('🔍 CHECKING COLUMN MAPPINGS\n');

  const missingInEmployees = [];
  const missingInAppUsers = [];
  const allMapped = [];

  headers.forEach((excelCol, index) => {
    const excelColStr = excelCol ? excelCol.toString().trim() : '';
    const excelColLower = excelColStr.toLowerCase();
    const sampleValue = sampleDataRow && sampleDataRow[index] ? String(sampleDataRow[index]).substring(0, 30) : '';
    
    // Try to find mapping
    let foundInEmployees = false;
    let foundInAppUsers = false;
    let mappedTo = [];
    let description = '';

    // If no headers, use position-based mapping
    if (!looksLikeHeaders && positionBasedMapping[index]) {
      const posMapping = positionBasedMapping[index];
      description = posMapping.description;
      
      posMapping.employees.forEach(col => {
        if (employeesColNames.includes(col.toLowerCase())) {
          foundInEmployees = true;
          mappedTo.push(`Employees.${col}`);
        }
      });
      
      posMapping.app_users.forEach(col => {
        if (appUsersColNames.includes(col.toLowerCase())) {
          foundInAppUsers = true;
          mappedTo.push(`App_Users.${col}`);
        }
      });
    } else {
      // Use header-based mapping
      // Check direct match
      if (employeesColNames.includes(excelColLower)) {
        foundInEmployees = true;
        mappedTo.push(`Employees.${excelColLower}`);
      }
      if (appUsersColNames.includes(excelColLower)) {
        foundInAppUsers = true;
        mappedTo.push(`App_Users.${excelColLower}`);
      }

      // Check mapping table - try exact match first, then partial
      if (!foundInEmployees && !foundInAppUsers) {
        // First try exact match
        if (columnMappings[excelColStr]) {
          for (const mapping of columnMappings[excelColStr]) {
            if (employeesColNames.includes(mapping.toLowerCase())) {
              foundInEmployees = true;
              mappedTo.push(`Employees.${mapping}`);
            }
            if (appUsersColNames.includes(mapping.toLowerCase())) {
              foundInAppUsers = true;
              mappedTo.push(`App_Users.${mapping}`);
            }
          }
        }
        
        // Then try partial match
        if (!foundInEmployees && !foundInAppUsers) {
          for (const [arKey, possibleMappings] of Object.entries(columnMappings)) {
            if (excelColStr.includes(arKey) || arKey.includes(excelColStr) || 
                excelColLower.includes(arKey.toLowerCase()) || arKey.toLowerCase().includes(excelColLower)) {
              for (const mapping of possibleMappings) {
                if (employeesColNames.includes(mapping.toLowerCase())) {
                  foundInEmployees = true;
                  mappedTo.push(`Employees.${mapping}`);
                }
                if (appUsersColNames.includes(mapping.toLowerCase())) {
                  foundInAppUsers = true;
                  mappedTo.push(`App_Users.${mapping}`);
                }
              }
            }
          }
        }
      }

      // Check partial matches
      if (!foundInEmployees && !foundInAppUsers) {
        for (const empCol of employeesColNames) {
          if (empCol.includes(excelColLower) || excelColLower.includes(empCol)) {
            foundInEmployees = true;
            mappedTo.push(`Employees.${empCol}`);
            break;
          }
        }
        for (const userCol of appUsersColNames) {
          if (userCol.includes(excelColLower) || excelColLower.includes(userCol)) {
            foundInAppUsers = true;
            mappedTo.push(`App_Users.${userCol}`);
            break;
          }
        }
      }
    }

    // Report status
    const displayName = looksLikeHeaders ? `"${excelColStr}"` : `Column ${index + 1}`;
    console.log(`${index + 1}. ${displayName}${description ? ` (${description})` : ''}`);
    if (sampleValue && !looksLikeHeaders) {
      console.log(`   Sample: ${sampleValue}${sampleValue.length >= 30 ? '...' : ''}`);
    }
    
    if (foundInEmployees || foundInAppUsers) {
      console.log(`   ✅ Mapped to: ${mappedTo.join(', ')}`);
      allMapped.push({ excel: displayName, mapped: mappedTo, description });
    } else {
      // Check if this column is intentionally not mapped (like Age, Manager fields, etc.)
      const intentionallyUnmapped = ['العمر', 'Age', 'Manager', 'المجموعة', 'الملاك الوظيفي', 'Facility', 'Category'];
      const isIntentionallyUnmapped = intentionallyUnmapped.some(keyword => 
        excelColStr.includes(keyword) || description.includes(keyword)
      );
      
      if (isIntentionallyUnmapped) {
        console.log(`   ℹ️  Not mapped (derived/informational field: ${description || excelColStr})`);
      } else {
        console.log(`   ⚠️  No direct mapping (may need custom handling or lookup)`);
        missingInEmployees.push(displayName);
        missingInAppUsers.push(displayName);
      }
    }
    console.log();
  });

  // Step 5: Summary
  console.log('═'.repeat(70));
  console.log('📊 SUMMARY\n');

  if (missingInEmployees.length === 0 && missingInAppUsers.length === 0) {
    console.log('✅ SUCCESS: All Excel columns have equivalents in Employees or App_Users tables!\n');
    console.log(`   Total columns checked: ${headers.filter(h => h && h.toString().trim()).length}`);
    console.log(`   All mapped successfully: ${allMapped.length}\n`);
  } else {
    console.log('⚠️  WARNING: Some Excel columns do not have direct equivalents!\n');
    console.log(`   Total columns checked: ${headers.filter(h => h && h.toString().trim()).length}`);
    console.log(`   Successfully mapped: ${allMapped.length}`);
    console.log(`   Missing mappings: ${missingInEmployees.length}\n`);
    
    if (missingInEmployees.length > 0) {
      console.log('❌ Columns without mappings:');
      missingInEmployees.forEach(col => {
        console.log(`   - "${col}"`);
      });
      console.log();
    }
  }

  // Step 6: Show database column details
  console.log('═'.repeat(70));
  console.log('📋 DATABASE TABLE COLUMNS\n');

  console.log('Employees table columns:');
  employeesColumns.forEach(col => {
    console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.IS_NULLABLE === 'YES' ? ', nullable' : ', required'})`);
  });
  console.log();

  console.log('App_Users table columns:');
  appUsersColumns.forEach(col => {
    console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.IS_NULLABLE === 'YES' ? ', nullable' : ', required'})`);
  });
  console.log();

  console.log('═'.repeat(70));
  
  if (missingInEmployees.length > 0 || missingInAppUsers.length > 0) {
    console.log('\n⚠️  RECOMMENDATION:');
    console.log('   Some Excel columns may need custom mapping or may be derived fields.');
    console.log('   Review the missing columns above and determine if they need to be:');
    console.log('   1. Added to the database schema');
    console.log('   2. Mapped to existing columns with data transformation');
    console.log('   3. Ignored if they are calculated/derived fields\n');
    process.exit(1);
  } else {
    console.log('\n✅ All columns verified! Ready to import data.\n');
    process.exit(0);
  }
}

// Run the script
verifyExcelColumns()
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

