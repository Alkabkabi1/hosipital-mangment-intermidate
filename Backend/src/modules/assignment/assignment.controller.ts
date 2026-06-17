import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as assignmentService from './assignment.service';
import { createAssignmentSchema, updateAssignmentStatusSchema } from './assignment.schema';

/**
 * Create assignment request
 * POST /api/assignment
 */
export const createAssignmentController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const input = createAssignmentSchema.parse(req.body);
    const result = await assignmentService.createAssignment(req.auth.sub, input);
    
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's assignment requests
 * GET /api/employee/assignments
 */
export const getMyAssignmentsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const assignments = await assignmentService.getUserAssignments(req.auth.sub);
    sendSuccess(res, assignments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment request by ID
 * GET /api/assignment/:id
 */
export const getAssignmentByIdController: RequestHandler = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid assignment ID', code: 'BAD_REQUEST' });
    }

    const assignment = await assignmentService.getAssignmentById(assignmentId);
    sendSuccess(res, assignment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all assignment requests (admin only)
 * GET /api/admin/assignments
 */
export const getAllAssignmentsController: RequestHandler = async (req, res, next) => {
  try {
    const assignments = await assignmentService.getAllAssignments();
    sendSuccess(res, assignments);
  } catch (error) {
    next(error);
  }
};

/**
 * Update assignment status (admin only)
 * PUT /api/assignment/:id/status
 */
export const updateAssignmentStatusController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const assignmentId = parseInt(req.params.id);
    if (isNaN(assignmentId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid assignment ID', code: 'BAD_REQUEST' });
    }

    const input = updateAssignmentStatusSchema.parse(req.body);
    const result = await assignmentService.updateAssignmentStatus(assignmentId, input, req.auth.sub);
    
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

