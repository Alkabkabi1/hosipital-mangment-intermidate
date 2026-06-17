// =====================================================
// UNIFIED ONBOARDING CONTROLLER - CONFLICT RESOLUTION
// =====================================================
// Merges simple and comprehensive onboarding implementations
// Supports both basic and detailed form submissions
// Provides unified API interface for all onboarding operations
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { 
  UnifiedOnboardingService,
  type UnifiedOnboardingInput,
  type SimpleOnboardingInput,
  type ComprehensiveOnboardingInput
} from './onboarding.service.unified';
import { AppError } from '../../core/errors';
import { 
  onboardingRequestSchema, 
  simpleOnboardingSchema,
  comprehensiveOnboardingSchema,
  type OnboardingRequestInput 
} from '../../core/unified-requests/unified-request.schema';

// =====================================================
// SECTION 1: UNIFIED CREATION CONTROLLER
// =====================================================

export const createUnifiedOnboardingController = async (
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
    
    // Validate input using union schema (supports both simple and comprehensive)
    const validatedInput = onboardingRequestSchema.parse(req.body);
    
    // Safely check for comprehensive fields by looking at the raw input
    const rawInput = validatedInput as any;
    const isComprehensive = rawInput.firstName && rawInput.secondName;
    
    // Prepare unified input with safe property access
    const unifiedInput: UnifiedOnboardingInput = {
      form_type: isComprehensive ? 'comprehensive' : 'simple',
      employee_email: rawInput.employee_email || userEmail,
      employee_name: rawInput.employee_name,
      employee_dept: rawInput.employee_dept,
      request_date: rawInput.request_date,
      start_date: rawInput.start_date || rawInput.startDate,
      
      // Simple form fields (safe access)
      position_title: rawInput.position_title,
      notes: rawInput.notes,
      
      // Comprehensive form fields (safe access if present)
      ...(isComprehensive && {
        firstName: rawInput.firstName,
        secondName: rawInput.secondName,
        thirdName: rawInput.thirdName,
        jobTitle: rawInput.jobTitle,
        workId: rawInput.workId,
        reasonForJob: rawInput.reasonForJob,
        documentNumber: rawInput.documentNumber,
        applicationDate: rawInput.applicationDate,
        fourthName: rawInput.fourthName,
        fatherName: rawInput.fatherName,
        grandpaName: rawInput.grandpaName,
        familyName: rawInput.familyName,
        transactionNumber: rawInput.transactionNumber,
        transactionDate: rawInput.transactionDate,
        employeeStatus: rawInput.employeeStatus,
        employeeNumber: rawInput.employeeNumber,
        department: rawInput.department,
        group: rawInput.group,
        rank: rawInput.rank,
        birthDate: rawInput.birthDate,
        appointmentDate: rawInput.appointmentDate,
        employmentType: rawInput.employmentType,
        nationality: rawInput.nationality,
        gender: rawInput.gender,
        onboardingReason: rawInput.onboardingReason,
        phone: rawInput.phone
      })
    };
    
    // Create onboarding using unified service
    const result = await UnifiedOnboardingService.createOnboarding(userId, unifiedInput);
    
    res.status(201).json({
      success: true,
      message: `${isComprehensive ? 'Comprehensive' : 'Simple'} onboarding request created successfully`,
      data: result
    });
    
  } catch (error: any) {
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
// SECTION 2: FORM-SPECIFIC CONTROLLERS
// =====================================================

export const createSimpleOnboardingController = async (
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
    
    // Validate as simple onboarding
    const validatedInput = simpleOnboardingSchema.parse(req.body);
    
    const simpleInput: SimpleOnboardingInput = {
      employee_email: validatedInput.employee_email || userEmail,
      employee_name: validatedInput.employee_name,
      employee_dept: validatedInput.employee_dept,
      request_date: validatedInput.request_date,
      start_date: validatedInput.start_date,
      position_title: validatedInput.position_title,
      notes: validatedInput.notes
    };
    
    const result = await UnifiedOnboardingService.createSimpleOnboarding(userId, simpleInput);
    
    res.status(201).json({
      success: true,
      message: 'Simple onboarding request created successfully',
      data: result
    });
    
  } catch (error: any) {
    if (error.issues) {
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

export const createComprehensiveOnboardingController = async (
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
    
    // Validate as comprehensive onboarding
    const validatedInput = comprehensiveOnboardingSchema.parse(req.body);
    
    const comprehensiveInput: ComprehensiveOnboardingInput = {
      firstName: validatedInput.firstName,
      secondName: validatedInput.secondName,
      thirdName: validatedInput.thirdName,
      jobTitle: validatedInput.jobTitle,
      workId: validatedInput.workId,
      reasonForJob: validatedInput.reasonForJob,
      documentNumber: validatedInput.documentNumber,
      applicationDate: validatedInput.applicationDate,
      startDate: validatedInput.startDate,
      fourthName: validatedInput.fourthName,
      fatherName: validatedInput.fatherName,
      grandpaName: validatedInput.grandpaName,
      familyName: validatedInput.familyName,
      transactionNumber: validatedInput.transactionNumber,
      transactionDate: validatedInput.transactionDate,
      employeeStatus: validatedInput.employeeStatus,
      employeeNumber: validatedInput.employeeNumber,
      department: validatedInput.department,
      group: validatedInput.group,
      rank: validatedInput.rank,
      birthDate: validatedInput.birthDate,
      appointmentDate: validatedInput.appointmentDate,
      employmentType: validatedInput.employmentType,
      nationality: validatedInput.nationality,
      gender: validatedInput.gender,
      onboardingReason: validatedInput.onboardingReason,
      employee_email: validatedInput.employee_email || userEmail,
      phone: validatedInput.phone,
      requestDate: (validatedInput as any).requestDate || (validatedInput as any).request_date
    };
    
    const result = await UnifiedOnboardingService.createComprehensiveOnboarding(userId, comprehensiveInput);
    
    res.status(201).json({
      success: true,
      message: 'Comprehensive onboarding request created successfully',
      data: result
    });
    
  } catch (error: any) {
    if (error.issues) {
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
// SECTION 3: BACKWARD COMPATIBILITY CONTROLLER
// =====================================================

/**
 * Legacy controller for employee-requests onboarding creation
 * Maintains backward compatibility during transition
 */
export const createOnboardingController = async (
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
    const result = await UnifiedOnboardingService.createOnboardingRequest({
      employee_email: req.body.employee_email || userEmail,
      employee_name: req.body.employee_name,
      employee_dept: req.body.employee_dept,
      created_by_user: userId,
      request_date: req.body.request_date || new Date().toISOString().split('T')[0],
      start_date: req.body.start_date || req.body.startDate,
      document_number: req.body.document_number || req.body.documentNumber,
      transaction_number: req.body.transaction_number || req.body.transactionNumber,
      transaction_date: req.body.transaction_date || req.body.transactionDate,
      employee_status: req.body.employee_status || req.body.employeeStatus,
      employment_type: req.body.employment_type || req.body.employmentType,
      onboarding_reason: req.body.onboarding_reason || req.body.onboardingReason,
      reason_for_job: req.body.reason_for_job || req.body.reasonForJob,
      payload_json: req.body.payload_json || JSON.stringify(req.body)
    });
    
    // Return response in expected legacy format
    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب مباشرة العمل بنجاح',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 4: RETRIEVAL CONTROLLERS
// =====================================================

export const getMyOnboardingsController = async (
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
    
    const onboardings = await UnifiedOnboardingService.getMyOnboardings(userId);
    
    res.json({
      success: true,
      data: onboardings,
      count: onboardings.length
    });
    
  } catch (error) {
    next(error);
  }
};

export const getOnboardingByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onboardingId = parseInt(req.params.id);
    
    if (!onboardingId || isNaN(onboardingId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid onboarding ID',
        code: 'INVALID_ONBOARDING_ID'
      });
    }
    
    const onboarding = await UnifiedOnboardingService.getOnboardingById(onboardingId);
    
    if (!onboarding) {
      throw new AppError({
        statusCode: 404,
        message: 'Onboarding request not found',
        code: 'ONBOARDING_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: onboarding
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 5: ADMIN MANAGEMENT CONTROLLERS
// =====================================================

export const getAdminOnboardingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin permissions
    const userRoles = req.auth?.roles || [];
    if (!userRoles.some(role => ['ADMIN', 'HR', 'MANAGER'].includes(role.toUpperCase()))) {
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
    
    const onboardings = await UnifiedOnboardingService.getAdminOnboardings(options);
    
    res.json({
      success: true,
      data: onboardings,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: onboardings.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 6: APPROVAL WORKFLOW CONTROLLERS
// =====================================================

export const approveOnboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onboardingId = parseInt(req.params.id);
    const approverId = req.auth?.sub;
    const { decision_note } = req.body;
    
    if (!onboardingId || isNaN(onboardingId) || !approverId) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid parameters',
        code: 'INVALID_PARAMETERS'
      });
    }
    
    await UnifiedOnboardingService.approveOnboarding(
      onboardingId,
      approverId,
      decision_note
    );
    
    res.json({
      success: true,
      message: 'Onboarding request approved successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

export const rejectOnboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onboardingId = parseInt(req.params.id);
    const rejectorId = req.auth?.sub;
    const { decision_note, rejection_reason } = req.body;
    
    if (!onboardingId || isNaN(onboardingId) || !rejectorId) {
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
    
    await UnifiedOnboardingService.rejectOnboarding(
      onboardingId,
      rejectorId,
      reasonToUse
    );
    
    res.json({
      success: true,
      message: 'Onboarding request rejected successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 7: STATUS UPDATE CONTROLLER
// =====================================================

export const updateOnboardingStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const onboardingId = parseInt(req.params.id);
    const updaterId = req.auth?.sub;
    const { status, decision_note, notes } = req.body;
    
    if (!onboardingId || isNaN(onboardingId) || !updaterId || !status) {
      throw new AppError({
        statusCode: 400,
        message: 'Missing required parameters',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    await UnifiedOnboardingService.updateOnboardingStatus(
      onboardingId,
      status,
      updaterId,
      {
        decision_note,
        notes
      }
    );
    
    res.json({
      success: true,
      message: 'Onboarding status updated successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 8: MIGRATION UTILITIES CONTROLLER
// =====================================================

export const migrateOnboardingDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only allow admin users to run migration
    const userRoles = req.auth?.roles || [];
    if (!userRoles.some(role => role.toUpperCase() === 'ADMIN')) {
      throw new AppError({
        statusCode: 403,
        message: 'Only administrators can run data migration',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const result = await UnifiedOnboardingService.migrateLegacyOnboardingData();
    
    res.json({
      success: true,
      message: 'Onboarding data migration completed',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 9: LEGACY COMPATIBILITY MAPPINGS
// =====================================================

/**
 * Maps old onboarding service methods to new unified service
 * Provides seamless transition for existing code
 */

// Legacy method exports for backward compatibility
export const listMyOnboardings = getMyOnboardingsController;
export const getOnboardingDetails = getOnboardingByIdController;
export const adminListOnboardings = getAdminOnboardingsController;
export const changeOnboardingStatus = updateOnboardingStatusController;

// Export unified controller as default
export default {
  // New unified methods
  createOnboarding: createUnifiedOnboardingController,
  createSimple: createSimpleOnboardingController,
  createComprehensive: createComprehensiveOnboardingController,
  getMyOnboardings: getMyOnboardingsController,
  getById: getOnboardingByIdController,
  getAdminOnboardings: getAdminOnboardingsController,
  approve: approveOnboardingController,
  reject: rejectOnboardingController,
  updateStatus: updateOnboardingStatusController,
  
  // Legacy compatibility methods
  create: createOnboardingController,
  listMy: getMyOnboardingsController,
  adminList: getAdminOnboardingsController,
  changeStatus: updateOnboardingStatusController,
  
  // Migration utilities
  migrate: migrateOnboardingDataController
};
