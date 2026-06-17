/**
 * Verification Script: Employee Certificates and Licenses Tables
 * 
 * This script verifies that the Employee_Certificates and Employee_Licenses
 * tables exist and have the correct structure with the verified field.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function verifyCredentialsTables() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_management',
      port: parseInt(process.env.DB_PORT || '3306')
    });
    
    console.log('✅ Connected to database\n');
    
    // Check Employee_Certificates table
    console.log('📋 Checking Employee_Certificates table...');
    const [certColumns] = await connection.query(
      `SHOW COLUMNS FROM Employee_Certificates`
    );
    
    console.log('✅ Employee_Certificates table exists');
    console.log('   Columns:', certColumns.map(c => c.Field).join(', '));
    
    const hasVerified = certColumns.some(c => c.Field === 'verified');
    const hasVerifiedBy = certColumns.some(c => c.Field === 'verified_by');
    const hasVerifiedAt = certColumns.some(c => c.Field === 'verified_at');
    
    if (hasVerified && hasVerifiedBy && hasVerifiedAt) {
      console.log('✅ Verification columns exist\n');
    } else {
      console.log('❌ Missing verification columns!');
      console.log('   verified:', hasVerified);
      console.log('   verified_by:', hasVerifiedBy);
      console.log('   verified_at:', hasVerifiedAt);
      console.log('\n');
    }
    
    // Check Employee_Licenses table
    console.log('📋 Checking Employee_Licenses table...');
    const [licColumns] = await connection.query(
      `SHOW COLUMNS FROM Employee_Licenses`
    );
    
    console.log('✅ Employee_Licenses table exists');
    console.log('   Columns:', licColumns.map(c => c.Field).join(', '));
    
    const licHasVerified = licColumns.some(c => c.Field === 'verified');
    const licHasVerifiedBy = licColumns.some(c => c.Field === 'verified_by');
    const licHasVerifiedAt = licColumns.some(c => c.Field === 'verified_at');
    
    if (licHasVerified && licHasVerifiedBy && licHasVerifiedAt) {
      console.log('✅ Verification columns exist\n');
    } else {
      console.log('❌ Missing verification columns!');
      console.log('   verified:', licHasVerified);
      console.log('   verified_by:', licHasVerifiedBy);
      console.log('   verified_at:', licHasVerifiedAt);
      console.log('\n');
    }
    
    // Count existing records
    const [certCount] = await connection.query(
      `SELECT COUNT(*) as count, 
              SUM(CASE WHEN verified = TRUE THEN 1 ELSE 0 END) as verified_count
       FROM Employee_Certificates`
    );
    
    const [licCount] = await connection.query(
      `SELECT COUNT(*) as count,
              SUM(CASE WHEN verified = TRUE THEN 1 ELSE 0 END) as verified_count
       FROM Employee_Licenses`
    );
    
    console.log('📊 Data Summary:');
    console.log(`   Certificates: ${certCount[0].count} total, ${certCount[0].verified_count || 0} verified`);
    console.log(`   Licenses: ${licCount[0].count} total, ${licCount[0].verified_count || 0} verified`);
    
    console.log('\n✅ All checks completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n⚠️  Tables do not exist. Please run the credentials schema migration.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyCredentialsTables();

