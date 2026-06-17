import { Router } from 'express';

import {
  assignRoleController,
  getUserRolesController,
  listRolesController,
  listUsersWithRolesController,
  refreshTokenAfterRoleChangeController,
  removeRoleController,
} from './role.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';

export const roleRouter = Router();

// Public authenticated routes (no role requirement)
roleRouter.post('/refresh-token', authenticate, rateLimit({ windowMs: 60_000, max: 60 }), refreshTokenAfterRoleChangeController);

// Admin-only routes
roleRouter.use(authenticate, requireRoles(['ADMIN']));
roleRouter.get('/', listRolesController);
roleRouter.get('/users', listUsersWithRolesController);
roleRouter.get('/user/:id', getUserRolesController);
roleRouter.post('/assign', rateLimit({ windowMs: 60_000, max: 120 }), assignRoleController);
roleRouter.post('/remove', rateLimit({ windowMs: 60_000, max: 120 }), removeRoleController);
