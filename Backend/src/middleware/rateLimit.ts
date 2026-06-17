import type { RequestHandler } from 'express';

type RateEntry = { count: number; resetAt: number };
const buckets = new Map<string, RateEntry>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: any) => string;
}

export function rateLimit(opts: RateLimitOptions): RequestHandler {
  const windowMs = opts.windowMs;
  const max = opts.max;
  const keyGen = opts.keyGenerator || ((req) => (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown').toString());

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGen(req);
    const entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS' });
    }
    entry.count += 1;
    next();
  };
}

