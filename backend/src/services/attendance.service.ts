import { AttendanceRepo } from '../repositories/attendance.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { SubjectRepo } from '../repositories/subject.repo.js';
import { AuthUser, AttendanceRow, AttendanceStatus } from '../types/index.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const AttendanceService = {
  async getDaily(classId: string, date: string, subjectId: string | null | undefined, currentUser: AuthUser) {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN') {
      const isHomeroom = cls.teacher_id === currentUser.id;
      if (!isHomeroom) {
        // GVBM: check if teacher teaches this subject in this class
        if (!subjectId) {
          throw new ForbiddenError('Giáo viên bộ môn chỉ có quyền xem điểm danh của môn học được phân công.');
        }
        const assignments = await SubjectRepo.getAssignmentsForClass(classId);
        const hasAssignment = assignments.some(
          (a) => a.teacher_id === currentUser.id && a.subject_id === subjectId
        );
        if (!hasAssignment) {
          throw new ForbiddenError('Bạn không được phân công giảng dạy môn học này tại lớp này.');
        }
      }
    }

    return AttendanceRepo.getDaily(classId, date, subjectId);
  },

  async saveBatch(
    classId: string,
    date: string,
    subjectId: string | null | undefined,
    entries: Array<{ student_id: string; status: AttendanceStatus; note?: string | null }>,
    currentUser: AuthUser
  ): Promise<void> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN') {
      if (!subjectId) {
        throw new BadRequestError('Vui lòng chọn môn học để ghi nhận điểm danh.');
      }

      // Check if user teaches this subject in this class
      const assignments = await SubjectRepo.getAssignmentsForClass(classId);
      const hasAssignment = assignments.some(
        (a) => a.teacher_id === currentUser.id && a.subject_id === subjectId
      );

      if (!hasAssignment) {
        throw new ForbiddenError('Bạn không được phân công giảng dạy môn học này. Chỉ giáo viên phụ trách môn hoặc Quản trị viên mới có quyền điểm danh.');
      }
    }

    await AttendanceRepo.saveBatch(classId, date, subjectId || null, currentUser.id, entries);
  },

  async getHistory(classId: string, startDate?: string, endDate?: string): Promise<AttendanceRow[]> {
    return AttendanceRepo.getHistory(classId, startDate, endDate);
  },

  async getAttendanceRecords(classId: string): Promise<AttendanceRow[]> {
    return AttendanceRepo.getAttendanceRecords(classId);
  },
};
