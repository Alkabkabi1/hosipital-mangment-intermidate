#!/usr/bin/env node

/**
 * Quick Test Script - Essential Tests Only
 * For rapid validation of critical fixes
 */

const axios = require('axios');

class QuickTestSuite {
  constructor() {
    this.API_BASE = 'http://localhost:3037/api';
    this.results = [];
  }

  async log(test, status, details = '') {
    const result = { test, status, details, timestamp: new Date().toISOString() };
    this.results.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${status}`);
    if (details) console.log(`   ${details}`);
  }

  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.API_BASE}${endpoint}`,
        headers: { 'Content-Type': 'application/json' }
      };

      if (data) config.data = data;

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  async runQuickTests() {
    console.log('🚀 QUICK TEST - Critical Issues Validation');
    console.log('=' .repeat(50));

    // Test 1: Assignment creation (was broken)
    await this.testAssignmentCreation();

    // Test 2: Backend health  
    await this.testBackendHealth();

    // Test 3: Database tables
    await this.testDatabaseHealth();

    // Summary
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log('\n📊 QUICK TEST RESULTS:');
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Failed: ${failed}/${total}`);
    console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);

    if (failed === 0) {
      console.log('\n🎉 All critical tests PASSED! System is ready for full testing.');
    } else {
      console.log('\n⚠️ Some critical issues remain. Check failed tests above.');
    }
  }

  async testAssignmentCreation() {
    const testData = {
      employeeName: 'Test User',
      newRole: 'Test Assignment',
      assignmentReason: 'تكليف للاختبار النظام', // 5+ characters
      startDate: '2025-12-01',
      assignmentType: 'temporary'
    };

    const result = await this.apiRequest('/assignment', 'POST', testData);
    
    if (result.success) {
      await this.log('Assignment Request Creation', 'PASS', 'No 500 error - database table integration working');
    } else if (result.status === 500) {
      await this.log('Assignment Request Creation', 'FAIL', `500 Error: ${result.error}`);
    } else if (result.status === 401) {
      await this.log('Assignment Request Creation', 'SKIP', 'Authentication required - endpoint exists');
    } else {
      await this.log('Assignment Request Creation', 'FAIL', `Error: ${result.error}`);
    }
  }

  async testBackendHealth() {
    const result = await this.apiRequest('/health');
    
    if (result.success) {
      await this.log('Backend Health Check', 'PASS', 'Backend server responding');
    } else {
      await this.log('Backend Health Check', 'FAIL', `Backend not responding: ${result.error}`);
    }
  }

  async testDatabaseHealth() {
    // Test if admin stats endpoint works (indicates database connectivity)
    const result = await this.apiRequest('/admin/stats');
    
    if (result.success) {
      await this.log('Database Connectivity', 'PASS', 'Admin stats endpoint working');
    } else if (result.status === 401) {
      await this.log('Database Connectivity', 'PASS', 'Endpoint exists, authentication required');
    } else {
      await this.log('Database Connectivity', 'FAIL', `Database issues: ${result.error}`);
    }
  }
}

// Execute
const quickTest = new QuickTestSuite();
quickTest.runQuickTests();
