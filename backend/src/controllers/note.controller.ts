import { Request, Response, NextFunction } from 'express';
import { NoteService } from '../services/note.service.js';
import { getParam } from '../utils/params.js';

export const NoteController = {
  async getByStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = getParam(req.params.studentId);
      const notes = await NoteService.getNotesForStudent(studentId);
      res.status(200).json({ data: notes });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = getParam(req.params.studentId);
      const { content } = req.body;
      const note = await NoteService.addNote(studentId, content, req.user!);
      res.status(201).json({ data: note });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = getParam(req.params.studentId);
      const id = getParam(req.params.id);
      await NoteService.deleteNote(id, studentId, req.user!);
      res.status(200).json({ data: { message: 'Đã xóa ghi chú thành công.' } });
    } catch (err) {
      next(err);
    }
  },
};
