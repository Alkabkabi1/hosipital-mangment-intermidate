import { Router } from 'express';

import {
  addOnboardingSignatureController,
  adminListOnboardingsController,
  adminListPendingOnboardingsController,
  adminOnboardingMiddleware,
  createOnboardingController,
  getOnboardingController,
  listMyOnboardingsController,
  onboardingMiddleware,
  updateOnboardingStatusController,
} from './onboarding.controller';

export const onboardingRouter = Router();

onboardingRouter.use(onboardingMiddleware);
onboardingRouter.post('/', createOnboardingController);
onboardingRouter.get('/', listMyOnboardingsController);
onboardingRouter.get('/mine', listMyOnboardingsController);
onboardingRouter.get('/admin/list', adminOnboardingMiddleware, adminListOnboardingsController);
onboardingRouter.get('/admin/all', adminOnboardingMiddleware, adminListOnboardingsController);
onboardingRouter.get('/admin/pending', adminOnboardingMiddleware, adminListPendingOnboardingsController);
onboardingRouter.patch('/:id/status', adminOnboardingMiddleware, updateOnboardingStatusController);
onboardingRouter.post('/:id/signatures', addOnboardingSignatureController);
onboardingRouter.get('/:id', getOnboardingController);
