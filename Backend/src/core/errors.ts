export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  // Additional error codes for unified request system
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_REQUEST_ID'
  | 'INVALID_ONBOARDING_ID'
  | 'INVALID_CLEARANCE_ID'
  | 'INVALID_PARAMETERS'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'REJECTION_REASON_REQUIRED'
  | 'MISSING_PARAMETERS'
  | 'ONBOARDING_NOT_FOUND'
  | 'CLEARANCE_NOT_FOUND'
  | 'ONBOARDING_CREATION_FAILED'
  | 'ONBOARDING_RETRIEVAL_FAILED'
  | 'ONBOARDING_ADMIN_RETRIEVAL_FAILED'
  | 'ONBOARDING_UPDATE_FAILED'
  | 'CLEARANCE_CREATION_FAILED'
  | 'CLEARANCE_RETRIEVAL_FAILED'
  | 'CLEARANCE_UPDATE_FAILED'
  | 'CLEARANCE_ADMIN_RETRIEVAL_FAILED'
  | 'HOUSING_ALLOWANCE_NOT_FOUND'
  | 'MATERNITY_LEAVE_NOT_FOUND'
  | 'MIGRATION_FAILED'
  | 'REQUEST_CREATION_FAILED'
  | 'REQUEST_RETRIEVAL_FAILED'
  | 'REQUEST_UPDATE_FAILED'
  | 'REQUEST_NOT_FOUND'
  | 'UNSUPPORTED_REQUEST_TYPE';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(options: { message: string; statusCode?: number; code?: ErrorCode; isOperational?: boolean; details?: any }) {
    super(options.message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_SERVER_ERROR';
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export const createHttpError = (statusCode: number, message: string, code?: ErrorCode) =>
  new AppError({ statusCode, message, code });
