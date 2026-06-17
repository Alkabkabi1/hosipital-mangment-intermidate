import type { RequestHandler } from 'express';
import { withConnection } from '../../core/database';
import { findEmployeeIdForUser } from './clearance.repository';
import type { ClearanceWithUserRow } from './clearance.repository';
import { addSignatureSchema, createClearanceSchema, updateClearanceStatusSchema } from './clearance.schema';
import {
  addClearanceSignature,
  adminListClearances,
  adminListPendingClearances,
  changeClearanceStatus,
  createClearance,
  getClearanceDetails,
  listMyClearances,
} from './clearance.service';
import { AppError } from '../../core/errors';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import type { ClearanceForm } from '../../shared/types/workflows';
import { sendSuccess } from '../../shared/utils/response';
import { getClearanceStatusLabel } from '../../shared/utils/status';

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const mapClearanceResponse = async (clearance: ClearanceForm) => ({
  clearanceId: clearance.clearanceId,
  employeeId: clearance.employeeId,
  referenceNumber: clearance.referenceNumber,
  requestDate: toIso(clearance.requestDate),
  effectiveDate: toIso(clearance.effectiveDate),
  lastWorkingDay: toIso(clearance.lastWorkingDay ?? null),
  reason: clearance.reason ?? null,
  statusId: clearance.statusId,
  statusLabel: await getClearanceStatusLabel(clearance.statusId, 'ar'),
  notes: clearance.notes ?? null,
  createdAt: toIso(clearance.createdAt),
  updatedAt: toIso(clearance.updatedAt),
});

const mapAdminClearanceResponse = async (row: ClearanceWithUserRow) => ({
  clearanceId: row.clearance_id,
  employeeId: row.employee_id,
  referenceNumber: row.reference_number,
  requestDate: toIso(row.request_date),
  effectiveDate: toIso(row.effective_date),
  lastWorkingDay: toIso(row.last_working_day),
  reason: row.reason ?? null,
  statusId: row.status_id,
  statusLabel: await getClearanceStatusLabel(row.status_id, 'ar'),
  notes: row.notes ?? null,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  employeeName: row.employee_name,
  employeeEmail: row.employee_email,
});

export const createClearanceController: RequestHandler = async (req, res, next) => {
  try {
    const input = createClearanceSchema.parse(req.body);
    const clearance = await createClearance(req.auth!.sub, input);
    if (!clearance) {
      throw new AppError({ statusCode: 500, message: 'Failed to create clearance request', code: 'INTERNAL_SERVER_ERROR' });
    }
    sendSuccess(res, await mapClearanceResponse(clearance), 201);
  } catch (error) {
    next(error);
  }
};

export const listMyClearancesController: RequestHandler = async (req, res, next) => {
  try {
    const clearances = await listMyClearances(req.auth!.sub);
    const mapped = await Promise.all(clearances.map(mapClearanceResponse));
    sendSuccess(res, mapped);
  } catch (error) {
    next(error);
  }
};

export const getClearanceController: RequestHandler = async (req, res, next) => {
  try {
    const clearanceId = Number(req.params.id);
    const userId = req.auth!.sub;
    const userEmail = req.auth!.email;
    
    const clearance = await getClearanceDetails(clearanceId);
    
    // Enhanced authorization check - check multiple ways a user can own a request  
    const employeeId = await findEmployeeIdForUser(userId);
    const isOwnerByEmployeeId = employeeId !== null && clearance.employeeId === employeeId;
    
    // Get actual request data from database to check created_by_user and employee_email
    const [requestData] = await withConnection(async (conn) => {
      const [rows] = await conn.execute(`
        SELECT created_by_user, employee_email 
        FROM Clearance_Requests 
        WHERE id = ?
      `, [clearanceId]);
      return rows as any[];
    });
    
    const requestRecord = requestData[0];
    const isOwnerByUserId = requestRecord?.created_by_user === userId;
    const isOwnerByEmail = requestRecord?.employee_email === userEmail;
    const isAdmin = req.auth?.roles.includes('ADMIN') || req.auth?.roles.includes('HR') || req.auth?.roles.includes('MANAGER');
    
    if (!isOwnerByEmployeeId && !isOwnerByUserId && !isOwnerByEmail && !isAdmin) {
      console.log(`❌ Authorization failed for clearance ${clearanceId}:`, {
        userId,
        userEmail,
        employeeId,
        clearanceEmployeeId: clearance.employeeId,
        createdByUser: requestRecord?.created_by_user,
        employeeEmail: requestRecord?.employee_email,
        isAdmin
      });
      throw new AppError({ statusCode: 403, message: 'You do not have permission to view this request', code: 'FORBIDDEN' });
    }
    
    console.log(`✅ Authorization granted for clearance ${clearanceId}:`, {
      isOwnerByEmployeeId,
      isOwnerByUserId,
      isOwnerByEmail,
      isAdmin
    });
    
    sendSuccess(res, await mapClearanceResponse(clearance));
  } catch (error) {
    next(error);
  }
};

export const adminListClearancesController: RequestHandler = async (_req, res, next) => {
  try {
    const clearances = await adminListClearances();
    const mapped = await Promise.all(clearances.map(mapAdminClearanceResponse));
    sendSuccess(res, mapped);
  } catch (error) {
    next(error);
  }
};

export const adminListPendingClearancesController: RequestHandler = async (_req, res, next) => {
  try {
    const clearances = await adminListPendingClearances();
    const mapped = await Promise.all(clearances.map(mapAdminClearanceResponse));
    sendSuccess(res, mapped);
  } catch (error) {
    next(error);
  }
};

export const updateClearanceStatusController: RequestHandler = async (req, res, next) => {
  try {
    const clearanceId = Number(req.params.id);
    const input = updateClearanceStatusSchema.parse(req.body);
    await changeClearanceStatus(clearanceId, req.auth!.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addClearanceSignatureController: RequestHandler = async (req, res, next) => {
  try {
    const clearanceId = Number(req.params.id);
    const input = addSignatureSchema.parse(req.body);
    await addClearanceSignature(clearanceId, req.auth!.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const clearanceMiddleware = [authenticate];
export const adminClearanceMiddleware = [authenticate, requireRoles(['ADMIN'])];
