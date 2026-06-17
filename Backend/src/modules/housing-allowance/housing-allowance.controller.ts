/**
 * Housing Allowance Request (بدل سكن أطباء سعوديين) - Controller Layer
 */

import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as housingAllowanceService from './housing-allowance.service';

/**
 * Create a new housing allowance request
 */
export const createHousingAllowanceRequestController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestData = {
      employeeName: req.body.employeeName || req.body.employee_name,
      employeeNumber: req.body.employeeNumber || req.body.employee_number,
      jobTitle: req.body.jobTitle || req.body.job_title,
      department: req.body.department,
      nationality: req.body.nationality || 'سعودي',
      letterDate: req.body.letterDate || req.body.letter_date,
      hijriDate: req.body.hijriDate || req.body.hijri_date,
      housingDirector: req.body.housingDirector || req.body.housing_director,
      periodStart: req.body.periodStart || req.body.period_start,
      periodEnd: req.body.periodEnd || req.body.period_end,
      socialStatus: req.body.socialStatus || req.body.social_status,
      allowanceReason: req.body.allowanceReason || req.body.allowance_reason,
      housingManagerNote: req.body.housingManagerNote || req.body.housing_manager_note,
      financeNote: req.body.financeNote || req.body.finance_note,
      financeName: req.body.financeName || req.body.finance_name,
      hrDirector: req.body.hrDirector || req.body.hr_director,
      employeeNotes: req.body.employeeNotes || req.body.employee_notes
    };

    const result = await housingAllowanceService.createHousingAllowanceRequest(req.auth.sub, requestData);
    sendSuccess(res, { id: result.id, message: 'تم تقديم طلب بدل السكن بنجاح' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all housing allowance requests (admin only)
 */
export const getAllHousingAllowanceRequestsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requests = await housingAllowanceService.getAllHousingAllowanceRequests();
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

/**
 * Get housing allowance request by ID
 */
export const getHousingAllowanceRequestByIdController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      throw new AppError({ statusCode: 400, message: 'معرف الطلب غير صحيح', code: 'INVALID_REQUEST_ID' });
    }

    const request = await housingAllowanceService.getHousingAllowanceRequestById(requestId);
    sendSuccess(res, request);
  } catch (error) {
    next(error);
  }
};

/**
 * Get my housing allowance requests (employee)
 */
export const getMyHousingAllowanceRequestsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const requests = await housingAllowanceService.getHousingAllowanceRequestsByEmployee(req.auth.sub);
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

/**
 * Update housing allowance request status (admin only)
 */
export const updateHousingAllowanceRequestStatusController: RequestHandler = async (req, res, next) => {
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

    await housingAllowanceService.updateHousingAllowanceRequestStatus(requestId, req.auth.sub, updateData);
    sendSuccess(res, { message: 'تم تحديث حالة طلب بدل السكن بنجاح' });
  } catch (error) {
    next(error);
  }
};
