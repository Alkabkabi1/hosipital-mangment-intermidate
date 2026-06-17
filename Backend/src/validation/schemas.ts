import { z } from 'zod';

// Common helpers
const nonEmpty = z.string().min(1, 'Required');
const email = z.string().email('Invalid email');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Expected ISO date (YYYY-MM-DD)');

// Clearance create: require employee email, clearanceType, specificReason, lastWorkingDay, documentNumber
const ClearanceCreate = z.object({
  email,
  clearanceType: z.enum(['end_of_service', 'end_mid_service']),
  reason: nonEmpty, // Display reason (Arabic label)
  specificReason: nonEmpty, // Specific reason code (e.g., 'retirement', 'due_to_assignment', 'other')
  lastWorkingDay: isoDate.refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d > today;
  }, { message: 'Last working day must be in the future' }),
  documentNumber: nonEmpty, // Document number the clearance is based on
  otherReasonText: z.string().optional(), // Custom reason text if "other" is selected
  // Optional additional fields used by controller
  firstName: z.string().optional(),
  secondName: z.string().optional(),
  thirdName: z.string().optional(),
  employeeNumber: z.string().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  requestDate: z.string().optional(),
});

// Onboarding create: comprehensive onboarding form with all required fields
const OnboardingCreate = z.object({
  // Container 1: Basic Info
  firstName: nonEmpty,
  secondName: nonEmpty,
  thirdName: nonEmpty,
  jobTitle: nonEmpty,
  workId: nonEmpty,
  reasonForJob: z.enum(['transfer', 'assignment', 'appointment', 'secondment', 'scholarship']),
  
  // Container 2: Document & Dates
  documentNumber: nonEmpty,
  applicationDate: isoDate,
  startDate: isoDate,
  
  // Container 3: Details
  // Fourth degree name
  fourthName: nonEmpty,
  fatherName: nonEmpty,
  grandpaName: nonEmpty,
  familyName: nonEmpty,
  
  // Transaction
  transactionNumber: nonEmpty,
  transactionDate: isoDate,
  
  // Employee info
  employeeStatus: z.enum(['full_assignment', 'partial_assignment']),
  employeeNumber: nonEmpty,
  department: nonEmpty, // Department ID or name
  group: z.string().optional(),
  rank: z.string().optional(),
  
  // Dates
  birthDate: isoDate.refine((date) => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Birth date must be in the past
    if (d >= today) return false;
    // Birth date should be reasonable (not more than 100 years ago)
    const minDate = new Date(today);
    minDate.setFullYear(minDate.getFullYear() - 100);
    return d >= minDate;
  }, { message: 'Birth date must be in the past and within reasonable range' }),
  appointmentDate: isoDate,
  
  // Employment details
  employmentType: z.enum(['civil_service', 'self_employment', 'surplus_workforce', 'locum', 'partial_assignment']),
  nationality: nonEmpty, // Single nationality field (moved from optional)
  gender: z.enum(['male', 'female']),
  onboardingReason: z.enum(['transfer', 'assignment', 'appointment', 'secondment', 'scholarship']),
  
  // Backend compatibility fields
  email: email.optional(),
  phone: z.string().optional(),
  requestDate: z.string().optional(),
});

// Delegation create: accept either (from/to emails + dates) OR (reference_number + delegation_type + scope_description + dates)
const DelegationEitherA = z.object({
  fromEmail: email,
  toEmail: email,
  validFrom: isoDate,
  validTo: isoDate,
  scopes: z.any().optional(),
});

const DelegationEitherB = z.object({
  reference_number: nonEmpty,
  delegation_type: nonEmpty,
  scope_description: nonEmpty,
  start_date: isoDate,
  end_date: isoDate,
});

const DelegationCreate = z.union([DelegationEitherA, DelegationEitherB]);

export const Schemas = {
  clearance: { create: ClearanceCreate },
  onboarding: { create: OnboardingCreate },
  delegation: { create: DelegationCreate },
};

export type ClearanceCreateInput = z.infer<typeof ClearanceCreate>;
export type OnboardingCreateInput = z.infer<typeof OnboardingCreate>;
export type DelegationCreateInput = z.infer<typeof DelegationCreate>;

