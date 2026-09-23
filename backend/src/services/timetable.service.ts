import { TimetableRepo } from '../repositories/timetable.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { AuthUser, TimetableEntryRow } from '../types/index.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const TimetableService = {
  async getTimetableForClass(classId: string, currentUser: AuthUser): Promise<TimetableEntryRow[]> {
    return TimetableRepo.getByClassId(classId);
  },

  async saveEntry(
    classId: string,
    dayOfWeek: number,
    period: number,
    subjectId: string,
    teacherId: string | null | undefined,
    currentUser: AuthUser
  ): Promise<TimetableEntryRow> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xếp hoặc chỉnh sửa thời khóa biểu.');
    }

    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    // Validate shift rules according to THCS standards
    const isMorningGrade = cls.grade === 6 || cls.grade === 9;
    const isAfternoonGrade = cls.grade === 7 || cls.grade === 8;

    if (isMorningGrade) {
      if (period > 5) {
        throw new BadRequestError(`Khối ${cls.grade} học ca sáng (Tiết 1 - 5). Tiết ${period} thuộc ca chiều.`);
      }
      if (dayOfWeek === 7 && period > 3) {
        throw new BadRequestError('Thứ Bảy ca sáng chỉ học tối đa 3 tiết.');
      }
    } else if (isAfternoonGrade) {
      if (period < 6 || period > 10) {
        throw new BadRequestError(`Khối ${cls.grade} học ca chiều (Tiết 6 - 10). Tiết ${period} không thuộc ca chiều.`);
      }
      if (dayOfWeek === 7 && period > 8) {
        throw new BadRequestError('Thứ Bảy ca chiều chỉ học tối đa 3 tiết (Tiết 6 - 8).');
      }
    }

    // Check teacher conflict across entire school
    if (teacherId) {
      const conflict = await TimetableRepo.findTeacherConflict(teacherId, dayOfWeek, period, classId);
      if (conflict) {
        throw new BadRequestError(
          `Xung đột lịch: Giáo viên đã có tiết dạy tại lớp ${conflict.class_name} vào Thứ ${dayOfWeek}, Tiết ${period}.`
        );
      }
    }

    return TimetableRepo.saveEntry({
      class_id: classId,
      day_of_week: dayOfWeek,
      period,
      subject_id: subjectId,
      teacher_id: teacherId,
    });
  },

  async deleteEntry(id: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xóa tiết học.');
    }

    const deleted = await TimetableRepo.deleteEntry(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy tiết học để xóa.');
    }
  },

  async copyFromClass(sourceClassId: string, targetClassId: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền sao chép thời khóa biểu.');
    }

    const sourceClass = await ClassRepo.getById(sourceClassId);
    const targetClass = await ClassRepo.getById(targetClassId);

    if (!sourceClass || !targetClass) {
      throw new NotFoundError('Không tìm thấy lớp học nguồn hoặc đích.');
    }

    // Check shift compatibility
    const sourceIsMorning = sourceClass.grade === 6 || sourceClass.grade === 9;
    const targetIsMorning = targetClass.grade === 6 || targetClass.grade === 9;

    if (sourceIsMorning !== targetIsMorning) {
      throw new BadRequestError('Không thể sao chép thời khóa biểu giữa hai lớp khác ca học (Sáng vs Chiều).');
    }

    await TimetableRepo.copyFromClass(sourceClassId, targetClassId);
  },

  async clearTimetable(classId: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xóa toàn bộ thời khóa biểu của lớp.');
    }

    await TimetableRepo.clearTimetable(classId);
  },
};
