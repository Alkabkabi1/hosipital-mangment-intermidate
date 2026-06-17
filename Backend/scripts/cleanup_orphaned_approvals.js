const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

async function cleanupOrphanedApprovals() {
  console.log('🧹 تنظيف الموافقات اليتيمة...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'nora',
    password: process.env.DB_PASSWORD || 'nora123',
    database: process.env.DB_NAME || 'nora_database',
    multipleStatements: true
  });

  try {
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // قراءة ملف SQL
    const sqlFile = path.join(__dirname, 'cleanup_orphaned_approvals.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // تقسيم الاستعلامات
    const queries = sqlContent.split(';').filter(q => q.trim().length > 0);

    console.log(`📋 سيتم تنفيذ ${queries.length} استعلام`);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim();
      if (!query) continue;

      try {
        console.log(`\n🔍 استعلام ${i + 1}:`);
        console.log(query.substring(0, 100) + (query.length > 100 ? '...' : ''));

        const [result] = await connection.execute(query);

        if (query.toUpperCase().includes('SELECT')) {
          console.log(`📊 النتائج: ${Array.isArray(result) ? result.length : 'N/A'} صف`);
          if (Array.isArray(result) && result.length > 0 && result.length <= 10) {
            console.table(result);
          }
        } else if (query.toUpperCase().includes('DELETE')) {
          console.log(`🗑️ تم حذف ${result.affectedRows} صف`);
        }

      } catch (error) {
        console.error(`❌ خطأ في الاستعلام ${i + 1}:`, error.message);
        // استمر في الاستعلامات الأخرى
      }
    }

    console.log('\n✅ انتهى تنظيف الموافقات اليتيمة');

  } catch (error) {
    console.error('❌ خطأ في التنظيف:', error);
  } finally {
    await connection.end();
  }
}

cleanupOrphanedApprovals();
