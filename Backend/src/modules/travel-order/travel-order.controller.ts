import type { RequestHandler } from 'express';
import { AppError } from '../../core/errors';
import * as service from './travel-order.service';

export const createTravelOrderController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await service.createTravelOrder(userId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMyTravelOrdersController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const data = await service.getUserTravelOrders(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTravelOrderByIdController: RequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await service.getTravelOrderById(id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAllTravelOrdersController: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getAllTravelOrders();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateTravelOrderStatusController: RequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.auth?.sub;
    if (!adminId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await service.updateTravelOrderStatus(id, req.body, adminId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

