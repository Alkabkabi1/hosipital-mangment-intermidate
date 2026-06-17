/**
 * Maternity Leave Request (طلب إجازة رعاية مولود) - Controller Layer
 */

import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as maternityLeaveService from './maternity-leave.service';

/**
 * Create a new maternity leave request
 */
export const createMaternityLeaveRequestController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestData = {
      employeeName: req.body.employeeName || req.body.employee_name,
      jobTitle: req.body.jobTitle || req.body.job_title,
      employeeId: req.body.employeeId || req.body.employee_id_number,
      serviceType: req.body.serviceType || req.body.service_type,
      department: req.body.department,
      appointmentDate: req.body.appointmentDate || req.body.appointment_date,
      requestType: req.body.requestType || req.body.request_type || 'new',
      leaveFromDate: req.body.leaveFromDate || req.body.leave_from_date,
      leaveToDate: req.body.leaveToDate || req.body.leave_to_date,
      leaveDuration: parseInt(req.body.leaveDuration || req.body.leave_duration),
      employeeSignature: req.body.employeeSignature || req.body.employee_signature,
      pledgeDate: req.body.pledgeDate || req.body.pledge_date,
      approvalOption: req.body.approvalOption || req.body.approval_option || 'approve',
      deferPeriod: req.body.deferPeriod || req.body.defer_period,
      managerName: req.body.managerName || req.body.manager_name,
      managerSignature: req.body.managerSignature || req.body.manager_signature,
      attachBirthNoticeName: req.body.attachBirthNoticeName || req.body.attach_birth_notice_name,
      attachBirthCertName: req.body.attachBirthCertName || req.body.attach_birth_cert_name
    };

    const result = await maternityLeaveService.createMaternityLeaveRequest(req.auth.sub, requestData);
    sendSuccess(res, { id: result.id, message: 'تم تقديم طلب إجازة الأمومة بنجاح' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all maternity leave requests (admin only)
 */
export const getAllMaternityLeaveRequestsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requests = await maternityLeaveService.getAllMaternityLeaveRequests();
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

/**
 * Get maternity leave request by ID
 */
export const getMaternityLeaveRequestByIdController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'معرف الطلب غير صحيح', code: 'INVALID_REQUEST_ID' });
    }

    const request = await maternityLeaveService.getMaternityLeaveRequestById(requestId);
    sendSuccess(res, request);
  } catch (error) {
    next(error);
  }
};

/**
 * Get my maternity leave requests (employee)
 */
export const getMyMaternityLeaveRequestsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requests = await maternityLeaveService.getMaternityLeaveRequestsByEmployee(req.auth.sub);
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

/**
 * Update maternity leave request status (admin only)
 */
export const updateMaternityLeaveRequestStatusController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'معرف الطلب غير صحيح', code: 'INVALID_REQUEST_ID' });
    }

    const updateData = {
      status: req.body.status,
      adminNotes: req.body.adminNotes || req.body.admin_notes,
      rejectionReason: req.body.rejectionReason || req.body.rejection_reason
    };

    await maternityLeaveService.updateMaternityLeaveRequestStatus(requestId, req.auth.sub, updateData);
    sendSuccess(res, { message: 'تم تحديث حالة طلب إجازة الأمومة بنجاح' });
  } catch (error) {
    next(error);
  }
};
