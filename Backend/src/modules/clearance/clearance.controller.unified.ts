// =====================================================
// UNIFIED CLEARANCE CONTROLLER - CONFLICT RESOLUTION
// =====================================================
// Merges clearance controller with employee-requests clearance handling
// Provides backward compatibility while using unified service layer
// Single endpoint for all clearance operations
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { UnifiedClearanceService, type UnifiedClearanceInput } from './clearance.service.unified';
import { AppError } from '../../core/errors';
import { clearanceRequestSchema, type ClearanceRequestInput } from '../../core/unified-requests/unified-request.schema';

// =====================================================
// SECTION 1: REQUEST CREATION CONTROLLERS
// =====================================================

export const createUnifiedClearanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.sub;
    const userEmail = req.auth?.email;
    
    if (!userId || !userEmail) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Validate input using unified schema
    const validatedInput = clearanceRequestSchema.parse(req.body);
    
    // Prepare clearance input for unified service
    const clearanceInput: UnifiedClearanceInput = {
      employee_email: validatedInput.employee_email || userEmail,
      employee_name: validatedInput.employee_name,
      employee_dept: validatedInput.employee_dept,
      request_date: validatedInput.request_date,
      last_work_day: validatedInput.last_work_day || validatedInput.lastWorkDay || validatedInput.lastWorkingDay,
      reason: validatedInput.reason,
      clearance_type: validatedInput.clearance_type,
      specific_reason: validatedInput.specific_reason,
      document_number: validatedInput.document_number,
      notes: validatedInput.notes
    };
    
    // Create clearance using unified service
    const result = await UnifiedClearanceService.createClearance(userId, clearanceInput);
    
    res.status(201).json({
      success: true,
      message: 'Clearance request created successfully',
      data: result
    });
    
  } catch (error) {
    if (error.issues) {
      // Zod validation error
      const validationErrors = error.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      
      return next(new AppError({
        statusCode: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      }));
    }
    
    next(error);
  }
};

// =====================================================
// SECTION 2: BACKWARD COMPATIBILITY CONTROLLERS
// =====================================================

/**
 * Legacy controller for employee-requests clearance creation
 * Maintains backward compatibility during transition
 */
export const createClearanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.sub;
    const userEmail = req.auth?.email;
    
    if (!userId || !userEmail) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Handle legacy request format from employee-requests service
    const {
      employee_email,
      employee_name,
      employee_dept,
      request_date,
      last_work_day,
      reason,
      clearance_type,
      specific_reason,
      document_number,
      payload_json,
      
      // Backward compatibility fields
      lastWorkingDay,
      lastWorkDay
    } = req.body;
    
    // Use legacy service method for compatibility
    const result = await UnifiedClearanceService.createClearanceRequest({
      employee_email: employee_email || userEmail,
      employee_name,
      employee_dept,
      created_by_user: userId,
      request_date: request_date || new Date().toISOString().split('T')[0],
      last_work_day: last_work_day || lastWorkingDay || lastWorkDay,
      reason,
      clearance_type,
      specific_reason,
      document_number,
      payload_json: payload_json ? JSON.stringify(payload_json) : undefined
    });
    
    // Return response in expected format
    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب إخلاء الطرف بنجاح',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 3: RETRIEVAL CONTROLLERS
// =====================================================

export const getMyClearancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.auth?.sub;
    
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const clearances = await UnifiedClearanceService.getMyClearances(userId);
    
    res.json({
      success: true,
      data: clearances,
      count: clearances.length
    });
    
  } catch (error) {
    next(error);
  }
};

export const getClearanceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clearanceId = parseInt(req.params.id);
    
    if (!clearanceId || isNaN(clearanceId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid clearance ID',
        code: 'INVALID_CLEARANCE_ID'
      });
    }
    
    const clearance = await UnifiedClearanceService.getClearanceById(clearanceId);
    
    if (!clearance) {
      throw new AppError({
        statusCode: 404,
        message: 'Clearance request not found',
        code: 'CLEARANCE_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: clearance
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 4: ADMIN MANAGEMENT CONTROLLERS
// =====================================================

export const getAdminClearancesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin permissions
    const userRole = req.auth?.role;
    if (!['admin', 'hr', 'manager'].includes(userRole)) {
      throw new AppError({
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const {
      status,
      limit = '50',
      offset = '0'
    } = req.query;
    
    const options = {
      status: status ? (Array.isArray(status) ? status as string[] : [status as string]) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };
    
    const clearances = await UnifiedClearanceService.getAdminClearances(options);
    
    res.json({
      success: true,
      data: clearances,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: clearances.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 5: APPROVAL WORKFLOW CONTROLLERS
// =====================================================

export const approveClearanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clearanceId = parseInt(req.params.id);
    const approverId = req.auth?.sub;
    const { decision_note } = req.body;
    
    if (!clearanceId || isNaN(clearanceId) || !approverId) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid parameters',
        code: 'INVALID_PARAMETERS'
      });
    }
    
    await UnifiedClearanceService.approveClearance(
      clearanceId,
      approverId,
      decision_note
    );
    
    res.json({
      success: true,
      message: 'Clearance request approved successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

export const rejectClearanceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clearanceId = parseInt(req.params.id);
    const rejectorId = req.auth?.sub;
    const { decision_note, rejection_reason } = req.body;
    
    if (!clearanceId || isNaN(clearanceId) || !rejectorId) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid parameters',
        code: 'INVALID_PARAMETERS'
      });
    }
    
    const reasonToUse = rejection_reason || decision_note;
    
    if (!reasonToUse) {
      throw new AppError({
        statusCode: 400,
        message: 'Rejection reason is required',
        code: 'REJECTION_REASON_REQUIRED'
      });
    }
    
    await UnifiedClearanceService.rejectClearance(
      clearanceId,
      rejectorId,
      reasonToUse
    );
    
    res.json({
      success: true,
      message: 'Clearance request rejected successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 6: STATUS UPDATE CONTROLLER
// =====================================================

export const updateClearanceStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clearanceId = parseInt(req.params.id);
    const updaterId = req.auth?.sub;
    const { status, decision_note, rejection_reason } = req.body;
    
    if (!clearanceId || isNaN(clearanceId) || !updaterId || !status) {
      throw new AppError({
        statusCode: 400,
        message: 'Missing required parameters',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    await UnifiedClearanceService.updateClearanceStatus(
      clearanceId,
      status,
      updaterId,
      {
        decision_note,
        rejection_reason // Backward compatibility
      }
    );
    
    res.json({
      success: true,
      message: 'Clearance status updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 7: MIGRATION UTILITIES CONTROLLER
// =====================================================

export const migrateClearanceDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only allow admin users to run migration
    const userRole = req.auth?.role;
    if (!['admin'].includes(userRole)) {
      throw new AppError({
        statusCode: 403,
        message: 'Only administrators can run data migration',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const result = await UnifiedClearanceService.migrateLegacyClearanceData();
    
    res.json({
      success: true,
      message: 'Clearance data migration completed',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 8: LEGACY COMPATIBILITY MAPPINGS
// =====================================================

/**
 * Maps old clearance service methods to new unified service
 * Provides seamless transition for existing code
 */

// Legacy method exports for backward compatibility
export const listMyClearances = getMyClearancesController;
export const getClearanceDetails = getClearanceByIdController;
export const adminListClearances = getAdminClearancesController;
export const changeClearanceStatus = updateClearanceStatusController;

// Export unified controller as default for new integrations
export default {
  // New unified methods
  createClearance: createUnifiedClearanceController,
  getMyClearances: getMyClearancesController,
  getClearanceById: getClearanceByIdController,
  getAdminClearances: getAdminClearancesController,
  approveClearance: approveClearanceController,
  rejectClearance: rejectClearanceController,
  updateStatus: updateClearanceStatusController,
  
  // Legacy compatibility methods
  create: createClearanceController,
  listMy: getMyClearancesController,
  getById: getClearanceByIdController,
  adminList: getAdminClearancesController,
  changeStatus: updateClearanceStatusController,
  
  // Migration utilities
  migrate: migrateClearanceDataController
};
