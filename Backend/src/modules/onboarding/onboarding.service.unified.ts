// =====================================================
// UNIFIED ONBOARDING SERVICE - CONFLICT RESOLUTION
// =====================================================
// Merges simple onboarding module with comprehensive employee-requests implementation
// Supports both basic and detailed form submissions
// Provides single source of truth for all onboarding operations
// =====================================================

import { withConnection } from '../../core/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AppError } from '../../core/errors';
import { UnifiedRequestService, generateReferenceNumber, getStandardStatus } from '../../core/unified-requests';
import type { CreateOnboardingRequest } from '../employee-requests/employee-requests.service';

// =====================================================
// SECTION 1: UNIFIED TYPES AND INTERFACES
// =====================================================

// Simple onboarding input (basic implementation)
export interface SimpleOnboardingInput {
  // Basic required fields
  employee_email: string;
  employee_name: string;
  employee_dept?: string;
  request_date?: string;
  start_date: string;
  
  // Simple optional fields
  position_title?: string;
  department_id?: number;
  supervisor_id?: number;
  notes?: string;
}

// Comprehensive onboarding input (full implementation)
export interface ComprehensiveOnboardingInput {
  // Container 1: Basic Info
  firstName: string;
  secondName: string;
  thirdName: string;
  jobTitle: string;
  workId: string;
  reasonForJob: 'transfer' | 'assignment' | 'appointment' | 'secondment' | 'scholarship';
  
  // Container 2: Document & Dates  
  documentNumber: string;
  applicationDate: string;
  startDate: string;
  
  // Container 3: Details
  fourthName: string;
  fatherName: string;
  grandpaName: string;
  familyName: string;
  transactionNumber: string;
  transactionDate: string;
  
  // Employee info
  employeeStatus: 'full_assignment' | 'partial_assignment';
  employeeNumber: string;
  department: string;
  group?: string;
  rank?: string;
  
  // Personal info
  birthDate: string;
  appointmentDate: string;
  employmentType: 'civil_service' | 'self_employment' | 'surplus_workforce' | 'locum' | 'partial_assignment';
  nationality: string;
  gender: 'male' | 'female';
  onboardingReason: 'transfer' | 'assignment' | 'appointment' | 'secondment' | 'scholarship';
  
  // Optional fields
  employee_email?: string;
  phone?: string;
  requestDate?: string;
}

// Unified onboarding input that accepts both formats
export interface UnifiedOnboardingInput {
  // Determine which format is being used
  form_type?: 'simple' | 'comprehensive';
  
  // Common fields (always present)
  employee_email: string;
  employee_name?: string;  // Can be computed from firstName+secondName+thirdName
  employee_dept?: string;
  request_date?: string;
  start_date: string;
  
  // Simple form fields
  position_title?: string;
  department_id?: number;
  supervisor_id?: number;
  notes?: string;
  
  // Comprehensive form fields (optional)
  firstName?: string;
  secondName?: string;
  thirdName?: string;
  jobTitle?: string;
  workId?: string;
  reasonForJob?: string;
  documentNumber?: string;
  applicationDate?: string;
  fourthName?: string;
  fatherName?: string;
  grandpaName?: string;
  familyName?: string;
  transactionNumber?: string;
  transactionDate?: string;
  employeeStatus?: string;
  employeeNumber?: string;
  department?: string;
  group?: string;
  rank?: string;
  birthDate?: string;
  appointmentDate?: string;
  employmentType?: string;
  nationality?: string;
  gender?: string;
  onboardingReason?: string;
  phone?: string;
  
  // Additional data for complex forms
  additional_data?: Record<string, any>;
}

export interface OnboardingResponse {
  id: number;
  reference_number: string;
  employee_id?: number;
  employee_email: string;
  employee_name: string;
  employee_dept?: string;
  status: string;
  request_date: string;
  start_date: string;
  
  // Basic fields
  position_title?: string;
  department_id?: number;
  supervisor_id?: number;
  
  // Comprehensive fields  
  document_number?: string;
  transaction_number?: string;
  transaction_date?: string;
  employee_status?: string;
  employment_type?: string;
  onboarding_reason?: string;
  reason_for_job?: string;
  employee_number?: string;
  nationality?: string;
  gender?: string;
  birth_date?: string;
  appointment_date?: string;
  
  // Multi-approval fields
  approval_stage: string;
  total_approvers: number;
  approved_count: number;
  final_decision: 'pending' | 'approved' | 'rejected';
  
  // Timestamps and decision tracking
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  decision_note?: string;
  approved_by?: number;
  rejected_by?: number;
  
  // Original form data
  payload_json?: string;
  notes?: string;
}

// =====================================================
// SECTION 2: FORM TYPE DETECTION AND TRANSFORMATION
// =====================================================

function detectFormType(input: UnifiedOnboardingInput): 'simple' | 'comprehensive' {
  // If explicitly specified, use that
  if (input.form_type) {
    return input.form_type;
  }
  
  // Detect based on presence of comprehensive fields
  const comprehensiveFields = [
    'firstName', 'secondName', 'thirdName', 'jobTitle', 'workId', 
    'documentNumber', 'transactionNumber', 'employeeStatus', 'employmentType'
  ];
  
  const presentComprehensiveFields = comprehensiveFields.filter(field => 
    input[field as keyof UnifiedOnboardingInput]
  );
  
  // If more than 3 comprehensive fields are present, assume comprehensive form
  return presentComprehensiveFields.length > 3 ? 'comprehensive' : 'simple';
}

function transformToUnifiedFormat(input: UnifiedOnboardingInput): Record<string, any> {
  const formType = detectFormType(input);
  const unified: Record<string, any> = { ...input };
  
  if (formType === 'comprehensive') {
    // Build employee name from comprehensive fields
    if (input.firstName && input.secondName) {
      unified.employee_name = [input.firstName, input.secondName, input.thirdName]
        .filter(Boolean)
        .join(' ');
    }
    
    // Map job title to position_title
    if (input.jobTitle && !unified.position_title) {
      unified.position_title = input.jobTitle;
    }
    
    // Map dates - handle both field names safely
    if ((input as any).startDate && !unified.start_date) {
      unified.start_date = (input as any).startDate;
    }
    
    if (input.applicationDate && !unified.request_date) {
      unified.request_date = input.applicationDate;
    }
    
    // Map department
    if (input.department && !unified.employee_dept) {
      unified.employee_dept = input.department;
    }
    
    // Build full name for advanced forms
    if (input.fourthName || input.fatherName) {
      const fullName = [input.fourthName, input.fatherName, input.grandpaName, input.familyName]
        .filter(Boolean)
        .join(' ');
      
      if (fullName) {
        unified.full_fourth_degree_name = fullName;
      }
    }
  }
  
  return unified;
}

function extractFormDataFromPayload(payload_json: string | null): Record<string, any> {
  if (!payload_json) return {};
  
  try {
    const parsed = JSON.parse(payload_json);
    return {
      // Basic fields
      position_title: parsed.jobTitle || parsed.position_title,
      department_id: parsed.department_id,
      
      // Comprehensive fields
      document_number: parsed.documentNumber || parsed.document_number,
      transaction_number: parsed.transactionNumber || parsed.transaction_number,
      transaction_date: parsed.transactionDate || parsed.transaction_date,
      employee_status: parsed.employeeStatus || parsed.employee_status,
      employment_type: parsed.employmentType || parsed.employment_type,
      onboarding_reason: parsed.onboardingReason || parsed.onboarding_reason,
      reason_for_job: parsed.reasonForJob || parsed.reason_for_job,
      employee_number: parsed.employeeNumber || parsed.employee_number,
      nationality: parsed.nationality,
      gender: parsed.gender,
      birth_date: parsed.birthDate || parsed.birth_date,
      appointment_date: parsed.appointmentDate || parsed.appointment_date,
      
      // Name components
      first_name: parsed.firstName,
      second_name: parsed.secondName,
      third_name: parsed.thirdName,
      fourth_name: parsed.fourthName,
      father_name: parsed.fatherName,
      grandpa_name: parsed.grandpaName,
      family_name: parsed.familyName
    };
  } catch (error) {
    console.warn('Failed to parse onboarding payload JSON:', error);
    return {};
  }
}

// =====================================================
// SECTION 3: UNIFIED ONBOARDING SERVICE CLASS
// =====================================================

export class UnifiedOnboardingService {
  
  // =====================================================
  // CREATE ONBOARDING (FLEXIBLE FORMAT SUPPORT)
  // =====================================================
  
  static async createOnboarding(
    userId: number,
    input: UnifiedOnboardingInput
  ): Promise<{ id: number; reference_number: string }> {
    
    try {
      // Transform input to unified format
      const unifiedInput = transformToUnifiedFormat(input);
      const formType = detectFormType(input);
      
      // Prepare form data based on detected type
      const formData = {
        ...unifiedInput,
        form_type: formType,
        // Store original input for complex forms
        original_input: formType === 'comprehensive' ? input : undefined
      };
      
      // Use unified request service for consistent creation
      const result = await UnifiedRequestService.createRequest({
        request_type: 'onboarding',
        employee_email: unifiedInput.employee_email,
        employee_name: unifiedInput.employee_name,
        employee_dept: unifiedInput.employee_dept,
        created_by_user: userId,
        status: unifiedInput.status,
        request_date: unifiedInput.request_date || new Date().toISOString().split('T')[0],
        form_data: formData
      });
      
      return result;
      
    } catch (error: any) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to create onboarding request: ${error.message}`,
        code: 'ONBOARDING_CREATION_FAILED'
      });
    }
  }
  
  // =====================================================
  // SIMPLE FORM SUPPORT
  // =====================================================
  
  static async createSimpleOnboarding(
    userId: number,
    input: SimpleOnboardingInput
  ): Promise<{ id: number; reference_number: string }> {
    
    const unifiedInput: UnifiedOnboardingInput = {
      form_type: 'simple',
      employee_email: input.employee_email,
      employee_name: input.employee_name,
      employee_dept: input.employee_dept,
      request_date: input.request_date,
      start_date: input.start_date,
      position_title: input.position_title,
      department_id: input.department_id,
      supervisor_id: input.supervisor_id,
      notes: input.notes
    };
    
    return this.createOnboarding(userId, unifiedInput);
  }
  
  // =====================================================
  // COMPREHENSIVE FORM SUPPORT
  // =====================================================
  
  static async createComprehensiveOnboarding(
    userId: number,
    input: ComprehensiveOnboardingInput
  ): Promise<{ id: number; reference_number: string }> {
    
    const unifiedInput: UnifiedOnboardingInput = {
      form_type: 'comprehensive',
      employee_email: input.employee_email || 'temp@hospital.com', // Will be updated
      start_date: input.startDate,
      request_date: input.requestDate || input.applicationDate,
      
      // Comprehensive fields
      firstName: input.firstName,
      secondName: input.secondName,
      thirdName: input.thirdName,
      jobTitle: input.jobTitle,
      workId: input.workId,
      reasonForJob: input.reasonForJob,
      documentNumber: input.documentNumber,
      applicationDate: input.applicationDate,
      fourthName: input.fourthName,
      fatherName: input.fatherName,
      grandpaName: input.grandpaName,
      familyName: input.familyName,
      transactionNumber: input.transactionNumber,
      transactionDate: input.transactionDate,
      employeeStatus: input.employeeStatus,
      employeeNumber: input.employeeNumber,
      department: input.department,
      group: input.group,
      rank: input.rank,
      birthDate: input.birthDate,
      appointmentDate: input.appointmentDate,
      employmentType: input.employmentType,
      nationality: input.nationality,
      gender: input.gender,
      onboardingReason: input.onboardingReason,
      phone: input.phone
    };
    
    return this.createOnboarding(userId, unifiedInput);
  }
  
  // =====================================================
  // BACKWARD COMPATIBILITY METHODS
  // =====================================================
  
  /**
   * Legacy method signature support for employee-requests service
   */
  static async createOnboardingRequest(
    data: Omit<CreateOnboardingRequest, 'reference_number'>
  ): Promise<{ id: number; reference_number: string }> {
    
    // Detect if this is comprehensive data by checking payload_json
    let formType: 'simple' | 'comprehensive' = 'simple';
    let comprehensiveData: any = {};
    
    if (data.payload_json) {
      try {
        comprehensiveData = JSON.parse(data.payload_json);
        formType = 'comprehensive';
      } catch (error) {
        console.warn('Failed to parse onboarding payload JSON:', error);
      }
    }
    
    const unifiedInput: UnifiedOnboardingInput = {
      form_type: formType,
      employee_email: data.employee_email,
      employee_name: data.employee_name,
      employee_dept: data.employee_dept,
      request_date: data.request_date,
      start_date: data.start_date || comprehensiveData.startDate,
      
      // Basic fields
      position_title: comprehensiveData.jobTitle,
      notes: data.reason_for_job,
      
      // Comprehensive fields from payload
      ...comprehensiveData,
      
      // Map specific fields
      documentNumber: data.document_number || comprehensiveData.documentNumber,
      transactionNumber: data.transaction_number || comprehensiveData.transactionNumber,
      employeeStatus: data.employee_status || comprehensiveData.employeeStatus,
      employmentType: data.employment_type || comprehensiveData.employmentType,
      onboardingReason: data.onboarding_reason || comprehensiveData.onboardingReason,
      
      additional_data: comprehensiveData
    };
    
    const userId = data.created_by_user || 0;
    
    return this.createOnboarding(userId, unifiedInput);
  }
  
  // =====================================================
  // RETRIEVE ONBOARDING REQUESTS
  // =====================================================
  
  static async getMyOnboardings(userId: number): Promise<OnboardingResponse[]> {
    try {
      const requests = await UnifiedRequestService.getRequests({
        created_by_user: userId,
        request_type: ['onboarding'],
        limit: 100
      });
      
      return requests.map(this.formatOnboardingResponse);
      
    } catch (error: any) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to retrieve onboarding requests: ${error.message}`,
        code: 'ONBOARDING_RETRIEVAL_FAILED'
      });
    }
  }
  
  static async getOnboardingById(onboardingId: number): Promise<OnboardingResponse | null> {
    return withConnection(async (conn) => {
      try {
        const [rows] = await conn.execute<RowDataPacket[]>(
          `SELECT * FROM Onboarding_Requests WHERE id = ?`,
          [onboardingId]
        );
        
        if (rows.length === 0) {
          return null;
        }
        
        return this.formatOnboardingResponse(rows[0]);
        
      } catch (error: any) {
        throw new AppError({
          statusCode: 500,
          message: `Failed to retrieve onboarding request: ${error.message}`,
          code: 'ONBOARDING_RETRIEVAL_FAILED'
        });
      }
    });
  }
  
  static async getAdminOnboardings(options: {
    status?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<OnboardingResponse[]> {
    try {
      const requests = await UnifiedRequestService.getRequests({
        request_type: ['onboarding'],
        status: options.status,
        limit: options.limit || 50,
        offset: options.offset || 0
      });
      
      return requests.map(this.formatOnboardingResponse);
      
    } catch (error: any) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to retrieve admin onboarding requests: ${error.message}`,
        code: 'ONBOARDING_ADMIN_RETRIEVAL_FAILED'
      });
    }
  }
  
  // =====================================================
  // UPDATE ONBOARDING REQUESTS
  // =====================================================
  
  static async updateOnboardingStatus(
    onboardingId: number,
    status: string,
    approverUserId: number,
    options: {
      decision_note?: string;
      notes?: string;
    } = {}
  ): Promise<void> {
    try {
      // Determine final_decision based on status
      let final_decision: 'pending' | 'approved' | 'rejected' = 'pending';
      if (status.includes('مكتمل') || status.includes('approved')) {
        final_decision = 'approved';
      } else if (status.includes('مرفوض') || status.includes('rejected')) {
        final_decision = 'rejected';
      }
      
      await UnifiedRequestService.updateRequest(
        'onboarding',
        onboardingId,
        {
          status: await getStandardStatus(status),
          decision_note: options.decision_note || options.notes,
          final_decision,
          approval_stage: final_decision === 'pending' ? 'in_review' : final_decision,
          approved_count: final_decision === 'approved' ? 1 : 0
        },
        approverUserId
      );
      
    } catch (error: any) {
      throw new AppError({
        statusCode: 500,
        message: `Failed to update onboarding status: ${error.message}`,
        code: 'ONBOARDING_UPDATE_FAILED'
      });
    }
  }
  
  // =====================================================
  // APPROVAL WORKFLOW METHODS
  // =====================================================
  
  static async approveOnboarding(
    onboardingId: number,
    approverUserId: number,
    decision_note?: string
  ): Promise<void> {
    await this.updateOnboardingStatus(
      onboardingId,
      'مكتمل',
      approverUserId,
      { decision_note: decision_note || 'Approved' }
    );
  }
  
  static async rejectOnboarding(
    onboardingId: number,
    rejectorUserId: number,
    rejection_reason: string
  ): Promise<void> {
    await this.updateOnboardingStatus(
      onboardingId,
      'مرفوض',
      rejectorUserId,
      { decision_note: rejection_reason }
    );
  }
  
  // =====================================================
  // RESPONSE FORMATTING
  // =====================================================
  
  private static formatOnboardingResponse(row: any): OnboardingResponse {
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
      start_date: row.start_date,
      
      // Basic onboarding fields (with fallback to JSON data)
      position_title: row.position_title || formData.position_title,
      department_id: row.department_id || formData.department_id,
      supervisor_id: row.supervisor_id,
      
      // Comprehensive onboarding fields
      document_number: row.document_number || formData.document_number,
      transaction_number: row.transaction_number || formData.transaction_number,
      transaction_date: row.transaction_date || formData.transaction_date,
      employee_status: row.employee_status || formData.employee_status,
      employment_type: row.employment_type || formData.employment_type,
      onboarding_reason: row.onboarding_reason || formData.onboarding_reason,
      reason_for_job: row.reason_for_job || formData.reason_for_job,
      employee_number: row.employee_number || formData.employee_number,
      nationality: row.nationality || formData.nationality,
      gender: row.gender || formData.gender,
      birth_date: row.birth_date || formData.birth_date,
      appointment_date: row.appointment_date || formData.appointment_date,
      
      // Multi-approval fields
      approval_stage: row.approval_stage || 'pending',
      total_approvers: row.total_approvers || 0,
      approved_count: row.approved_count || 0,
      final_decision: row.final_decision || 'pending',
      
      // Timestamps and decision tracking
      created_at: row.created_at,
      updated_at: row.updated_at,
      approved_at: row.approved_at,
      rejected_at: row.rejected_at,
      decision_note: row.decision_note,
      approved_by: row.approved_by,
      rejected_by: row.rejected_by,
      
      // Additional data
      payload_json: row.payload_json,
      notes: row.notes
    };
  }
  
  // =====================================================
  // MIGRATION UTILITY METHODS
  // =====================================================
  
  /**
   * Utility method to migrate data from simple/comprehensive schemas
   */
  static async migrateLegacyOnboardingData(): Promise<{ migrated: number; errors: number }> {
    return withConnection(async (conn) => {
      let migrated = 0;
      let errors = 0;
      
      try {
        // Find records with JSON data that needs extraction
        const [records] = await conn.execute<RowDataPacket[]>(`
          SELECT * FROM Onboarding_Requests 
          WHERE payload_json IS NOT NULL 
            AND (document_number IS NULL OR employment_type IS NULL)
        `);
        
        for (const record of records) {
          try {
            const formData = extractFormDataFromPayload(record.payload_json);
            
            if (Object.keys(formData).length > 0) {
              // Update record with extracted data
              await conn.execute(`
                UPDATE Onboarding_Requests 
                SET 
                  position_title = COALESCE(position_title, ?),
                  document_number = COALESCE(document_number, ?),
                  transaction_number = COALESCE(transaction_number, ?),
                  employee_status = COALESCE(employee_status, ?),
                  employment_type = COALESCE(employment_type, ?),
                  nationality = COALESCE(nationality, ?),
                  gender = COALESCE(gender, ?)
                WHERE id = ?
              `, [
                formData.position_title,
                formData.document_number,
                formData.transaction_number,
                formData.employee_status,
                formData.employment_type,
                formData.nationality,
                formData.gender,
                record.id
              ]);
              
              migrated++;
            }
          } catch (recordError) {
            console.error(`Failed to migrate onboarding record ${record.id}:`, recordError);
            errors++;
          }
        }
        
        return { migrated, errors };
        
      } catch (error: any) {
        throw new AppError({
          statusCode: 500,
          message: `Migration failed: ${error.message}`,
          code: 'MIGRATION_FAILED'
        });
      }
    });
  }
}
