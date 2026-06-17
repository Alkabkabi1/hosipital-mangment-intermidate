import { Router } from 'express';

import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';
import {
  listRoleTemplatesController,
  getRoleTemplateController,
  applyTemplateController,
  createRoleTemplateController,
  updateRoleTemplateController,
  deleteRoleTemplateController,
} from './role-template.controller';

const roleTemplateRouter = Router();

// List templates (accessible to admins and managers)
roleTemplateRouter.get(
  '/',
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  listRoleTemplatesController
);

// Get specific template
roleTemplateRouter.get(
  '/:id',
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  rateLimit({ windowMs: 60_000, max: 100 }),
  getRoleTemplateController
);

// Apply template to user (admin only)
roleTemplateRouter.post(
  '/:id/apply',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  applyTemplateController
);

// Create template (admin only)
roleTemplateRouter.post(
  '/',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 30 }),
  createRoleTemplateController
);

// Update template (admin only)
roleTemplateRouter.put(
  '/:id',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 30 }),
  updateRoleTemplateController
);

// Delete template (admin only)
roleTemplateRouter.delete(
  '/:id',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 30 }),
  deleteRoleTemplateController
);

export { roleTemplateRouter };

