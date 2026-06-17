import { Router } from 'express';
import { postCspReport } from './csp.controller';

export const cspRouter = Router();

// Accept CSP violation reports
cspRouter.post('/csp/report', postCspReport);

export default cspRouter;

