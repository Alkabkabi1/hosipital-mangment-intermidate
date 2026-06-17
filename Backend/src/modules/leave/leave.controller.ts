import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as leaveService from './leave.service';

// Create a new leave request
export const createLeaveRequestController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestData = {
      employee_id: req.auth.sub,
      employee_name: req.body.employee_name || req.body.employeeName || 'غير محدد',
      employee_number: req.body.employee_number || req.body.employeeNumber || null,
      employee_id_number: req.body.employee_id_number || req.body.employeeId || null,
      job_title: req.body.job_title || req.body.jobTitle || 'غير محدد',
      appointment_date: req.body.appointment_date || req.body.appointmentDate || null,
      job_type: req.body.job_type || req.body.jobType || 'civil',
      leave_types: req.body.leave_types || req.body.leaveTypes || [req.body.leaveType] || ['annual'],
      request_type: req.body.request_type || req.body.requestType || 'new',
      leave_duration: req.body.leave_duration || req.body.leaveDuration || '1 day',
      leave_from_date: req.body.leave_from_date || req.body.leaveFromDate || new Date().toISOString().split('T')[0],
      leave_to_date: req.body.leave_to_date || req.body.leaveToDate || new Date().toISOString().split('T')[0],
      previous_leave_duration: req.body.previous_leave_duration || req.body.previousLeaveDuration || null,
      leave_reasons: req.body.leave_reasons || req.body.leaveReasons || req.body.reason || 'Leave request',
      employee_signature_name: req.body.employee_signature_name || req.body.employeeSignatureName || req.body.employeeName || 'Digital Signature',
      employee_signature: req.body.employee_signature || req.body.employeeSignature || 'auto-signed',
      request_date: req.body.request_date || req.body.requestDate || new Date().toISOString().split('T')[0]
    };

    const result = await leaveService.createLeaveRequest(requestData);
    sendSuccess(res, { id: result.id, message: 'تم تقديم طلب الإجازة بنجاح' }, 201);
  } catch (error) {
    next(error);
  }
};

// Get all leave requests (admin only)
export const getAllLeaveRequestsController: RequestHandler = async (req, res, next) => {
  try {
    const requests = await leaveService.getAllLeaveRequests();
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

// Get employee's own leave requests
export const getMyLeaveRequestsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requests = await leaveService.getLeaveRequestsByEmployee(req.auth.sub);
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

// Get a single leave request by ID
export const getLeaveRequestByIdController: RequestHandler = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const request = await leaveService.getLeaveRequestById(requestId);
    sendSuccess(res, request);
  } catch (error) {
    next(error);
  }
};

// Approve a leave request
export const approveLeaveRequestController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const notes = req.body.notes || req.body.admin_notes;
    const result = await leaveService.approveLeaveRequest(requestId, req.auth.sub, notes);
    sendSuccess(res, { message: 'تم اعتماد طلب الإجازة بنجاح', ...result });
  } catch (error) {
    next(error);
  }
};

// Reject a leave request
export const rejectLeaveRequestController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const reason = req.body.reason || req.body.rejection_reason;
    const result = await leaveService.rejectLeaveRequest(requestId, req.auth.sub, reason);
    sendSuccess(res, { message: 'تم رفض طلب الإجازة', ...result });
  } catch (error) {
    next(error);
  }
};

// Update leave request status
export const updateLeaveRequestStatusController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const { status, notes } = req.body;
    if (!status) {
      throw new AppError({ statusCode: 400, message: 'Status is required', code: 'BAD_REQUEST' });
    }

    const result = await leaveService.updateLeaveRequestStatus(requestId, status, req.auth.sub, notes);
    sendSuccess(res, { message: 'تم تحديث حالة الطلب بنجاح', ...result });
  } catch (error) {
    next(error);
  }
};

// Add comment to leave request
export const addLeaveRequestCommentController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const { comment } = req.body;
    if (!comment) {
      throw new AppError({ statusCode: 400, message: 'Comment is required', code: 'BAD_REQUEST' });
    }

    const result = await leaveService.addLeaveRequestComment(requestId, req.auth.sub, comment);
    sendSuccess(res, { message: 'تم إضافة التعليق بنجاح', ...result }, 201);
  } catch (error) {
    next(error);
  }
};

// Get comments for a leave request
export const getLeaveRequestCommentsController: RequestHandler = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const comments = await leaveService.getLeaveRequestComments(requestId);
    sendSuccess(res, comments);
  } catch (error) {
    next(error);
  }
};

// Get status history for a leave request
export const getLeaveRequestHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const history = await leaveService.getLeaveRequestHistory(requestId);
    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

// Delete/Cancel a leave request
export const deleteLeaveRequestController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid request ID', code: 'BAD_REQUEST' });
    }

    const result = await leaveService.deleteLeaveRequest(requestId, req.auth.sub);
    sendSuccess(res, { message: 'تم إلغاء طلب الإجازة', ...result });
  } catch (error) {
    next(error);
  }
};

