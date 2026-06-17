import { config as _dotenv } from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load only the repo-root .env regardless of the current working directory.
// __dirname at runtime is Backend/dist/config, so ../../.. goes to the repo root.
const ROOT_ENV = path.resolve(__dirname, '../../..', '.env');
_dotenv({ path: ROOT_ENV, override: false });

// Helpers
const boolish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : ['true', '1', 'yes', 'y', 'on'].includes(v.toLowerCase())));

const ttl = z
  .string()
  .regex(/^\d+[smhd]$/i, 'TTL must include unit: s|m|h|d (e.g., 15m, 1h)')
  .default('15m');

// Build schema (covers Stage-F requirements + existing fields for compatibility)
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3037),
    HOST: z.string().min(1).optional(),
    // DEV-EASY mode (relaxed CORS/CSP/HTTPS/rate-limit/uploads for local only)
    DEV_EASY: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((v) => (v == null ? false : typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on', 'y'].includes(v.toLowerCase()))),

    // Database
    DB_HOST: z.string().min(1, 'DB_HOST is required'),
    DB_PORT: z.coerce.number().default(3306),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().optional().default(''),
    DB_CONNECTION_LIMIT: z.coerce.number().default(10),

    // Auth & tokens
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    ACCESS_TTL: ttl.default('15m').optional(),
    REFRESH_TTL: ttl.default('7d').optional(),

    // CORS
    CORS_ALLOWED_ORIGINS: z.string().optional(),
    CORS_ORIGINS: z.string().optional(), // legacy name; will be merged into CORS_ALLOWED_ORIGINS

    // Flags
    COMMISSIONER_SERVER_ENABLED: boolish.optional(),
    UPLOAD_SCAN_ENABLED: boolish.optional(),
    TRUST_PROXY: boolish.optional(),

    // Logging & rate limiting
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    ENABLE_REQUEST_LOGGING: boolish.default(false),

    // Defaults for bootstrap
    DEFAULT_ADMIN_EMAIL: z.string().email().optional(),
    DEFAULT_ADMIN_PASSWORD: z.string().min(8).optional(),
    DEFAULT_ADMIN_NAME: z.string().optional(),
    DEFAULT_ADMIN_EMPLOYEE_NUMBER: z.string().optional(),
    DEFAULT_ADMIN_DEPARTMENT_CODE: z.string().optional(),
    DEFAULT_ADMIN_PHONE: z.string().optional(),
    DEFAULT_ADMIN_FULL_NAME_AR: z.string().optional(),
    DEFAULT_ADMIN_POSITION: z.string().optional(),

    // Uploads
    UPLOAD_MAX_SIZE: z.coerce.number().default(10 * 1024 * 1024),
    UPLOAD_ALLOWED_TYPES: z.string().optional(),
    UPLOAD_STORAGE_PATH: z.string().optional(),
  })
  .transform((raw) => {
    // Merge legacy CORS_ORIGINS into CORS_ALLOWED_ORIGINS if not set
    const cors = raw.CORS_ALLOWED_ORIGINS && raw.CORS_ALLOWED_ORIGINS.trim().length > 0
      ? raw.CORS_ALLOWED_ORIGINS
      : (raw.CORS_ORIGINS || '');
    return { ...raw, CORS_ALLOWED_ORIGINS: cors };
  });

export type AppEnv = z.infer<typeof envSchema> & {
  ALLOWED_ORIGINS_LIST: string[];
};

export function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  const data = parsed.data;
  const list = (data.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Fail-fast: disallow '*' outside development
  if (list.includes('*') && !['development', 'test'].includes(data.NODE_ENV)) {
    throw new Error("CORS_ALLOWED_ORIGINS cannot include '*' outside development/test");
  }

  return Object.assign(data, { ALLOWED_ORIGINS_LIST: list });
}

// Backwards-compatible export used across the codebase
export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
