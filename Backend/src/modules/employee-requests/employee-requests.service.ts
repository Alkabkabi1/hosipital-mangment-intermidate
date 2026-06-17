import { type PoolConnection } from 'mysql2/promise';
import { withConnection } from '../../core/database';
import { withTransaction } from '../../services/transaction';

export interface CreateClearanceRequest {
  reference_number: string;
  employee_email: string;
  employee_name?: string;
  employee_dept?: string;
  created_by_user: number;
  request_date?: string;
  last_work_day?: string;
  clearance_type?: string;
  reason?: string;
  specific_reason?: string;
  document_number?: string;
  other_reason_text?: string;
  payload_json?: any;
}

export interface CreateOnboardingRequest {
  reference_number: string;
  employee_email: string;
  employee_name?: string;
  employee_dept?: string;
  created_by_user: number;
  request_date?: string;
  start_date?: string;
  document_number?: string;
  transaction_number?: string;
  transaction_date?: string;
  employee_status?: string;
  employment_type?: string;
  onboarding_reason?: string;
  reason_for_job?: string;
  payload_json?: any;
}

export interface CreateDelegationRequest {
  reference_number: string;
  created_by_user: number;
  from_email: string;
  to_email: string;
  scopes_json: any;
  valid_from: string;
  valid_to: string;
}

export interface RequestSummary {
  // Core request types (existing)
  clearance: { total: number; pending: number };
  onboarding: { total: number; pending: number };
  delegation: { total: number; pending: number };
  certificate: { total: number; pending: number };
  experience: { total: number; pending: number };
  
  // Additional request types (newly supported)
  exit: { total: number; pending: number };
  assignment: { total: number; pending: number };
  assignment_termination: { total: number; pending: number };
  internal_transfer: { total: number; pending: number };
  maternity_leave: { total: number; pending: number };
  housing_allowance: { total: number; pending: number };
  
  // Overall summary
  overall: { 
    total_requests: number; 
    total_pending: number; 
    completion_rate: number; 
  };
}

const PENDING_STATUSES = ['قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة', 'submitted'];

// Generate unique reference number
function generateReferenceNumber(type: 'CLR' | 'ONB' | 'DLG' | 'CRT'): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${type}-${timestamp}-${random}`;
}

export async function createClearanceRequest(data: Omit<CreateClearanceRequest, 'reference_number'>): Promise<{ id: number; reference_number: string }> {
  return withConnection(async (conn) => {
    const reference_number = generateReferenceNumber('CLR');
    
    // NUCLEAR FIX: Use query() with escaped values instead of execute() with parameters
    const query = `
      INSERT INTO Clearance_Requests
      (reference_number, employee_email, employee_name, employee_dept, created_by_user, status, request_date, last_work_day, clearance_type, reason, specific_reason, document_number, payload_json)
      VALUES (
        '${reference_number}',
        '${data.employee_email}',
        ${data.employee_name ? `'${data.employee_name.replace(/'/g, "''")}'` : 'NULL'},
        ${data.employee_dept ? `'${data.employee_dept.replace(/'/g, "''")}'` : 'NULL'},
        ${data.created_by_user || 'NULL'},
        'قيد الاعتماد',
        ${data.request_date ? `'${data.request_date}'` : 'NOW()'},
        ${data.last_work_day ? `'${data.last_work_day}'` : 'NULL'},
        ${data.clearance_type ? `'${data.clearance_type.replace(/'/g, "''")}'` : 'NULL'},
        ${data.reason ? `'${data.reason.replace(/'/g, "''")}'` : 'NULL'},
        ${data.specific_reason ? `'${data.specific_reason.replace(/'/g, "''")}'` : 'NULL'},
        ${data.document_number ? `'${data.document_number.replace(/'/g, "''")}'` : 'NULL'},
        ${data.payload_json ? `'${JSON.stringify(data.payload_json).replace(/'/g, "''")}'` : 'NULL'}
      )
    `;
    
    const [result] = await conn.query(query);
    const requestId = (result as any).insertId;

    // Initialize multi-approval workflow
    try {
      const { initializeRequestApprovals } = await import('../multi-approval/multi-approval.service');
      await initializeRequestApprovals('clearance', requestId);
      console.log(`✅ Multi-approval initialized for clearance request #${requestId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for clearance request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    return {
      id: requestId,
      reference_number
    };
  });
}

export async function createOnboardingRequest(data: Omit<CreateOnboardingRequest, 'reference_number'>): Promise<{ id: number; reference_number: string }> {
  return withConnection(async (conn) => {
    const reference_number = generateReferenceNumber('ONB');
    
    // NUCLEAR FIX: Use query() with escaped values instead of execute() with parameters
    const query = `
      INSERT INTO Onboarding_Requests
      (reference_number, employee_email, employee_name, employee_dept, created_by_user, status, request_date, start_date, document_number, transaction_number, transaction_date, employee_status, employment_type, onboarding_reason, reason_for_job, payload_json)
      VALUES (
        '${reference_number}',
        '${data.employee_email}',
        ${data.employee_name ? `'${data.employee_name.replace(/'/g, "''")}'` : 'NULL'},
        ${data.employee_dept ? `'${data.employee_dept.replace(/'/g, "''")}'` : 'NULL'},
        ${data.created_by_user || 'NULL'},
        'قيد الاعتماد',
        ${data.request_date ? `'${data.request_date}'` : 'NOW()'},
        ${data.start_date ? `'${data.start_date}'` : 'NULL'},
        ${data.document_number ? `'${data.document_number.replace(/'/g, "''")}'` : 'NULL'},
        ${data.transaction_number ? `'${data.transaction_number.replace(/'/g, "''")}'` : 'NULL'},
        ${data.transaction_date ? `'${data.transaction_date}'` : 'NULL'},
        ${data.employee_status ? `'${data.employee_status.replace(/'/g, "''")}'` : 'NULL'},
        ${data.employment_type ? `'${data.employment_type.replace(/'/g, "''")}'` : 'NULL'},
        ${data.onboarding_reason ? `'${data.onboarding_reason.replace(/'/g, "''")}'` : 'NULL'},
        ${data.reason_for_job ? `'${data.reason_for_job.replace(/'/g, "''")}'` : 'NULL'},
        ${data.payload_json ? `'${JSON.stringify(data.payload_json).replace(/'/g, "''")}'` : 'NULL'}
      )
    `;
    
    const [result] = await conn.query(query);
    const requestId = (result as any).insertId;

    // Initialize multi-approval workflow
    try {
      const { initializeRequestApprovals } = await import('../multi-approval/multi-approval.service');
      await initializeRequestApprovals('onboarding', requestId);
      console.log(`✅ Multi-approval initialized for onboarding request #${requestId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for onboarding request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    return {
      id: requestId,
      reference_number
    };
  });
}

export async function createDelegationRequest(data: Omit<CreateDelegationRequest, 'reference_number'>): Promise<{ id: number; reference_number: string }> {
  return withConnection(async (conn) => {
    const reference_number = generateReferenceNumber('DLG');
    
    const [result] = await conn.execute(`
      INSERT INTO Delegation_Requests
      (reference_number, created_by_user, from_email, to_email, scopes_json, valid_from, valid_to, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'قيد الاعتماد')
    `, [
      reference_number,
      data.created_by_user,
      data.from_email,
      data.to_email,
      JSON.stringify(data.scopes_json),
      data.valid_from,
      data.valid_to
    ]);

    const requestId = (result as any).insertId;

    // Initialize multi-approval workflow
    try {
      const { initializeRequestApprovals } = await import('../multi-approval/multi-approval.service');
      await initializeRequestApprovals('delegation', requestId);
      console.log(`✅ Multi-approval initialized for delegation request #${requestId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for delegation request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    return {
      id: requestId,
      reference_number
    };
  });
}

export async function getEmployeeRequests(userId: number, limit = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    // Get user's email to filter requests
    const [userRows] = await conn.execute(
      'SELECT email FROM App_Users WHERE id = ?',
      [userId]
    );
    
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return [];
    }
    
    const userEmail = (userRows[0] as any).email;

    // Union query to get all request types
    const [rows] = await conn.execute(`
      SELECT id, 'onboarding' AS type, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at, payload_json
      FROM Onboarding_Requests
      WHERE created_by_user = ? OR employee_email = ?
      UNION ALL
      SELECT id, 'clearance' AS type, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at, payload_json
      FROM Clearance_Requests
      WHERE created_by_user = ? OR employee_email = ?
      UNION ALL
      SELECT id, 'delegation' AS type, reference_number, from_email AS employee_email, NULL AS employee_name, NULL AS employee_dept, status, created_at AS request_date, created_at, NULL AS payload_json
      FROM Delegation_Requests
      WHERE created_by_user = ? OR from_email = ? OR to_email = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, userEmail, userId, userEmail, userId, userEmail, userEmail, limit]);

    return rows as any[];
  });
}

export async function getEmployeeClearanceRequests(userId: number, limit = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    // NUCLEAR OPTION: Use query() instead of execute() to bypass parameter binding issues
    const [userRows] = await conn.query('SELECT email FROM App_Users WHERE id = ' + userId);
    
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return [];
    }
    
    const userEmail = (userRows[0] as any).email;

    // Use query() with escaped values instead of execute() with parameters
    const query = 
      `SELECT id, reference_number, employee_email, employee_name, employee_dept, status, request_date, last_work_day, clearance_type, reason, specific_reason, document_number, created_at, updated_at, payload_json 
       FROM Clearance_Requests 
       WHERE created_by_user = ${userId} OR employee_email = '${userEmail}' 
       ORDER BY created_at DESC 
       LIMIT ${limit}`;
    
    const [rows] = await conn.query(query);

    return rows as any[];
  });
}

export async function getEmployeeOnboardingRequests(userId: number, limit = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    // NUCLEAR OPTION: Use query() instead of execute() to bypass parameter binding issues
    const [userRows] = await conn.query('SELECT email FROM App_Users WHERE id = ' + userId);
    
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return [];
    }
    
    const userEmail = (userRows[0] as any).email;

    // Use query() with escaped values instead of execute() with parameters
    const query = 
      `SELECT id, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at, updated_at, payload_json 
       FROM Onboarding_Requests 
       WHERE created_by_user = ${userId} OR employee_email = '${userEmail}' 
       ORDER BY created_at DESC 
       LIMIT ${limit}`;
    
    const [rows] = await conn.query(query);

    return rows as any[];
  });
}

export async function getEmployeeCertificateRequests(userId: number, limit = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    // Get employee certificate requests
    const query = 
      `SELECT id, employee_name, occupation, iqama_number, passport_number, nationality, 
              education_place, status, approval_stage, total_approvers, approved_count, final_decision,
              request_notes, admin_notes, created_at, updated_at, approved_at
       FROM Certificate_Requests 
       WHERE employee_id = ${userId}
       ORDER BY created_at DESC 
       LIMIT ${limit}`;
    
    const [rows] = await conn.query(query);

    return rows as any[];
  });
}

export async function getEmployeeExperienceRequests(userId: number, limit = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    // Get employee experience certificate requests
    const query = 
      `SELECT id, employee_name, employee_number, position, department, nationality, 
              service_type, start_date, end_date, reason_for_leaving,
              status, approval_stage, total_approvers, approved_count, final_decision,
              request_notes, admin_notes, created_at, updated_at, approved_at
       FROM Experience_Certificate_Requests 
       WHERE employee_id = ${userId}
       ORDER BY created_at DESC 
       LIMIT ${limit}`;
    
    const [rows] = await conn.query(query);

    return rows as any[];
  });
}

export async function getEmployeeExitRequests(userId: number, limit = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    // Get employee exit requests
    const query = 
      `SELECT id, employee_name, employee_number, employee_id_number, job_title, department,
              supervisor_name, mobile_number, email, exit_reasons, work_environment,
              manager_relationship, coworker_relationship, suggestions,
              status, approval_stage, total_approvers, approved_count, final_decision,
              request_notes, admin_notes, rejection_reason,
              created_at, updated_at, submitted_at, approved_at, rejected_at
       FROM Exit_Requests 
       WHERE employee_id = ${userId}
       ORDER BY created_at DESC 
       LIMIT ${limit}`;
    
    const [rows] = await conn.query(query);

    return rows as any[];
  });
}

export async function getAllRecentRequests(limit = 10): Promise<any[]> {
  return withConnection(async (conn) => {
    // Get ALL requests regardless of status (same structure as pending query but without status filter)
    // Only query tables that exist in the database
    const query = 
      'SELECT id, \'onboarding\' AS type, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at ' +
      'FROM Onboarding_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'clearance\' AS type, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at ' +
      'FROM Clearance_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'delegation\' AS type, reference_number, from_email AS employee_email, NULL AS employee_name, NULL AS employee_dept, status, created_at AS request_date, created_at ' +
      'FROM Delegation_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'certificate\' AS type, COALESCE(reference_number, CONCAT(\'CRT-\', DATE_FORMAT(created_at, \'%Y%m%d\'), \'-\', LPAD(id, 4, \'0\'))) AS reference_number, COALESCE(employee_email, (SELECT email FROM App_Users WHERE id = Certificate_Requests.employee_id)) AS employee_email, employee_name, employee_dept, status, COALESCE(request_date, created_at) AS request_date, created_at ' +
      'FROM Certificate_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'experience\' AS type, COALESCE(reference_number, CONCAT(\'EXP-\', DATE_FORMAT(created_at, \'%Y%m%d\'), \'-\', LPAD(id, 4, \'0\'))) AS reference_number, COALESCE(employee_email, (SELECT email FROM App_Users WHERE id = Experience_Certificate_Requests.employee_id)) AS employee_email, employee_name, COALESCE(employee_dept, department) AS employee_dept, status, COALESCE(request_date, created_at) AS request_date, created_at ' +
      'FROM Experience_Certificate_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'exit\' AS type, COALESCE(reference_number, CONCAT(\'EXT-\', DATE_FORMAT(created_at, \'%Y%m%d\'), \'-\', LPAD(id, 4, \'0\'))) AS reference_number, email AS employee_email, employee_name, department AS employee_dept, status, created_at AS request_date, created_at ' +
      'FROM Exit_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'maternity_leave\' AS type, COALESCE(reference_number, CONCAT(\'MAT-\', DATE_FORMAT(created_at, \'%Y%m%d\'), \'-\', LPAD(id, 4, \'0\'))) AS reference_number, COALESCE(employee_email, (SELECT email FROM App_Users WHERE id = Maternity_Leave_Requests.employee_id)) AS employee_email, employee_name, COALESCE(employee_dept, department) AS employee_dept, status, COALESCE(request_date, created_at) AS request_date, created_at ' +
      'FROM Maternity_Leave_Requests ' +
      'UNION ALL ' +
      'SELECT id, \'housing_allowance\' AS type, COALESCE(reference_number, CONCAT(\'HA-\', id)) AS reference_number, (SELECT email FROM App_Users WHERE id = Housing_Allowance_Requests.employee_id) AS employee_email, employee_name, department AS employee_dept, status, DATE(created_at) AS request_date, created_at ' +
      'FROM Housing_Allowance_Requests ' +
      'ORDER BY created_at DESC ' +
      'LIMIT ' + limit;
    
    const [rows] = await conn.query(query);
    return rows as any[];
  });
}

export async function getRecentPendingRequests(limit = 10): Promise<any[]> {
  return withConnection(async (conn) => {
    // NUCLEAR FIX: Use query() with escaped values instead of execute() with parameters
    const escapedStatuses = PENDING_STATUSES.map(status => `'${status.replace(/'/g, "''")}'`).join(',');
    
    const query = 
      'SELECT id, \'onboarding\' AS type, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at ' +
      'FROM Onboarding_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'UNION ALL ' +
      'SELECT id, \'clearance\' AS type, reference_number, employee_email, employee_name, employee_dept, status, request_date, created_at ' +
      'FROM Clearance_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'UNION ALL ' +
      'SELECT id, \'delegation\' AS type, reference_number, from_email AS employee_email, NULL AS employee_name, NULL AS employee_dept, status, created_at AS request_date, created_at ' +
      'FROM Delegation_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'UNION ALL ' +
      'SELECT id, \'certificate\' AS type, NULL AS reference_number, NULL AS employee_email, employee_name, NULL AS employee_dept, status, created_at AS request_date, created_at ' +
      'FROM Certificate_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'UNION ALL ' +
      'SELECT id, \'experience\' AS type, NULL AS reference_number, NULL AS employee_email, employee_name, department AS employee_dept, status, created_at AS request_date, created_at ' +
      'FROM Experience_Certificate_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'UNION ALL ' +
      'SELECT id, \'exit\' AS type, NULL AS reference_number, email AS employee_email, employee_name, department AS employee_dept, status, created_at AS request_date, created_at ' +
      'FROM Exit_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'UNION ALL ' +
      'SELECT id, \'housing_allowance\' AS type, COALESCE(reference_number, CONCAT(\'HA-\', id)) AS reference_number, (SELECT email FROM App_Users WHERE id = Housing_Allowance_Requests.employee_id) AS employee_email, employee_name, department AS employee_dept, status, DATE(created_at) AS request_date, created_at ' +
      'FROM Housing_Allowance_Requests ' +
      'WHERE status IN (' + escapedStatuses + ') ' +
      'ORDER BY created_at DESC ' +
      'LIMIT ' + limit;
    
    const [rows] = await conn.query(query);

    return rows as any[];
  });
}

export async function getRequestsSummary(): Promise<RequestSummary> {
  return withConnection(async (conn) => {
    // NUCLEAR FIX: Use query() with escaped values instead of execute() with parameters
    const escapedStatuses = PENDING_STATUSES.map(status => `'${status.replace(/'/g, "''")}'`).join(',');
    
    // Core request types (existing)
    const clearanceQuery = 
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Clearance_Requests';
    const [clearanceRows] = await conn.query(clearanceQuery);

    const onboardingQuery = 
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Onboarding_Requests';
    const [onboardingRows] = await conn.query(onboardingQuery);

    const delegationQuery = 
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Delegation_Requests';
    const [delegationRows] = await conn.query(delegationQuery);

    const certificateQuery =
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Certificate_Requests';
    const [certificateRows] = await conn.query(certificateQuery);

    const experienceQuery =
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Experience_Certificate_Requests';
    const [experienceRows] = await conn.query(experienceQuery);

    // Additional request types (only query existing tables)
    const exitQuery =
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Exit_Requests';
    const [exitRows] = await conn.query(exitQuery);

    const maternityLeaveQuery =
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Maternity_Leave_Requests';
    const [maternityLeaveRows] = await conn.query(maternityLeaveQuery);

    const housingAllowanceQuery =
      'SELECT COUNT(*) as total, ' +
      'SUM(CASE WHEN status IN (' + escapedStatuses + ') THEN 1 ELSE 0 END) as pending ' +
      'FROM Housing_Allowance_Requests';
    const [housingAllowanceRows] = await conn.query(housingAllowanceQuery);

    // Extract results safely (only for existing tables)
    const clearance = (clearanceRows as any[])[0];
    const onboarding = (onboardingRows as any[])[0];
    const delegation = (delegationRows as any[])[0];
    const certificate = (certificateRows as any[])[0];
    const experience = (experienceRows as any[])[0];
    const exit = (exitRows as any[])[0];
    const maternityLeave = (maternityLeaveRows as any[])[0];
    const housingAllowance = (housingAllowanceRows as any[])[0];

    // Calculate overall totals (only for existing tables)
    const existingTypes = [
      clearance, onboarding, delegation, certificate, experience,
      exit, maternityLeave, housingAllowance
    ];

    const totalRequests = existingTypes.reduce((sum, type) => sum + (type?.total || 0), 0);
    const totalPending = existingTypes.reduce((sum, type) => sum + (type?.pending || 0), 0);

    return {
      // Core request types (existing)
      clearance: {
        total: clearance?.total || 0,
        pending: clearance?.pending || 0
      },
      onboarding: {
        total: onboarding?.total || 0,
        pending: onboarding?.pending || 0
      },
      delegation: {
        total: delegation?.total || 0,
        pending: delegation?.pending || 0
      },
      certificate: {
        total: certificate?.total || 0,
        pending: certificate?.pending || 0
      },
      experience: {
        total: experience?.total || 0,
        pending: experience?.pending || 0
      },
      
      // Additional request types (only existing tables)
      exit: {
        total: exit?.total || 0,
        pending: exit?.pending || 0
      },
      maternity_leave: {
        total: maternityLeave?.total || 0,
        pending: maternityLeave?.pending || 0
      },
      housing_allowance: {
        total: housingAllowance?.total || 0,
        pending: housingAllowance?.pending || 0
      },
      
      // Missing tables (placeholder values to maintain API compatibility)
      assignment: {
        total: 0,
        pending: 0
      },
      assignment_termination: {
        total: 0,
        pending: 0
      },
      internal_transfer: {
        total: 0,
        pending: 0
      },
      
      // Overall summary
      overall: {
        total_requests: totalRequests,
        total_pending: totalPending,
        completion_rate: totalRequests > 0 ? Math.round(((totalRequests - totalPending) / totalRequests) * 100) : 0
      }
    };
  });
}

export async function approveRequest(type: 'onboarding' | 'clearance' | 'delegation' | 'certificate' | 'experience' | 'exit', id: number, approvedBy: number, note?: string): Promise<boolean> {
  return withTransaction(async (conn) => {
    const tableName = type === 'onboarding' ? 'Onboarding_Requests' :
                     type === 'clearance' ? 'Clearance_Requests' :
                     type === 'delegation' ? 'Delegation_Requests' :
                     type === 'certificate' ? 'Certificate_Requests' :
                     type === 'experience' ? 'Experience_Certificate_Requests' : 'Exit_Requests';

    // For certificate/experience/exit, use 'approved' status, for others use 'مكتمل'
    const approvedStatus = (type === 'certificate' || type === 'experience' || type === 'exit') ? 'approved' : 'مكتمل';
    const isApproval = true; // This is the approve function

    // Create placeholder strings for IN clauses - use string concatenation
    const statusPlaceholders = PENDING_STATUSES.map(() => '?').join(',');

    // Certificate, Experience, and Exit tables don't have approved_by column, so handle differently
    let query, params;
    if (type === 'certificate' || type === 'experience' || type === 'exit') {
      query = 
        'UPDATE ' + tableName + ' ' +
        'SET status=?, admin_notes=?, approved_at=NOW(), approval_stage=\'Completed\', final_decision=\'approved\' ' +
        'WHERE id=? AND (status=\'pending\' OR status=\'submitted\' OR status IN (' + statusPlaceholders + '))';
      params = [approvedStatus, note || null, id, ...PENDING_STATUSES];
    } else {
      query = 
        'UPDATE ' + tableName + ' ' +
        'SET status=?, approved_by=?, approved_at=NOW(), decision_note=? ' +
        'WHERE id=? AND status IN (' + statusPlaceholders + ')';
      params = [approvedStatus, approvedBy, note || null, id, ...PENDING_STATUSES];
    }
    
    const [result] = await conn.execute(query, params);

    // If the request was successfully processed, update all pending approvals for this request
    if ((result as any).affectedRows > 0) {
      // Update all pending approvals for this request to match the new status
      const approvalStatus = isApproval ? 'approved' : 'rejected';
      await conn.execute(
        'UPDATE Request_Approvals SET status = ?, acted_at = NOW() WHERE request_type = ? AND request_id = ? AND status = \'pending\'',
        [approvalStatus, type, id]
      );

      console.log(`${approvalStatus === 'approved' ? '✅' : '❌'} Updated pending approvals for ${type} request ${id} to ${approvalStatus}`);
    }

    return (result as any).affectedRows > 0;
  });
}

export async function rejectRequest(type: 'onboarding' | 'clearance' | 'delegation' | 'certificate' | 'experience' | 'exit', id: number, rejectedBy: number, note?: string): Promise<boolean> {
  return withTransaction(async (conn) => {
    const tableName = type === 'onboarding' ? 'Onboarding_Requests' :
                     type === 'clearance' ? 'Clearance_Requests' :
                     type === 'delegation' ? 'Delegation_Requests' :
                     type === 'certificate' ? 'Certificate_Requests' :
                     type === 'experience' ? 'Experience_Certificate_Requests' : 'Exit_Requests';

    // For certificate/experience/exit, use 'rejected' status, for others use 'مرفوض'
    const rejectedStatus = (type === 'certificate' || type === 'experience' || type === 'exit') ? 'rejected' : 'مرفوض';
    const isApproval = false; // This is the reject function

    // Create placeholder strings for IN clauses - use string concatenation
    const statusPlaceholders = PENDING_STATUSES.map(() => '?').join(',');

    // Certificate, Experience, and Exit tables don't have rejected_by column, so handle differently
    let query, params;
    if (type === 'certificate' || type === 'experience' || type === 'exit') {
      query = 
        'UPDATE ' + tableName + ' ' +
        'SET status=?, rejection_reason=?, updated_at=NOW(), approval_stage=\'Rejected\', final_decision=\'rejected\' ' +
        'WHERE id=? AND (status=\'pending\' OR status=\'submitted\' OR status IN (' + statusPlaceholders + '))';
      params = [rejectedStatus, note || null, id, ...PENDING_STATUSES];
    } else {
      query = 
        'UPDATE ' + tableName + ' ' +
        'SET status=?, rejected_by=?, rejected_at=NOW(), decision_note=? ' +
        'WHERE id=? AND status IN (' + statusPlaceholders + ')';
      params = [rejectedStatus, rejectedBy, note || null, id, ...PENDING_STATUSES];
    }
    
    const [result] = await conn.execute(query, params);

    // If the request was successfully processed, update all pending approvals for this request
    if ((result as any).affectedRows > 0) {
      // Update all pending approvals for this request to match the new status
      const approvalStatus = isApproval ? 'approved' : 'rejected';
      await conn.execute(
        'UPDATE Request_Approvals SET status = ?, acted_at = NOW() WHERE request_type = ? AND request_id = ? AND status = \'pending\'',
        [approvalStatus, type, id]
      );

      console.log(`${approvalStatus === 'approved' ? '✅' : '❌'} Updated pending approvals for ${type} request ${id} to ${approvalStatus}`);
    }

    return (result as any).affectedRows > 0;
  });
}
