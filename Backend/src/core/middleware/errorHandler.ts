import type { NextFunction, Request, Response } from 'express';

import { isAppError } from '../errors';
import { logger } from '../logger';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(error)) {
    logger.error({ err: error }, 'Operational error encountered');
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
    return;
  }

  const fallbackMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  logger.error({ err: error }, 'Unexpected error encountered');
  res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: fallbackMessage,
  });
}
