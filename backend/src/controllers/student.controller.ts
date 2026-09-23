import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service.js';
import { getParam } from '../utils/params.js';

export const StudentController = {
  async getStudentsByClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const students = await StudentService.getStudents(classId);
      res.status(200).json({ data: students });
    } catch (err) {
      next(err);
    }
  },

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const student = await StudentService.getStudentById(id);
      res.status(200).json({ data: student });
    } catch (err) {
      next(err);
    }
  },

  async createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const student = await StudentService.createStudent(classId, req.body, req.user!);
      res.status(201).json({ data: student });
    } catch (err) {
      next(err);
    }
  },

  async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      const student = await StudentService.updateStudent(id, req.body, req.user!);
      res.status(200).json({ data: student });
    } catch (err) {
      next(err);
    }
  },

  async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req.params.id);
      await StudentService.deleteStudent(id, req.user!);
      res.status(200).json({ data: { message: 'Đã xóa học sinh thành công.' } });
    } catch (err) {
      next(err);
    }
  },

  async importStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classId = getParam(req.params.classId);
      const { students } = req.body;
      const imported = await StudentService.importStudents(classId, students, req.user!);
      res.status(201).json({ data: imported });
    } catch (err) {
      next(err);
    }
  },
};
