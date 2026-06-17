import { Request, Response, NextFunction } from 'express';
import { ContractorHousingService } from './contractor-housing.service';
import { 
  createContractorHousingSchema, 
  updateContractorHousingStatusSchema 
} from './contractor-housing.schema';
import { AppError } from '../../core/errors';

export class ContractorHousingController {
  /**
   * Create contractor housing allowance request (employee)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        throw new AppError({ statusCode: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const validated = createContractorHousingSchema.parse(req.body);
      const request = await ContractorHousingService.createRequest(userId, validated);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء طلب بدل سكن المتعاقدين بنجاح',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all contractor housing requests (admin)
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const requests = await ContractorHousingService.getAllRequests(limit, offset);

      res.json({
        success: true,
        data: requests,
        pagination: { limit, offset },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get contractor housing request by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const request = await ContractorHousingService.getRequestById(id);

      if (!request) {
        throw new AppError({ statusCode: 404, message: 'Request not found', code: 'NOT_FOUND' });
      }

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my contractor housing requests (employee)
   */
  static async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        throw new AppError({ statusCode: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const requests = await ContractorHousingService.getEmployeeRequests(userId);

      res.json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update contractor housing request status (admin)
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const adminId = req.auth?.sub;

      if (!adminId) {
        throw new AppError({ statusCode: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const validated = updateContractorHousingStatusSchema.parse(req.body);
      const request = await ContractorHousingService.updateRequestStatus(id, adminId, validated);

      res.json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete contractor housing request (admin)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await ContractorHousingService.deleteRequest(id);

      res.json({
        success: true,
        message: 'تم حذف الطلب بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get contractor housing statistics (admin)
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ContractorHousingService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

