import type { RequestHandler } from 'express';

import {
  adminCreateUser,
  adminDeleteUser,
  adminGetUser,
  adminListUsers,
  adminUpdateUser,
  getPrivilegedUsersOverview,
  adminCreateEmployee,
  adminUpdateEmployee,
} from './admin.service';
import {
  createAdminUserSchema,
  listAdminUsersQuerySchema,
  updateAdminUserSchema,
} from './admin.schema';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

export const listAdminUsersController: RequestHandler = async (req, res, next) => {
  try {
    const query = listAdminUsersQuerySchema.parse(req.query);
    const users = await adminListUsers(query);
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

export const getAdminUserController: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user id', code: 'BAD_REQUEST' });
    }
    const user = await adminGetUser(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const createAdminUserController: RequestHandler = async (req, res, next) => {
  try {
    const input = createAdminUserSchema.parse(req.body);
    const actorId = req.auth?.sub;
    if (!actorId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const user = await adminCreateUser(input, actorId);
    sendSuccess(res, user, 201);
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserController: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user id', code: 'BAD_REQUEST' });
    }
    const input = updateAdminUserSchema.parse(req.body);
    const actorId = req.auth?.sub;
    if (!actorId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const user = await adminUpdateUser(userId, input, actorId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUserController: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user id', code: 'BAD_REQUEST' });
    }
    await adminDeleteUser(userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getPrivilegedUsersOverviewController: RequestHandler = async (req, res, next) => {
  try {
    const overview = await getPrivilegedUsersOverview();
    sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
};

// ====================== Employee Management ======================

export const createEmployeeController: RequestHandler = async (req, res, next) => {
  try {
    const actorId = req.auth?.sub;
    if (!actorId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await adminCreateEmployee(req.body);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeController: RequestHandler = async (req, res, next) => {
  try {
    const actorId = req.auth?.sub;
    if (!actorId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    
    const employeeId = parseInt(req.params.id);
    if (isNaN(employeeId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid employee ID', code: 'BAD_REQUEST' });
    }
    
    const result = await adminUpdateEmployee(employeeId, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

