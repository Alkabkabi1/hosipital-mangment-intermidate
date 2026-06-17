import { Router } from 'express';
import { requireRoles } from '../../core/middleware/requireRoles';
import { postRemediateRolesController } from './remediate.controller';

export const remediateRouter = Router();

remediateRouter.post('/remediate', requireRoles(['ADMIN']), postRemediateRolesController);

export default remediateRouter;

