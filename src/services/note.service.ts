import { StudentNoteRow, UserRow } from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';
import { studentNoteSchema } from '@/lib/validations/forms';

export const NoteService = {
  getNotesForStudent(studentId: string): StudentNoteRow[] {
    return LocalStore.getNotesForStudent(studentId);
  },

  addNote(
    studentId: string,
    content: string,
    currentUser: UserRow | null
  ): OperationResult<StudentNoteRow> {
    const student = LocalStore.getStudentById(studentId);
    if (!student) {
      return failure('Học sinh không tồn tại trong hệ thống.');
    }

    // 1. Authorization check: Only Homeroom teacher or Admin can add notes
    if (!AuthGuard.canManageStudentNote(currentUser, student.class_id)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền thêm ghi chú cho học sinh này.');
    }

    // 2. Validation check
    const validation = studentNoteSchema.safeParse({ content });
    if (!validation.success) {
      return failure(validation.error.errors[0]?.message || 'Nội dung ghi chú không hợp lệ');
    }

    const note = LocalStore.addNoteForStudent(studentId, content.trim(), student.class_id);
    return success(note);
  },

  deleteNote(
    studentId: string,
    noteId: string,
    currentUser: UserRow | null
  ): OperationResult<void> {
    const student = LocalStore.getStudentById(studentId);
    if (!student) {
      return failure('Học sinh không tồn tại trong hệ thống.');
    }

    // 1. Authorization check
    if (!AuthGuard.canManageStudentNote(currentUser, student.class_id)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền xoá ghi chú của học sinh.');
    }

    LocalStore.deleteNote(studentId, noteId);
    return success();
  },
};
