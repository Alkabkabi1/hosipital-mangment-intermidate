/**
 * Experience Certificate Request (شهادة خبرة) - Controller Layer
 */

import type { RequestHandler } from 'express';
import { createExperienceSchema, updateExperienceStatusSchema } from './experience.schema';
import {
  createExperience,
  getAllExperiences as getUserExperiences,
  getExperienceById,
  getAllExperiences,
  updateExperienceStatus,
  getExperienceHistory,
} from './experience.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';
import { withConnection } from '../../core/database';

/**
 * Check if a user has admin or HR role
 */
async function checkUserIsAdmin(userId: number): Promise<boolean> {
  return withConnection(async (conn) => {
    const [userRoles] = await conn.execute<any[]>(
      `SELECT r.role_name
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE`,
      [userId]
    );

    const roles = userRoles.map((r: any) => r.role_name);
    return roles.includes('ADMIN') || roles.includes('HR');
  });
}

/**
 * Create a new experience certificate request
 * POST /api/experience-certificate
 */
export const createExperienceController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const input = createExperienceSchema.parse(req.body);
    const result = await createExperience(userId, input);

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's experience certificate requests
 * GET /api/experience-certificate
 */
export const getUserExperiencesController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    // Check if user is admin/HR - if so, return all experiences
    const isAdmin = await checkUserIsAdmin(userId);

    const experiences = await getUserExperiences();
    sendSuccess(res, experiences);
  } catch (error) {
    next(error);
  }
};

/**
 * Get experience certificate by ID
 * GET /api/experience-certificate/:id
 */
export const getExperienceByIdController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const experienceId = Number(req.params.id);
    if (Number.isNaN(experienceId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid experience certificate ID',
        code: 'BAD_REQUEST',
      });
    }

    const experience = await getExperienceById(experienceId, userId);
    sendSuccess(res, experience);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all experience certificate requests (admin)
 * GET /api/admin/experience-certificates
 */
export const getAllExperiencesController: RequestHandler = async (req, res, next) => {
  try {
    const experiences = await getAllExperiences();
    sendSuccess(res, experiences);
  } catch (error) {
    next(error);
  }
};

/**
 * Update experience certificate status (admin)
 * PATCH /api/experience-certificate/:id/status
 */
export const updateExperienceStatusController: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.auth?.sub;
    if (!adminId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const experienceId = Number(req.params.id);
    if (Number.isNaN(experienceId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid experience certificate ID',
        code: 'BAD_REQUEST',
      });
    }

    const input = updateExperienceStatusSchema.parse(req.body);
    const result = await updateExperienceStatus(experienceId, input, adminId);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get experience certificate status history
 * GET /api/experience-certificate/:id/history
 */
export const getExperienceHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const experienceId = Number(req.params.id);
    if (Number.isNaN(experienceId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid experience certificate ID',
        code: 'BAD_REQUEST',
      });
    }

    const history = await getExperienceHistory(experienceId);
    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

