import { Router } from 'express';

import { getProfileController, getCurrentUserPermissionsController, listUsersController, getUserByEmailController, getDepartmentsController, getJobTitlesController } from './users.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, getProfileController);
usersRouter.get('/me/permissions', authenticate, rateLimit({ windowMs: 60_000, max: 100 }), getCurrentUserPermissionsController);
usersRouter.get('/', authenticate, requireRoles(['ADMIN']), listUsersController);
usersRouter.get('/by-email/:email', authenticate, requireRoles(['ADMIN', 'MANAGER', 'HR']), getUserByEmailController);

// Public endpoints for employees - get departments and job titles from App_Users table
usersRouter.get('/departments', authenticate, rateLimit({ windowMs: 60_000, max: 100 }), getDepartmentsController);
usersRouter.get('/job-titles', authenticate, rateLimit({ windowMs: 60_000, max: 100 }), getJobTitlesController);
