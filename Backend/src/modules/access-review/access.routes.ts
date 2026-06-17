import { Router } from 'express';
import { requireRoles } from '../../core/middleware/requireRoles';
import { exportUsersRolesCsvController, exportUsersRolesJsonController } from './access.controller';

export const accessReviewRouter = Router();

accessReviewRouter.get('/users.csv', requireRoles(['ADMIN']), exportUsersRolesCsvController);
accessReviewRouter.get('/users.json', requireRoles(['ADMIN']), exportUsersRolesJsonController);

export default accessReviewRouter;

