#!/usr/bin/env ts-node
/* eslint-disable no-console */

type Opts = {
  p95ms: number;
  cpuCores: number;
  reqPerUser: number;
  users: number;
  targetUtil: number; // 0..1
};

function parseArgs(): Opts {
  const args = process.argv.slice(2);
  const map: Record<string,string> = {};
  for (const a of args) {
    const [k,v] = a.split('=');
    if (k && v) map[k.replace(/^--/, '')] = v;
  }
  const p95ms = Number(map.p95 || map.p95ms || 500);
  const cpuCores = Number(map.cores || map.cpu || 1);
  const reqPerUser = Number(map.rpu || map.req || 1);
  const users = Number(map.users || 100);
  const targetUtil = Number(map.util || 0.6);
  return { p95ms, cpuCores, reqPerUser, users, targetUtil };
}

function estimatePods(opts: Opts) {
  // Very rough model: capacity per core ~ 1000ms / p95ms RPS
  const rpsPerCore = 1000 / opts.p95ms;
  const rpsPerPod = rpsPerCore * opts.cpuCores * opts.targetUtil;
  const requiredRps = opts.users * opts.reqPerUser; // per second across users
  const pods = Math.ceil(requiredRps / Math.max(0.001, rpsPerPod));
  return { rpsPerCore, rpsPerPod, requiredRps, pods };
}

function main() {
  const o = parseArgs();
  const est = estimatePods(o);
  console.log('[capacity] inputs:', o);
  console.log(`[capacity] rps/core=${est.rpsPerCore.toFixed(2)} rps/pod=${est.rpsPerPod.toFixed(2)} required_rps=${est.requiredRps.toFixed(2)}`);
  console.log(`[capacity] pods_needed=${est.pods}`);
  console.log('[capacity] note: linear approximation; validate with load tests and HPA metrics.');
}

if (require.main === module) main();

