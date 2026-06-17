import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { uploadGuard } from '../../middleware/uploadGuard';
import { scanFile, scanFiles } from '../../services/scanner';

import {
  deleteUploadController,
  uploadDocumentsController,
  uploadInfoController,
  uploadProfilePictureController,
} from './upload.controller';
import {
  ensureUploadDirectory,
  getAllowedMimeTypes,
  resolveUploadCategory,
  validateMimeType,
  type UploadCategory,
} from './upload.service';
import { env } from '../../config';
import { authenticate } from '../../core/middleware/authenticate';

const uploadRouter = Router();

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const category = req.uploadCategory ?? 'documents';
    try {
      const destination = ensureUploadDirectory(category);
      cb(null, destination);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${randomUUID()}${extension.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    try {
      validateMimeType(file.mimetype);
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
});

const setUploadCategory = (category: UploadCategory): RequestHandler => (req, _res, next) => {
  req.uploadCategory = category;
  next();
};

const setCategoryFromParam: RequestHandler = (req, _res, next) => {
  const typeParam = req.params.type as string | undefined;
  req.uploadCategory = resolveUploadCategory(typeParam);
  next();
};

uploadRouter.use(authenticate);

uploadRouter.post(
  '/profile-picture',
  setUploadCategory('profile'),
  uploadGuard,
  upload.single('profilePicture'),
  async (req, res, next) => {
    try {
      if (process.env.UPLOAD_SCAN_ENABLED && (req as any).file) {
        const r = await scanFile((req as any).file);
        if (!r.clean) return res.status(400).json({ error: 'UPLOAD_SCANNED_UNSAFE', reason: r.reason });
      }
      next();
    } catch (err) { next(err); }
  },
  uploadProfilePictureController
);

uploadRouter.post(
  '/documents',
  setUploadCategory('documents'),
  uploadGuard,
  upload.array('documents', 10),
  async (req, res, next) => {
    try {
      if (process.env.UPLOAD_SCAN_ENABLED && Array.isArray((req as any).files)) {
        const r = await scanFiles((req as any).files as any);
        if (!r.clean) return res.status(400).json({ error: 'UPLOAD_SCANNED_UNSAFE', reason: r.reason });
      }
      next();
    } catch (err) { next(err); }
  },
  uploadDocumentsController
);

uploadRouter.post(
  '/:type-documents',
  setCategoryFromParam,
  uploadGuard,
  upload.array('documents', 10),
  async (req, res, next) => {
    try {
      if (process.env.UPLOAD_SCAN_ENABLED && Array.isArray((req as any).files)) {
        const r = await scanFiles((req as any).files as any);
        if (!r.clean) return res.status(400).json({ error: 'UPLOAD_SCANNED_UNSAFE', reason: r.reason });
      }
      next();
    } catch (err) { next(err); }
  },
  uploadDocumentsController
);

uploadRouter.get('/info/:filename', uploadInfoController);

uploadRouter.delete('/:filename', deleteUploadController);

uploadRouter.get('/allowed-types', (_req, res) => {
  const types = getAllowedMimeTypes();
  res.json({ success: true, data: { mimetypes: types } });
});

export { uploadRouter };
