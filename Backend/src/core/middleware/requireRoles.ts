import type { RequestHandler } from 'express';

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';

interface RoleAssignment {
  role: string;
}

async function fetchUserRoles(userId: number): Promise<string[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT r.role_name AS role
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE`,
      [userId]
    );
    return (rows as RoleAssignment[]).map((row) => row.role);
  });
}

export const requireRoles = (roles: string[]): RequestHandler => {
  return async (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' }));
    }

    try {
      // Get user roles from token or database
      let userRoles: string[] = [];
      
      if (req.auth.roles && req.auth.roles.length > 0) {
        userRoles = req.auth.roles;
      } else {
        // Fallback to database lookup
        userRoles = await fetchUserRoles(req.auth.sub);
      }

      // Also check for admin user by email (fallback for legacy admin accounts)
      const adminEmails = ['admin@hospital.sa', 'admin@dev.local', 'sadmin'];
      const isAdminByEmail = req.auth.email && adminEmails.includes(req.auth.email.toLowerCase());
      
      if (isAdminByEmail && roles.includes('ADMIN')) {
        userRoles = [...userRoles, 'ADMIN'];
      }

      // Flexible role matching (case-insensitive)
      const hasRole = roles.some((requiredRole) => 
        userRoles.some(userRole => 
          userRole.toLowerCase() === requiredRole.toLowerCase() ||
          (requiredRole.toLowerCase() === 'admin' && userRole.toLowerCase() === 'administrator') ||
          (requiredRole.toLowerCase() === 'administrator' && userRole.toLowerCase() === 'admin')
        )
      );

      if (!hasRole) {
        console.log(`Access denied for user ${req.auth.sub} (${req.auth.email}). Required roles: ${roles}, User roles: ${userRoles}`);
        return next(new AppError({ statusCode: 403, message: 'Insufficient privileges - غير مصرح', code: 'FORBIDDEN' }));
      }

      // Update auth with fetched roles
      req.auth.roles = userRoles;

      next();
    } catch (error) {
      console.error('Role checking error:', error);
      return next(new AppError({ statusCode: 500, message: 'Authentication error', code: 'INTERNAL_ERROR' as any }));
    }
  };
};
