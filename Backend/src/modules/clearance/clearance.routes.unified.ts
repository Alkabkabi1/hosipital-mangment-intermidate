// =====================================================
// UNIFIED CLEARANCE ROUTES - CONFLICT RESOLUTION
// =====================================================
// Merges clearance routes with employee-requests clearance endpoints
// Provides both new unified endpoints and legacy compatibility
// Single routing configuration for all clearance operations
// =====================================================

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';

// Import unified controllers
import {
  createUnifiedClearanceController,
  createClearanceController,
  getMyClearancesController,
  getClearanceByIdController,
  getAdminClearancesController,
  approveClearanceController,
  rejectClearanceController,
  updateClearanceStatusController,
  migrateClearanceDataController
} from './clearance.controller.unified';

import { clearanceRequestSchema } from '../../core/unified-requests/unified-request.schema';

const router = Router();

// =====================================================
// SECTION 1: MIDDLEWARE CONFIGURATION
// =====================================================

// Rate limiting for clearance operations
const createClearanceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 clearance requests per windowMs
  message: 'Too many clearance requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const queryClearanceRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute  
  max: 30, // Limit each IP to 30 queries per windowMs
  message: 'Too many clearance queries, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const clearanceIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Clearance ID must be a number')
});

const approvalBodySchema = z.object({
  decision_note: z.string().optional()
});

const rejectionBodySchema = z.object({
  decision_note: z.string().min(1, 'Rejection reason is required').optional(),
  rejection_reason: z.string().min(1, 'Rejection reason is required').optional()
}).refine(data => data.decision_note || data.rejection_reason, {
  message: 'Either decision_note or rejection_reason is required'
});

const statusUpdateBodySchema = z.object({
  status: z.string().min(1, 'Status is required'),
  decision_note: z.string().optional(),
  rejection_reason: z.string().optional() // Backward compatibility
});

const queryOptionsSchema = z.object({
  status: z.union([z.string(), z.array(z.string())]).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

// =====================================================
// SECTION 2: NEW UNIFIED ENDPOINTS
// =====================================================

// Create clearance request (new unified endpoint)
router.post(
  '/',
  requireAuth,
  createClearanceRateLimit,
  validateBody(clearanceRequestSchema),
  createUnifiedClearanceController
);

// Get user's clearance requests
router.get(
  '/my-clearances',
  requireAuth,
  queryClearanceRateLimit,
  getMyClearancesController
);

// Get specific clearance by ID  
router.get(
  '/:id',
  requireAuth,
  validateParams(clearanceIdParamsSchema),
  getClearanceByIdController
);

// Update clearance status
router.patch(
  '/:id/status',
  requireAuth,
  validateParams(clearanceIdParamsSchema),
  validateBody(statusUpdateBodySchema),
  updateClearanceStatusController
);

// =====================================================
// SECTION 3: ADMIN MANAGEMENT ENDPOINTS
// =====================================================

// Get all clearance requests for admin
router.get(
  '/admin/all',
  requireAuth,
  // TODO: Add admin role validation middleware
  queryClearanceRateLimit,
  validateQuery(queryOptionsSchema),
  getAdminClearancesController
);

// Approve clearance request
router.post(
  '/admin/:id/approve',
  requireAuth,
  // TODO: Add admin role validation middleware
  validateParams(clearanceIdParamsSchema),
  validateBody(approvalBodySchema),
  approveClearanceController
);

// Reject clearance request
router.post(
  '/admin/:id/reject',
  requireAuth,
  // TODO: Add admin role validation middleware  
  validateParams(clearanceIdParamsSchema),
  validateBody(rejectionBodySchema),
  rejectClearanceController
);

// =====================================================
// SECTION 4: LEGACY COMPATIBILITY ENDPOINTS
// =====================================================

// Legacy endpoint from employee-requests service
router.post(
  '/employee/requests/clearance',
  requireAuth,
  createClearanceRateLimit,
  createClearanceController // Uses legacy controller for compatibility
);

// Legacy endpoint for getting user clearances
router.get(
  '/employee/requests/clearance',
  requireAuth,
  queryClearanceRateLimit,
  getMyClearancesController
);

// Legacy create endpoint (from original clearance module)
router.post(
  '/create',
  requireAuth,
  createClearanceRateLimit,
  createClearanceController
);

// Legacy list endpoint (from original clearance module)
router.get(
  '/list',
  requireAuth,
  queryClearanceRateLimit,
  getMyClearancesController
);

// Legacy admin endpoints (from original clearance module)
router.get(
  '/admin/list',
  requireAuth,
  queryClearanceRateLimit,
  validateQuery(queryOptionsSchema),
  getAdminClearancesController
);

router.get(
  '/admin/pending',
  requireAuth,
  queryClearanceRateLimit,
  (req, res, next) => {
    // Add pending status filter
    req.query.status = ['قيد الاعتماد', 'قيد المراجعة'];
    next();
  },
  validateQuery(queryOptionsSchema),
  getAdminClearancesController
);

// =====================================================
// SECTION 5: WORKFLOW ENDPOINTS (LEGACY SUPPORT)
// =====================================================

// Legacy approval/rejection endpoints with different paths
router.post(
  '/:id/approve',
  requireAuth,
  validateParams(clearanceIdParamsSchema),
  validateBody(approvalBodySchema),
  approveClearanceController
);

router.post(
  '/:id/reject',
  requireAuth,
  validateParams(clearanceIdParamsSchema),
  validateBody(rejectionBodySchema),
  rejectClearanceController
);

// Status change endpoint (legacy format)
router.put(
  '/:id/status',
  requireAuth,
  validateParams(clearanceIdParamsSchema),
  validateBody(statusUpdateBodySchema),
  updateClearanceStatusController
);

// =====================================================
// SECTION 6: MIGRATION AND UTILITY ENDPOINTS
// =====================================================

// Data migration endpoint (admin only)
router.post(
  '/admin/migrate-data',
  requireAuth,
  // TODO: Add admin role validation middleware
  migrateClearanceDataController
);

// Health check endpoint for clearance service
router.get(
  '/health',
  (req, res) => {
    res.json({
      success: true,
      service: 'unified-clearance',
      version: '2.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        unified: {
          create: 'POST /',
          list: 'GET /my-clearances',
          detail: 'GET /:id',
          update: 'PATCH /:id/status'
        },
        admin: {
          list: 'GET /admin/all',
          approve: 'POST /admin/:id/approve',
          reject: 'POST /admin/:id/reject'
        },
        legacy: {
          employeeRequests: 'POST /employee/requests/clearance',
          originalModule: 'POST /create'
        }
      }
    });
  }
);

// =====================================================
// SECTION 7: ERROR HANDLING
// =====================================================

// Clearance-specific error handler
router.use((error: any, req: any, res: any, next: any) => {
  // Log clearance-specific errors
  console.error('Clearance Route Error:', {
    path: req.path,
    method: req.method,
    clearanceId: req.params.id,
    userId: req.auth?.sub,
    error: error.message,
    stack: error.stack
  });
  
  // Enhance error messages for clearance context
  if (error.code === 'CLEARANCE_NOT_FOUND') {
    error.message = 'Clearance request not found or you do not have permission to access it';
  } else if (error.code === 'CLEARANCE_CREATION_FAILED') {
    error.message = 'Failed to create clearance request. Please check your input and try again.';
  } else if (error.code === 'CLEARANCE_UPDATE_FAILED') {
    error.message = 'Failed to update clearance request. Please try again.';
  }
  
  // Pass to global error handler
  next(error);
});

export default router;
