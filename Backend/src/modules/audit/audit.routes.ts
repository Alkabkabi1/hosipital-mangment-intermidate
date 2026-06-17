import { Router } from 'express';
import { listAuditEventsController } from './audit.controller';
import { getAuditRequestsController } from './audit-requests.controller';
import { requireRoles } from '../../core/middleware/requireRoles';

export const auditAdminRouter = Router();

auditAdminRouter.get('/events', requireRoles(['ADMIN']), listAuditEventsController);
auditAdminRouter.get('/requests', requireRoles(['ADMIN']), getAuditRequestsController);

export default auditAdminRouter;

