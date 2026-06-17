import type { RequestHandler } from 'express';
import { AppError } from '../../core/errors';
import * as service from './airlines-ticket.service';

export const createAirlinesTicketController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await service.createAirlinesTicket(userId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMyAirlinesTicketsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const data = await service.getUserAirlinesTickets(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAirlinesTicketByIdController: RequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await service.getAirlinesTicketById(id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAllAirlinesTicketsController: RequestHandler = async (req, res, next) => {
  try {
    const data = await service.getAllAirlinesTickets();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateAirlinesTicketStatusController: RequestHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const adminId = req.auth?.sub;
    if (!adminId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }
    const result = await service.updateAirlinesTicketStatus(id, req.body, adminId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

