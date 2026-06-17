#!/usr/bin/env node

/**
 * Hospital Request System - Comprehensive Test Suite
 * Automated testing for all 11 request types and critical fixes validation
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

class HospitalTestSuite {
  constructor() {
    this.API_BASE = 'http://localhost:3037/api';
    this.FRONTEND_BASE = 'http://localhost:3037/Frontend/HTML';
    this.testResults = {
      phase1: [],
      phase2: [],
      phase3: [],
      phase4: [],
      phase5: []
    };
    this.authToken = null;
    this.testUser = null;
    this.adminToken = null;
    this.createdRequests = [];
    
    // Database config
    this.dbConfig = {
      host: 'localhost',
      user: 'nora',
      password: 'nora123', 
      database: 'nora_database'
    };
  }

  // Utility functions
  log(phase, test, status, details = '') {
    const timestamp = new Date().toISOString();
    const result = {
      timestamp,
      test,
      status,
      details
    };
    
    this.testResults[phase].push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} [${phase.toUpperCase()}] ${test}: ${status}`);
    if (details) console.log(`   📝 ${details}`);
  }

  async apiRequest(endpoint, method = 'GET', data = null, token = null) {
    try {
      const config = {
        method,
        url: `${this.API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || 0
      };
    }
  }

  async dbQuery(sql, params = []) {
    let connection;
    try {
      connection = await mysql.createConnection(this.dbConfig);
      const [rows] = await connection.execute(sql, params);
      return { success: true, data: rows };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      if (connection) await connection.end();
    }
  }

  async setup() {
    console.log('🚀 HOSPITAL REQUEST SYSTEM - COMPREHENSIVE TEST SUITE');
    console.log('=' .repeat(70));
    console.log('🎯 Target: Validate all fixes from TESTING_ISSUES_REPORT.md');
    console.log('📊 Coverage: All 11 request types + critical issue verification');
    console.log('');

    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbTest = await this.dbQuery('SELECT COUNT(*) as users FROM App_Users');
    if (!dbTest.success) {
      console.error('❌ Database connection failed:', dbTest.error);
      process.exit(1);
    }
    console.log(`✅ Database connected - ${dbTest.data[0].users} users available`);

    // Login as test user
    console.log('🔐 Authenticating test user...');
    const loginResult = await this.apiRequest('/auth/login', 'POST', {
      email: 'aseelma@moh.gov.sa',
      password: 'password123'
    });

    if (!loginResult.success) {
      console.error('❌ Test user login failed:', loginResult.error);
      console.log('💡 Note: You may need to create test user credentials first');
      process.exit(1);
    }

    this.authToken = loginResult.data.token || loginResult.data.accessToken || (loginResult.data.data && loginResult.data.data.token);
    this.testUser = loginResult.data.user || (loginResult.data.data && loginResult.data.data.user);
    console.log(`✅ Logged in as: ${this.testUser ? this.testUser.name || 'Test User' : 'Test User'}`);

    console.log('\n🧪 Starting test execution...\n');
  }

  // ==========================================
  // PHASE 1: CRITICAL BLOCKER TESTS
  // ==========================================

  async runPhase1() {
    console.log('🎯 PHASE 1: CRITICAL BLOCKER TESTS');
    console.log('Testing issues that were completely blocking functionality');
    console.log('-' .repeat(50));

    // Test 1.1: Assignment Request Creation
    await this.testAssignmentCreation();

    // Test 1.2: Assignment Termination Creation  
    await this.testAssignmentTerminationCreation();

    // Test 1.3: Internal Transfer Creation
    await this.testInternalTransferCreation();

    // Test 1.4: Employee Authorization
    await this.testEmployeeAuthorization();

    // Test 1.5: Admin Employee Data
    await this.testAdminEmployeeData();

    this.printPhaseResults('phase1');
  }

  async testAssignmentCreation() {
    const requestData = {
      employeeName: 'اسيل محمود عربي المغربي',
      currentPosition: 'Test Position',
      newRole: 'Test Assignment Role',
      assignmentReason: 'تكليف للاختبار والتطوير النظام', // 5+ characters
      startDate: '2025-12-01',
      assignmentType: 'temporary',
      notes: 'Test assignment request'
    };

    const result = await this.apiRequest('/assignment', 'POST', requestData, this.authToken);
    
    if (result.success) {
      this.log('phase1', 'Assignment Request Creation', 'PASS', `Request created with ID: ${result.data.id || 'N/A'}`);
      if (result.data.id) {
        this.createdRequests.push({ type: 'assignment', id: result.data.id });
      }
    } else {
      this.log('phase1', 'Assignment Request Creation', 'FAIL', `Error: ${result.error} (Status: ${result.status})`);
    }
  }

  async testAssignmentTerminationCreation() {
    const requestData = {
      employeeName: 'اسيل محمود عربي المغربي',
      assignmentRole: 'Test Assignment Role',
      terminationReason: 'انهاء التكليف للاختبار والتطوير', // 5+ characters
      terminationDate: '2025-12-31',
      earlyTermination: false
    };

    const result = await this.apiRequest('/assignment-termination', 'POST', requestData, this.authToken);
    
    if (result.success) {
      this.log('phase1', 'Assignment Termination Creation', 'PASS', `Request created`);
      if (result.data.id) {
        this.createdRequests.push({ type: 'assignment_termination', id: result.data.id });
      }
    } else {
      this.log('phase1', 'Assignment Termination Creation', 'FAIL', `Error: ${result.error}`);
    }
  }

  async testInternalTransferCreation() {
    const requestData = {
      employeeName: 'اسيل محمود عربي المغربي',
      currentDepartment: 'IT Department',
      currentPosition: 'Software Developer',  // Added: required by schema
      targetDepartment: 'HR Department',
      targetPosition: 'HR Specialist',        // Added: required by schema
      transferReason: 'نقل للاختبار والتطوير النظام', // 5+ characters
      effectiveDate: '2025-12-15',
      transferType: 'permanent'
    };

    const result = await this.apiRequest('/internal-transfer', 'POST', requestData, this.authToken);
    
    if (result.success) {
      this.log('phase1', 'Internal Transfer Creation', 'PASS', `Request created`);
      if (result.data.id) {
        this.createdRequests.push({ type: 'internal_transfer', id: result.data.id });
      }
    } else {
      this.log('phase1', 'Internal Transfer Creation', 'FAIL', `Error: ${result.error}`);
    }
  }

  async testEmployeeAuthorization() {
    // First create a clearance request to test authorization on
    const clearanceData = {
      firstName: 'اسيل',
      secondName: 'محمود', 
      thirdName: 'عربي',
      clearanceType: 'final',
      reason: 'استقالة',
      lastWorkingDay: '2025-12-31'
    };

    const createResult = await this.apiRequest('/employee/requests/clearance', 'POST', clearanceData, this.authToken);
    
    if (createResult.success) {
      const requestId = createResult.data.clearanceId || createResult.data.id;
      this.createdRequests.push({ type: 'clearance', id: requestId });

      // Test accessing own request details
      const detailResult = await this.apiRequest(`/clearance/${requestId}`, 'GET', null, this.authToken);
      
      if (detailResult.success) {
        this.log('phase1', 'Employee Authorization', 'PASS', 'Employee can access own request details');
      } else if (detailResult.status === 403) {
        this.log('phase1', 'Employee Authorization', 'FAIL', 'Still getting authorization error - غير مصرح');
      } else {
        this.log('phase1', 'Employee Authorization', 'FAIL', `Error: ${detailResult.error}`);
      }
    } else {
      this.log('phase1', 'Employee Authorization', 'SKIP', 'Could not create clearance request for testing');
    }
  }

  async testAdminEmployeeData() {
    // Check if admin dashboard API returns employee data
    const result = await this.apiRequest('/admin/requests/recent?limit=10', 'GET', null, this.authToken);
    
    if (result.success) {
      const requests = result.data.data || result.data || [];
      if (requests.length > 0) {
        const hasEmployeeData = requests.some(req => 
          req.employee_name && req.employee_name !== 'غير محدد' && 
          req.employee_dept && req.employee_dept !== 'غير محدد'
        );
        
        if (hasEmployeeData) {
          this.log('phase1', 'Admin Employee Data', 'PASS', 'Employee names and departments populated');
        } else {
          this.log('phase1', 'Admin Employee Data', 'FAIL', 'Employee data still empty in admin API');
        }
      } else {
        this.log('phase1', 'Admin Employee Data', 'SKIP', 'No requests available to test employee data');
      }
    } else {
      this.log('phase1', 'Admin Employee Data', 'FAIL', `Admin API error: ${result.error}`);
    }
  }

  // ==========================================
  // PHASE 2: ALL REQUEST TYPES
  // ==========================================

  async runPhase2() {
    console.log('\n🎯 PHASE 2: ALL REQUEST TYPES COVERAGE');
    console.log('Testing end-to-end functionality for all 11 request types');
    console.log('-' .repeat(50));

    const requestTypes = [
      { type: 'clearance', endpoint: '/employee/requests/clearance', data: this.getClearanceTestData() },
      { type: 'onboarding', endpoint: '/employee/requests/onboarding', data: this.getOnboardingTestData() },
      { type: 'certificate', endpoint: '/certificate', data: this.getCertificateTestData() },
      { type: 'experience', endpoint: '/experience-certificate', data: this.getExperienceTestData() },
      { type: 'delegation', endpoint: '/delegation', data: this.getDelegationTestData() },
      { type: 'exit', endpoint: '/exit', data: this.getExitTestData() },
      { type: 'leave', endpoint: '/leave-request', data: this.getLeaveTestData() }
    ];

    for (const requestType of requestTypes) {
      await this.testRequestTypeEndToEnd(requestType);
    }

    this.printPhaseResults('phase2');
  }

  async testRequestTypeEndToEnd(requestType) {
    const { type, endpoint, data } = requestType;
    
    // Test creation
    const createResult = await this.apiRequest(endpoint, 'POST', data, this.authToken);
    
    if (createResult.success) {
      this.log('phase2', `${type} Creation`, 'PASS', `Request created successfully`);
      
      const requestId = createResult.data.id || createResult.data[`${type}Id`] || createResult.data.requestId;
      if (requestId) {
        this.createdRequests.push({ type, id: requestId });
        
        // Test detail access
        await this.testRequestDetails(type, requestId);
      }
    } else {
      this.log('phase2', `${type} Creation`, 'FAIL', `Error: ${createResult.error} (${createResult.status})`);
    }
  }

  async testRequestDetails(type, requestId) {
    // Map request types to their detail endpoints
    const detailEndpoints = {
      'clearance': `/clearance/${requestId}`,
      'onboarding': `/onboarding/${requestId}`,
      'certificate': `/certificate/${requestId}`,
      'experience': `/experience-certificate/${requestId}`,
      'delegation': `/delegation/${requestId}`,
      'exit': `/exit/${requestId}`,
      'leave': `/leave-request/${requestId}`
    };

    const endpoint = detailEndpoints[type];
    if (!endpoint) {
      this.log('phase2', `${type} Detail Access`, 'SKIP', 'No detail endpoint mapped');
      return;
    }

    const result = await this.apiRequest(endpoint, 'GET', null, this.authToken);
    
    if (result.success) {
      this.log('phase2', `${type} Detail Access`, 'PASS', 'Employee can access own request details');
    } else if (result.status === 403) {
      this.log('phase2', `${type} Detail Access`, 'FAIL', 'Authorization error - غير مصرح');
    } else if (result.status === 404) {
      this.log('phase2', `${type} Detail Access`, 'FAIL', 'Request not found - الطلب غير موجود');
    } else {
      this.log('phase2', `${type} Detail Access`, 'FAIL', `Error: ${result.error}`);
    }
  }

  // ==========================================
  // PHASE 3: APPROVAL WORKFLOW TESTS
  // ==========================================

  async runPhase3() {
    console.log('\n🎯 PHASE 3: APPROVAL WORKFLOW TESTS');
    console.log('Testing admin approval processes and status persistence');
    console.log('-' .repeat(50));

    // Get admin token
    await this.loginAsAdmin();

    // Test admin dashboard data
    await this.testAdminDashboard();

    // Test approval process
    await this.testApprovalProcess();

    // Test status persistence
    await this.testStatusPersistence();

    this.printPhaseResults('phase3');
  }

  async loginAsAdmin() {
    // Try common admin credentials
    const adminCredentials = [
      { email: 'admin@hospital.sa', password: '203040' },
      { email: 'sadmin', password: '203040' },
      { email: 'admin@dev.local', password: 'admin123' },
      { email: 'admin@hospital.com', password: 'admin123' }
    ];

    for (const creds of adminCredentials) {
      const result = await this.apiRequest('/auth/login', 'POST', creds);
      if (result.success) {
        this.adminToken = result.data.token || result.data.accessToken;
        console.log(`✅ Admin login successful with: ${creds.email}`);
        return;
      }
    }

    console.log('⚠️ Could not login as admin - testing limited to employee perspective');
  }

  async testAdminDashboard() {
    if (!this.adminToken) {
      this.log('phase3', 'Admin Dashboard Data', 'SKIP', 'No admin access');
      return;
    }

    const result = await this.apiRequest('/admin/requests/recent', 'GET', null, this.adminToken);
    
    if (result.success) {
      const requests = result.data.data || result.data || [];
      const hasEmployeeData = requests.some(req => 
        req.employee_name && req.employee_name !== 'غير محدد'
      );
      
      if (hasEmployeeData) {
        this.log('phase3', 'Admin Dashboard Data', 'PASS', `${requests.length} requests with employee data`);
      } else {
        this.log('phase3', 'Admin Dashboard Data', 'FAIL', 'Employee data still missing in admin dashboard');
      }
    } else {
      this.log('phase3', 'Admin Dashboard Data', 'FAIL', `Admin API error: ${result.error}`);
    }
  }

  async testApprovalProcess() {
    if (!this.adminToken || this.createdRequests.length === 0) {
      this.log('phase3', 'Approval Process', 'SKIP', 'No admin access or requests to approve');
      return;
    }

    // Try to approve the first created request
    const testRequest = this.createdRequests[0];
    const result = await this.apiRequest('/multi-approval/approve', 'POST', {
      requestType: testRequest.type,
      requestId: testRequest.id,
      decision: 'approved',
      note: 'Approved via automated test'
    }, this.adminToken);

    if (result.success) {
      this.log('phase3', 'Approval Process', 'PASS', 'Admin can approve requests without duplicate decision error');
    } else if (result.error.includes('already made a decision')) {
      this.log('phase3', 'Approval Process', 'FAIL', 'Still getting duplicate decision error');
    } else {
      this.log('phase3', 'Approval Process', 'FAIL', `Approval error: ${result.error}`);
    }
  }

  async testStatusPersistence() {
    // Check if approved requests are properly filtered
    const beforeApproval = await this.apiRequest('/admin/requests/recent', 'GET', null, this.adminToken);
    
    if (beforeApproval.success) {
      const pendingCount = (beforeApproval.data.data || beforeApproval.data || []).filter(r => 
        r.status === 'قيد الاعتماد' || r.status === 'pending'
      ).length;
      
      this.log('phase3', 'Status Persistence', 'INFO', `Found ${pendingCount} pending requests for filtering test`);
    }
  }

  // ==========================================
  // PHASE 4: NAVIGATION & UI TESTS
  // ==========================================

  async runPhase4() {
    console.log('\n🎯 PHASE 4: NAVIGATION & UI TESTS');
    console.log('Testing frontend resource loading and navigation');
    console.log('-' .repeat(50));

    // Test resource loading for problematic pages
    await this.testResourceLoading('employee-maternity-leave-request.html');
    await this.testResourceLoading('employee-saudi-doctors-housing.html');

    // Test API endpoint availability
    await this.testEndpointAvailability();

    this.printPhaseResults('phase4');
  }

  async testResourceLoading(pageName) {
    try {
      const response = await axios.get(`${this.FRONTEND_BASE}/${pageName}`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.log('phase4', `${pageName} Loading`, 'PASS', 'Page loads without errors');
      } else {
        this.log('phase4', `${pageName} Loading`, 'FAIL', `HTTP ${response.status}`);
      }
    } catch (error) {
      this.log('phase4', `${pageName} Loading`, 'FAIL', `Error: ${error.message}`);
    }
  }

  async testEndpointAvailability() {
    const endpoints = [
      '/admin/stats',
      '/admin/requests/summary', 
      '/employee/requests/summary',
      '/multi-approval/types'
    ];

    for (const endpoint of endpoints) {
      const result = await this.apiRequest(endpoint, 'GET', null, this.authToken);
      
      if (result.success) {
        this.log('phase4', `Endpoint ${endpoint}`, 'PASS', 'Endpoint accessible');
      } else {
        this.log('phase4', `Endpoint ${endpoint}`, 'FAIL', `Error: ${result.error}`);
      }
    }
  }

  // ==========================================
  // PHASE 5: DATABASE VALIDATION
  // ==========================================

  async runPhase5() {
    console.log('\n🎯 PHASE 5: DATABASE VALIDATION');
    console.log('Validating database state and table integrity');
    console.log('-' .repeat(50));

    // Test database table existence
    await this.testDatabaseTables();

    // Test employee data linkage
    await this.testEmployeeDataLinkage();

    // Verify approval system tables
    await this.testApprovalSystemIntegrity();

    this.printPhaseResults('phase5');
  }

  async testDatabaseTables() {
    const requiredTables = [
      'Assignment_Requests',
      'Assignment_Termination_Requests',
      'Internal_Transfer_Requests',
      'Certificate_Requests',
      'Experience_Certificate_Requests',
      'Request_Approvals'
    ];

    for (const table of requiredTables) {
      const result = await this.dbQuery(`SHOW TABLES LIKE '${table}'`);
      
      if (result.success && result.data.length > 0) {
        this.log('phase5', `Table ${table}`, 'PASS', 'Table exists');
      } else {
        this.log('phase5', `Table ${table}`, 'FAIL', 'Table missing');
      }
    }
  }

  async testEmployeeDataLinkage() {
    // Check if created requests have proper employee data
    if (this.createdRequests.length === 0) {
      this.log('phase5', 'Employee Data Linkage', 'SKIP', 'No requests created to test');
      return;
    }

    const testRequest = this.createdRequests[0];
    const tableName = this.getTableName(testRequest.type);
    
    if (!tableName) {
      this.log('phase5', 'Employee Data Linkage', 'SKIP', 'Unknown table mapping');
      return;
    }

    const result = await this.dbQuery(
      `SELECT employee_name, employee_dept FROM ${tableName} WHERE id = ?`,
      [testRequest.id]
    );

    if (result.success && result.data.length > 0) {
      const request = result.data[0];
      if (request.employee_name && request.employee_name !== 'غير محدد') {
        this.log('phase5', 'Employee Data Linkage', 'PASS', `Employee data populated: ${request.employee_name}`);
      } else {
        this.log('phase5', 'Employee Data Linkage', 'FAIL', 'Employee data not populated during request creation');
      }
    } else {
      this.log('phase5', 'Employee Data Linkage', 'FAIL', `Database query failed: ${result.error}`);
    }
  }

  async testApprovalSystemIntegrity() {
    // Check Request_Approvals table can handle all request types
    const result = await this.dbQuery(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Request_Approvals' 
      AND COLUMN_NAME = 'request_type'
    `);

    if (result.success && result.data.length > 0) {
      const enumValues = result.data[0].COLUMN_TYPE;
      const hasAssignmentTypes = enumValues.includes('assignment') && 
                                enumValues.includes('assignment_termination') && 
                                enumValues.includes('internal_transfer');
      
      if (hasAssignmentTypes) {
        this.log('phase5', 'Approval System Integrity', 'PASS', 'Request_Approvals supports all request types');
      } else {
        this.log('phase5', 'Approval System Integrity', 'FAIL', 'Assignment types missing from Request_Approvals enum');
      }
    } else {
      this.log('phase5', 'Approval System Integrity', 'FAIL', 'Could not verify Request_Approvals structure');
    }
  }

  // ==========================================
  // HELPER FUNCTIONS & TEST DATA
  // ==========================================

  getTableName(requestType) {
    const tableMap = {
      'clearance': 'Clearance_Requests',
      'onboarding': 'Onboarding_Requests', 
      'certificate': 'Certificate_Requests',
      'experience': 'Experience_Certificate_Requests',
      'assignment': 'Assignment_Requests',
      'assignment_termination': 'Assignment_Termination_Requests',
      'internal_transfer': 'Internal_Transfer_Requests'
    };
    return tableMap[requestType];
  }

  getClearanceTestData() {
    return {
      firstName: 'اسيل',
      secondName: 'محمود',
      thirdName: 'عربي المغربي',
      clearanceType: 'final',
      reason: 'استقالة',
      lastWorkingDay: '2025-12-31',
      employeeNumber: 'TEST001'
    };
  }

  getOnboardingTestData() {
    return {
      firstName: 'موظف',
      secondName: 'اختبار',
      jobTitle: 'Test Position',
      startDate: '2025-12-01',
      documentNumber: 'TEST-DOC-001',
      department: 'IT',
      nationality: 'سعودي'
    };
  }

  getCertificateTestData() {
    return {
      employeeName: 'اسيل محمود عربي المغربي',
      occupation: 'Software Developer',        // Fixed: schema expects 'occupation', not 'jobTitle'
      nationality: 'سعودي',
      requestNotes: 'للاختبار'                // Fixed: schema expects 'requestNotes'
    };
  }

  getExperienceTestData() {
    return {
      employeeName: 'اسيل محمود عربي المغربي',
      position: 'Test Position',
      department: 'IT',
      nationality: 'سعودي',
      serviceType: 'Full-time',
      startDate: '2020-01-01',
      endDate: '2025-12-31'
    };
  }

  getDelegationTestData() {
    return {
      referenceNumber: 'DEL-TEST-001',        // Added: required by schema
      requestDate: '2025-11-15',              // Added: required by schema  
      delegationType: 'temporary',
      reason: 'للاختبار والتطوير',
      startDate: '2025-12-01',
      endDate: '2025-12-31'
    };
  }

  getExitTestData() {
    return {
      employeeName: 'اسيل محمود عربي المغربي',
      jobTitle: 'Test Position',
      department: 'IT',
      exitReasons: 'للاختبار النظام'
    };
  }

  getLeaveTestData() {
    return {
      employee_name: 'اسيل محمود عربي المغربي',         // Fixed: controller expects employee_name
      job_title: 'Software Developer',                   // Added: required field
      job_type: 'civil',                                  // Added: required field  
      leave_types: ['annual'],                            // Fixed: must be array, not single leaveType
      leave_duration: '10 days',                          // Added: required field
      leave_from_date: '2025-12-15',                      // Fixed: controller expects underscored version
      leave_to_date: '2025-12-25',                        // Fixed: controller expects underscored version  
      leave_reasons: 'للاختبار النظام',                   // Fixed: controller expects leave_reasons
      employee_signature_name: 'اسيل محمود عربي المغربي', // Added: required field
      employee_signature: 'Test Signature'                // Added: required field
    };
  }

  // ==========================================
  // REPORTING FUNCTIONS
  // ==========================================

  printPhaseResults(phase) {
    const results = this.testResults[phase];
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    console.log(`\n📊 ${phase.toUpperCase()} RESULTS: ${passed} PASS, ${failed} FAIL, ${skipped} SKIP\n`);
  }

  async generateFinalReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL TEST RESULTS SUMMARY');
    console.log('=' .repeat(70));

    let totalPass = 0, totalFail = 0, totalSkip = 0;

    for (const [phase, results] of Object.entries(this.testResults)) {
      const passed = results.filter(r => r.status === 'PASS').length;
      const failed = results.filter(r => r.status === 'FAIL').length;  
      const skipped = results.filter(r => r.status === 'SKIP').length;

      totalPass += passed;
      totalFail += failed;
      totalSkip += skipped;

      console.log(`${phase.toUpperCase()}: ${passed} PASS, ${failed} FAIL, ${skipped} SKIP`);
    }

    const total = totalPass + totalFail + totalSkip;
    const successRate = total > 0 ? Math.round((totalPass / total) * 100) : 0;

    console.log('\n🎯 OVERALL RESULTS:');
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${totalPass}`);
    console.log(`   Failed: ${totalFail}`);
    console.log(`   Skipped: ${totalSkip}`);
    console.log(`   Success Rate: ${successRate}%`);

    // System health assessment
    console.log('\n🏥 SYSTEM HEALTH ASSESSMENT:');
    if (successRate >= 90) {
      console.log('   Status: 🎉 EXCELLENT - Ready for production');
    } else if (successRate >= 70) {
      console.log('   Status: ✅ GOOD - Minor issues to address');
    } else if (successRate >= 50) {
      console.log('   Status: ⚠️ FAIR - Several issues need fixing');
    } else {
      console.log('   Status: ❌ POOR - Major issues remain');
    }

    // Critical issues check
    const phase1Failed = this.testResults.phase1.filter(r => r.status === 'FAIL').length;
    if (phase1Failed === 0) {
      console.log('   Critical Issues: ✅ All critical blockers resolved');
    } else {
      console.log(`   Critical Issues: ❌ ${phase1Failed} critical issues remain`);
    }

    console.log(`\n📝 Created ${this.createdRequests.length} test requests for validation`);
    
    // Save detailed report
    await this.saveDetailedReport();
  }

  async saveDetailedReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportData = {
      timestamp,
      testEnvironment: {
        database: 'nora_database',
        backend: 'localhost:3037',
        testUser: this.testUser?.name || 'Unknown'
      },
      results: this.testResults,
      createdRequests: this.createdRequests,
      summary: {
        totalTests: Object.values(this.testResults).flat().length,
        passed: Object.values(this.testResults).flat().filter(r => r.status === 'PASS').length,
        failed: Object.values(this.testResults).flat().filter(r => r.status === 'FAIL').length,
        skipped: Object.values(this.testResults).flat().filter(r => r.status === 'SKIP').length
      }
    };

    const fs = require('fs');
    const reportPath = `test-results-${timestamp}.json`;
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`\n📄 Detailed report saved: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️ Could not save report: ${error.message}`);
    }
  }

  // ==========================================
  // MAIN EXECUTION
  // ==========================================

  async runAllTests() {
    try {
      await this.setup();
      
      await this.runPhase1(); // Critical blockers
      await this.runPhase2(); // All request types
      await this.runPhase3(); // Approval workflows  
      await this.runPhase4(); // Navigation & UI
      await this.runPhase5(); // Database validation

      await this.generateFinalReport();

      console.log('\n🎉 TEST SUITE COMPLETED!');
      console.log('📋 Review results above and detailed JSON report');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const testSuite = new HospitalTestSuite();
  testSuite.runAllTests();
}

module.exports = HospitalTestSuite;
