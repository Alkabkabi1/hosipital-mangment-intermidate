import helmet from 'helmet';
import type { Express } from 'express';
import { env, isDevelopment } from '../config/env';

export function securityHeaders() {
  // DEV_EASY: disable Helmet/CSP entirely to avoid local blocks
  if (env.DEV_EASY) {
    const extra = (_req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'no-referrer');
      next();
    };
    return [extra];
  }
  const connectSrc = ["'self'", ...env.ALLOWED_ORIGINS_LIST.filter(Boolean)];
  if (isDevelopment) {
    // common local dev hosts
    connectSrc.push('http://localhost:3037', 'http://127.0.0.1:3037');
  }

  const csp: Parameters<typeof helmet.contentSecurityPolicy>[0] = {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      // allow inline styles and Google Fonts CSS
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      // allow fonts from Google Fonts CDN
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // API calls to self (additional hosts can be appended from env list)
      connectSrc,
      // data: images (favicons, inline svgs, etc.)
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  };

  const helmetMw = helmet({
    contentSecurityPolicy: csp,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Additional simple headers (helmet covers most)
  const extra = (req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Report-Only CSP for telemetry: mirror allowed sources and report to /api/csp/report
    const reportOnly = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "report-uri /api/csp/report"
    ].join('; ');
    res.setHeader('Content-Security-Policy-Report-Only', reportOnly);
    next();
  };

  return [helmetMw, extra];
}
