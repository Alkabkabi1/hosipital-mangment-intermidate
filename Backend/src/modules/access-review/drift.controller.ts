import type { RequestHandler } from 'express';
import { getDriftReport } from './drift.service';

export const getDriftReportController: RequestHandler = async (_req, res, next) => {
  try {
    const report = await getDriftReport({});
    res.json(report);
  } catch (err) {
    next(err);
  }
};

