import type { RequestHandler } from 'express';

import { verifyToken, type JwtPayload } from '../../shared/utils/tokens';
import { AppError } from '../errors';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: JwtPayload;
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  // Public endpoints: bypass auth
  const p = req.path || '';
  const publicPaths = new Set<string>([
    '/health', '/ready',
    '/api/health', '/api/ready',
    '/api/openapi.json',
    '/api/csp/report',
    '/metrics',
  ]);
  if (publicPaths.has(p)) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' }));
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    req.auth = payload;
    return next();
  } catch {
    return next(new AppError({ statusCode: 401, message: 'Invalid token', code: 'UNAUTHORIZED' }));
  }
};
