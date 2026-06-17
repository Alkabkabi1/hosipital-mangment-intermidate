import { Router } from 'express';
import { requireRoles } from '../../core/middleware/requireRoles';
import { getDriftReportController } from './drift.controller';

export const driftRouter = Router();

driftRouter.get('/drift', requireRoles(['ADMIN']), getDriftReportController);

export default driftRouter;

