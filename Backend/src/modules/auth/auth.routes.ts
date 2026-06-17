import { Router } from 'express';

import { loginController, meController, refreshController, registerController, revokeController } from './auth.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/signup', registerController);
authRouter.post('/login',  rateLimit({ windowMs: 60_000, max: 60 }), loginController);
authRouter.post('/refresh', rateLimit({ windowMs: 60_000, max: 60 }), refreshController);
authRouter.post('/revoke', rateLimit({ windowMs: 60_000, max: 60 }), revokeController);
authRouter.get('/me', authenticate, meController);
