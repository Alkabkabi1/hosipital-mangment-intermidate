import type { RequestHandler } from 'express';

import type { DelegationWithUserRow } from './delegation.repository';
import { addDelegationSignatureSchema, createDelegationSchema, updateDelegationStatusSchema } from './delegation.schema';
import {
  addDelegationSignature,
  adminListDelegations,
  adminListPendingDelegations,
  changeDelegationStatus,
  createDelegation,
  getDelegationDetails,
  listMyDelegations,
} from './delegation.service';
import { AppError } from '../../core/errors';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import type { DelegationForm } from '../../shared/types/workflows';
import { sendSuccess } from '../../shared/utils/response';
import { presentWorkflowStatus } from '../../shared/utils/status';
import { findEmployeeIdForUser } from '../clearance/clearance.repository';

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const mapDelegationResponse = (delegation: DelegationForm) => ({
  delegationId: delegation.delegationId,
  employeeId: delegation.employeeId,
  referenceNumber: delegation.referenceNumber,
  requestDate: toIso(delegation.requestDate),
  delegationType: delegation.delegationType,
  startDate: toIso(delegation.startDate ?? null),
  endDate: toIso(delegation.endDate ?? null),
  reason: delegation.reason ?? null,
  delegatedToEmployeeId: delegation.delegatedToEmployeeId ?? null,
  status: presentWorkflowStatus(delegation.status),
  statusCode: delegation.status,
  createdAt: toIso(delegation.createdAt),
  updatedAt: toIso(delegation.updatedAt),
});

const mapAdminDelegationResponse = (row: DelegationWithUserRow) => ({
  delegationId: row.delegation_id,
  employeeId: row.employee_id,
  referenceNumber: row.reference_number,
  requestDate: toIso(row.request_date),
  delegationType: row.delegation_type,
  startDate: toIso(row.start_date),
  endDate: toIso(row.end_date),
  reason: row.reason ?? null,
  delegatedToEmployeeId: row.delegated_to_employee_id ?? null,
  status: presentWorkflowStatus(row.status),
  statusCode: row.status,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  employeeName: row.employee_name,
  employeeEmail: row.employee_email,
});

export const createDelegationController: RequestHandler = async (req, res, next) => {
  try {
    const input = createDelegationSchema.parse(req.body);
    const delegation = await createDelegation(req.auth!.sub, input);
    if (!delegation) {
      throw new AppError({ statusCode: 500, message: 'Failed to create delegation', code: 'INTERNAL_SERVER_ERROR' });
    }
    sendSuccess(res, mapDelegationResponse(delegation), 201);
  } catch (error) {
    next(error);
  }
};

export const listMyDelegationsController: RequestHandler = async (req, res, next) => {
  try {
    // TEMPORARY FIX: Query Delegation_Requests table directly since that's where the data actually is
    const { withConnection } = await import('../../core/database');
    const delegations = await withConnection(async (conn) => {
      const userId = req.auth!.sub;
      
      // Get user email first
      const [userRows] = await conn.query('SELECT email FROM App_Users WHERE id = ?', [userId]);
      if (!Array.isArray(userRows) || userRows.length === 0) {
        return [];
      }
      
      const userEmail = (userRows[0] as any).email;
      
      // Query Delegation_Requests table (where actual data is stored)
      // Only select columns that actually exist in the table
      const [rows] = await conn.query(`
        SELECT id, reference_number, from_email, to_email, status, created_at
        FROM Delegation_Requests 
        WHERE created_by_user = ? OR from_email = ? OR to_email = ?
        ORDER BY created_at DESC
      `, [userId, userEmail, userEmail]);
      
      return rows;
    });
    
    // Map to simple format (only use columns that exist)
    const mappedDelegations = (delegations as any[]).map(row => ({
      id: row.id,
      referenceNumber: row.reference_number,
      fromEmail: row.from_email,
      toEmail: row.to_email,
      status: row.status,
      createdAt: row.created_at
    }));
    
    sendSuccess(res, mappedDelegations);
  } catch (error) {
    next(error);
  }
};

export const getDelegationController: RequestHandler = async (req, res, next) => {
  try {
    const delegationId = Number(req.params.id);
    const delegation = await getDelegationDetails(delegationId);
    const employeeId = await findEmployeeIdForUser(req.auth!.sub);
    const isOwner = employeeId !== null && delegation.employeeId === employeeId;
    const isAdmin = req.auth?.roles.includes('ADMIN');
    if (!isOwner && !isAdmin) {
      throw new AppError({ statusCode: 403, message: 'Forbidden', code: 'FORBIDDEN' });
    }
    sendSuccess(res, mapDelegationResponse(delegation));
  } catch (error) {
    next(error);
  }
};

export const adminListDelegationsController: RequestHandler = async (_req, res, next) => {
  try {
    const delegations = await adminListDelegations();
    sendSuccess(res, delegations.map(mapAdminDelegationResponse));
  } catch (error) {
    next(error);
  }
};

export const adminListPendingDelegationsController: RequestHandler = async (_req, res, next) => {
  try {
    const delegations = await adminListPendingDelegations();
    sendSuccess(res, delegations.map(mapAdminDelegationResponse));
  } catch (error) {
    next(error);
  }
};

export const updateDelegationStatusController: RequestHandler = async (req, res, next) => {
  try {
    const delegationId = Number(req.params.id);
    const input = updateDelegationStatusSchema.parse(req.body);
    await changeDelegationStatus(delegationId, req.auth!.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addDelegationSignatureController: RequestHandler = async (req, res, next) => {
  try {
    const delegationId = Number(req.params.id);
    const input = addDelegationSignatureSchema.parse(req.body);
    await addDelegationSignature(delegationId, req.auth!.sub, input);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const delegationMiddleware = [authenticate];
export const adminDelegationMiddleware = [authenticate, requireRoles(['ADMIN'])];
