import cors, { type CorsOptions } from 'cors';
import { env, isDevelopment } from '../config/env';

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, '').toLowerCase();
}

export function createCorsMiddleware() {
  if (env.DEV_EASY) {
    // Allow all origins in DEV_EASY (local-only convenience)
    return cors({ origin: true, credentials: false });
  }
  const allowed = env.ALLOWED_ORIGINS_LIST || [];
  const allowAll = allowed.includes('*') && isDevelopment;

  const options: CorsOptions = {
    origin: (origin, callback) => {
      if (allowAll || !origin) {
        callback(null, true);
        return;
      }
      const normalized = normalizeOrigin(origin);
      if (allowed.map(normalizeOrigin).includes(normalized)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
  };

  return cors(options);
}
