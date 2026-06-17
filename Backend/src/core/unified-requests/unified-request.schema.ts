// =====================================================
// UNIFIED REQUEST VALIDATION SCHEMAS
// =====================================================
// Centralized validation for all request types
// Combines comprehensive validation from employee-requests
// with clean schema patterns from dedicated modules
// =====================================================

import { z } from 'zod';

// =====================================================
// SECTION 1: BASE VALIDATION SCHEMAS
// =====================================================

// Common validation patterns
const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format. Use ISO format (YYYY-MM-DD)',
});

const nonEmptyString = z.string().min(1, 'This field is required');
const email = z.string().email('Invalid email format');
const optionalString = z.string().optional();
const positiveInt = z.number().int().positive();
const optionalPositiveInt = z.number().int().positive().optional();

// Base request schema that all requests inherit from
const baseRequestSchema = z.object({
  employee_email: email,
  employee_name: nonEmptyString,
  employee_dept: optionalString,
  request_date: isoDate.optional(),
  status: z.string().optional(),
});

// Multi-approval system fields (optional for all requests)
const multiApprovalSchema = z.object({
  approval_stage: z.string().optional(),
  total_approvers: z.number().int().min(0).optional(),
  approved_count: z.number().int().min(0).optional(),
  final_decision: z.enum(['pending', 'approved', 'rejected']).optional(),
});

// =====================================================
// SECTION 2: CLEARANCE REQUEST SCHEMAS
// =====================================================

export const clearanceRequestSchema = baseRequestSchema.extend({
  // Core clearance fields
  last_work_day: isoDate.optional(),
  reason: z.string().max(500).optional(),
  
  // Enhanced clearance fields (from comprehensive implementation)
  clearance_type: z.enum(['end_of_service', 'end_mid_service']).optional(),
  specific_reason: z.string().max(100).optional(),
  document_number: z.string().max(50).optional(),
  
  // Backward compatibility fields (mapped from old implementations)
  lastWorkDay: isoDate.optional(), // Maps to last_work_day
  lastWorkingDay: isoDate.optional(), // Maps to last_work_day
  
  // Additional form data
  notes: z.string().optional(),
  ...multiApprovalSchema.shape,
});

export type ClearanceRequestInput = z.infer<typeof clearanceRequestSchema>;

// =====================================================
// SECTION 3: ONBOARDING REQUEST SCHEMAS
// =====================================================

// Simple onboarding schema (basic implementation)
export const simpleOnboardingSchema = baseRequestSchema.extend({
  start_date: isoDate,
  position_title: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  ...multiApprovalSchema.shape,
});

// Comprehensive onboarding schema (full implementation)
export const comprehensiveOnboardingSchema = baseRequestSchema.extend({
  // Container 1: Basic Info
  firstName: nonEmptyString,
  secondName: nonEmptyString,
  thirdName: nonEmptyString,
  jobTitle: nonEmptyString,
  workId: nonEmptyString,
  reasonForJob: z.enum(['transfer', 'assignment', 'appointment', 'secondment', 'scholarship']),
  
  // Container 2: Document & Dates
  documentNumber: nonEmptyString,
  applicationDate: isoDate,
  startDate: isoDate,
  
  // Container 3: Details
  fourthName: nonEmptyString,
  fatherName: nonEmptyString,
  grandpaName: nonEmptyString,
  familyName: nonEmptyString,
  transactionNumber: nonEmptyString,
  transactionDate: isoDate,
  
  // Employee info
  employeeStatus: z.enum(['full_assignment', 'partial_assignment']),
  employeeNumber: nonEmptyString,
  department: nonEmptyString,
  group: z.string().optional(),
  rank: z.string().optional(),
  
  // Dates with validation
  birthDate: isoDate.refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d >= today) return false;
    const minDate = new Date(today);
    minDate.setFullYear(minDate.getFullYear() - 100);
    return d >= minDate;
  }, { message: 'Birth date must be in the past and within reasonable range' }),
  
  appointmentDate: isoDate,
  
  // Employment details
  employmentType: z.enum(['civil_service', 'self_employment', 'surplus_workforce', 'locum', 'partial_assignment']),
  nationality: nonEmptyString,
  gender: z.enum(['male', 'female']),
  onboardingReason: z.enum(['transfer', 'assignment', 'appointment', 'secondment', 'scholarship']),
  
  // Optional fields
  email: email.optional(),
  phone: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

// Unified onboarding schema that accepts both simple and comprehensive data
export const onboardingRequestSchema = z.union([
  simpleOnboardingSchema.extend({
    form_type: z.literal('simple').optional()
  }),
  comprehensiveOnboardingSchema.extend({
    form_type: z.literal('comprehensive').optional()
  })
]);

export type OnboardingRequestInput = z.infer<typeof onboardingRequestSchema>;

// =====================================================
// SECTION 4: DELEGATION REQUEST SCHEMA
// =====================================================

export const delegationRequestSchema = baseRequestSchema.extend({
  // Delegation-specific fields
  from_email: email.optional(),
  to_email: email.optional(),
  delegation_type: z.string().max(100).optional(),
  scope_description: z.string().optional(),
  start_date: isoDate.optional(),
  end_date: isoDate.optional(),
  
  // Alternative delegation data format
  reference_number: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type DelegationRequestInput = z.infer<typeof delegationRequestSchema>;

// =====================================================
// SECTION 5: CERTIFICATE REQUEST SCHEMAS
// =====================================================

export const certificateRequestSchema = baseRequestSchema.extend({
  occupation: nonEmptyString,
  nationality: nonEmptyString,
  iqama_number: z.string().max(50).optional(),
  passport_number: z.string().max(50).optional(),
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type CertificateRequestInput = z.infer<typeof certificateRequestSchema>;

// =====================================================
// SECTION 6: EXPERIENCE CERTIFICATE REQUEST SCHEMA
// =====================================================

export const experienceRequestSchema = baseRequestSchema.extend({
  job_title: nonEmptyString,
  department: nonEmptyString,
  start_date: isoDate,
  end_date: isoDate.optional(),
  experience_years: z.number().int().min(0).optional(),
  experience_months: z.number().int().min(0).max(11).optional(),
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type ExperienceRequestInput = z.infer<typeof experienceRequestSchema>;

// =====================================================
// SECTION 7: EXIT REQUEST SCHEMA
// =====================================================

export const exitRequestSchema = baseRequestSchema.extend({
  employee_number: z.string().max(50).optional(),
  employee_id_number: z.string().max(50).optional(),
  job_title: nonEmptyString,
  department: nonEmptyString,
  supervisor_name: z.string().max(255).optional(),
  mobile_number: z.string().max(20).optional(),
  
  // Exit feedback fields
  exit_reasons: z.string().optional(),
  work_environment: z.string().optional(),
  manager_relationship: z.string().optional(),
  coworker_relationship: z.string().optional(),
  suggestions: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type ExitRequestInput = z.infer<typeof exitRequestSchema>;

// =====================================================
// SECTION 8: ASSIGNMENT REQUEST SCHEMAS
// =====================================================

export const assignmentRequestSchema = baseRequestSchema.extend({
  employee_number: z.string().max(50).optional(),
  national_id: z.string().max(50).optional(),
  
  // Current position
  current_department: z.string().max(100).optional(),
  current_position: z.string().max(255).optional(),
  current_location: z.string().max(100).optional(),
  
  // Assignment details
  assignment_type: z.enum(['temporary', 'permanent', 'project_based', 'acting']).default('temporary'),
  new_role: nonEmptyString,
  new_department: z.string().max(100).optional(),
  assignment_reason: nonEmptyString,
  
  // Duration
  start_date: isoDate,
  end_date: isoDate.optional(),
  expected_duration: z.string().max(50).optional(),
  
  // Additional info
  additional_benefits: z.string().optional(),
  financial_impact: z.string().max(100).optional(),
  requires_relocation: z.boolean().default(false),
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type AssignmentRequestInput = z.infer<typeof assignmentRequestSchema>;

// =====================================================
// SECTION 9: ASSIGNMENT TERMINATION REQUEST SCHEMA
// =====================================================

export const assignmentTerminationRequestSchema = baseRequestSchema.extend({
  employee_number: z.string().max(50).optional(),
  national_id: z.string().max(50).optional(),
  
  // Assignment termination details
  current_assignment_id: z.number().int().positive().optional(),
  current_assignment_role: nonEmptyString,
  assignment_start_date: isoDate.optional(),
  termination_reason: nonEmptyString,
  
  // Return details
  return_to_department: z.string().max(100).optional(),
  return_to_position: z.string().max(255).optional(),
  return_date: isoDate.optional(),
  
  effective_date: isoDate,
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type AssignmentTerminationRequestInput = z.infer<typeof assignmentTerminationRequestSchema>;

// =====================================================
// SECTION 10: INTERNAL TRANSFER REQUEST SCHEMA
// =====================================================

export const internalTransferRequestSchema = baseRequestSchema.extend({
  employee_number: z.string().max(50).optional(),
  national_id: z.string().max(50).optional(),
  job_title: nonEmptyString,
  
  // Current position
  current_department: nonEmptyString,
  current_position: nonEmptyString,
  current_supervisor: z.string().max(255).optional(),
  current_location: z.string().max(100).optional(),
  
  // Transfer destination
  target_department: nonEmptyString,
  target_position: nonEmptyString,
  target_supervisor: z.string().max(255).optional(),
  target_location: z.string().max(100).optional(),
  
  // Transfer details
  transfer_reason: nonEmptyString,
  transfer_type: z.enum(['permanent', 'temporary']).default('permanent'),
  requires_training: z.boolean().default(false),
  salary_impact: z.string().max(100).optional(),
  preferred_start_date: isoDate.optional(),
  
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type InternalTransferRequestInput = z.infer<typeof internalTransferRequestSchema>;

// =====================================================
// SECTION 11: MATERNITY LEAVE REQUEST SCHEMA
// =====================================================

export const maternityLeaveRequestSchema = baseRequestSchema.extend({
  job_title: nonEmptyString,
  department: nonEmptyString,
  supervisor_name: z.string().max(255).optional(),
  
  // Maternity leave specific
  expected_due_date: isoDate,
  requested_start_date: isoDate,
  requested_end_date: isoDate.optional(),
  leave_duration_weeks: z.number().int().min(1).max(52).default(14),
  
  // Medical information
  medical_certificate_attached: z.boolean().default(false),
  doctor_name: z.string().max(255).optional(),
  medical_notes: z.string().optional(),
  
  // Work arrangement
  work_handover_plan: z.string().optional(),
  temporary_replacement: z.string().max(255).optional(),
  return_work_plan: z.string().optional(),
  
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type MaternityLeaveRequestInput = z.infer<typeof maternityLeaveRequestSchema>;

// =====================================================
// SECTION 12: HOUSING ALLOWANCE REQUEST SCHEMA
// =====================================================

export const housingAllowanceRequestSchema = baseRequestSchema.extend({
  allowance_type: z.enum(['saudi_doctors', 'general_housing']),
  monthly_amount: z.number().positive().optional(),
  justification: z.string().optional(),
  accommodation_details: z.string().optional(),
  request_notes: z.string().optional(),
  
  ...multiApprovalSchema.shape,
});

export type HousingAllowanceRequestInput = z.infer<typeof housingAllowanceRequestSchema>;

// =====================================================
// SECTION 13: UNIFIED REQUEST CREATION SCHEMA
// =====================================================

// Master schema that determines which validation to use based on request type
export const createUnifiedRequestSchema = z.object({
  request_type: z.enum([
    'clearance', 'onboarding', 'delegation', 'certificate', 'experience',
    'exit', 'assignment', 'assignment_termination', 'internal_transfer', 
    'maternity_leave', 'housing_allowance'
  ]),
  form_data: z.record(z.any()), // Will be validated against specific schema based on request_type
});

export type CreateUnifiedRequestInput = z.infer<typeof createUnifiedRequestSchema>;

// =====================================================
// SECTION 14: REQUEST UPDATE SCHEMA
// =====================================================

export const updateRequestSchema = z.object({
  status: z.string().optional(),
  decision_note: z.string().optional(),
  approval_stage: z.string().optional(),
  approved_count: z.number().int().min(0).optional(),
  final_decision: z.enum(['pending', 'approved', 'rejected']).optional(),
  form_data: z.record(z.any()).optional(), // Additional form data updates
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

// =====================================================
// SECTION 15: REQUEST QUERY SCHEMA
// =====================================================

export const requestQuerySchema = z.object({
  employee_id: optionalPositiveInt,
  created_by_user: optionalPositiveInt,
  status: z.array(z.string()).optional(),
  request_type: z.array(z.enum([
    'clearance', 'onboarding', 'delegation', 'certificate', 'experience',
    'exit', 'assignment', 'assignment_termination', 'internal_transfer', 
    'maternity_leave', 'housing_allowance'
  ])).optional(),
  date_from: isoDate.optional(),
  date_to: isoDate.optional(),
  approval_stage: z.string().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0),
});

export type RequestQueryInput = z.infer<typeof requestQuerySchema>;

// =====================================================
// SECTION 16: SCHEMA SELECTOR UTILITY
// =====================================================

export function getValidationSchema(requestType: string) {
  const schemas = {
    clearance: clearanceRequestSchema,
    onboarding: onboardingRequestSchema,
    delegation: delegationRequestSchema,
    certificate: certificateRequestSchema,
    experience: experienceRequestSchema,
    exit: exitRequestSchema,
    assignment: assignmentRequestSchema,
    assignment_termination: assignmentTerminationRequestSchema,
    internal_transfer: internalTransferRequestSchema,
    maternity_leave: maternityLeaveRequestSchema,
    housing_allowance: housingAllowanceRequestSchema,
  };
  
  return schemas[requestType as keyof typeof schemas];
}
