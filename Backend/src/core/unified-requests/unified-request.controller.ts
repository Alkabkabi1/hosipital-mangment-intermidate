// =====================================================
// UNIFIED REQUEST CONTROLLER - HYBRID ARCHITECTURE
// =====================================================
// Provides consistent API interface for all request types
// Combines comprehensive handling with clean controller patterns
// Single point of entry for all request operations
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { UnifiedRequestService } from './unified-request.service';
import { 
  getValidationSchema, 
  createUnifiedRequestSchema,
  updateRequestSchema,
  requestQuerySchema,
  type CreateUnifiedRequestInput,
  type UpdateRequestInput,
  type RequestQueryInput
} from './unified-request.schema';
import { AppError } from '../errors';
import { withConnection } from '../database';

// =====================================================
// SECTION 1: REQUEST CREATION CONTROLLER
// =====================================================

export const createUnifiedRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse and validate the base request structure
    const { request_type, form_data } = createUnifiedRequestSchema.parse(req.body);
    
    // Get specific validation schema for the request type
    const specificSchema = getValidationSchema(request_type);
    if (!specificSchema) {
      throw new AppError({
        statusCode: 400,
        message: `Unsupported request type: ${request_type}`,
        code: 'UNSUPPORTED_REQUEST_TYPE'
      });
    }
    
    // Validate form data against specific schema
    const validatedFormData = specificSchema.parse(form_data);
    
    // Extract user information from auth middleware
    const userId = req.auth?.sub;
    const userEmail = req.auth?.email;
    
    if (!userId || !userEmail) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Prepare unified request data
    const requestData = {
      request_type,
      employee_email: validatedFormData.employee_email || userEmail,
      employee_name: validatedFormData.employee_name,
      employee_dept: validatedFormData.employee_dept,
      created_by_user: userId,
      status: validatedFormData.status || 'قيد الاعتماد',
      request_date: validatedFormData.request_date || new Date().toISOString().split('T')[0],
      form_data: validatedFormData
    };
    
    // Create the request using unified service
    const result = await UnifiedRequestService.createRequest(requestData);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: `${request_type} request created successfully`,
      data: {
        id: result.id,
        reference_number: result.reference_number,
        request_type,
        status: 'قيد الاعتماد'
      }
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
// SECTION 2: REQUEST RETRIEVAL CONTROLLERS
// =====================================================

export const getUnifiedRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate query parameters
    const queryOptions = requestQuerySchema.parse(req.query);
    
    // Get requests using unified service
    const requests = await UnifiedRequestService.getRequests(queryOptions);
    
    // Format response
    res.json({
      success: true,
      data: requests,
      pagination: {
        limit: queryOptions.limit,
        offset: queryOptions.offset,
        total: requests.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

export const getMyRequestsController = async (
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
    
    // Parse query parameters
    const queryParams = requestQuerySchema.parse(req.query);
    
    // Add user filter
    const queryOptions = {
      ...queryParams,
      created_by_user: userId
    };
    
    const requests = await UnifiedRequestService.getRequests(queryOptions);
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
    
  } catch (error) {
    next(error);
  }
};

export const getRequestByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { request_type, request_id } = req.params;
    const requestId = parseInt(request_id);
    
    if (!requestId || isNaN(requestId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid request ID',
        code: 'INVALID_REQUEST_ID'
      });
    }
    
    // Get specific request
    const requests = await UnifiedRequestService.getRequests({
      request_type: [request_type as any],
      limit: 1
    });
    
    const request = requests.find(r => r.id === requestId);
    
    if (!request) {
      throw new AppError({
        statusCode: 404,
        message: 'Request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 3: REQUEST UPDATE CONTROLLER
// =====================================================

export const updateUnifiedRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { request_type, request_id } = req.params;
    const requestId = parseInt(request_id);
    const userId = req.auth?.sub;
    
    if (!requestId || isNaN(requestId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid request ID',
        code: 'INVALID_REQUEST_ID'
      });
    }
    
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Validate update data
    const updateData = updateRequestSchema.parse(req.body);
    
    // Update request using unified service
    await UnifiedRequestService.updateRequest(
      request_type as any,
      requestId,
      updateData,
      userId
    );
    
    res.json({
      success: true,
      message: 'Request updated successfully'
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
// SECTION 4: ADMIN MANAGEMENT CONTROLLERS
// =====================================================

export const getAdminRequestsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check admin permissions (this would be handled by middleware in real app)
    const userRole = req.auth?.role;
    if (!['admin', 'hr', 'manager'].includes(userRole)) {
      throw new AppError({
        statusCode: 403,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    // Parse query parameters
    const queryOptions = requestQuerySchema.parse(req.query);
    
    // Get all requests for admin view
    const requests = await UnifiedRequestService.getRequests(queryOptions);
    
    // Group by request type for admin dashboard
    const groupedRequests = requests.reduce((acc, request) => {
      const type = request.request_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(request);
      return acc;
    }, {} as Record<string, any[]>);
    
    res.json({
      success: true,
      data: {
        all_requests: requests,
        grouped_by_type: groupedRequests,
        total_count: requests.length,
        type_counts: Object.keys(groupedRequests).reduce((acc, type) => {
          acc[type] = groupedRequests[type].length;
          return acc;
        }, {} as Record<string, number>)
      }
    });
    
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get dashboard statistics
    const stats = await withConnection(async (conn) => {
      // Get counts by request type and status
      const [typeStats] = await conn.execute(`
        SELECT 
          'clearance' as request_type,
          COUNT(*) as total,
          COUNT(CASE WHEN final_decision = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN final_decision = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN final_decision = 'rejected' THEN 1 END) as rejected
        FROM Clearance_Requests
        UNION ALL
        SELECT 
          'onboarding' as request_type,
          COUNT(*) as total,
          COUNT(CASE WHEN final_decision = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN final_decision = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN final_decision = 'rejected' THEN 1 END) as rejected
        FROM Onboarding_Requests
        UNION ALL
        SELECT 
          'delegation' as request_type,
          COUNT(*) as total,
          COUNT(CASE WHEN final_decision = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN final_decision = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN final_decision = 'rejected' THEN 1 END) as rejected
        FROM Delegation_Requests
      `);
      
      return typeStats;
    });
    
    res.json({
      success: true,
      data: {
        request_type_stats: stats,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 5: APPROVAL WORKFLOW CONTROLLERS
// =====================================================

export const approveRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { request_type, request_id } = req.params;
    const { decision_note } = req.body;
    const approverId = req.auth?.sub;
    
    const requestId = parseInt(request_id);
    
    if (!requestId || isNaN(requestId) || !approverId) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid request ID or missing authentication',
        code: 'INVALID_PARAMETERS'
      });
    }
    
    // Update request to approved status
    await UnifiedRequestService.updateRequest(
      request_type as any,
      requestId,
      {
        status: 'مكتمل',
        final_decision: 'approved',
        decision_note: decision_note || 'Approved',
        approval_stage: 'completed'
      },
      approverId
    );
    
    res.json({
      success: true,
      message: 'Request approved successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

export const rejectRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { request_type, request_id } = req.params;
    const { decision_note } = req.body;
    const rejectorId = req.auth?.sub;
    
    const requestId = parseInt(request_id);
    
    if (!requestId || isNaN(requestId) || !rejectorId) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid request ID or missing authentication',
        code: 'INVALID_PARAMETERS'
      });
    }
    
    if (!decision_note) {
      throw new AppError({
        statusCode: 400,
        message: 'Rejection reason is required',
        code: 'REJECTION_REASON_REQUIRED'
      });
    }
    
    // Update request to rejected status
    await UnifiedRequestService.updateRequest(
      request_type as any,
      requestId,
      {
        status: 'مرفوض',
        final_decision: 'rejected',
        decision_note,
        approval_stage: 'rejected'
      },
      rejectorId
    );
    
    res.json({
      success: true,
      message: 'Request rejected successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// =====================================================
// SECTION 6: UTILITY CONTROLLERS
// =====================================================

export const getRequestTypesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestTypes = [
      { type: 'clearance', name_ar: 'إخلاء طرف', name_en: 'Clearance' },
      { type: 'onboarding', name_ar: 'مباشرة عمل', name_en: 'Onboarding' },
      { type: 'delegation', name_ar: 'تفويض', name_en: 'Delegation' },
      { type: 'certificate', name_ar: 'شهادة تعريف', name_en: 'Certificate' },
      { type: 'experience', name_ar: 'شهادة خبرة', name_en: 'Experience Certificate' },
      { type: 'exit', name_ar: 'إنهاء العمل', name_en: 'Exit Request' },
      { type: 'assignment', name_ar: 'تكليف', name_en: 'Assignment' },
      { type: 'assignment_termination', name_ar: 'إنهاء تكليف', name_en: 'Assignment Termination' },
      { type: 'internal_transfer', name_ar: 'نقل داخلي', name_en: 'Internal Transfer' },
      { type: 'maternity_leave', name_ar: 'إجازة أمومة', name_en: 'Maternity Leave' },
      { type: 'housing_allowance', name_ar: 'بدل سكن', name_en: 'Housing Allowance' }
    ];
    
    res.json({
      success: true,
      data: requestTypes
    });
    
  } catch (error) {
    next(error);
  }
};

export const getStatusMappingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const statusMapping = await withConnection(async (conn) => {
      const [rows] = await conn.execute(`
        SELECT canonical_status, display_status_ar, display_status_en, 
               status_category, status_order, is_final
        FROM Request_Status_Mapping 
        ORDER BY status_order
      `);
      return rows;
    });
    
    res.json({
      success: true,
      data: statusMapping
    });
    
  } catch (error) {
    next(error);
  }
};
