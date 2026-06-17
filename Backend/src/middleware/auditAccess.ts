import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';

import { logAccessAttempt } from '../modules/audit/access-audit.service';

/**
 * Middleware to audit all role-based access control checks
 * Logs both granted and denied access attempts for security monitoring
 * 
 * This middleware should be placed AFTER requireRoles middleware
 * It reads the result from req.accessGranted which is set by requireRoles
 */
export const auditAccessMiddleware: RequestHandler = async (req, _res, next) => {
  // Only log if user is authenticated
  if (!req.auth?.sub) {
    return next();
  }

  // Get access information from request (set by requireRoles middleware)
  const accessGranted = (req as any).accessGranted !== false; // Default to true if not set
  const requiredRoles = (req as any).requiredRoles as string[] | undefined;
  const userRoles = req.auth.roles || [];

  // Generate request ID if not present
  const requestId = (req as any).requestId || randomUUID();
  (req as any).requestId = requestId;

  // Get client information
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                     req.socket.remoteAddress || 
                     'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Log the access attempt (non-blocking)
  logAccessAttempt({
    user_id: req.auth.sub,
    endpoint: req.path,
    http_method: req.method,
    required_roles: requiredRoles,
    user_roles: userRoles,
    access_granted: accessGranted,
    ip_address: ipAddress,
    user_agent: userAgent,
    request_id: requestId,
  }).catch((error) => {
    // Log error but don't fail the request
    console.error('Audit logging failed:', error);
  });

  next();
};

/**
 * Enhanced requireRoles that sets audit flags
 * Wraps the original requireRoles to add audit metadata
 */
export function auditableRequireRoles(roles: string[]): RequestHandler {
  return async (req, res, next) => {
    // Import requireRoles dynamically to avoid circular dependencies
    const { requireRoles } = await import('../core/middleware/requireRoles');
    
    // Store required roles for audit
    (req as any).requiredRoles = roles;
    
    // Call original requireRoles
    const roleMiddleware = requireRoles(roles);
    roleMiddleware(req, res, (error?: any) => {
      if (error) {
        // Access was denied
        (req as any).accessGranted = false;
      } else {
        // Access was granted
        (req as any).accessGranted = true;
      }
      
      // Continue with audit middleware
      auditAccessMiddleware(req, res, () => {
        // Then pass any error to the next error handler
        if (error) {
          next(error);
        } else {
          next();
        }
      });
    });
  };
}

