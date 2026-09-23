import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service.js';
import { getParam } from '../utils/params.js';

export const ClassController = {
  async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classes = await ClassService.getClasses(req.user!);
      res.status(200).json({ data: classes });
    } catch (err) {
      next(err);
    }
  },

  async getClassById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const cls = await ClassService.getClassById(id, req.user!);
      res.status(200).json({ data: cls });
    } catch (err) {
      next(err);
    }
  },

  async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newClass = await ClassService.createClass(req.body, req.user!);
      res.status(201).json({ data: newClass });
    } catch (err) {
      next(err);
    }
  },

  async updateClassSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const updated = await ClassService.updateClassSettings(id, req.body, req.user!);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async archiveClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const archived = await ClassService.archiveClass(id, req.user!);
      res.status(200).json({ data: archived });
    } catch (err) {
      next(err);
    }
  },
};
