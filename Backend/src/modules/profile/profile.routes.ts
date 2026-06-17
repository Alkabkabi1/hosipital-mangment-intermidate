import { Router } from 'express';

import {
  changePasswordController,
  getProfileController,
  updateProfileController,
} from './profile.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { parseOptionalFormData } from '../../core/middleware/parseFormData';

export const profileRouter = Router();

profileRouter.use(authenticate);
profileRouter.get('/me', getProfileController);
profileRouter.put('/me', parseOptionalFormData, updateProfileController);
profileRouter.post('/change-password', changePasswordController);
