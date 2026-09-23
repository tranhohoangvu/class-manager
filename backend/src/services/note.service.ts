import { NoteRepo } from '../repositories/note.repo.js';
import { StudentRepo } from '../repositories/student.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { AuthUser, StudentNoteRow } from '../types/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export const NoteService = {
  async getNotesForStudent(studentId: string): Promise<StudentNoteRow[]> {
    return NoteRepo.getByStudentId(studentId);
  },

  async addNote(studentId: string, content: string, currentUser: AuthUser): Promise<StudentNoteRow> {
    const student = await StudentRepo.getById(studentId);
    if (!student) {
      throw new NotFoundError('Không tìm thấy học sinh.');
    }

    const cls = await ClassRepo.getById(student.class_id);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền thêm ghi chú học sinh.');
    }

    return NoteRepo.create({
      student_id: studentId,
      class_id: student.class_id,
      content,
    });
  },

  async deleteNote(noteId: string, studentId: string, currentUser: AuthUser): Promise<void> {
    const student = await StudentRepo.getById(studentId);
    if (!student) {
      throw new NotFoundError('Không tìm thấy học sinh.');
    }

    const cls = await ClassRepo.getById(student.class_id);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền xóa ghi chú học sinh.');
    }

    const deleted = await NoteRepo.delete(noteId);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy ghi chú để xóa.');
    }
  },
};
