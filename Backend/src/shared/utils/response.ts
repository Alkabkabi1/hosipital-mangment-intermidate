import type { Response } from 'express';

type StatusCode = number;

export function sendSuccess<T>(
  res: Response,
  data: T,
  status: StatusCode = 200,
  extras?: Record<string, unknown>
): void {
  res.status(status).json({ success: true, data, ...(extras ?? {}) });
}
