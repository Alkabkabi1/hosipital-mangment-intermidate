import type { Express, Request, Response, NextFunction } from 'express';
import { env, isProduction } from '../config/env';

export function applyHttpsEnforcement(app: Express) {
  if (env.DEV_EASY) return; // no redirects in local easy mode
  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }
  if (!isProduction || !env.TRUST_PROXY) return;

  const skip = new Set(['/health', '/ready', '/api/health', '/api/ready']);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (skip.has(req.path)) return next();
    const proto = (req.headers['x-forwarded-proto'] as string) || (req as any).protocol;
    if ((req as any).secure || (proto && proto.toLowerCase() === 'https')) return next();
    const host = req.headers['host'];
    const url = `https://${host}${req.originalUrl}`;
    return res.redirect(301, url);
  });
}
