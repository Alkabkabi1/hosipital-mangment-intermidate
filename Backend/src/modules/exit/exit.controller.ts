/**
 * Exit Request (طلب إنهاء العمل) - Controller Layer
 */

import type { RequestHandler } from 'express';
import { createExitSchema, updateExitStatusSchema } from './exit.schema';
import {
  createExit,
  getUserExits,
  getExitById,
  getAllExits,
  updateExitStatus,
  getExitHistory,
} from './exit.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

/**
 * Create a new exit request
 * POST /api/exit-request
 */
export const createExitController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const input = createExitSchema.parse(req.body);
    const result = await createExit(userId, input);

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's exit requests
 * GET /api/exit-request
 */
export const getUserExitsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const exits = await getUserExits(userId);
    sendSuccess(res, exits);
  } catch (error) {
    next(error);
  }
};

/**
 * Get exit request by ID
 * GET /api/exit-request/:id
 */
export const getExitByIdController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    const exitId = parseInt(req.params.id);

    if (isNaN(exitId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid exit request ID',
        code: 'BAD_REQUEST',
      });
    }

    const exit = await getExitById(exitId, userId);
    sendSuccess(res, exit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all exit requests (admin only)
 * GET /api/exit-request/admin/all
 */
export const getAllExitsController: RequestHandler = async (req, res, next) => {
  try {
    const exits = await getAllExits();
    sendSuccess(res, exits);
  } catch (error) {
    next(error);
  }
};

/**
 * Update exit request status (admin only)
 * PUT /api/exit-request/:id/status
 */
export const updateExitStatusController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const exitId = parseInt(req.params.id);
    if (isNaN(exitId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid exit request ID',
        code: 'BAD_REQUEST',
      });
    }

    const input = updateExitStatusSchema.parse(req.body);
    const result = await updateExitStatus(exitId, input, userId);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get exit request history
 * GET /api/exit-request/:id/history
 */
export const getExitHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const exitId = parseInt(req.params.id);

    if (isNaN(exitId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid exit request ID',
        code: 'BAD_REQUEST',
      });
    }

    const history = await getExitHistory(exitId);
    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

