#!/usr/bin/env ts-node
import { config as loadEnv } from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';

loadEnv();

type Group = { name_norm: string; ids: number[] };

function argFlag(name: string): boolean {
  return process.argv.includes(name);
}
function argValue(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}

async function main() {
  const dryRun = !argFlag('--apply');
  const backupPath = argValue('--backup');

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management',
    connectionLimit: 5,
  });

  async function loadGroups(table: string, idCol: string): Promise<Group[]> {
    const [rows] = await pool.query(`SELECT ${idCol} AS id, name_norm FROM ${table} WHERE name_norm IS NOT NULL AND name_norm <> ''`);
    const map = new Map<string, number[]>();
    for (const r of rows as any[]) {
      const k = r.name_norm as string;
      const arr = map.get(k) || [];
      arr.push(Number(r.id));
      map.set(k, arr);
    }
    const groups: Group[] = [];
    map.forEach((ids, name_norm) => { if (ids.length > 1) groups.push({ name_norm, ids: ids.sort((a,b)=>a-b) }); });
    return groups;
  }

  const deptGroups = await loadGroups('Departments', 'department_id');
  const jobGroups = await loadGroups('Job_Titles', 'job_title_id');

  const reportLines: string[] = ['entity,name_norm,survivor_id,victim_ids,total_victims'];

  async function countRefs(table: string, col: string, id: number): Promise<number> {
    const [rows] = await pool.query(`SELECT COUNT(*) AS c FROM ${table} WHERE ${col} = ?`, [id]);
    return Number((rows as any[])[0].c);
  }

  async function processGroups(entity: 'department'|'job_title', groups: Group[]) {
    for (const g of groups) {
      const survivor = g.ids[0];
      const victims = g.ids.slice(1);
      reportLines.push([entity, g.name_norm, String(survivor), victims.join('|'), String(victims.length)].join(','));
      if (!dryRun && victims.length) {
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();
          if (entity === 'department') {
            for (const vid of victims) {
              await conn.query('UPDATE Employees SET department_id = ? WHERE department_id = ?', [survivor, vid]);
            }
            await conn.query('DELETE FROM Departments WHERE department_id IN (' + victims.map(()=>'?').join(',') + ')', victims);
          } else {
            for (const vid of victims) {
              await conn.query('UPDATE Employees SET job_title_id = ? WHERE job_title_id = ?', [survivor, vid]);
            }
            await conn.query('DELETE FROM Job_Titles WHERE job_title_id IN (' + victims.map(()=>'?').join(',') + ')', victims);
          }
          await conn.commit();
        } catch (err) {
          await conn.rollback();
          throw err;
        } finally {
          conn.release();
        }
      }
    }
  }

  if (dryRun && backupPath) {
    const dumpPath = path.resolve(String(backupPath));
    fs.mkdirSync(path.dirname(dumpPath), { recursive: true });
    fs.writeFileSync(dumpPath, '# Take a DB dump here before apply (manual step)\n');
  }

  await processGroups('department', deptGroups);
  await processGroups('job_title', jobGroups);

  fs.writeFileSync('dedupe-report.csv', reportLines.join('\n'));
  console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}: groups(dept=${deptGroups.length}, job=${jobGroups.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

