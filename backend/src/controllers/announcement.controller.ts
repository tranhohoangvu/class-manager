import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service.js';
import { getParam } from '../utils/params.js';

export const AnnouncementController = {
  async getByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const announcements = await AnnouncementService.getAnnouncements(classId);
      res.status(200).json({ data: announcements });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const created = await AnnouncementService.createAnnouncement(classId, req.body, req.user!);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  },

  async togglePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const id = getParam(req.params.id);
      const updated = await AnnouncementService.togglePin(id, classId, req.user!);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const id = getParam(req.params.id);
      await AnnouncementService.deleteAnnouncement(id, classId, req.user!);
      res.status(200).json({ data: { message: 'Đã xóa thông báo thành công.' } });
    } catch (err) {
      next(err);
    }
  },
};
