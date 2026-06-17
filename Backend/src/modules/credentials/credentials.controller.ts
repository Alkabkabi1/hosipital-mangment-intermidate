import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import * as credentialsService from './credentials.service';

// ====================== Certificates ======================

export const createCertificateController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const certificateData = {
      employee_id: req.auth.sub,
      certificate_name: req.body.certificateName || req.body.certificate_name,
      issuing_institution: req.body.issuingInstitution || req.body.issuing_institution,
      certificate_type: req.body.certificateType || req.body.certificate_type || 'certificate',
      field_of_study: req.body.fieldOfStudy || req.body.field_of_study,
      issue_date: req.body.issueDate || req.body.issue_date,
      description: req.body.description
    };

    const result = await credentialsService.createCertificate(certificateData);
    sendSuccess(res, { id: result.id, message: 'تم إضافة الشهادة بنجاح' }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyCertificatesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const certificates = await credentialsService.getCertificatesByEmployee(req.auth.sub);
    sendSuccess(res, certificates);
  } catch (error) {
    next(error);
  }
};

export const deleteCertificateController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const certificateId = parseInt(req.params.id);
    if (isNaN(certificateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid certificate ID', code: 'BAD_REQUEST' });
    }

    await credentialsService.deleteCertificate(certificateId, req.auth.sub);
    sendSuccess(res, { message: 'تم حذف الشهادة بنجاح' });
  } catch (error) {
    next(error);
  }
};

// ====================== Licenses ======================

export const createLicenseController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const licenseData = {
      employee_id: req.auth.sub,
      license_name: req.body.licenseName || req.body.license_name,
      license_number: req.body.licenseNumber || req.body.license_number,
      issuing_authority: req.body.issuingAuthority || req.body.issuing_authority,
      license_type: req.body.licenseType || req.body.license_type || 'professional',
      issue_date: req.body.issueDate || req.body.issue_date,
      expiry_date: req.body.expiryDate || req.body.expiry_date,
      renewal_reminder_days: req.body.renewalReminderDays || req.body.renewal_reminder_days || 30,
      description: req.body.description
    };

    const result = await credentialsService.createLicense(licenseData);
    sendSuccess(res, { id: result.id, message: 'تم إضافة الترخيص بنجاح' }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyLicensesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const licenses = await credentialsService.getLicensesByEmployee(req.auth.sub);
    sendSuccess(res, licenses);
  } catch (error) {
    next(error);
  }
};

export const deleteLicenseController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const licenseId = parseInt(req.params.id);
    if (isNaN(licenseId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid license ID', code: 'BAD_REQUEST' });
    }

    await credentialsService.deleteLicense(licenseId, req.auth.sub);
    sendSuccess(res, { message: 'تم حذف الترخيص بنجاح' });
  } catch (error) {
    next(error);
  }
};

export const getExpiringLicensesController: RequestHandler = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const licenses = await credentialsService.getExpiringLicenses(days);
    sendSuccess(res, licenses);
  } catch (error) {
    next(error);
  }
};

// ====================== Admin Approval Controllers ======================

export const getPendingCertificatesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const certificates = await credentialsService.getPendingCertificates();
    sendSuccess(res, certificates);
  } catch (error) {
    next(error);
  }
};

export const getPendingLicensesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const licenses = await credentialsService.getPendingLicenses();
    sendSuccess(res, licenses);
  } catch (error) {
    next(error);
  }
};

export const getPendingCredentialsGroupedController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const grouped = await credentialsService.getPendingCredentialsGrouped();
    sendSuccess(res, grouped);
  } catch (error) {
    next(error);
  }
};

export const approveCertificateController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const certificateId = parseInt(req.params.id);
    if (isNaN(certificateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid certificate ID', code: 'BAD_REQUEST' });
    }

    await credentialsService.approveCertificate(certificateId, req.auth.sub);
    sendSuccess(res, { message: 'تم الموافقة على الشهادة بنجاح' });
  } catch (error) {
    next(error);
  }
};

export const approveLicenseController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const licenseId = parseInt(req.params.id);
    if (isNaN(licenseId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid license ID', code: 'BAD_REQUEST' });
    }

    await credentialsService.approveLicense(licenseId, req.auth.sub);
    sendSuccess(res, { message: 'تم الموافقة على الترخيص بنجاح' });
  } catch (error) {
    next(error);
  }
};

export const rejectCertificateController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const certificateId = parseInt(req.params.id);
    if (isNaN(certificateId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid certificate ID', code: 'BAD_REQUEST' });
    }

    await credentialsService.rejectCertificate(certificateId, req.auth.sub);
    sendSuccess(res, { message: 'تم رفض الشهادة بنجاح' });
  } catch (error) {
    next(error);
  }
};

export const rejectLicenseController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const licenseId = parseInt(req.params.id);
    if (isNaN(licenseId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid license ID', code: 'BAD_REQUEST' });
    }

    await credentialsService.rejectLicense(licenseId, req.auth.sub);
    sendSuccess(res, { message: 'تم رفض الترخيص بنجاح' });
  } catch (error) {
    next(error);
  }
};

// ====================== Admin View Employee Credentials ======================

export const getEmployeeCertificatesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid employee ID', code: 'BAD_REQUEST' });
    }

    const certificates = await credentialsService.getCertificatesByEmployee(employeeId);
    sendSuccess(res, certificates);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeLicensesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid employee ID', code: 'BAD_REQUEST' });
    }

    const licenses = await credentialsService.getLicensesByEmployee(employeeId);
    sendSuccess(res, licenses);
  } catch (error) {
    next(error);
  }
};

