import {
  insertDelegationForm,
  listDelegationsByEmployee,
  listDelegationsForAdmin,
  listDelegationsForAdminByStatuses,
  getDelegationById,
  updateDelegationStatusRecord,
} from './delegation.repository';
import type {
  AddDelegationSignatureInput,
  CreateDelegationInput,
  UpdateDelegationStatusInput,
} from './delegation.schema';
import { AppError } from '../../core/errors';
import { insertSignature, ensureDepartmentHasNotSigned } from '../../shared/utils/signatures';
import { STANDARD_WORKFLOW_STATUSES, normalizeWorkflowStatus } from '../../shared/utils/status';
import { findEmployeeIdForUser } from '../clearance/clearance.repository';

function toIsoDate(value?: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

export async function createDelegation(userId: number, input: CreateDelegationInput) {
  const employeeId = await findEmployeeIdForUser(userId);
  if (!employeeId) {
    throw new AppError({ statusCode: 400, message: 'User not linked to employee record', code: 'BAD_REQUEST' });
  }

  const delegationId = await insertDelegationForm({
    employeeId,
    referenceNumber: input.referenceNumber,
    requestDate: toIsoDate(input.requestDate) ?? new Date().toISOString().slice(0, 10),
    delegationType: input.delegationType,
    startDate: toIsoDate(input.startDate ?? undefined),
    endDate: toIsoDate(input.endDate ?? undefined),
    reason: input.reason,
    delegatedToEmployeeId: input.delegatedToEmployeeId ?? null,
    status: STANDARD_WORKFLOW_STATUSES.pending,
    notes: input.notes,
  });

  return getDelegationById(delegationId);
}

export async function listMyDelegations(userId: number) {
  const employeeId = await findEmployeeIdForUser(userId);
  if (!employeeId) return [];
  return listDelegationsByEmployee(employeeId);
}

export async function getDelegationDetails(delegationId: number) {
  const delegation = await getDelegationById(delegationId);
  if (!delegation) {
    throw new AppError({ statusCode: 404, message: 'Delegation not found', code: 'NOT_FOUND' });
  }
  return delegation;
}

export async function adminListDelegations() {
  return listDelegationsForAdmin();
}

export async function adminListPendingDelegations() {
  return listDelegationsForAdminByStatuses([STANDARD_WORKFLOW_STATUSES.pending]);
}

export async function changeDelegationStatus(
  delegationId: number,
  approverUserId: number,
  input: UpdateDelegationStatusInput
) {
  const normalized = normalizeWorkflowStatus(input.status);
  await updateDelegationStatusRecord({
    delegationId,
    status: normalized,
    updatedBy: approverUserId,
    reason: input.reason ?? null,
  });
}

export async function addDelegationSignature(
  delegationId: number,
  signerUserId: number,
  input: AddDelegationSignatureInput
) {
  await ensureDepartmentHasNotSigned('Delegation_Signatures', delegationId, input.departmentId);

  await insertSignature({
    table: 'Delegation_Signatures',
    formId: delegationId,
    departmentId: input.departmentId,
    signerName: input.signerName,
    signerTitle: input.signerTitle,
    signedBy: signerUserId,
    signatureDate: toIsoDate(input.signatureDate ?? undefined) ?? new Date().toISOString().slice(0, 10),
    comment: input.comment ?? null,
  });
}

export const DELEGATION_STATUS = STANDARD_WORKFLOW_STATUSES;
