#!/usr/bin/env node
'use strict';

/**
 * One-way runner for the backend.
 * Usage:  cd Backend && node ./server.js
 *
 * - Ensures we run from Backend/
 * - Builds automatically if dist/server.js is missing (or FORCE_BUILD=true)
 * - Delegates to compiled dist/server.js
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Ensure cwd is Backend/
process.chdir(__dirname);

// Default NODE_ENV if not set
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

const distMain = path.resolve(__dirname, 'dist', 'server.js');
const needBuild = process.env.FORCE_BUILD === 'true' || !fs.existsSync(distMain);

if (needBuild) {
  console.log('[runner] Building backend (npm run build)...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npmCmd, ['run', 'build'], { stdio: 'inherit', cwd: __dirname });
  if (r.status !== 0) {
    console.error('[runner] Build failed.');
    process.exit(r.status || 1);
  }
  if (!fs.existsSync(distMain)) {
    console.error('[runner] Build did not produce dist/server.js');
    process.exit(1);
  }
}

console.log('[runner] Starting API server…');
require(distMain);
