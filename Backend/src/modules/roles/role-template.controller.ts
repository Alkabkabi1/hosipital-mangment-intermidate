import type { RequestHandler } from 'express';

import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import {
  listRoleTemplates,
  getRoleTemplate,
  applyTemplateToUser,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
} from './role-template.service';

/**
 * GET /api/role-templates
 * List all active role templates
 */
export const listRoleTemplatesController: RequestHandler = async (req, res, next) => {
  try {
    const templates = await listRoleTemplates();
    sendSuccess(res, { templates });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/role-templates/:id
 * Get a specific template with its roles
 */
export const getRoleTemplateController: RequestHandler = async (req, res, next) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid template ID', code: 'VALIDATION_ERROR' });
    }

    const data = await getRoleTemplate(templateId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/role-templates/:id/apply
 * Apply a template to a user
 */
export const applyTemplateController: RequestHandler = async (req, res, next) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    const { userId, expiresAt } = req.body;
    const assignedBy = req.auth?.sub;

    if (isNaN(templateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid template ID', code: 'VALIDATION_ERROR' });
    }

    if (!userId || isNaN(parseInt(userId, 10))) {
      throw new AppError({ statusCode: 400, message: 'Invalid user ID', code: 'VALIDATION_ERROR' });
    }

    if (!assignedBy) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const assignedCount = await applyTemplateToUser(
      templateId,
      parseInt(userId, 10),
      assignedBy,
      expiresAt ? new Date(expiresAt) : undefined
    );

    sendSuccess(res, { message: `Assigned ${assignedCount} role(s) from template`, count: assignedCount });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/role-templates
 * Create a new template
 */
export const createRoleTemplateController: RequestHandler = async (req, res, next) => {
  try {
    const { name, nameAr, description, roleIds } = req.body;
    const createdBy = req.auth?.sub;

    if (!name || !nameAr) {
      throw new AppError({ statusCode: 400, message: 'Template name required', code: 'VALIDATION_ERROR' });
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new AppError({ statusCode: 400, message: 'At least one role required', code: 'VALIDATION_ERROR' });
    }

    if (!createdBy) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const templateId = await createRoleTemplate(name, nameAr, description, roleIds, createdBy);
    sendSuccess(res, { templateId, message: 'Template created successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/role-templates/:id
 * Update a template
 */
export const updateRoleTemplateController: RequestHandler = async (req, res, next) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    const { name, nameAr, description, roleIds } = req.body;

    if (isNaN(templateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid template ID', code: 'VALIDATION_ERROR' });
    }

    if (!name || !nameAr) {
      throw new AppError({ statusCode: 400, message: 'Template name required', code: 'VALIDATION_ERROR' });
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new AppError({ statusCode: 400, message: 'At least one role required', code: 'VALIDATION_ERROR' });
    }

    await updateRoleTemplate(templateId, name, nameAr, description, roleIds);
    sendSuccess(res, { message: 'Template updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/role-templates/:id
 * Delete (deactivate) a template
 */
export const deleteRoleTemplateController: RequestHandler = async (req, res, next) => {
  try {
    const templateId = parseInt(req.params.id, 10);

    if (isNaN(templateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid template ID', code: 'VALIDATION_ERROR' });
    }

    await deleteRoleTemplate(templateId);
    sendSuccess(res, { message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
};

