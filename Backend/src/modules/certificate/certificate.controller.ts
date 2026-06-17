/**
 * Certificate Request (شهادة تعريف) - Controller Layer
 */

import type { RequestHandler } from 'express';
import { createCertificateSchema, updateCertificateStatusSchema } from './certificate.schema';
import {
  createCertificate,
  getAllCertificates as getUserCertificates,
  getCertificateById,
  getAllCertificates,
  updateCertificateStatus,
  getCertificateHistory,
} from './certificate.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

/**
 * Create a new certificate request
 * POST /api/certificate
 */
export const createCertificateController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const input = createCertificateSchema.parse(req.body);
    const result = await createCertificate(userId, input);

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's certificate requests
 * GET /api/certificate
 */
export const getUserCertificatesController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const certificates = await getUserCertificates();
    sendSuccess(res, certificates);
  } catch (error) {
    next(error);
  }
};

/**
 * Get certificate by ID
 * GET /api/certificate/:id
 */
export const getCertificateByIdController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const certificateId = Number(req.params.id);
    if (Number.isNaN(certificateId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid certificate ID',
        code: 'BAD_REQUEST',
      });
    }

    const certificate = await getCertificateById(certificateId, userId);
    sendSuccess(res, certificate);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all certificate requests (admin)
 * GET /api/admin/certificates
 */
export const getAllCertificatesController: RequestHandler = async (req, res, next) => {
  try {
    const certificates = await getAllCertificates();
    sendSuccess(res, certificates);
  } catch (error) {
    next(error);
  }
};

/**
 * Update certificate status (admin)
 * PATCH /api/certificate/:id/status
 */
export const updateCertificateStatusController: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.auth?.sub;
    if (!adminId) {
      throw new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const certificateId = Number(req.params.id);
    if (Number.isNaN(certificateId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid certificate ID',
        code: 'BAD_REQUEST',
      });
    }

    const input = updateCertificateStatusSchema.parse(req.body);
    const result = await updateCertificateStatus(certificateId, input, adminId);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get certificate status history
 * GET /api/certificate/:id/history
 */
export const getCertificateHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const certificateId = Number(req.params.id);
    if (Number.isNaN(certificateId)) {
      throw new AppError({
        statusCode: 400,
        message: 'Invalid certificate ID',
        code: 'BAD_REQUEST',
      });
    }

    const history = await getCertificateHistory(certificateId);
    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
};

