import type { RequestHandler } from 'express';

import {
  buildStoredFileInfo,
  deleteStoredFile,
  getStoredFileInfo,
  resolveUploadCategory,
  type UploadCategory,
} from './upload.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

declare module 'express-serve-static-core' {
  interface Request {
    uploadCategory?: UploadCategory;
  }
}

export const uploadProfilePictureController: RequestHandler = (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError({ statusCode: 400, message: 'No file uploaded', code: 'BAD_REQUEST' });
    }
    const category = req.uploadCategory ?? 'profile';
    const payload = buildStoredFileInfo(req.file, category);
    sendSuccess(res, payload, 201);
  } catch (error) {
    next(error);
  }
};

export const uploadDocumentsController: RequestHandler = (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      throw new AppError({ statusCode: 400, message: 'No files uploaded', code: 'BAD_REQUEST' });
    }
    const category = req.uploadCategory ?? 'documents';
    const payload = files.map((file) => buildStoredFileInfo(file, category));
    sendSuccess(res, payload, 201);
  } catch (error) {
    next(error);
  }
};

export const uploadInfoController: RequestHandler = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      throw new AppError({ statusCode: 400, message: 'Filename is required', code: 'BAD_REQUEST' });
    }
    const category = resolveUploadCategory(req.query.type as string | undefined);
    const info = await getStoredFileInfo(filename, category);
    sendSuccess(res, info);
  } catch (error) {
    next(error);
  }
};

export const deleteUploadController: RequestHandler = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      throw new AppError({ statusCode: 400, message: 'Filename is required', code: 'BAD_REQUEST' });
    }
    const category = resolveUploadCategory(req.query.type as string | undefined);
    await deleteStoredFile(filename, category);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
