import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as service from './assignment-termination.service';
import { createAssignmentTerminationSchema, updateAssignmentTerminationStatusSchema } from './assignment-termination.schema';

export const createAssignmentTerminationController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const input = createAssignmentTerminationSchema.parse(req.body);
    const result = await service.createAssignmentTermination(req.auth.sub, input);
    
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyAssignmentTerminationsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const terminations = await service.getUserAssignmentTerminations(req.auth.sub);
    sendSuccess(res, terminations);
  } catch (error) {
    next(error);
  }
};

export const getAssignmentTerminationByIdController: RequestHandler = async (req, res, next) => {
  try {
    const terminationId = parseInt(req.params.id);
    if (isNaN(terminationId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    const termination = await service.getAssignmentTerminationById(terminationId);
    sendSuccess(res, termination);
  } catch (error) {
    next(error);
  }
};

export const getAllAssignmentTerminationsController: RequestHandler = async (req, res, next) => {
  try {
    const terminations = await service.getAllAssignmentTerminations();
    sendSuccess(res, terminations);
  } catch (error) {
    next(error);
  }
};

export const updateAssignmentTerminationStatusController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const terminationId = parseInt(req.params.id);
    if (isNaN(terminationId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    const input = updateAssignmentTerminationStatusSchema.parse(req.body);
    const result = await service.updateAssignmentTerminationStatus(terminationId, input, req.auth.sub);
    
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

