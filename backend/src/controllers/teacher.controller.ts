import { Request, Response, NextFunction } from 'express';
import { TeacherService } from '../services/teacher.service.js';
import { getParam } from '../utils/params.js';

export const TeacherController = {
  async getTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teachers = await TeacherService.getTeachers();
      res.status(200).json({ data: teachers });
    } catch (err) {
      next(err);
    }
  },

  async getTeacherById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const teacher = await TeacherService.getTeacherById(id);
      res.status(200).json({ data: teacher });
    } catch (err) {
      next(err);
    }
  },

  async createTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teacher = await TeacherService.createTeacher(req.body);
      res.status(201).json({ data: teacher });
    } catch (err) {
      next(err);
    }
  },

  async updateTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const updated = await TeacherService.updateTeacher(id, req.body);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const updated = await TeacherService.toggleTeacherStatus(id);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async assignHomeroom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { class_id, teacher_id } = req.body;
      await TeacherService.assignHomeroom(class_id, teacher_id);
      res.status(200).json({ data: { message: 'Đã phân công GVCN thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async assignSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { teacher_id, class_id, subject_id } = req.body;
      await TeacherService.assignSubject(teacher_id, class_id, subject_id);
      res.status(200).json({ data: { message: 'Đã phân công GVBM thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async removeSubjectAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      await TeacherService.removeSubjectAssignment(id);
      res.status(200).json({ data: { message: 'Đã gỡ bỏ phân công môn học thành công.' } });
    } catch (err) {
      next(err);
    }
  },
};
