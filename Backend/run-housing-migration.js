// Quick script to run housing allowance migration
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Running Housing Allowance Migration...\n');
  
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kauh_db',
    multipleStatements: true
  };
  
  console.log(`📡 Connecting to database: ${config.database}@${config.host}:${config.port}`);
  
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');
    
    // Check if table already exists
    console.log('🔍 Checking if Housing_Allowance_Requests table exists...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'Housing_Allowance_Requests'"
    );
    
    if (tables.length > 0) {
      console.log('⚠️  Table already exists! Skipping creation.');
      
      // Check table structure
      const [columns] = await connection.query(
        'DESCRIBE Housing_Allowance_Requests'
      );
      console.log('\n📋 Current table structure:');
      console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
      
      // Count existing records
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM Housing_Allowance_Requests'
      );
      console.log(`\n📊 Existing records: ${count[0].total}`);
      
    } else {
      console.log('❌ Table does not exist. Creating now...\n');
      
      // Read migration file
      const migrationPath = path.join(__dirname, 'migrations', '015_housing_allowance_requests.sql');
      console.log(`📄 Reading migration file: ${migrationPath}`);
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute migration
      console.log('⚙️  Executing migration SQL...\n');
      await connection.query(sql);
      
      console.log('✅ Migration executed successfully!\n');
      
      // Verify table creation
      const [newTables] = await connection.query(
        "SHOW TABLES LIKE 'Housing_Allowance_Requests'"
      );
      
      if (newTables.length > 0) {
        console.log('✅ Housing_Allowance_Requests table created successfully!');
        
        const [columns] = await connection.query(
          'DESCRIBE Housing_Allowance_Requests'
        );
        console.log('\n📋 Table structure:');
        console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key })));
      } else {
        console.log('❌ Table creation failed!');
      }
      
      // Check status history table
      const [historyTables] = await connection.query(
        "SHOW TABLES LIKE 'Housing_Allowance_Status_History'"
      );
      
      if (historyTables.length > 0) {
        console.log('✅ Housing_Allowance_Status_History table created successfully!');
      }
    }
    
    console.log('\n✅ Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server (npm run dev)');
    console.log('   2. Submit a new housing allowance request');
    console.log('   3. Check employee and admin dashboards');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection refused. Is MySQL running?');
      console.error('   Check your .env file for correct database credentials.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Check your database username/password in .env file.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database does not exist. Create it first or check DB_NAME in .env file.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

