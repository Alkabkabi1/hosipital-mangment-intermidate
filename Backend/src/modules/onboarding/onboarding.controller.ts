import type { RequestHandler } from 'express';

import type { OnboardingWithUserRow } from './onboarding.repository';
import { addOnboardingSignatureSchema, createOnboardingSchema, updateOnboardingStatusSchema } from './onboarding.schema';
import {
  addOnboardingSignature,
  adminListOnboardings,
  adminListPendingOnboardings,
  changeOnboardingStatus,
  createOnboarding,
  getOnboardingDetails,
  listMyOnboardings,
} from './onboarding.service';
import { AppError } from '../../core/errors';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import type { OnboardingForm } from '../../shared/types/workflows';
import { sendSuccess } from '../../shared/utils/response';
import { presentWorkflowStatus } from '../../shared/utils/status';
import { findEmployeeIdForUser } from '../clearance/clearance.repository';

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const mapOnboardingResponse = (onboarding: OnboardingForm) => ({
  onboardingId: onboarding.onboardingId,
  employeeId: onboarding.employeeId,
  referenceNumber: onboarding.referenceNumber,
  requestDate: toIso(onboarding.requestDate),
  startDate: toIso(onboarding.startDate),
  positionTitle: onboarding.positionTitle ?? null,
  departmentId: onboarding.departmentId ?? null,
  supervisorId: onboarding.supervisorId ?? null,
  status: presentWorkflowStatus(onboarding.status),
  statusCode: onboarding.status,
  notes: onboarding.notes ?? null,
  createdAt: toIso(onboarding.createdAt),
  updatedAt: toIso(onboarding.updatedAt),
});

const mapAdminOnboardingResponse = (row: OnboardingWithUserRow) => ({
  onboardingId: row.onboarding_id,
  employeeId: row.employee_id,
  referenceNumber: row.reference_number,
  requestDate: toIso(row.request_date),
  startDate: toIso(row.start_date),
  positionTitle: row.position ?? null,
  departmentId: row.department_id ?? null,
  supervisorId: row.supervisor_id ?? null,
  status: presentWorkflowStatus(row.status),
  statusCode: row.status,
  notes: row.notes ?? null,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  employeeName: row.employee_name,
  employeeEmail: row.employee_email,
  departmentName: row.department_name,
});

export const createOnboardingController: RequestHandler = async (req, res, next) => {
  try {
    const input = createOnboardingSchema.parse(req.body);
    const onboarding = await createOnboarding(req.auth!.sub, input);
    if (!onboarding) {
      throw new AppError({ statusCode: 500, message: 'Failed to create onboarding request', code: 'INTERNAL_SERVER_ERROR' });
    }
    sendSuccess(res, mapOnboardingResponse(onboarding), 201);
  } catch (error) {
    next(error);
  }
};

export const listMyOnboardingsController: RequestHandler = async (req, res, next) => {
  try {
    const onboardings = await listMyOnboardings(req.auth!.sub);
    sendSuccess(res, onboardings.map(mapOnboardingResponse));
  } catch (error) {
    next(error);
  }
};

export const getOnboardingController: RequestHandler = async (req, res, next) => {
  try {
    const onboardingId = Number(req.params.id);
    const onboarding = await getOnboardingDetails(onboardingId);
    const employeeId = await findEmployeeIdForUser(req.auth!.sub);
    const isOwner = employeeId !== null && onboarding.employeeId === employeeId;
    const isAdmin = req.auth?.roles.includes('ADMIN');
    if (!isOwner && !isAdmin) {
      throw new AppError({ statusCode: 403, message: 'Forbidden', code: 'FORBIDDEN' });
    }
    sendSuccess(res, mapOnboardingResponse(onboarding));
  } catch (error) {
    next(error);
  }
};

export const adminListOnboardingsController: RequestHandler = async (_req, res, next) => {
  try {
    const onboardings = await adminListOnboardings();
    sendSuccess(res, onboardings.map(mapAdminOnboardingResponse));
  } catch (error) {
    next(error);
  }
};

export const adminListPendingOnboardingsController: RequestHandler = async (_req, res, next) => {
  try {
    const onboardings = await adminListPendingOnboardings();
    sendSuccess(res, onboardings.map(mapAdminOnboardingResponse));
  } catch (error) {
    next(error);
  }
};

export const updateOnboardingStatusController: RequestHandler = async (req, res, next) => {
  try {
    const onboardingId = Number(req.params.id);
    const input = updateOnboardingStatusSchema.parse(req.body);
    await changeOnboardingStatus(onboardingId, req.auth!.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addOnboardingSignatureController: RequestHandler = async (req, res, next) => {
  try {
    const onboardingId = Number(req.params.id);
    const input = addOnboardingSignatureSchema.parse(req.body);
    await addOnboardingSignature(onboardingId, req.auth!.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const onboardingMiddleware = [authenticate];
export const adminOnboardingMiddleware = [authenticate, requireRoles(['ADMIN'])];
