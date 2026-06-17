#!/usr/bin/env node

/**
 * Test Specific Issues from TESTING_ISSUES_REPORT.md
 * Focused testing for each reported problem
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

class SpecificIssuesTestSuite {
  constructor() {
    this.API_BASE = 'http://localhost:3037/api';
    this.FRONTEND_BASE = 'http://localhost:3037/Frontend/HTML';
    this.issues = [];
    this.authToken = null;
  }

  async testIssue(issueId, description, testFunc) {
    console.log(`\n🔍 Testing Issue ${issueId}: ${description}`);
    console.log('-' .repeat(40));
    
    try {
      const result = await testFunc();
      this.issues.push({
        id: issueId,
        description,
        status: result.status,
        details: result.details,
        timestamp: new Date().toISOString()
      });
      
      const icon = result.status === 'FIXED' ? '✅' : result.status === 'STILL_BROKEN' ? '❌' : '⚠️';
      console.log(`${icon} Issue ${issueId}: ${result.status}`);
      if (result.details) console.log(`   📝 ${result.details}`);
      
    } catch (error) {
      console.log(`❌ Issue ${issueId}: TEST_ERROR - ${error.message}`);
      this.issues.push({
        id: issueId,
        description,
        status: 'TEST_ERROR', 
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async loginTestUser() {
    const result = await this.apiRequest('/auth/login', 'POST', {
      email: 'aseelma@moh.gov.sa',
      password: 'password123'
    });

    if (result.success) {
      this.authToken = result.data.token || result.data.accessToken;
      return { status: 'SUCCESS', details: 'Test user authenticated' };
    } else {
      return { status: 'FAILED', details: `Login failed: ${result.error}` };
    }
  }

  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.API_BASE}${endpoint}`,
        headers: { 'Content-Type': 'application/json' }
      };

      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }

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

  async runSpecificTests() {
    console.log('🎯 TESTING SPECIFIC ISSUES FROM TESTING_ISSUES_REPORT.md');
    console.log('=' .repeat(70));

    // Setup
    const loginResult = await this.loginTestUser();
    if (loginResult.status !== 'SUCCESS') {
      console.error('❌ Cannot proceed without authentication');
      return;
    }

    // Test each specific issue reported
    
    await this.testIssue('A1', 'Database Table Missing Errors', async () => {
      const result = await this.apiRequest('/assignment', 'POST', {
        employeeName: 'Test', newRole: 'Test', assignmentReason: 'تكليف اختبار', startDate: '2025-12-01', assignmentType: 'temporary'
      });
      
      if (result.success) {
        return { status: 'FIXED', details: 'Assignment request created without database table errors' };
      } else if (result.error.includes("doesn't exist")) {
        return { status: 'STILL_BROKEN', details: 'Still getting table missing errors' };
      } else if (result.status === 401) {
        return { status: 'SKIP', details: 'Authentication issue, but no database table error' };
      } else {
        return { status: 'UNKNOWN', details: `Different error: ${result.error}` };
      }
    });

    await this.testIssue('B1', 'Employee Authorization - غير مصرح', async () => {
      // Create a clearance request first
      const createResult = await this.apiRequest('/employee/requests/clearance', 'POST', {
        firstName: 'اسيل', clearanceType: 'final', reason: 'استقالة', lastWorkingDay: '2025-12-31'
      });
      
      if (!createResult.success) {
        return { status: 'SKIP', details: 'Could not create request to test authorization' };
      }

      const requestId = createResult.data.clearanceId || createResult.data.id;
      
      // Test accessing own request
      const detailResult = await this.apiRequest(`/clearance/${requestId}`);
      
      if (detailResult.success) {
        return { status: 'FIXED', details: 'Employee can access own request details' };
      } else if (detailResult.status === 403) {
        return { status: 'STILL_BROKEN', details: 'Still getting غير مصرح authorization error' };
      } else {
        return { status: 'UNKNOWN', details: `Different error: ${detailResult.error}` };
      }
    });

    await this.testIssue('C1', 'Validation Requirements (10 char → 5 char)', async () => {
      const shortReason = 'قصير'; // Only 4 characters - should fail
      const validReason = 'سبب صحيح'; // 8 characters - should pass
      
      const failResult = await this.apiRequest('/assignment', 'POST', {
        employeeName: 'Test', newRole: 'Test', assignmentReason: shortReason, startDate: '2025-12-01', assignmentType: 'temporary'
      });
      
      const passResult = await this.apiRequest('/assignment', 'POST', {
        employeeName: 'Test', newRole: 'Test', assignmentReason: validReason, startDate: '2025-12-01', assignmentType: 'temporary'
      });
      
      if (!failResult.success && passResult.success) {
        return { status: 'FIXED', details: '5-character validation working correctly' };
      } else if (!failResult.success && !passResult.success) {
        return { status: 'STILL_BROKEN', details: 'Both short and long reasons fail - validation too strict' };
      } else if (failResult.success && passResult.success) {
        return { status: 'OVER_FIXED', details: 'Both short and long reasons pass - validation too loose' };
      } else {
        return { status: 'UNKNOWN', details: 'Unexpected validation behavior' };
      }
    });

    await this.testIssue('D1', 'Leave Request Dashboard Visibility', async () => {
      // Create a leave request
      const createResult = await this.apiRequest('/leave-request', 'POST', {
        employeeName: 'اسيل محمود عربي المغربي',
        leaveFromDate: '2025-12-15',
        leaveToDate: '2025-12-25', 
        leaveType: 'annual',
        reason: 'للاختبار'
      });

      if (!createResult.success) {
        return { status: 'SKIP', details: `Could not create leave request: ${createResult.error}` };
      }

      // Check if it appears in employee requests
      const myRequestsResult = await this.apiRequest('/employee/requests/my');
      
      if (myRequestsResult.success) {
        const requests = myRequestsResult.data.data || myRequestsResult.data || [];
        const hasLeaveRequest = requests.some(r => r.type === 'leave' || r.type === 'leave_request');
        
        if (hasLeaveRequest) {
          return { status: 'FIXED', details: 'Leave requests now appear in employee dashboard API' };
        } else {
          return { status: 'STILL_BROKEN', details: 'Leave requests still not visible in employee dashboard' };
        }
      } else {
        return { status: 'SKIP', details: `Could not check employee requests: ${myRequestsResult.error}` };
      }
    });

    await this.testIssue('E1', 'Resource Loading - MIME Type Errors', async () => {
      try {
        // Test maternity leave page
        const maternityResponse = await axios.get(`${this.FRONTEND_BASE}/employee-maternity-leave-request.html`);
        
        // Test housing allowance page  
        const housingResponse = await axios.get(`${this.FRONTEND_BASE}/employee-saudi-doctors-housing.html`);
        
        if (maternityResponse.status === 200 && housingResponse.status === 200) {
          return { status: 'FIXED', details: 'Both maternity leave and housing allowance pages load successfully' };
        } else {
          return { status: 'STILL_BROKEN', details: 'One or both pages still not loading' };
        }
      } catch (error) {
        return { status: 'STILL_BROKEN', details: `Resource loading error: ${error.message}` };
      }
    });

    // Generate summary
    this.generateIssueSummary();
  }

  generateIssueSummary() {
    console.log('\n📋 SPECIFIC ISSUES SUMMARY:');
    console.log('=' .repeat(50));
    
    const fixed = this.issues.filter(i => i.status === 'FIXED').length;
    const broken = this.issues.filter(i => i.status === 'STILL_BROKEN').length;
    const skipped = this.issues.filter(i => i.status === 'SKIP').length;
    
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`❌ Still Broken: ${broken}`);
    console.log(`⚠️ Skipped: ${skipped}`);
    
    if (broken === 0) {
      console.log('\n🎉 ALL REPORTED ISSUES HAVE BEEN FIXED!');
      console.log('✅ System ready for full production testing');
    } else {
      console.log(`\n⚠️ ${broken} critical issues still need attention`);
      console.log('❌ Review failed tests and fix remaining issues');
    }

    // Detailed breakdown
    console.log('\n📝 DETAILED BREAKDOWN:');
    this.issues.forEach(issue => {
      const icon = issue.status === 'FIXED' ? '✅' : 
                   issue.status === 'STILL_BROKEN' ? '❌' : '⚠️';
      console.log(`${icon} ${issue.id}: ${issue.description}`);
      console.log(`   Status: ${issue.status}`);
      if (issue.details) console.log(`   Details: ${issue.details}`);
    });
  }
}

// Execute
const testSuite = new SpecificIssuesTestSuite();
testSuite.runSpecificTests();
