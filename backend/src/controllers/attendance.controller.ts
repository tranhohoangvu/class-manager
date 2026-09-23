import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import { getParam } from '../utils/params.js';

export const AttendanceController = {
  async getDaily(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const subjectId = req.query.subject_id as string | undefined;

      const records = await AttendanceService.getDaily(classId, date, subjectId, req.user!);
      res.status(200).json({ data: records });
    } catch (err) {
      next(err);
    }
  },

  async saveBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const { date, subject_id, entries } = req.body;

      await AttendanceService.saveBatch(classId, date, subject_id, entries, req.user!);
      res.status(200).json({ data: { message: 'Đã lưu điểm danh thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const startDate = req.query.start_date as string | undefined;
      const endDate = req.query.end_date as string | undefined;

      const records = await AttendanceService.getHistory(classId, startDate, endDate);
      res.status(200).json({ data: records });
    } catch (err) {
      next(err);
    }
  },

  async getAllRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const records = await AttendanceService.getAttendanceRecords(classId);
      res.status(200).json({ data: records });
    } catch (err) {
      next(err);
    }
  },
};
