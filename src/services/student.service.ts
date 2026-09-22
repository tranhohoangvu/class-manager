import { StudentRow, StudentFormData, UserRow } from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';
import { studentSchema } from '@/lib/validations/student';

export const StudentService = {
  getStudents(classId?: string): StudentRow[] {
    return LocalStore.getStudents(classId);
  },

  getStudentById(id: string): StudentRow | null {
    return LocalStore.getStudentById(id);
  },

  createStudent(
    data: StudentFormData,
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<StudentRow> {
    // 1. Authorization check
    if (!AuthGuard.canEditStudent(currentUser, classId)) {
      return failure('Bạn không có quyền thêm học sinh vào lớp học này. Chỉ GVCN hoặc Quản trị viên mới được phép.');
    }

    // 2. Schema validation
    const validation = studentSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      return failure(firstError);
    }

    // 3. Class validation
    const targetClass = LocalStore.getClassById(classId);
    if (!targetClass) {
      return failure('Lớp học không tồn tại.');
    }

    // 4. Duplicate student_code check in class
    const cleanCode = data.student_code.trim().toUpperCase();
    const currentStudents = LocalStore.getStudents(classId);
    const isCodeTaken = currentStudents.some(
      (s) => s.student_code.trim().toUpperCase() === cleanCode
    );
    if (isCodeTaken) {
      return failure(`Mã học sinh "${cleanCode}" đã tồn tại trong lớp ${targetClass.name}.`);
    }

    // 5. Max student invariant
    const activeCount = currentStudents.filter((s) => s.status === 'active').length;
    if (activeCount >= targetClass.max_students) {
      return failure(`Lớp đã đạt sĩ số tối đa (${targetClass.max_students} học sinh). Không thể thêm mới.`);
    }

    // 5. Save
    const newStudent = LocalStore.addStudent(
      {
        ...data,
        student_code: cleanCode,
      },
      classId
    );

    return success(newStudent);
  },

  updateStudent(
    id: string,
    data: Partial<StudentFormData>,
    currentUser: UserRow | null
  ): OperationResult<StudentRow> {
    const student = LocalStore.getStudentById(id);
    if (!student) {
      return failure('Không tìm thấy học sinh để cập nhật.');
    }

    // 1. Authorization check
    if (!AuthGuard.canEditStudent(currentUser, student.class_id)) {
      return failure('Bạn không có quyền chỉnh sửa thông tin học sinh này. Chỉ GVCN hoặc Quản trị viên mới được phép.');
    }

    // 2. Duplicate student_code check if updated
    if (data.student_code) {
      const cleanCode = data.student_code.trim().toUpperCase();
      const currentStudents = LocalStore.getStudents(student.class_id);
      const isCodeTaken = currentStudents.some(
        (s) => s.id !== id && s.student_code.trim().toUpperCase() === cleanCode
      );
      if (isCodeTaken) {
        return failure(`Mã học sinh "${cleanCode}" đã được sử dụng bởi học sinh khác trong lớp.`);
      }
    }

    const updated = LocalStore.updateStudent(id, data);
    if (!updated) {
      return failure('Không thể cập nhật thông tin học sinh.');
    }

    return success(updated);
  },

  deleteStudent(id: string, currentUser: UserRow | null): OperationResult<boolean> {
    const student = LocalStore.getStudentById(id);
    if (!student) {
      return failure('Không tìm thấy học sinh cần xoá.');
    }

    // 1. Authorization check
    if (!AuthGuard.canEditStudent(currentUser, student.class_id)) {
      return failure('Bạn không có quyền xoá học sinh này. Chỉ GVCN hoặc Quản trị viên mới có quyền xoá học sinh.');
    }

    const deleted = LocalStore.deleteStudent(id);
    return success(deleted);
  },
};
