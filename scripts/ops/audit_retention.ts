#!/usr/bin/env ts-node
/* eslint-disable no-console */
import mysql from 'mysql2/promise';

async function main() {
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '180', 10);
  const dryRun = process.argv.includes('--dry-run');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hospital_app';

  const pool = await mysql.createPool({ host, port, user, password, database, connectionLimit: 2 });
  try {
    const [rows]: any = await pool.query(
      'SELECT COUNT(*) AS cnt FROM Audit_Events WHERE ts < (NOW() - INTERVAL ? DAY)',
      [retentionDays]
    );
    const count = rows?.[0]?.cnt || 0;
    if (dryRun) {
      console.log(`[retention] would delete ${count} rows older than ${retentionDays} days`);
    } else {
      const [res]: any = await pool.execute(
        'DELETE FROM Audit_Events WHERE ts < (NOW() - INTERVAL ? DAY)',
        [retentionDays]
      );
      console.log(`[retention] deleted ${res?.affectedRows ?? count} rows older than ${retentionDays} days`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

