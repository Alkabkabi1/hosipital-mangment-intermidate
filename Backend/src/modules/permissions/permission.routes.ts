import { Router } from 'express';

import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';
import {
  listPermissionsController,
  listPermissionsByResourceController,
  getCurrentUserPermissionsController,
  getUserPermissionsController,
  getRolePermissionsController,
  checkUserPermissionController,
  assignPermissionController,
  removePermissionController,
  createPermissionController,
  updatePermissionController,
  deletePermissionController,
} from './permission.controller';

const permissionRouter = Router();

// Admin-only routes
permissionRouter.get(
  '/',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  listPermissionsController
);

permissionRouter.get(
  '/by-resource',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  listPermissionsByResourceController
);

permissionRouter.get(
  '/users/:userId',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  getUserPermissionsController
);

permissionRouter.get(
  '/roles/:roleId',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  getRolePermissionsController
);

permissionRouter.post(
  '/users/:userId/check',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  checkUserPermissionController
);

permissionRouter.post(
  '/roles/:roleId',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  assignPermissionController
);

permissionRouter.delete(
  '/roles/:roleId/:permissionId',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  removePermissionController
);

// Permission CRUD routes
permissionRouter.post(
  '/',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 30 }),
  createPermissionController
);

permissionRouter.patch(
  '/:id',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 30 }),
  updatePermissionController
);

permissionRouter.delete(
  '/:id',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 30 }),
  deletePermissionController
);

export { permissionRouter };

