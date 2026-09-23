import { Request, Response, NextFunction } from 'express';
import { TimetableService } from '../services/timetable.service.js';
import { getParam } from '../utils/params.js';

export const TimetableController = {
  async getTimetableByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const entries = await TimetableService.getTimetableForClass(classId, req.user!);
      res.status(200).json({ data: entries });
    } catch (err) {
      next(err);
    }
  },

  async saveEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const { day_of_week, period, subject_id, teacher_id } = req.body;
      const entry = await TimetableService.saveEntry(
        classId,
        day_of_week,
        period,
        subject_id,
        teacher_id,
        req.user!
      );
      res.status(200).json({ data: entry });
    } catch (err) {
      next(err);
    }
  },

  async deleteEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      await TimetableService.deleteEntry(id, req.user!);
      res.status(200).json({ data: { message: 'Đã xóa tiết học thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async copyFromClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const { source_class_id } = req.body;
      await TimetableService.copyFromClass(source_class_id, classId, req.user!);
      res.status(200).json({ data: { message: 'Đã sao chép thời khóa biểu thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async clearTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      await TimetableService.clearTimetable(classId, req.user!);
      res.status(200).json({ data: { message: 'Đã xóa toàn bộ thời khóa biểu của lớp.' } });
    } catch (err) {
      next(err);
    }
  },
};
