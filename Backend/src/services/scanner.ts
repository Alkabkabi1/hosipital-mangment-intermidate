import type { Express } from 'express';
import { env } from '../config';

function flagEnabled(name: string, def = false): boolean {
  const v = process.env[name];
  if (!v) return def;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export interface ScanResult {
  clean: boolean;
  reason?: string;
}

export async function scanFile(file: Express.Multer.File): Promise<ScanResult> {
  if (env.DEV_EASY) return { clean: true };
  const enabled = flagEnabled('UPLOAD_SCAN_ENABLED', false);
  if (!enabled) return { clean: true };

  // Mock scanner logic; integrate ClamAV or a service here if available
  // EICAR string detection (simple heuristic)
  const name = (file.originalname || '').toLowerCase();
  if (name.includes('eicar')) {
    return { clean: false, reason: 'EICAR_TEST' };
  }
  return { clean: true };
}

export async function scanFiles(files: Express.Multer.File[]): Promise<ScanResult> {
  for (const f of files) {
    const r = await scanFile(f);
    if (!r.clean) return r;
  }
  return { clean: true };
}
