import type { RequestHandler } from 'express';

import { assignRoleSchema, removeRoleSchema } from './role.schema';
import { assignRoleToUser, getUserRoles, listRoles, listUsersWithRoles, removeRoleFromUser } from './role.service';
import { refreshUserToken } from '../auth/auth.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

export const listRolesController: RequestHandler = async (_req, res, next) => {
  try {
    const roles = await listRoles();
    sendSuccess(res, roles);
  } catch (error) {
    next(error);
  }
};

export const listUsersWithRolesController: RequestHandler = async (_req, res, next) => {
  try {
    const users = await listUsersWithRoles();
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
};

export const assignRoleController: RequestHandler = async (req, res, next) => {
  try {
    const input = assignRoleSchema.parse(req.body);
    const assignedBy = req.auth?.sub ?? 0;
    if (!assignedBy) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    await assignRoleToUser(input, assignedBy);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const removeRoleController: RequestHandler = async (req, res, next) => {
  try {
    const input = removeRoleSchema.parse(req.body);
    const actorId = req.auth?.sub ?? 0;
    if (!actorId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    await removeRoleFromUser(input, actorId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getUserRolesController: RequestHandler = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user id', code: 'BAD_REQUEST' });
    }
    const roles = await getUserRoles(userId);
    const payload = { userId, roles };
    res.json({ success: true, data: payload, roles });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenAfterRoleChangeController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    
    const result = await refreshUserToken(userId);
    sendSuccess(res, {
      accessToken: result.accessToken,
      token: result.accessToken,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
};
