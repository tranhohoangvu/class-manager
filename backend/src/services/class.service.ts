import { ClassRepo } from '../repositories/class.repo.js';
import { AuthUser, ClassRow } from '../types/index.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';
import { StudentRepo } from '../repositories/student.repo.js';

export const ClassService = {
  async getClasses(currentUser: AuthUser): Promise<ClassRow[]> {
    if (currentUser.role === 'ADMIN') {
      return ClassRepo.getAll();
    }
    return ClassRepo.getAssignedClassesForTeacher(currentUser.id);
  },

  async getClassById(id: string, currentUser: AuthUser): Promise<ClassRow> {
    const cls = await ClassRepo.getById(id);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }
    return cls;
  },

  async createClass(
    data: {
      name: string;
      grade: number;
      room_name?: string | null;
      school_year?: string;
      teacher_id?: string | null;
      max_students?: number;
      desk_count?: number;
    },
    currentUser: AuthUser
  ): Promise<ClassRow> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền tạo lớp học mới.');
    }

    if (!data.name?.trim()) {
      throw new BadRequestError('Tên lớp không được để trống.');
    }

    const allClasses = await ClassRepo.getAll();
    const isDuplicate = allClasses.some(
      (c) => c.status === 'active' && c.name.trim().toLowerCase() === data.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      throw new BadRequestError(`Tên lớp "${data.name.trim()}" đã tồn tại trong niên khóa này.`);
    }

    return ClassRepo.create(data);
  },

  async updateClassSettings(
    classId: string,
    data: { name?: string; room_name?: string; school_year?: string; max_students?: number },
    currentUser: AuthUser
  ): Promise<ClassRow> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Bạn không có quyền chỉnh sửa cài đặt lớp học này.');
    }

    if (data.max_students !== undefined) {
      const students = await StudentRepo.getByClassId(classId);
      const activeCount = students.filter((s) => s.status === 'active').length;
      if (activeCount > data.max_students) {
        throw new BadRequestError(
          `Lớp hiện có ${activeCount} học sinh đang học, không thể đặt sĩ số tối đa nhỏ hơn (${data.max_students}).`
        );
      }
    }

    const updated = await ClassRepo.update(classId, data as any);
    if (!updated) {
      throw new BadRequestError('Không thể cập nhật thông tin lớp học.');
    }
    return updated;
  },

  async archiveClass(classId: string, currentUser: AuthUser): Promise<ClassRow> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền lưu trữ lớp học.');
    }

    const updated = await ClassRepo.archive(classId);
    if (!updated) {
      throw new NotFoundError('Không tìm thấy lớp học để lưu trữ.');
    }
    return updated;
  },
};
