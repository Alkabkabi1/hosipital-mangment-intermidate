import type { RequestHandler } from 'express';
import path from 'node:path';
import { env } from '../config';
import { validateMimeType } from '../modules/upload/upload.service';

const DEFAULT_MAX = env.UPLOAD_MAX_SIZE || 10 * 1024 * 1024;
const DEFAULT_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']);

function isAllowedExt(filename: string): boolean {
  const ext = path.extname(filename || '').toLowerCase();
  return DEFAULT_EXTS.has(ext);
}

export const uploadGuard: RequestHandler = (req, res, next) => {
  if (env.DEV_EASY) return next();
  const files: any[] = [];
  if ((req as any).file) files.push((req as any).file);
  const many = (req as any).files;
  if (Array.isArray(many)) files.push(...many);
  else if (many && typeof many === 'object') {
    for (const key of Object.keys(many)) {
      const v = (many as any)[key];
      if (Array.isArray(v)) files.push(...v);
      else if (v) files.push(v);
    }
  }

  for (const f of files) {
    if (f.size > DEFAULT_MAX) {
      return res.status(413).json({ error: 'FILE_TOO_LARGE' });
    }
    try {
      validateMimeType(f.mimetype);
    } catch {
      return res.status(415).json({ error: 'UNSUPPORTED_MEDIA_TYPE' });
    }
    if (!isAllowedExt(f.originalname || f.filename)) {
      return res.status(415).json({ error: 'UNSUPPORTED_EXTENSION' });
    }
  }

  return next();
};
