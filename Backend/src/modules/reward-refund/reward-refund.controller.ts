import type { RequestHandler } from 'express';
import { AppError } from '../../core/errors';
import * as service from './reward-refund.service';

export const createRewardRefundController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await service.createRewardRefund(userId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMyRewardRefundsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const data = await service.getUserRewardRefunds(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRewardRefundByIdController: RequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await service.getRewardRefundById(id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAllRewardRefundsController: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getAllRewardRefunds();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateRewardRefundStatusController: RequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.auth?.sub;
    if (!adminId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await service.updateRewardRefundStatus(id, req.body, adminId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

