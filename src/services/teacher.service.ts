import { UserRow, TeacherFormData } from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';

export const TeacherService = {
  getTeachers(): UserRow[] {
    return LocalStore.getTeachers();
  },

  getTeacherDetails(teacherId: string) {
    return LocalStore.getTeacherDetails(teacherId);
  },

  /**
   * Helper: Check if assigning a teacher to a class violates the "Max 2 Grades per Teacher" invariant.
   */
  checkGradeLimit(teacherId: string, targetClassId: string): { allowed: boolean; error?: string } {
    const teacher = LocalStore.getUserById(teacherId);
    if (!teacher) return { allowed: false, error: 'Giáo viên không tồn tại' };

    const targetClass = LocalStore.getClassById(targetClassId);
    if (!targetClass) return { allowed: false, error: 'Lớp học không tồn tại' };

    const details = LocalStore.getTeacherDetails(teacherId);
    if (!details) return { allowed: true };

    const currentGrades = new Set<number>(details.grades);

    // If teacher already teaches in this grade, it's allowed
    if (currentGrades.has(targetClass.grade)) {
      return { allowed: true };
    }

    // If teacher already teaches in 2 grades and this is a 3rd grade, reject!
    if (currentGrades.size >= 2) {
      const gradesStr = Array.from(currentGrades).sort().map((g) => `Khối ${g}`).join(', ');
      return {
        allowed: false,
        error: `Giáo viên ${teacher.name} đang phụ trách tại ${gradesStr}. Theo quy định chuyên môn THCS, mỗi giáo viên không được phân công quá 2 khối học (dự kiến thêm Khối ${targetClass.grade}).`,
      };
    }

    return { allowed: true };
  },

  assignHomeroomTeacher(
    classId: string,
    teacherId: string | null,
    currentUser: UserRow | null
  ): OperationResult<void> {
    if (!AuthGuard.canManageTeacherAssignment(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền phân công Giáo viên Chủ nhiệm.');
    }

    if (teacherId) {
      const teacher = LocalStore.getUserById(teacherId);
      if (!teacher) {
        return failure('Giáo viên được chọn không tồn tại.');
      }
      if (teacher.status === 'disabled') {
        return failure(`Tài khoản giáo viên ${teacher.name} đang bị tạm khóa. Không thể phân công làm GVCN.`);
      }

      // Check grade limit
      const gradeCheck = this.checkGradeLimit(teacherId, classId);
      if (!gradeCheck.allowed) {
        return failure(gradeCheck.error || 'Vi phạm giới hạn số khối phân công.');
      }
    }

    LocalStore.assignHomeroomTeacher(classId, teacherId);
    return success();
  },

  assignSubjectTeacher(
    classId: string,
    subjectId: string,
    teacherId: string | null,
    currentUser: UserRow | null
  ): OperationResult<void> {
    if (!AuthGuard.canManageTeacherAssignment(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền phân công Giáo viên Bộ môn.');
    }

    if (teacherId) {
      const teacher = LocalStore.getUserById(teacherId);
      if (!teacher) {
        return failure('Giáo viên được chọn không tồn tại.');
      }
      if (teacher.status === 'disabled') {
        return failure(`Tài khoản giáo viên ${teacher.name} đang bị tạm khóa. Không thể phân công giảng dạy.`);
      }

      // Check grade limit
      const gradeCheck = this.checkGradeLimit(teacherId, classId);
      if (!gradeCheck.allowed) {
        return failure(gradeCheck.error || 'Vi phạm giới hạn số khối phân công.');
      }
    }

    LocalStore.assignSubjectTeacher(classId, subjectId, teacherId);
    return success();
  },

  createTeacher(
    data: TeacherFormData,
    currentUser: UserRow | null
  ): OperationResult<UserRow> {
    if (!AuthGuard.canManageTeacherAssignment(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền thêm tài khoản giáo viên.');
    }

    if (!data.name.trim() || !data.email.trim()) {
      return failure('Họ tên và email giáo viên không được để trống.');
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = LocalStore.getUsers().some(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (existing) {
      return failure(`Email "${cleanEmail}" đã được sử dụng trong hệ thống.`);
    }

    const newTeacher = LocalStore.addTeacher({
      ...data,
      email: cleanEmail,
    });

    return success(newTeacher);
  },

  updateTeacher(
    id: string,
    data: Partial<TeacherFormData>,
    currentUser: UserRow | null
  ): OperationResult<UserRow> {
    if (!AuthGuard.canManageTeacherAssignment(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền chỉnh sửa tài khoản giáo viên.');
    }

    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      const existing = LocalStore.getUsers().some(
        (u) => u.id !== id && u.email.trim().toLowerCase() === cleanEmail
      );
      if (existing) {
        return failure(`Email "${cleanEmail}" đã được sử dụng bởi tài khoản khác.`);
      }
    }

    const updated = LocalStore.updateTeacher(id, data);
    if (!updated) {
      return failure('Không tìm thấy giáo viên để cập nhật.');
    }

    return success(updated);
  },

  toggleTeacherStatus(
    id: string,
    currentUser: UserRow | null
  ): OperationResult<UserRow> {
    if (!AuthGuard.canManageTeacherAssignment(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền khóa hoặc mở khóa tài khoản.');
    }

    if (currentUser && currentUser.id === id) {
      return failure('Bạn không thể tự vô hiệu hóa tài khoản quản trị của chính mình.');
    }

    const updated = LocalStore.toggleTeacherStatus(id);
    if (!updated) {
      return failure('Không tìm thấy tài khoản giáo viên.');
    }

    return success(updated);
  },

  resetPassword(
    id: string,
    currentUser: UserRow | null
  ): OperationResult<void> {
    if (!AuthGuard.canManageTeacherAssignment(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền đặt lại mật khẩu giáo viên.');
    }

    const ok = LocalStore.resetTeacherPassword(id, 'password123');
    if (!ok) {
      return failure('Không thể đặt lại mật khẩu.');
    }

    return success();
  },
};
