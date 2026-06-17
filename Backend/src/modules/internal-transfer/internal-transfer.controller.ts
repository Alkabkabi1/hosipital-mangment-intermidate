import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as service from './internal-transfer.service';
import { createInternalTransferSchema, updateInternalTransferStatusSchema } from './internal-transfer.schema';

export const createInternalTransferController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const input = createInternalTransferSchema.parse(req.body);
    const result = await service.createInternalTransfer(req.auth.sub, input);
    
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyInternalTransfersController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const transfers = await service.getUserInternalTransfers(req.auth.sub);
    sendSuccess(res, transfers);
  } catch (error) {
    next(error);
  }
};

export const getInternalTransferByIdController: RequestHandler = async (req, res, next) => {
  try {
    const transferId = parseInt(req.params.id);
    if (isNaN(transferId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    const transfer = await service.getInternalTransferById(transferId);
    sendSuccess(res, transfer);
  } catch (error) {
    next(error);
  }
};

export const getAllInternalTransfersController: RequestHandler = async (req, res, next) => {
  try {
    const transfers = await service.getAllInternalTransfers();
    sendSuccess(res, transfers);
  } catch (error) {
    next(error);
  }
};

export const updateInternalTransferStatusController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const transferId = parseInt(req.params.id);
    if (isNaN(transferId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    const input = updateInternalTransferStatusSchema.parse(req.body);
    const result = await service.updateInternalTransferStatus(transferId, input, req.auth.sub);
    
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

