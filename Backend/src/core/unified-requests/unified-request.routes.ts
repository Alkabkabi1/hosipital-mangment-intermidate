// =====================================================
// UNIFIED REQUEST ROUTES - HYBRID ARCHITECTURE
// =====================================================
// Centralized routing for all request types
// Provides consistent API endpoints with proper middleware
// Combines comprehensive functionality with clean routing patterns
// =====================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/authenticate';
import { validateBody } from '../../validation/validate';
import { rateLimit } from 'express-rate-limit';
import { 
  createUnifiedRequestController,
  getUnifiedRequestsController,
  getMyRequestsController,
  getRequestByIdController,
  updateUnifiedRequestController,
  getAdminRequestsController,
  getAdminDashboardStatsController,
  approveRequestController,
  rejectRequestController,
  getRequestTypesController,
  getStatusMappingController
} from './unified-request.controller';
import { 
  createUnifiedRequestSchema,
  updateRequestSchema,
  requestQuerySchema
} from './unified-request.schema';
import { z } from 'zod';

const router = Router();

// =====================================================
// SECTION 1: MIDDLEWARE CONFIGURATION
// =====================================================

// Rate limiting configuration
const createRequestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many request submissions, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const queryRequestsRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per windowMs
  message: 'Too many query requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Parameter validation schemas
const requestParamsSchema = z.object({
  request_type: z.enum([
    'clearance', 'onboarding', 'delegation', 'certificate', 'experience',
    'exit', 'assignment', 'assignment_termination', 'internal_transfer', 
    'maternity_leave', 'housing_allowance'
  ]),
  request_id: z.string().regex(/^\d+$/, 'Request ID must be a number')
});

const approvalBodySchema = z.object({
  decision_note: z.string().optional()
});

const rejectionBodySchema = z.object({
  decision_note: z.string().min(1, 'Rejection reason is required')
});

// =====================================================
// SECTION 2: PUBLIC UTILITY ROUTES
// =====================================================

// Get available request types
router.get(
  '/types',
  queryRequestsRateLimit,
  getRequestTypesController
);

// Get status mappings
router.get(
  '/status-mappings',
  queryRequestsRateLimit,
  getStatusMappingController
);

// =====================================================
// SECTION 3: AUTHENTICATED USER ROUTES
// =====================================================

// Create a new request (any type)
router.post(
  '/',
  requireAuth,
  createRequestRateLimit,
  validateBody(createUnifiedRequestSchema),
  createUnifiedRequestController
);

// Get user's own requests
router.get(
  '/my-requests',
  requireAuth,
  queryRequestsRateLimit,
  validateQuery(requestQuerySchema),
  getMyRequestsController
);

// Get all requests (with filtering)
router.get(
  '/',
  requireAuth,
  queryRequestsRateLimit,
  validateQuery(requestQuerySchema),
  getUnifiedRequestsController
);

// Get specific request by type and ID
router.get(
  '/:request_type/:request_id',
  requireAuth,
  validateParams(requestParamsSchema),
  getRequestByIdController
);

// Update specific request
router.patch(
  '/:request_type/:request_id',
  requireAuth,
  validateParams(requestParamsSchema),
  validateBody(updateRequestSchema),
  updateUnifiedRequestController
);

// =====================================================
// SECTION 4: LEGACY COMPATIBILITY ROUTES
// =====================================================

// Backward compatibility for existing employee-requests endpoints
router.post(
  '/employee/requests/clearance',
  requireAuth,
  createRequestRateLimit,
  (req, res, next) => {
    // Transform legacy clearance request to unified format
    req.body = {
      request_type: 'clearance',
      form_data: req.body
    };
    next();
  },
  validateBody(createUnifiedRequestSchema),
  createUnifiedRequestController
);

router.post(
  '/employee/requests/onboarding',
  requireAuth,
  createRequestRateLimit,
  (req, res, next) => {
    // Transform legacy onboarding request to unified format
    req.body = {
      request_type: 'onboarding',
      form_data: req.body
    };
    next();
  },
  validateBody(createUnifiedRequestSchema),
  createUnifiedRequestController
);

router.post(
  '/employee/requests/delegation',
  requireAuth,
  createRequestRateLimit,
  (req, res, next) => {
    // Transform legacy delegation request to unified format
    req.body = {
      request_type: 'delegation',
      form_data: req.body
    };
    next();
  },
  validateBody(createUnifiedRequestSchema),
  createUnifiedRequestController
);

// Get user's clearance requests (legacy endpoint)
router.get(
  '/employee/requests/clearance',
  requireAuth,
  queryRequestsRateLimit,
  (req, res, next) => {
    // Add clearance filter to query
    req.query.request_type = ['clearance'];
    next();
  },
  validateQuery(requestQuerySchema),
  getMyRequestsController
);

// Get user's onboarding requests (legacy endpoint)  
router.get(
  '/employee/requests/onboarding',
  requireAuth,
  queryRequestsRateLimit,
  (req, res, next) => {
    // Add onboarding filter to query
    req.query.request_type = ['onboarding'];
    next();
  },
  validateQuery(requestQuerySchema),
  getMyRequestsController
);

// =====================================================
// SECTION 5: ADMIN MANAGEMENT ROUTES
// =====================================================

// Get admin dashboard statistics
router.get(
  '/admin/stats',
  requireAuth,
  // TODO: Add admin role middleware
  queryRequestsRateLimit,
  getAdminDashboardStatsController
);

// Get all requests for admin management
router.get(
  '/admin/all',
  requireAuth,
  // TODO: Add admin role middleware
  queryRequestsRateLimit,
  validateQuery(requestQuerySchema),
  getAdminRequestsController
);

// Admin approve request
router.post(
  '/admin/:request_type/:request_id/approve',
  requireAuth,
  // TODO: Add admin role middleware
  validateParams(requestParamsSchema),
  validateBody(approvalBodySchema),
  approveRequestController
);

// Admin reject request
router.post(
  '/admin/:request_type/:request_id/reject',
  requireAuth,
  // TODO: Add admin role middleware
  validateParams(requestParamsSchema),
  validateBody(rejectionBodySchema),
  rejectRequestController
);

// =====================================================
// SECTION 6: TYPE-SPECIFIC CONVENIENCE ROUTES
// =====================================================

// Convenience routes for each request type (optional, for easier frontend integration)

// Clearance requests
router.post('/clearance', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'clearance', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/clearance', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['clearance'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Onboarding requests
router.post('/onboarding', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'onboarding', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/onboarding', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['onboarding'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Delegation requests
router.post('/delegation', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'delegation', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/delegation', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['delegation'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Certificate requests
router.post('/certificate', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'certificate', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/certificate', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['certificate'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Experience Certificate requests
router.post('/experience', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'experience', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/experience', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['experience'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Exit requests
router.post('/exit', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'exit', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/exit', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['exit'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Assignment requests
router.post('/assignment', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'assignment', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/assignment', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['assignment'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Assignment Termination requests
router.post('/assignment-termination', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'assignment_termination', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/assignment-termination', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['assignment_termination'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Internal Transfer requests
router.post('/internal-transfer', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'internal_transfer', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/internal-transfer', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['internal_transfer'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Maternity Leave requests
router.post('/maternity-leave', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'maternity_leave', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/maternity-leave', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['maternity_leave'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// Housing Allowance requests
router.post('/housing-allowance', requireAuth, createRequestRateLimit, (req, res, next) => {
  req.body = { request_type: 'housing_allowance', form_data: req.body };
  next();
}, validateBody(createUnifiedRequestSchema), createUnifiedRequestController);

router.get('/housing-allowance', requireAuth, queryRequestsRateLimit, (req, res, next) => {
  req.query.request_type = ['housing_allowance'];
  next();
}, validateQuery(requestQuerySchema), getUnifiedRequestsController);

// =====================================================
// SECTION 7: ERROR HANDLING MIDDLEWARE
// =====================================================

// Request-specific error handler
router.use((error: any, req: any, res: any, next: any) => {
  // Log the error for debugging
  console.error('Unified Request Route Error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });
  
  // Pass error to global error handler
  next(error);
});

export default router;
