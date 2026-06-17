import { Router } from 'express';

import {
  addClearanceSignatureController,
  adminClearanceMiddleware,
  adminListClearancesController,
  adminListPendingClearancesController,
  clearanceMiddleware,
  createClearanceController,
  getClearanceController,
  listMyClearancesController,
  updateClearanceStatusController,
} from './clearance.controller';

export const clearanceRouter = Router();

clearanceRouter.use(clearanceMiddleware);
clearanceRouter.post('/', createClearanceController);
clearanceRouter.get('/', listMyClearancesController);
clearanceRouter.get('/mine', listMyClearancesController);
clearanceRouter.get('/admin', adminClearanceMiddleware, adminListClearancesController);
clearanceRouter.get('/admin/list', adminClearanceMiddleware, adminListClearancesController);
clearanceRouter.get('/admin/all', adminClearanceMiddleware, adminListClearancesController);
clearanceRouter.get('/admin/pending', adminClearanceMiddleware, adminListPendingClearancesController);
clearanceRouter.patch('/:id/status', adminClearanceMiddleware, updateClearanceStatusController);
clearanceRouter.post('/:id/signatures', addClearanceSignatureController);
clearanceRouter.get('/:id', getClearanceController);
