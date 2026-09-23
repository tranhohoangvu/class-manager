import { Request, Response, NextFunction } from 'express';
import { SeatingService } from '../services/seating.service.js';
import { getParam } from '../utils/params.js';

export const SeatingController = {
  async getDesksWithSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const desks = await SeatingService.getDesksWithSeats(classId);
      res.status(200).json({ data: desks });
    } catch (err) {
      next(err);
    }
  },

  async assignSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const { seat_id, student_id } = req.body;
      await SeatingService.assignSeat(classId, seat_id, student_id, req.user!);
      res.status(200).json({ data: { message: 'Đã cập nhật chỗ ngồi thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async swapSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const { seat_id_1, seat_id_2 } = req.body;
      await SeatingService.swapSeats(classId, seat_id_1, seat_id_2, req.user!);
      res.status(200).json({ data: { message: 'Đã hoán đổi chỗ ngồi thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async clearAllSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      await SeatingService.clearAllSeats(classId, req.user!);
      res.status(200).json({ data: { message: 'Đã xóa toàn bộ sơ đồ chỗ ngồi.' } });
    } catch (err) {
      next(err);
    }
  },

  async randomizeSeating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      await SeatingService.randomizeSeating(classId, req.user!);
      res.status(200).json({ data: { message: 'Đã xếp chỗ ngồi ngẫu nhiên thành công.' } });
    } catch (err) {
      next(err);
    }
  },
};
