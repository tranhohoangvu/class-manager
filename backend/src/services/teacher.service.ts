import { TeacherRepo } from '../repositories/teacher.repo.js';
import { UserRepo } from '../repositories/user.repo.js';
import { hashPassword } from '../utils/password.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { UserRow } from '../types/index.js';

export const TeacherService = {
  async getTeachers() {
    return TeacherRepo.getAllWithDetails();
  },

  async getTeacherById(id: string): Promise<UserRow> {
    const teacher = await UserRepo.findById(id);
    if (!teacher || teacher.role !== 'TEACHER') {
      throw new NotFoundError('Không tìm thấy giáo viên.');
    }
    return teacher;
  },

  async createTeacher(data: {
    name: string;
    email: string;
    phone?: string | null;
    password?: string;
    role?: 'ADMIN' | 'TEACHER';
    status?: 'active' | 'disabled';
  }): Promise<UserRow> {
    const existing = await UserRepo.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError(`Email "${data.email.trim()}" đã được sử dụng bởi tài khoản khác.`);
    }

    const passwordHash = await hashPassword(data.password || 'teacher123');

    return UserRepo.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      role: data.role || 'TEACHER',
      status: data.status || 'active',
      password_hash: passwordHash,
    });
  },

  async updateTeacher(
    id: string,
    data: Partial<{ name: string; phone: string | null; status: 'active' | 'disabled' }>
  ): Promise<UserRow> {
    const updated = await UserRepo.update(id, data);
    if (!updated) {
      throw new NotFoundError('Không tìm thấy giáo viên.');
    }
    return updated;
  },

  async toggleTeacherStatus(id: string): Promise<UserRow> {
    const updated = await UserRepo.toggleStatus(id);
    if (!updated) {
      throw new NotFoundError('Không tìm thấy giáo viên.');
    }
    return updated;
  },

  async assignHomeroom(classId: string, teacherId: string): Promise<void> {
    await TeacherRepo.assignHomeroom(classId, teacherId);
  },

  async assignSubject(teacherId: string, classId: string, subjectId: string): Promise<void> {
    await TeacherRepo.assignSubject(teacherId, classId, subjectId);
  },

  async removeSubjectAssignment(assignmentId: string): Promise<void> {
    const deleted = await TeacherRepo.removeSubjectAssignment(assignmentId);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy phân công môn học để gỡ bỏ.');
    }
  },
};
