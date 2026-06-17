import { Router } from 'express';

import {
  createAdminUserController,
  deleteAdminUserController,
  getAdminUserController,
  listAdminUsersController,
  updateAdminUserController,
  getPrivilegedUsersOverviewController,
  createEmployeeController,
  updateEmployeeController,
} from './admin.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';
import loginActivityRouter from './login-activity.routes';
import * as multiApprovalController from '../multi-approval/multi-approval.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles(['ADMIN']));

// Mount login activity routes
adminRouter.use('/login-activity', loginActivityRouter);

// Admin-only approval management routes
// These are mounted at /admin/approvals/* to match frontend expectations
adminRouter.get('/approvals/health-check', multiApprovalController.approvalHealthCheckController);
adminRouter.get('/approvals/stuck-requests', multiApprovalController.getStuckRequestsController);
adminRouter.post('/approvals/fix-request', multiApprovalController.fixRequestController);
adminRouter.post('/approvals/recalculate', multiApprovalController.recalculateRequestController);
adminRouter.get('/approvals/overdue', multiApprovalController.getOverdueRequestsController);
adminRouter.get('/approvals/notification-history', multiApprovalController.getNotificationHistoryController);
adminRouter.post('/approvals/notify-admins', multiApprovalController.notifyAdminsController);

adminRouter.get('/users', listAdminUsersController);
adminRouter.get('/users/:id', getAdminUserController);
adminRouter.post('/users', rateLimit({ windowMs: 60_000, max: 120 }), createAdminUserController);
adminRouter.put('/users/:id', rateLimit({ windowMs: 60_000, max: 120 }), updateAdminUserController);
adminRouter.delete('/users/:id', rateLimit({ windowMs: 60_000, max: 60 }), deleteAdminUserController);

// Privileges overview endpoint
adminRouter.get('/privileges-overview', getPrivilegedUsersOverviewController);

// Employee management endpoints
adminRouter.get('/employees', listAdminUsersController);
adminRouter.post('/employees', rateLimit({ windowMs: 60_000, max: 120 }), createEmployeeController);
adminRouter.put('/employees/:id', rateLimit({ windowMs: 60_000, max: 120 }), updateEmployeeController);

// Dashboard stats endpoints - now implemented in employee-requests module
// Removed conflicting routes to allow employee-requests module to handle:
// - GET /admin/requests/recent (implemented in employee-requests)  
// - GET /admin/requests/summary (implemented in employee-requests)

adminRouter.get('/stats', async (req, res) => {
  // Basic system stats - could be enhanced with real database queries
  res.json({
    total_employees: 150,
    total_users: 45, 
    total_departments: 8,
    total_requests: 25 // This could be calculated from database
  });
});

// /requests/summary route removed - now handled by employee-requests module

// حالات موحدة
const PENDING_STATUSES = ['قيد الاعتماد','قيد الانتظار','قيد المراجعة','submitted'];
const APPROVED_STATUS = 'مكتمل';
const REJECTED_STATUS = 'مرفوض';

// اعتماد طلب مباشرة (localStorage simulation)
adminRouter.post('/requests/direct/:id/approve', rateLimit({ windowMs: 60_000, max: 120 }), async (req, res) => {
  const id = req.params.id;
  const note = req.body?.note || null;
  
  // في بيئة الإنتاج سيكون تحديث قاعدة البيانات
  // هنا نحاكي النجاح
  res.json({ 
    id: parseInt(id), 
    status: APPROVED_STATUS, 
    message: 'تم الاعتماد',
    approved_at: new Date().toISOString(),
    approved_by: req.auth?.sub || 1,
    decision_note: note
  });
});

// رفض طلب مباشرة (localStorage simulation)
adminRouter.post('/requests/direct/:id/reject', rateLimit({ windowMs: 60_000, max: 120 }), async (req, res) => {
  const id = req.params.id;
  const note = req.body?.note || 'تم الرفض';
  
  // في بيئة الإنتاج سيكون تحديث قاعدة البيانات
  // هنا نحاكي النجاح
  res.json({ 
    id: parseInt(id), 
    status: REJECTED_STATUS, 
    message: 'تم الرفض',
    rejected_at: new Date().toISOString(),
    rejected_by: req.auth?.sub || 1,
    decision_note: note
  });
});

// اعتماد طلب إخلاء طرف
adminRouter.post('/requests/clearance/:id/approve', rateLimit({ windowMs: 60_000, max: 120 }), async (req, res) => {
  const id = req.params.id;
  const note = req.body?.note || null;
  
  res.json({ 
    id: parseInt(id), 
    status: APPROVED_STATUS, 
    message: 'تم اعتماد طلب الإخلاء',
    approved_at: new Date().toISOString(),
    approved_by: req.auth?.sub || 1,
    decision_note: note
  });
});

// رفض طلب إخلاء طرف
adminRouter.post('/requests/clearance/:id/reject', rateLimit({ windowMs: 60_000, max: 120 }), async (req, res) => {
  const id = req.params.id;
  const note = req.body?.note || 'تم الرفض';
  
  res.json({ 
    id: parseInt(id), 
    status: REJECTED_STATUS, 
    message: 'تم رفض طلب الإخلاء',
    rejected_at: new Date().toISOString(),
    rejected_by: req.auth?.sub || 1,
    decision_note: note
  });
});
