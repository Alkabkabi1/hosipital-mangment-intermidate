#!/usr/bin/env node

/**
 * Test Runner - Execute test suites based on arguments
 */

const { spawn } = require('child_process');
const path = require('path');

function printUsage() {
  console.log('🧪 Hospital Request System - Test Runner');
  console.log('');
  console.log('Usage:');
  console.log('  npm run test:quick     - Run quick validation (5 minutes)');
  console.log('  npm run test:full      - Run comprehensive test suite (20 minutes)');
  console.log('  npm run test:phase1    - Run only critical blocker tests');
  console.log('  npm run test:phase2    - Run only request type coverage tests');
  console.log('  npm run test:api       - Test API endpoints only');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/run-tests.js quick');
  console.log('  node scripts/run-tests.js full');
  console.log('  node scripts/run-tests.js phase1');
}

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptName], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  const testType = process.argv[2];

  if (!testType) {
    printUsage();
    return;
  }

  try {
    switch (testType.toLowerCase()) {
      case 'quick':
        console.log('🚀 Running Quick Tests...');
        await runScript('scripts/quick-test.js');
        break;

      case 'full':
      case 'comprehensive':
        console.log('🚀 Running Comprehensive Test Suite...');
        await runScript('scripts/comprehensive-test-suite.js');
        break;

      case 'phase1':
        console.log('🚀 Running Phase 1 Tests (Critical Blockers)...');
        // We'll create a phase-specific script if needed
        await runScript('scripts/comprehensive-test-suite.js');
        break;

      default:
        console.error(`❌ Unknown test type: ${testType}`);
        printUsage();
        process.exit(1);
    }

    console.log('\n🎉 Test execution completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

main();
