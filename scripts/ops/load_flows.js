#!/usr/bin/env node
/* eslint-disable no-console */
const fetch = global.fetch || require('node-fetch');

const API_BASE = process.env.API_BASE || 'http://localhost:3037';
const EMAIL = process.env.API_EMAIL || 'admin@example.com';
const PASSWORD = process.env.API_PASSWORD || 'ChangeMe123!';
const CONC = parseInt(process.env.F_CONCURRENCY || '5', 10);
const TOTAL = parseInt(process.env.F_TOTAL || '50', 10);
const DURATION_S = parseInt(process.env.F_DURATION_S || '0', 10); // 0 = use TOTAL

async function login() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const data = await res.json();
  const token = data?.data?.accessToken || data?.token || data?.accessToken;
  if (!token) throw new Error('no token in response');
  return token;
}

function clearancePayload(i) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    email: `user${i}@example.com`,
    reason: 'resignation',
    lastWorkingDay: today,
    firstName: 'User',
    secondName: String(i),
  };
}

async function createClearance(token, i) {
  const res = await fetch(`${API_BASE}/api/v1/employee/requests/clearance`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(clearancePayload(i)),
  });
  return res.status;
}

async function listAdminRecent(token) {
  const res = await fetch(`${API_BASE}/api/v1/admin/requests/recent?limit=10`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return res.status;
}

async function run() {
  console.log(`[flows] API_BASE=${API_BASE} CONC=${CONC} TOTAL=${TOTAL} DURATION_S=${DURATION_S}`);
  const token = await login();
  const started = Date.now();
  let sent = 0;
  let ok = 0;
  let errs = 0;

  async function worker(id) {
    while (true) {
      if (DURATION_S > 0) {
        if ((Date.now() - started) / 1000 > DURATION_S) break;
      } else if (sent >= TOTAL) break;
      const i = ++sent;
      try {
        const s1 = await createClearance(token, i);
        const s2 = await listAdminRecent(token);
        if (s1 < 400 && s2 < 400) ok++; else errs++;
      } catch (e) {
        errs++;
      }
    }
  }

  const workers = Array.from({ length: CONC }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  const elapsed = (Date.now() - started) / 1000;
  console.log(`[flows] sent=${sent} ok=${ok} errs=${errs} elapsed_s=${elapsed.toFixed(1)} rps=${(sent/elapsed).toFixed(1)}`);
}

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

