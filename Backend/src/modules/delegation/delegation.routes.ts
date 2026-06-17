import { Router } from 'express';

import {
  addDelegationSignatureController,
  adminDelegationMiddleware,
  adminListDelegationsController,
  adminListPendingDelegationsController,
  createDelegationController,
  delegationMiddleware,
  getDelegationController,
  listMyDelegationsController,
  updateDelegationStatusController,
} from './delegation.controller';

export const delegationRouter = Router();

delegationRouter.use(delegationMiddleware);
delegationRouter.post('/', createDelegationController);
delegationRouter.get('/', listMyDelegationsController);
delegationRouter.get('/mine', listMyDelegationsController);
delegationRouter.get('/admin/list', adminDelegationMiddleware, adminListDelegationsController);
delegationRouter.get('/admin/all', adminDelegationMiddleware, adminListDelegationsController);
delegationRouter.get('/admin/pending', adminDelegationMiddleware, adminListPendingDelegationsController);
delegationRouter.patch('/:id/status', adminDelegationMiddleware, updateDelegationStatusController);
delegationRouter.post('/:id/signatures', addDelegationSignatureController);
delegationRouter.get('/:id', getDelegationController);
