import type { RequestHandler } from 'express';

import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import {
  listAllPermissions,
  listActivePermissions,
  getUserPermissions,
  getUserPermissionsDetailed,
  getRolePermissions,
  userHasPermission,
  assignPermissionToRole,
  removePermissionFromRole,
  getPermissionsByResource,
  createPermission,
  updatePermission,
  deletePermission,
} from './permission.service';
import { createPermissionSchema, updatePermissionSchema } from './permission.schema';

/**
 * GET /api/permissions
 * List all permissions (admin only)
 */
export const listPermissionsController: RequestHandler = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const permissions = includeInactive ? await listAllPermissions() : await listActivePermissions();

    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/permissions/by-resource
 * Get all permissions grouped by resource (admin only)
 */
export const listPermissionsByResourceController: RequestHandler = async (req, res, next) => {
  try {
    const permissions = await getPermissionsByResource();
    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/permissions
 * Get current user's permissions and roles
 */
export const getCurrentUserPermissionsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const data = await getUserPermissionsDetailed(userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:userId/permissions
 * Get specific user's permissions (admin only)
 */
export const getUserPermissionsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user ID', code: 'VALIDATION_ERROR' });
    }

    const permissions = await getUserPermissions(userId);
    sendSuccess(res, { userId, permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roles/:roleId/permissions
 * Get permissions for a specific role (admin only)
 */
export const getRolePermissionsController: RequestHandler = async (req, res, next) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid role ID', code: 'VALIDATION_ERROR' });
    }

    const permissions = await getRolePermissions(roleId);
    sendSuccess(res, { roleId, permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:userId/check-permission
 * Check if a user has a specific permission
 */
export const checkUserPermissionController: RequestHandler = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { permission } = req.body;

    if (isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user ID', code: 'VALIDATION_ERROR' });
    }

    if (!permission || typeof permission !== 'string') {
      throw new AppError({ statusCode: 400, message: 'Permission name required', code: 'VALIDATION_ERROR' });
    }

    const hasPermission = await userHasPermission(userId, permission);
    sendSuccess(res, { userId, permission, hasPermission });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roles/:roleId/permissions
 * Assign a permission to a role (admin only)
 */
export const assignPermissionController: RequestHandler = async (req, res, next) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const { permissionId } = req.body;
    const grantedBy = req.auth?.sub;

    if (isNaN(roleId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid role ID', code: 'VALIDATION_ERROR' });
    }

    if (!permissionId || isNaN(parseInt(permissionId, 10))) {
      throw new AppError({ statusCode: 400, message: 'Invalid permission ID', code: 'VALIDATION_ERROR' });
    }

    if (!grantedBy) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    await assignPermissionToRole(roleId, parseInt(permissionId, 10), grantedBy);
    sendSuccess(res, { message: 'Permission assigned successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/roles/:roleId/permissions/:permissionId
 * Remove a permission from a role (admin only)
 */
export const removePermissionController: RequestHandler = async (req, res, next) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const permissionId = parseInt(req.params.permissionId, 10);

    if (isNaN(roleId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid role ID', code: 'VALIDATION_ERROR' });
    }

    if (isNaN(permissionId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid permission ID', code: 'VALIDATION_ERROR' });
    }

    await removePermissionFromRole(roleId, permissionId);
    sendSuccess(res, { message: 'Permission removed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/permissions
 * Create a new permission (admin only)
 */
export const createPermissionController: RequestHandler = async (req, res, next) => {
  try {
    const validatedData = createPermissionSchema.parse(req.body);
    const permissionId = await createPermission(validatedData);
    
    sendSuccess(res, { permissionId, message: 'Permission created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/permissions/:id
 * Update an existing permission (admin only)
 */
export const updatePermissionController: RequestHandler = async (req, res, next) => {
  try {
    const permissionId = parseInt(req.params.id, 10);
    
    if (isNaN(permissionId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid permission ID', code: 'VALIDATION_ERROR' });
    }

    const validatedData = updatePermissionSchema.parse(req.body);
    await updatePermission(permissionId, validatedData);
    
    sendSuccess(res, { message: 'Permission updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/permissions/:id
 * Delete a permission (soft delete - admin only)
 */
export const deletePermissionController: RequestHandler = async (req, res, next) => {
  try {
    const permissionId = parseInt(req.params.id, 10);
    
    if (isNaN(permissionId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid permission ID', code: 'VALIDATION_ERROR' });
    }

    await deletePermission(permissionId);
    sendSuccess(res, { message: 'Permission deleted successfully' });
  } catch (error) {
    next(error);
  }
};

