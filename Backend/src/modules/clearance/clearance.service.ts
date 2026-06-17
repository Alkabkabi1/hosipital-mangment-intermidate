import {
  findEmployeeIdForUser,
  getClearanceById,
  insertClearanceForm,
  listClearancesByEmployee,
  listClearancesForAdmin,
  listClearancesForAdminByStatusIds,
  updateClearanceStatus,
} from './clearance.repository';
import type { AddSignatureInput, CreateClearanceInput, UpdateClearanceStatusInput } from './clearance.schema';
import { AppError } from '../../core/errors';
import { insertSignature, ensureDepartmentHasNotSigned } from '../../shared/utils/signatures';
import { getClearanceStatusIdByName, STANDARD_WORKFLOW_STATUSES, normalizeWorkflowStatus } from '../../shared/utils/status';

function toIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

export async function createClearance(userId: number, input: CreateClearanceInput) {
  const employeeId = await findEmployeeIdForUser(userId);
  if (!employeeId) {
    throw new AppError({ statusCode: 400, message: 'User not linked to employee record', code: 'BAD_REQUEST' });
  }

  const statusId = await getClearanceStatusIdByName('pending');
  const clearanceId = await insertClearanceForm({
    employeeId,
    referenceNumber: input.referenceNumber,
    requestDate: toIsoDate(input.requestDate) ?? new Date().toISOString().slice(0, 10),
    effectiveDate: toIsoDate(input.effectiveDate) ?? new Date().toISOString().slice(0, 10),
    lastWorkingDay: toIsoDate(input.lastWorkingDay ?? undefined),
    reason: input.reason,
    notes: input.notes,
    statusId,
  });

  return getClearanceById(clearanceId);
}

export async function listMyClearances(userId: number) {
  const employeeId = await findEmployeeIdForUser(userId);
  if (!employeeId) {
    return [];
  }
  return listClearancesByEmployee(employeeId);
}

export async function getClearanceDetails(clearanceId: number) {
  const clearance = await getClearanceById(clearanceId);
  if (!clearance) {
    throw new AppError({ statusCode: 404, message: 'Clearance not found', code: 'NOT_FOUND' });
  }
  return clearance;
}

export async function adminListClearances() {
  return listClearancesForAdmin();
}

export async function adminListPendingClearances() {
  // Use status names directly instead of IDs
  const pendingStatuses = ['قيد الاعتماد', 'قيد الانتظار', 'قيد المراجعة', 'submitted'];
  return listClearancesForAdminByStatusIds(pendingStatuses);
}

export async function changeClearanceStatus(
  clearanceId: number,
  approverUserId: number,
  input: UpdateClearanceStatusInput
) {
  const statusKey = normalizeWorkflowStatus(input.status);
  const statusId = await getClearanceStatusIdByName(statusKey.toLowerCase());
  await updateClearanceStatus({
    clearanceId,
    statusId,
    approvedBy: approverUserId,
    rejectionReason: input.rejectionReason ?? null,
  });
}

export async function addClearanceSignature(
  clearanceId: number,
  signerUserId: number,
  input: AddSignatureInput
) {
  await ensureDepartmentHasNotSigned('Clearance_Signatures', clearanceId, input.departmentId);

  await insertSignature({
    table: 'Clearance_Signatures',
    formId: clearanceId,
    departmentId: input.departmentId,
    signerName: input.signerName,
    signerTitle: input.signerTitle,
    signedBy: signerUserId,
    signatureDate: toIsoDate(input.signatureDate) ?? new Date().toISOString().slice(0, 10),
    comment: input.comment ?? null,
  });
}

export const CLEARANCE_STATUS = STANDARD_WORKFLOW_STATUSES;
