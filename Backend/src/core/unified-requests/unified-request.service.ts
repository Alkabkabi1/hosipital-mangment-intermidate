// =====================================================
// UNIFIED REQUEST SERVICE - HYBRID ARCHITECTURE
// =====================================================
// Combines comprehensive field handling from employee-requests
// with clean service patterns from dedicated modules
// Single source of truth for all request operations
// =====================================================

import { withConnection } from '../database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AppError } from '../errors';

// =====================================================
// SECTION 1: CORE INTERFACES AND TYPES
// =====================================================

// Base interface that all request types inherit from
export interface BaseRequestData {
  id?: number;
  reference_number?: string;
  employee_id?: number;
  employee_email: string;
  employee_name: string;
  employee_dept?: string;
  created_by_user?: number;
  status?: string;
  request_date: string;
  approved_by?: number;
  approved_at?: Date;
  rejected_by?: number;
  rejected_at?: Date;
  decision_note?: string;
  
  // Multi-approval system fields
  approval_stage?: string;
  total_approvers?: number;
  approved_count?: number;
  final_decision?: 'pending' | 'approved' | 'rejected';
  last_approval_at?: Date;
  
  // Extended data storage
  payload_json?: any;
  created_at?: Date;
  updated_at?: Date;
}

// Request type identifiers
export type RequestType = 
  | 'clearance'
  | 'onboarding' 
  | 'delegation'
  | 'certificate'
  | 'experience'
  | 'exit'
  | 'assignment'
  | 'assignment_termination'
  | 'internal_transfer'
  | 'maternity_leave'
  | 'housing_allowance';

// Comprehensive request creation data
export interface CreateRequestData extends BaseRequestData {
  request_type: RequestType;
  form_data: Record<string, any>; // Flexible form data that varies by type
}

// Request query options
export interface RequestQueryOptions {
  employee_id?: number;
  created_by_user?: number;
  status?: string[];
  request_type?: RequestType[];
  date_from?: string;
  date_to?: string;
  approval_stage?: string;
  limit?: number;
  offset?: number;
}

// Request update data
export interface UpdateRequestData {
  status?: string;
  decision_note?: string;
  approval_stage?: string;
  approved_count?: number;
  final_decision?: 'pending' | 'approved' | 'rejected';
  payload_json?: any;
}

// =====================================================
// SECTION 2: REFERENCE NUMBER GENERATION
// =====================================================

const REQUEST_TYPE_PREFIXES: Record<RequestType, string> = {
  clearance: 'CLR',
  onboarding: 'ONB', 
  delegation: 'DLG',
  certificate: 'CRT',
  experience: 'EXP',
  exit: 'EXT',
  assignment: 'ASG',
  assignment_termination: 'AST',
  internal_transfer: 'ITR',
  maternity_leave: 'MAT',
  housing_allowance: 'HSG'
};

export async function generateReferenceNumber(requestType: RequestType): Promise<string> {
  return withConnection(async (conn) => {
    const prefix = REQUEST_TYPE_PREFIXES[requestType];
    
    // Get and increment sequence
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE Request_Reference_Sequences 
       SET current_sequence = current_sequence + 1 
       WHERE request_type = ?`,
      [requestType]
    );
    
    // If no rows updated, initialize sequence for this request type
    if (result.affectedRows === 0) {
      await conn.execute(
        `INSERT INTO Request_Reference_Sequences (request_type, prefix, current_sequence, date_created) 
         VALUES (?, ?, 1, CURDATE())`,
        [requestType, prefix]
      );
    }
    
    // Get current sequence number
    const [sequenceRows] = await conn.execute<RowDataPacket[]>(
      `SELECT current_sequence FROM Request_Reference_Sequences WHERE request_type = ?`,
      [requestType]
    );
    
    const sequence = sequenceRows[0]?.current_sequence || 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    return `${prefix}-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  });
}

// =====================================================
// SECTION 3: TABLE MAPPING AND FIELD CONFIGURATION
// =====================================================

const REQUEST_TABLE_MAPPING: Record<RequestType, string> = {
  clearance: 'Clearance_Requests',
  onboarding: 'Onboarding_Requests',
  delegation: 'Delegation_Requests', 
  certificate: 'Certificate_Requests',
  experience: 'Experience_Certificate_Requests',
  exit: 'Exit_Requests',
  assignment: 'Assignment_Requests',
  assignment_termination: 'Assignment_Termination_Requests',
  internal_transfer: 'Internal_Transfer_Requests',
  maternity_leave: 'Maternity_Leave_Requests',
  housing_allowance: 'Housing_Allowance_Requests'
};

// Type-specific field configurations for form data mapping
const REQUEST_FIELD_CONFIGS: Record<RequestType, {
  required_fields: string[];
  optional_fields: string[];
  json_extractable_fields: string[];
}> = {
  clearance: {
    required_fields: ['employee_email', 'employee_name', 'request_date'],
    optional_fields: ['last_work_day', 'clearance_type', 'specific_reason', 'document_number', 'reason'],
    json_extractable_fields: ['clearance_type', 'specific_reason', 'document_number', 'reason']
  },
  onboarding: {
    required_fields: ['employee_email', 'employee_name', 'request_date', 'start_date'],
    optional_fields: ['position_title', 'document_number', 'transaction_number', 'employment_type', 'nationality'],
    json_extractable_fields: ['firstName', 'secondName', 'thirdName', 'jobTitle', 'documentNumber', 'employmentType']
  },
  delegation: {
    required_fields: ['employee_email', 'employee_name', 'request_date'],
    optional_fields: ['from_email', 'to_email', 'delegation_type', 'scope_description', 'start_date', 'end_date'],
    json_extractable_fields: ['delegation_type', 'scope_description']
  },
  certificate: {
    required_fields: ['employee_name', 'occupation', 'nationality'],
    optional_fields: ['iqama_number', 'passport_number'],
    json_extractable_fields: ['occupation', 'iqama_number', 'passport_number']
  },
  experience: {
    required_fields: ['employee_name', 'job_title', 'department'],
    optional_fields: ['start_date', 'end_date', 'experience_years', 'experience_months'],
    json_extractable_fields: ['job_title', 'department', 'experience_years']
  },
  exit: {
    required_fields: ['employee_name', 'job_title', 'department'],
    optional_fields: ['exit_reasons', 'work_environment', 'suggestions'],
    json_extractable_fields: ['exit_reasons', 'work_environment', 'manager_relationship']
  },
  assignment: {
    required_fields: ['employee_name', 'new_role', 'assignment_reason', 'start_date'],
    optional_fields: ['assignment_type', 'new_department', 'end_date', 'additional_benefits'],
    json_extractable_fields: ['assignment_type', 'new_role', 'assignment_reason']
  },
  assignment_termination: {
    required_fields: ['employee_name', 'current_assignment_role', 'termination_reason', 'effective_date'],
    optional_fields: ['return_to_department', 'return_date'],
    json_extractable_fields: ['termination_reason', 'return_to_department']
  },
  internal_transfer: {
    required_fields: ['employee_name', 'current_department', 'target_department', 'transfer_reason'],
    optional_fields: ['transfer_type', 'preferred_start_date'],
    json_extractable_fields: ['current_department', 'target_department', 'transfer_reason']
  },
  maternity_leave: {
    required_fields: ['employee_name', 'job_title', 'expected_due_date', 'requested_start_date'],
    optional_fields: ['leave_duration_weeks', 'medical_certificate_attached'],
    json_extractable_fields: ['expected_due_date', 'leave_duration_weeks']
  },
  housing_allowance: {
    required_fields: ['employee_name', 'allowance_type'],
    optional_fields: ['monthly_amount', 'justification'],
    json_extractable_fields: ['allowance_type', 'monthly_amount', 'justification']
  }
};

// =====================================================
// SECTION 4: STATUS STANDARDIZATION
// =====================================================

export async function getStandardStatus(inputStatus?: string): Promise<string> {
  if (!inputStatus) return 'قيد الاعتماد';
  
  return withConnection(async (conn) => {
    // Try to find matching canonical status
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT display_status_ar FROM Request_Status_Mapping 
       WHERE canonical_status = ? OR display_status_ar = ? OR display_status_en = ?`,
      [inputStatus, inputStatus, inputStatus]
    );
    
    if (rows.length > 0) {
      return rows[0].display_status_ar;
    }
    
    // Default mapping for common values
    const statusMap: Record<string, string> = {
      'pending': 'قيد الاعتماد',
      'submitted': 'قيد الاعتماد', 
      'approved': 'مكتمل',
      'completed': 'مكتمل',
      'rejected': 'مرفوض',
      'in_review': 'قيد المراجعة',
      'under_review': 'قيد المراجعة'
    };
    
    return statusMap[inputStatus.toLowerCase()] || inputStatus;
  });
}

// =====================================================
// SECTION 5: UNIFIED REQUEST SERVICE CLASS
// =====================================================

export class UnifiedRequestService {
  
  // =====================================================
  // CREATE REQUEST (HYBRID APPROACH)
  // =====================================================
  
  static async createRequest(data: CreateRequestData): Promise<{ id: number; reference_number: string }> {
    return withConnection(async (conn) => {
      try {
        // Generate reference number
        const reference_number = await generateReferenceNumber(data.request_type);
        
        // Standardize status
        const status = await getStandardStatus(data.status);
        
        // Get table name
        const tableName = REQUEST_TABLE_MAPPING[data.request_type];
        
        // Build field mapping based on request type
        const fieldConfig = REQUEST_FIELD_CONFIGS[data.request_type];
        const insertData: Record<string, any> = {
          reference_number,
          employee_email: data.employee_email,
          employee_name: data.employee_name,
          employee_dept: data.employee_dept,
          created_by_user: data.created_by_user,
          status,
          request_date: data.request_date,
          
          // Multi-approval defaults
          approval_stage: 'pending',
          total_approvers: 0,
          approved_count: 0,
          final_decision: 'pending',
          
          // Store original form data in JSON
          payload_json: JSON.stringify(data.form_data)
        };
        
        // Map form data to specific fields based on request type
        Object.keys(data.form_data).forEach(key => {
          if (fieldConfig.optional_fields.includes(key) || fieldConfig.required_fields.includes(key)) {
            insertData[key] = data.form_data[key];
          }
        });
        
        // Handle special field mappings per request type
        this.applyTypeSpecificFieldMapping(data.request_type, data.form_data, insertData);
        
        // Build dynamic INSERT query
        const fields = Object.keys(insertData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(insertData);
        
        const query = `
          INSERT INTO ${tableName} (${fields.join(', ')})
          VALUES (${placeholders})
        `;
        
        const [result] = await conn.execute<ResultSetHeader>(query, values);
        
        // Initialize multi-approval workflow if needed
        await this.initializeMultiApprovalWorkflow(data.request_type, result.insertId);
        
        return {
          id: result.insertId,
          reference_number
        };
        
      } catch (error) {
        throw new AppError({
          statusCode: 500,
          message: `Failed to create ${data.request_type} request: ${error.message}`,
          code: 'REQUEST_CREATION_FAILED'
        });
      }
    });
  }
  
  // =====================================================
  // RETRIEVE REQUESTS (UNIFIED QUERY INTERFACE)
  // =====================================================
  
  static async getRequests(options: RequestQueryOptions): Promise<any[]> {
    return withConnection(async (conn) => {
      try {
        // Build dynamic query based on options
        let baseQuery = '';
        let conditions: string[] = [];
        let params: any[] = [];
        
        // Handle single request type or multiple types
        const requestTypes = options.request_type ? [options.request_type].flat() : Object.keys(REQUEST_TABLE_MAPPING) as RequestType[];
        
        // Build UNION query for multiple request types
        const unionQueries = requestTypes.map(requestType => {
          const tableName = REQUEST_TABLE_MAPPING[requestType];
          return `
            SELECT 
              id, reference_number, employee_id, employee_email, employee_name, employee_dept,
              created_by_user, status, request_date, approval_stage, total_approvers, 
              approved_count, final_decision, last_approval_at, payload_json,
              created_at, updated_at, '${requestType}' as request_type
            FROM ${tableName}
          `;
        });
        
        baseQuery = unionQueries.join(' UNION ALL ');
        
        // Add WHERE conditions
        if (options.employee_id) {
          conditions.push('employee_id = ?');
          params.push(options.employee_id);
        }
        
        if (options.created_by_user) {
          conditions.push('created_by_user = ?');
          params.push(options.created_by_user);
        }
        
        if (options.status && options.status.length > 0) {
          const statusPlaceholders = options.status.map(() => '?').join(', ');
          conditions.push(`status IN (${statusPlaceholders})`);
          params.push(...options.status);
        }
        
        if (options.date_from) {
          conditions.push('request_date >= ?');
          params.push(options.date_from);
        }
        
        if (options.date_to) {
          conditions.push('request_date <= ?');
          params.push(options.date_to);
        }
        
        if (options.approval_stage) {
          conditions.push('approval_stage = ?');
          params.push(options.approval_stage);
        }
        
        // Wrap in subquery if we have conditions
        if (conditions.length > 0) {
          baseQuery = `SELECT * FROM (${baseQuery}) unified_requests WHERE ${conditions.join(' AND ')}`;
        }
        
        // Add ordering and pagination
        baseQuery += ' ORDER BY created_at DESC';
        
        if (options.limit) {
          baseQuery += ' LIMIT ?';
          params.push(options.limit);
          
          if (options.offset) {
            baseQuery += ' OFFSET ?';
            params.push(options.offset);
          }
        }
        
        const [rows] = await conn.execute<RowDataPacket[]>(baseQuery, params);
        return rows;
        
      } catch (error) {
        throw new AppError({
          statusCode: 500,
          message: `Failed to retrieve requests: ${error.message}`,
          code: 'REQUEST_RETRIEVAL_FAILED'
        });
      }
    });
  }
  
  // =====================================================
  // UPDATE REQUEST (UNIFIED UPDATE INTERFACE)
  // =====================================================
  
  static async updateRequest(
    requestType: RequestType, 
    requestId: number, 
    updateData: UpdateRequestData,
    updatedBy?: number
  ): Promise<void> {
    return withConnection(async (conn) => {
      try {
        const tableName = REQUEST_TABLE_MAPPING[requestType];
        
        // Standardize status if provided
        if (updateData.status) {
          updateData.status = await getStandardStatus(updateData.status);
        }
        
        // Build dynamic update query
        const updateFields: string[] = [];
        const params: any[] = [];
        
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            updateFields.push(`${key} = ?`);
            params.push(value);
          }
        });
        
        // Add metadata
        updateFields.push('updated_at = NOW()');
        
        if (updatedBy) {
          if (updateData.final_decision === 'approved') {
            updateFields.push('approved_by = ?', 'approved_at = NOW()');
            params.push(updatedBy);
          } else if (updateData.final_decision === 'rejected') {
            updateFields.push('rejected_by = ?', 'rejected_at = NOW()');
            params.push(updatedBy);
          }
        }
        
        params.push(requestId);
        
        const query = `
          UPDATE ${tableName} 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        
        await conn.execute(query, params);
        
        // Update multi-approval workflow if status changed
        if (updateData.final_decision || updateData.approval_stage) {
          await this.updateMultiApprovalWorkflow(requestType, requestId, updateData);
        }
        
      } catch (error) {
        throw new AppError({
          statusCode: 500,
          message: `Failed to update ${requestType} request: ${error.message}`,
          code: 'REQUEST_UPDATE_FAILED'
        });
      }
    });
  }
  
  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================
  
  private static applyTypeSpecificFieldMapping(
    requestType: RequestType,
    formData: Record<string, any>,
    insertData: Record<string, any>
  ): void {
    switch (requestType) {
      case 'clearance':
        // Handle clearance-specific field mapping
        if (formData.lastWorkDay || formData.last_work_day) {
          insertData.last_work_day = formData.lastWorkDay || formData.last_work_day;
        }
        break;
        
      case 'onboarding':
        // Handle onboarding name composition
        if (formData.firstName && formData.secondName) {
          insertData.employee_name = [formData.firstName, formData.secondName, formData.thirdName]
            .filter(Boolean).join(' ');
        }
        
        // Map job title
        if (formData.jobTitle) {
          insertData.position_title = formData.jobTitle;
        }
        break;
        
      default:
        // Standard field mapping for other types
        break;
    }
  }
  
  private static async initializeMultiApprovalWorkflow(
    requestType: RequestType,
    requestId: number
  ): Promise<void> {
    // This will be implemented when multi-approval system is integrated
    // For now, just set basic approval stage
    const tableName = REQUEST_TABLE_MAPPING[requestType];
    
    return withConnection(async (conn) => {
      await conn.execute(
        `UPDATE ${tableName} SET approval_stage = 'pending', total_approvers = 1 WHERE id = ?`,
        [requestId]
      );
    });
  }
  
  private static async updateMultiApprovalWorkflow(
    requestType: RequestType,
    requestId: number,
    updateData: UpdateRequestData
  ): Promise<void> {
    // This will be enhanced when multi-approval system is fully integrated
    if (updateData.final_decision) {
      const tableName = REQUEST_TABLE_MAPPING[requestType];
      
      return withConnection(async (conn) => {
        await conn.execute(
          `UPDATE ${tableName} SET last_approval_at = NOW() WHERE id = ?`,
          [requestId]
        );
      });
    }
  }
}
