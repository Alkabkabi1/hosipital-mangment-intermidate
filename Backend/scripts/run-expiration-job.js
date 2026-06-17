/**
 * Role Expiration Job Runner
 * Run this script periodically (daily) to:
 * 1. Disable expired role assignments
 * 2. Send notifications for roles expiring soon
 * 
 * Usage:
 *   node scripts/run-expiration-job.js
 * 
 * Can be scheduled with cron:
 *   0 9 * * * cd /path/to/Backend && node scripts/run-expiration-job.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import from compiled TypeScript
const { runExpirationJob } = require('../dist/modules/roles/role-expiration.service');

async function main() {
  try {
    console.log('🚀 Starting role expiration job...');
    console.log('📅 Time:', new Date().toLocaleString());
    console.log('');

    const result = await runExpirationJob();

    console.log('');
    console.log('📊 Job Summary:');
    console.log(`   - Roles expired and disabled: ${result.expired}`);
    console.log(`   - Expiration notifications sent: ${result.notified}`);
    console.log('');
    console.log('✅ Job completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Job failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

