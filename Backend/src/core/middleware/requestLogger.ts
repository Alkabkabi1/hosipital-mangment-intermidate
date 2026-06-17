import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config';
import { logger } from '../logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!env.ENABLE_REQUEST_LOGGING) {
    next();
    return;
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
    }, 'HTTP request completed');
  });

  next();
}
