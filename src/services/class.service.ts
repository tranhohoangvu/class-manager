import { ClassRow, UserRow, ClassFormData } from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';
import { classSettingsSchema } from '@/lib/validations/forms';

export const ClassService = {
  getClasses(): ClassRow[] {
    return LocalStore.getClasses();
  },

  getClassById(id: string): ClassRow | null {
    return LocalStore.getClassById(id);
  },

  addClass(
    data: ClassFormData,
    currentUser: UserRow | null
  ): OperationResult<ClassRow> {
    if (!AuthGuard.isAdmin(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền tạo lớp học mới.');
    }

    if (!data.name.trim()) {
      return failure('Tên lớp không được để trống.');
    }

    const classes = LocalStore.getClasses();
    const isDuplicateName = classes.some(
      (c) => c.status === 'active' && c.name.trim().toLowerCase() === data.name.trim().toLowerCase()
    );
    if (isDuplicateName) {
      return failure(`Tên lớp "${data.name.trim()}" đã tồn tại trong niên khóa này.`);
    }

    const newClass = LocalStore.addClass(data);
    return success(newClass);
  },

  updateClassSettings(
    classId: string,
    data: { name: string; room_name?: string; school_year?: string },
    currentUser: UserRow | null
  ): OperationResult<ClassRow> {
    if (!AuthGuard.canEditClassSettings(currentUser, classId)) {
      return failure('Bạn không có quyền chỉnh sửa cài đặt lớp học này.');
    }

    const validation = classSettingsSchema.safeParse(data);
    if (!validation.success) {
      return failure(validation.error.errors[0]?.message || 'Thông tin lớp học không hợp lệ');
    }

    const updated = LocalStore.updateClass(classId, {
      name: data.name.trim(),
      room_name: data.room_name?.trim() || null,
      school_year: data.school_year?.trim() || '2026 - 2027',
    });

    if (!updated) {
      return failure('Không thể cập nhật thông tin lớp học.');
    }

    return success(updated);
  },

  archiveClass(
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<ClassRow> {
    if (!AuthGuard.isAdmin(currentUser)) {
      return failure('Chỉ Quản trị viên mới có quyền lưu trữ lớp học.');
    }

    const updated = LocalStore.archiveClass(classId);
    if (!updated) {
      return failure('Không tìm thấy lớp học để lưu trữ.');
    }

    return success(updated);
  },
};
