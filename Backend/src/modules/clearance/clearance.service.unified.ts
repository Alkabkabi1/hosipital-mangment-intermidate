// =====================================================
// UNIFIED CLEARANCE SERVICE - CONFLICT RESOLUTION
// =====================================================
// Merges dedicated clearance module with employee-requests implementation
// Resolves field mapping conflicts and provides single source of truth
// Maintains backward compatibility during transition
// =====================================================

import { withConnection } from '../../core/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AppError } from '../../core/errors';
import { UnifiedRequestService, generateReferenceNumber, getStandardStatus } from '../../core/unified-requests';
import type { CreateClearanceRequest } from '../employee-requests/employee-requests.service';

// =====================================================
// SECTION 1: UNIFIED TYPES AND INTERFACES
// =====================================================

export interface UnifiedClearanceInput {
  // Core fields (from both implementations)
  employee_email: string;
  employee_name: string;
  employee_dept?: string;
  request_date?: string;
  
  // Clearance-specific fields (consolidated naming)
  last_work_day?: string;  // Unified field name (was last_working_day in old implementation)
  reason?: string;
  clearance_type?: 'end_of_service' | 'end_mid_service';
  specific_reason?: string;
  document_number?: string;
  
  // Form data flexibility (from employee-requests approach)
  notes?: string;
  additional_data?: Record<string, any>;
  
  // Backward compatibility fields (automatically mapped)
  lastWorkingDay?: string;  // Maps to last_work_day
  lastWorkDay?: string;     // Maps to last_work_day
  rejection_reason?: string; // Maps to decision_note
}

export interface ClearanceResponse {
  id: number;
  reference_number: string;
  employee_id?: number;
  employee_email: string;
  employee_name: string;
  employee_dept?: string;
  status: string;
  request_date: string;
  last_work_day?: string;
  clearance_type?: string;
  specific_reason?: string;
  document_number?: string;
  reason?: string;
  
  // Multi-approval fields
  approval_stage: string;
  total_approvers: number;
  approved_count: number;
  final_decision: 'pending' | 'approved' | 'rejected';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  
  // Decision tracking
  decision_note?: string;
  approved_by?: number;
  rejected_by?: number;
}

// =====================================================
// SECTION 2: FIELD MAPPING AND TRANSFORMATION
// =====================================================

function mapLegacyFields(input: UnifiedClearanceInput): Record<string, any> {
  const mapped: Record<string, any> = { ...input };
  
  // Handle last work day field variations
  if (input.lastWorkingDay && !mapped.last_work_day) {
    mapped.last_work_day = input.lastWorkingDay;
    delete mapped.lastWorkingDay;
  }
  
  if (input.lastWorkDay && !mapped.last_work_day) {
    mapped.last_work_day = input.lastWorkDay;
    delete mapped.lastWorkDay;
  }
  
  // Handle rejection reason mapping
  if (input.rejection_reason && !mapped.decision_note) {
    mapped.decision_note = input.rejection_reason;
    delete mapped.rejection_reason;
  }
  
  return mapped;
}

function extractFormDataFromPayload(payload_json: string | null): Record<string, any> {
  if (!payload_json) return {};
  
  try {
    const parsed = JSON.parse(payload_json);
    return {
      clearance_type: parsed.clearanceType || parsed.clearance_type,
      specific_reason: parsed.specificReason || parsed.specific_reason,
      document_number: parsed.documentNumber || parsed.document_number,
      last_work_day: parsed.lastWorkDay || parsed.last_work_day || parsed.lastWorkingDay,
      reason: parsed.reason
    };
  } catch (error) {
    console.warn('Failed to parse clearance payload JSON:', error);
    return {};
  }
}

// =====================================================
// SECTION 3: UNIFIED CLEARANCE SERVICE CLASS
// =====================================================

export class UnifiedClearanceService {
  
  // =====================================================
  // CREATE CLEARANCE (MERGED IMPLEMENTATION)
  // =====================================================
  
  static async createClearance(
    userId: number,
    input: UnifiedClearanceInput
  ): Promise<{ id: number; reference_number: string }> {
    
    try {
      // Map legacy field names to unified schema
      const mappedInput = mapLegacyFields(input);
      
      // Use unified request service for consistent creation
      const result = await UnifiedRequestService.createRequest({
        request_type: 'clearance',
        employee_email: mappedInput.employee_email,
        employee_name: mappedInput.employee_name,
        employee_dept: mappedInput.employee_dept,
        created_by_user: userId,
        status: mappedInput.status,
        request_date: mappedInput.request_date || new Date().toISOString().split('T')[0],
        form_data: {
          last_work_day: mappedInput.last_work_day,
          reason: mappedInput.reason,
          clearance_type: mappedInput.clearance_type,
          specific_reason: mappedInput.specific_reason,
          document_number: mappedInput.document_number,
          notes: mappedInput.notes,
          ...mappedInput.additional_data
        }
      });
      
      return result;
      
    } catch (error) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to create clearance request: ${error.message}`,
        code: 'CLEARANCE_CREATION_FAILED'
      });
    }
  }
  
  // =====================================================
  // BACKWARD COMPATIBILITY METHODS
  // =====================================================
  
  /**
   * Legacy method signature support for employee-requests service
   */
  static async createClearanceRequest(
    data: Omit<CreateClearanceRequest, 'reference_number'>
  ): Promise<{ id: number; reference_number: string }> {
    
    const unifiedInput: UnifiedClearanceInput = {
      employee_email: data.employee_email,
      employee_name: data.employee_name,
      employee_dept: data.employee_dept,
      request_date: data.request_date,
      last_work_day: data.last_work_day,
      reason: data.reason,
      clearance_type: data.clearance_type,
      specific_reason: data.specific_reason,
      document_number: data.document_number,
      additional_data: data.payload_json ? JSON.parse(data.payload_json) : undefined
    };
    
    const userId = data.created_by_user || 0; // Default fallback
    
    return this.createClearance(userId, unifiedInput);
  }
  
  // =====================================================
  // RETRIEVE CLEARANCES (UNIFIED QUERY)
  // =====================================================
  
  static async getMyClearances(userId: number): Promise<ClearanceResponse[]> {
    try {
      const requests = await UnifiedRequestService.getRequests({
        created_by_user: userId,
        request_type: ['clearance'],
        limit: 100
      });
      
      return requests.map(this.formatClearanceResponse);
      
    } catch (error) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to retrieve clearance requests: ${error.message}`,
        code: 'CLEARANCE_RETRIEVAL_FAILED'
      });
    }
  }
  
  static async getClearanceById(clearanceId: number): Promise<ClearanceResponse | null> {
    return withConnection(async (conn) => {
      try {
        const [rows] = await conn.execute<RowDataPacket[]>(
          `SELECT * FROM Clearance_Requests WHERE id = ?`,
          [clearanceId]
        );
        
        if (rows.length === 0) {
          return null;
        }
        
        return this.formatClearanceResponse(rows[0]);
        
      } catch (error) {
        throw new AppError({
          statusCode: 500,
          message: `Failed to retrieve clearance request: ${error.message}`,
          code: 'CLEARANCE_RETRIEVAL_FAILED'
        });
      }
    });
  }
  
  static async getAdminClearances(options: {
    status?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<ClearanceResponse[]> {
    try {
      const requests = await UnifiedRequestService.getRequests({
        request_type: ['clearance'],
        status: options.status,
        limit: options.limit || 50,
        offset: options.offset || 0
      });
      
      return requests.map(this.formatClearanceResponse);
      
    } catch (error) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to retrieve admin clearance requests: ${error.message}`,
        code: 'CLEARANCE_ADMIN_RETRIEVAL_FAILED'
      });
    }
  }
  
  // =====================================================
  // UPDATE CLEARANCE (UNIFIED UPDATE)
  // =====================================================
  
  static async updateClearanceStatus(
    clearanceId: number,
    status: string,
    approverUserId: number,
    options: {
      decision_note?: string;
      rejection_reason?: string; // Backward compatibility
    } = {}
  ): Promise<void> {
    try {
      // Handle backward compatibility for rejection_reason
      const decision_note = options.decision_note || options.rejection_reason;
      
      // Determine final_decision based on status
      let final_decision: 'pending' | 'approved' | 'rejected' = 'pending';
      if (status.includes('مكتمل') || status.includes('approved')) {
        final_decision = 'approved';
      } else if (status.includes('مرفوض') || status.includes('rejected')) {
        final_decision = 'rejected';
      }
      
      await UnifiedRequestService.updateRequest(
        'clearance',
        clearanceId,
        {
          status: await getStandardStatus(status),
          decision_note,
          final_decision,
          approval_stage: final_decision === 'pending' ? 'in_review' : final_decision,
          approved_count: final_decision === 'approved' ? 1 : 0
        },
        approverUserId
      );
      
    } catch (error) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to update clearance status: ${error.message}`,
        code: 'CLEARANCE_UPDATE_FAILED'
      });
    }
  }
  
  // =====================================================
  // APPROVAL WORKFLOW METHODS
  // =====================================================
  
  static async approveClearance(
    clearanceId: number,
    approverUserId: number,
    decision_note?: string
  ): Promise<void> {
    await this.updateClearanceStatus(
      clearanceId,
      'مكتمل',
      approverUserId,
      { decision_note: decision_note || 'Approved' }
    );
  }
  
  static async rejectClearance(
    clearanceId: number,
    rejectorUserId: number,
    rejection_reason: string
  ): Promise<void> {
    await this.updateClearanceStatus(
      clearanceId,
      'مرفوض',
      rejectorUserId,
      { decision_note: rejection_reason }
    );
  }
  
  // =====================================================
  // RESPONSE FORMATTING
  // =====================================================
  
  private static formatClearanceResponse(row: any): ClearanceResponse {
    // Extract additional data from payload_json if present
    const formData = extractFormDataFromPayload(row.payload_json);
    
    return {
      id: row.id,
      reference_number: row.reference_number,
      employee_id: row.employee_id,
      employee_email: row.employee_email,
      employee_name: row.employee_name,
      employee_dept: row.employee_dept,
      status: row.status,
      request_date: row.request_date,
      
      // Core clearance fields (with fallback to JSON data)
      last_work_day: row.last_work_day || formData.last_work_day,
      clearance_type: row.clearance_type || formData.clearance_type,
      specific_reason: row.specific_reason || formData.specific_reason,
      document_number: row.document_number || formData.document_number,
      reason: row.reason || formData.reason,
      
      // Multi-approval fields
      approval_stage: row.approval_stage || 'pending',
      total_approvers: row.total_approvers || 0,
      approved_count: row.approved_count || 0,
      final_decision: row.final_decision || 'pending',
      
      // Timestamps
      created_at: row.created_at,
      updated_at: row.updated_at,
      approved_at: row.approved_at,
      rejected_at: row.rejected_at,
      
      // Decision tracking
      decision_note: row.decision_note,
      approved_by: row.approved_by,
      rejected_by: row.rejected_by
    };
  }
  
  // =====================================================
  // MIGRATION UTILITY METHODS
  // =====================================================
  
  /**
   * Utility method to migrate data from old schema to unified schema
   * This will be used during the transition period
   */
  static async migrateLegacyClearanceData(): Promise<{ migrated: number; errors: number }> {
    return withConnection(async (conn) => {
      let migrated = 0;
      let errors = 0;
      
      try {
        // Find records that might be using old schema format
        const [oldRecords] = await conn.execute<RowDataPacket[]>(`
          SELECT * FROM Clearance_Requests 
          WHERE payload_json IS NOT NULL 
            AND (last_work_day IS NULL OR clearance_type IS NULL)
        `);
        
        for (const record of oldRecords) {
          try {
            const formData = extractFormDataFromPayload(record.payload_json);
            
            if (Object.keys(formData).length > 0) {
              // Update record with extracted data
              await conn.execute(`
                UPDATE Clearance_Requests 
                SET 
                  last_work_day = COALESCE(last_work_day, ?),
                  clearance_type = COALESCE(clearance_type, ?),
                  specific_reason = COALESCE(specific_reason, ?),
                  document_number = COALESCE(document_number, ?),
                  reason = COALESCE(reason, ?)
                WHERE id = ?
              `, [
                formData.last_work_day,
                formData.clearance_type,
                formData.specific_reason,
                formData.document_number,
                formData.reason,
                record.id
              ]);
              
              migrated++;
            }
          } catch (recordError) {
            console.error(`Failed to migrate clearance record ${record.id}:`, recordError);
            errors++;
          }
        }
        
        return { migrated, errors };
        
      } catch (error) {
        throw new AppError({
          statusCode: 500,
          message: `Migration failed: ${error.message}`,
          code: 'MIGRATION_FAILED'
        });
      }
    });
  }
}
