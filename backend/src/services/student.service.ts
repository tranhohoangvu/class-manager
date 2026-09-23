import { StudentRepo } from '../repositories/student.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { AuthUser, StudentRow } from '../types/index.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const StudentService = {
  async getStudents(classId: string): Promise<StudentRow[]> {
    return StudentRepo.getByClassId(classId);
  },

  async getStudentById(id: string): Promise<StudentRow> {
    const student = await StudentRepo.getById(id);
    if (!student) {
      throw new NotFoundError('Không tìm thấy học sinh.');
    }
    return student;
  },

  async createStudent(
    classId: string,
    data: {
      student_code: string;
      full_name: string;
      gender?: 'male' | 'female' | null;
      date_of_birth?: string | null;
      phone?: string | null;
      email?: string | null;
    },
    currentUser: AuthUser
  ): Promise<StudentRow> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền thêm học sinh vào lớp này.');
    }

    const students = await StudentRepo.getByClassId(classId);
    const activeCount = students.filter((s) => s.status === 'active').length;
    if (activeCount >= cls.max_students) {
      throw new BadRequestError(
        `Lớp học đã đạt sĩ số tối đa (${cls.max_students} học sinh). Không thể thêm học sinh mới.`
      );
    }

    const codeExists = students.some(
      (s) => s.student_code.trim().toUpperCase() === data.student_code.trim().toUpperCase()
    );
    if (codeExists) {
      throw new BadRequestError(`Mã học sinh "${data.student_code.trim()}" đã tồn tại trong lớp này.`);
    }

    return StudentRepo.create({ ...data, class_id: classId });
  },

  async updateStudent(
    id: string,
    data: Partial<{
      student_code: string;
      full_name: string;
      gender: 'male' | 'female' | null;
      date_of_birth: string | null;
      phone: string | null;
      email: string | null;
      status: 'active' | 'inactive';
    }>,
    currentUser: AuthUser
  ): Promise<StudentRow> {
    const student = await StudentRepo.getById(id);
    if (!student) {
      throw new NotFoundError('Không tìm thấy học sinh.');
    }

    const cls = await ClassRepo.getById(student.class_id);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học của học sinh này.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền chỉnh sửa thông tin học sinh.');
    }

    if (data.student_code && data.student_code.trim().toUpperCase() !== student.student_code) {
      const students = await StudentRepo.getByClassId(student.class_id);
      const codeExists = students.some(
        (s) => s.id !== id && s.student_code.trim().toUpperCase() === data.student_code!.trim().toUpperCase()
      );
      if (codeExists) {
        throw new BadRequestError(`Mã học sinh "${data.student_code.trim()}" đã tồn tại trong lớp này.`);
      }
    }

    const updated = await StudentRepo.update(id, data);
    if (!updated) {
      throw new BadRequestError('Không thể cập nhật thông tin học sinh.');
    }
    return updated;
  },

  async deleteStudent(id: string, currentUser: AuthUser): Promise<void> {
    const student = await StudentRepo.getById(id);
    if (!student) {
      throw new NotFoundError('Không tìm thấy học sinh.');
    }

    const cls = await ClassRepo.getById(student.class_id);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học của học sinh này.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền xoá học sinh.');
    }

    const deleted = await StudentRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy học sinh để xoá.');
    }
  },

  async importStudents(
    classId: string,
    studentsToImport: Array<{
      student_code: string;
      full_name: string;
      gender?: 'male' | 'female' | null;
      date_of_birth?: string | null;
      phone?: string | null;
      email?: string | null;
    }>,
    currentUser: AuthUser
  ): Promise<StudentRow[]> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền nhập danh sách học sinh.');
    }

    const existingStudents = await StudentRepo.getByClassId(classId);
    const currentActive = existingStudents.filter((s) => s.status === 'active').length;

    // Check capacity
    if (currentActive + studentsToImport.length > cls.max_students) {
      throw new BadRequestError(
        `Không thể nhập ${studentsToImport.length} học sinh. Lớp hiện có ${currentActive}/${cls.max_students} học sinh (vượt quá giới hạn).`
      );
    }

    return StudentRepo.bulkImport(classId, studentsToImport);
  },
};
