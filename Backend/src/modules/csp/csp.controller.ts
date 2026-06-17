import type { Request, Response } from 'express';
import { logger } from '../../core/logger';

export function postCspReport(req: Request, res: Response) {
  try {
    const body = req.body || {};
    // Standard browsers send {"csp-report":{...}} or {"csp_report":{...}}
    const cspReport = body['csp-report'] || body['csp_report'] || body;
    logger.info({ cspReport }, 'CSP report received');
  } catch (err) {
    logger.warn({ err }, 'Failed to process CSP report');
  }
  res.status(204).end();
}

