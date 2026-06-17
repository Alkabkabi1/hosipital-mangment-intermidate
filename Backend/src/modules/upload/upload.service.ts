import fs from 'node:fs';
import path from 'node:path';

import type { Express } from 'express';

import { env } from '../../config';
import { AppError } from '../../core/errors';

export type UploadCategory = 'profile' | 'documents' | 'clearance' | 'delegation' | 'onboarding' | 'temp';

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const allowedMimeTypes = env.UPLOAD_ALLOWED_TYPES
  ? env.UPLOAD_ALLOWED_TYPES.split(',').map((value) => value.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_TYPES;

const uploadsRoot = env.UPLOAD_STORAGE_PATH
  ? path.resolve(env.UPLOAD_STORAGE_PATH)
  : path.resolve(process.cwd(), 'uploads');

export interface StoredFileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  category: UploadCategory;
  storedAt: string;
}

export function ensureUploadDirectory(category: UploadCategory): string {
  const dir = path.join(uploadsRoot, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function resolveUploadCategory(type?: string | null): UploadCategory {
  if (!type) {
    return 'documents';
  }
  const normalized = type.trim().toLowerCase();
  switch (normalized) {
    case 'profile':
    case 'profile-picture':
    case 'profile_pictures':
      return 'profile';
    case 'delegation':
    case 'delegations':
      return 'delegation';
    case 'clearance':
    case 'clearances':
      return 'clearance';
    case 'onboarding':
    case 'onboardings':
      return 'onboarding';
    case 'temp':
    case 'temporary':
      return 'temp';
    default:
      return 'documents';
  }
}

export function validateMimeType(mimetype: string): void {
  if (!allowedMimeTypes.includes(mimetype)) {
    throw new AppError({ statusCode: 415, message: 'Unsupported file type', code: 'BAD_REQUEST' });
  }
}

export function buildStoredFileInfo(file: Express.Multer.File, category: UploadCategory): StoredFileInfo {
  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    category,
    storedAt: new Date().toISOString(),
  };
}

export async function getStoredFileInfo(filename: string, category: UploadCategory): Promise<StoredFileInfo> {
  const safeName = path.basename(filename);
  const directory = ensureUploadDirectory(category);
  const filePath = path.join(directory, safeName);

  try {
    const stats = await fs.promises.stat(filePath);
    return {
      filename: safeName,
      originalName: safeName,
      size: stats.size,
      mimetype: 'application/octet-stream',
      category,
      storedAt: stats.ctime.toISOString(),
    };
  } catch (error) {
    throw new AppError({ statusCode: 404, message: 'File not found', code: 'NOT_FOUND' });
  }
}

export async function deleteStoredFile(filename: string, category: UploadCategory): Promise<void> {
  const safeName = path.basename(filename);
  const directory = ensureUploadDirectory(category);
  const filePath = path.join(directory, safeName);

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new AppError({ statusCode: 404, message: 'File not found', code: 'NOT_FOUND' });
    }
    throw error;
  }
}

export function getUploadsRoot(): string {
  return uploadsRoot;
}

export function getAllowedMimeTypes(): string[] {
  return allowedMimeTypes.slice();
}
