import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';

export const ReportController = {
  async getSchoolSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const summary = await ReportService.getSchoolSummary(date);
      res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  },

  async getGradeBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const breakdown = await ReportService.getGradeBreakdown(date);
      res.status(200).json({ data: breakdown });
    } catch (err) {
      next(err);
    }
  },
};
