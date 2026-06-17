import {
  getOnboardingById,
  insertOnboardingForm,
  listOnboardingsByEmployee,
  listOnboardingsForAdmin,
  listOnboardingsForAdminByStatuses,
  updateOnboardingStatusRecord,
} from './onboarding.repository';
import type {
  AddOnboardingSignatureInput,
  CreateOnboardingInput,
  UpdateOnboardingStatusInput,
} from './onboarding.schema';
import { AppError } from '../../core/errors';
import { insertSignature, ensureDepartmentHasNotSigned } from '../../shared/utils/signatures';
import { STANDARD_WORKFLOW_STATUSES, normalizeWorkflowStatus } from '../../shared/utils/status';
import { findEmployeeIdForUser } from '../clearance/clearance.repository';

function toIsoDate(value?: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

export async function createOnboarding(userId: number, input: CreateOnboardingInput) {
  const employeeId = await findEmployeeIdForUser(userId);
  if (!employeeId) {
    throw new AppError({ statusCode: 400, message: 'User not linked to employee record', code: 'BAD_REQUEST' });
  }

  const onboardingId = await insertOnboardingForm({
    employeeId,
    referenceNumber: input.referenceNumber,
    requestDate: toIsoDate(input.requestDate) ?? new Date().toISOString().slice(0, 10),
    startDate: toIsoDate(input.startDate) ?? new Date().toISOString().slice(0, 10),
    positionTitle: input.positionTitle ?? null,
    departmentId: input.departmentId ?? null,
    supervisorId: input.supervisorId ?? null,
    status: STANDARD_WORKFLOW_STATUSES.pending,
    notes: input.notes ?? null,
  });

  return getOnboardingById(onboardingId);
}

export async function listMyOnboardings(userId: number) {
  const employeeId = await findEmployeeIdForUser(userId);
  if (!employeeId) return [];
  return listOnboardingsByEmployee(employeeId);
}

export async function getOnboardingDetails(onboardingId: number) {
  const onboarding = await getOnboardingById(onboardingId);
  if (!onboarding) {
    throw new AppError({ statusCode: 404, message: 'Onboarding not found', code: 'NOT_FOUND' });
  }
  return onboarding;
}

export async function adminListOnboardings() {
  return listOnboardingsForAdmin();
}

export async function adminListPendingOnboardings() {
  return listOnboardingsForAdminByStatuses([STANDARD_WORKFLOW_STATUSES.pending]);
}

export async function changeOnboardingStatus(
  onboardingId: number,
  approverUserId: number,
  input: UpdateOnboardingStatusInput
) {
  const normalized = normalizeWorkflowStatus(input.status);
  await updateOnboardingStatusRecord({
    onboardingId,
    status: normalized,
    updatedBy: approverUserId,
    notes: input.notes ?? null,
  });
}

export async function addOnboardingSignature(
  onboardingId: number,
  signerUserId: number,
  input: AddOnboardingSignatureInput
) {
  await ensureDepartmentHasNotSigned('Onboarding_Signatures', onboardingId, input.departmentId);

  await insertSignature({
    table: 'Onboarding_Signatures',
    formId: onboardingId,
    departmentId: input.departmentId,
    signerName: input.signerName,
    signerTitle: input.signerTitle,
    signedBy: signerUserId,
    signatureDate: toIsoDate(input.signatureDate ?? undefined) ?? new Date().toISOString().slice(0, 10),
    comment: input.comment ?? null,
  });
}

export const ONBOARDING_STATUS = STANDARD_WORKFLOW_STATUSES;
