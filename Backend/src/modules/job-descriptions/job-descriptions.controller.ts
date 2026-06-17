import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as jobDescService from './job-descriptions.service';

// ====================== Employee Controllers ======================

export const createJobDescriptionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const data = {
      employee_id: req.auth.sub,
      job_description: req.body.jobDescription || req.body.job_description,
      submission_notes: req.body.submissionNotes || req.body.submission_notes
    };

    const result = await jobDescService.createJobDescription(data);
    sendSuccess(res, { id: result.id, message: 'تم إرسال الوصف الوظيفي للمراجعة' }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyJobDescriptionsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const jobDescs = await jobDescService.getJobDescriptionsByEmployee(req.auth.sub);
    sendSuccess(res, jobDescs);
  } catch (error) {
    next(error);
  }
};

export const getMyApprovedJobDescriptionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const jobDesc = await jobDescService.getApprovedJobDescription(req.auth.sub);
    sendSuccess(res, jobDesc);
  } catch (error) {
    next(error);
  }
};

export const deleteJobDescriptionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    await jobDescService.deleteJobDescription(id, req.auth.sub);
    sendSuccess(res, { message: 'تم حذف الوصف الوظيفي بنجاح' });
  } catch (error) {
    next(error);
  }
};

// ====================== Admin Controllers ======================

export const getPendingJobDescriptionsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const jobDescs = await jobDescService.getPendingJobDescriptions();
    sendSuccess(res, jobDescs);
  } catch (error) {
    next(error);
  }
};

export const getAllJobDescriptionsController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const jobDescs = await jobDescService.getAllJobDescriptions();
    sendSuccess(res, jobDescs);
  } catch (error) {
    next(error);
  }
};

export const approveJobDescriptionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    await jobDescService.approveJobDescription(id, req.auth.sub);
    sendSuccess(res, { message: 'تم الموافقة على الوصف الوظيفي بنجاح' });
  } catch (error) {
    next(error);
  }
};

export const rejectJobDescriptionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError({ statusCode: 400, message: 'Invalid ID', code: 'BAD_REQUEST' });
    }

    const reason = req.body.reason;
    await jobDescService.rejectJobDescription(id, req.auth.sub, reason);
    sendSuccess(res, { message: 'تم رفض الوصف الوظيفي' });
  } catch (error) {
    next(error);
  }
};

// ====================== View Employee's Job Description (for admins) ======================

export const getEmployeeJobDescriptionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid employee ID', code: 'BAD_REQUEST' });
    }

    const jobDesc = await jobDescService.getApprovedJobDescription(employeeId);
    sendSuccess(res, jobDesc);
  } catch (error) {
    next(error);
  }
};

