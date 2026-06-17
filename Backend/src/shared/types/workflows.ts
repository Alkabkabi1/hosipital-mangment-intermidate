export interface WorkflowSignature {
  id: number;
  formId: number;
  departmentId: number;
  signerName: string;
  signerTitle: string;
  signedBy: number;
  signedAt: Date;
  signatureDate: Date;
  comment?: string | null;
}

export interface ClearanceForm {
  clearanceId: number;
  employeeId: number;
  referenceNumber: string;
  requestDate: Date;
  effectiveDate: Date;
  lastWorkingDay?: Date | null;
  reason?: string | null;
  statusId: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DelegationForm {
  delegationId: number;
  employeeId: number;
  referenceNumber: string;
  requestDate: Date;
  delegationType: string;
  startDate?: Date | null;
  endDate?: Date | null;
  reason?: string | null;
  delegatedToEmployeeId?: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingForm {
  onboardingId: number;
  employeeId: number;
  referenceNumber: string;
  requestDate: Date;
  startDate: Date;
  positionTitle?: string | null;
  departmentId?: number | null;
  supervisorId?: number | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowType = 'clearance' | 'delegation' | 'onboarding';
