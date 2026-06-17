const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'nora',
    password: 'nora123',
    database: 'hospital_management',
    multipleStatements: true
  });

  try {
    console.log('🚀 Running Multi-Approval System Migration...\n');
    
    const sqlFile = path.join(__dirname, '../migrations/multi-approval-system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by delimiter change statements and execute separately
    const statements = sql.split('DELIMITER');
    
    for (let i = 0; i < statements.length; i++) {
      let stmt = statements[i].trim();
      if (!stmt) continue;
      
      // Handle delimiter changes
      if (stmt.startsWith('$$')) {
        stmt = stmt.substring(2);
      }
      if (stmt.endsWith('$$')) {
        stmt = stmt.substring(0, stmt.length - 2);
      }
      
      // Replace $$ delimiter with ;
      stmt = stmt.replace(/\$\$/g, ';');
      
      if (stmt && stmt.trim()) {
        try {
          await connection.query(stmt);
          console.log(`✅ Executed statement ${i + 1}`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_FIELDNAME' ||
              error.code === 'ER_DUP_KEYNAME' ||
              error.message.includes('already exists')) {
            console.log(`⚠️  Skipped (already exists): Statement ${i + 1}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Multi-Approval System Migration Completed!');
    
    // Verify tables were created
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_management' 
        AND TABLE_NAME IN ('Request_Approvals', 'Approval_Rules', 'User_Role_History')
    `);
    
    console.log('\n📊 Created Tables:');
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    
    // Check stored procedures
    const [procs] = await connection.query(`
      SELECT ROUTINE_NAME 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'hospital_management' 
        AND ROUTINE_NAME IN ('SP_Initialize_Request_Approvals', 'SP_Process_Approval')
    `);
    
    if (procs.length > 0) {
      console.log('\n⚙️  Created Stored Procedures:');
      procs.forEach(p => console.log(`   - ${p.ROUTINE_NAME}`));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();

