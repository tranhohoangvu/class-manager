import { describe, it, expect, beforeEach } from 'vitest';
import { StudentService } from '@/services/student.service';
import { LocalStore } from '@/lib/store';
import { UserRow, StudentFormData } from '@/types';

describe('Cải tiến 3: Student Import & Management Tests', () => {
  const mockAdmin: UserRow = {
    id: 'u-admin',
    name: 'Quản trị viên',
    email: 'admin@schoolops.local',
    phone: null,
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockGVCN_6A1: UserRow = {
    id: 'u-tea-01',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@school.edu.vn',
    phone: null,
    role: 'TEACHER',
    status: 'active',
    assigned_class_ids: ['c-6a1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockUnauthorizedTeacher: UserRow = {
    id: 'u-tea-99',
    name: 'Giáo viên bộ môn khác',
    email: 'other@school.edu.vn',
    phone: null,
    role: 'TEACHER',
    status: 'active',
    assigned_class_ids: ['c-9a4'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const testClassId = 'c-6a1';

  beforeEach(() => {
    LocalStore.updateClass(testClassId, { max_students: 40 });
  });

  it('chặn người dùng không có thẩm quyền nhập học sinh vào lớp', () => {
    const studentsToImport: StudentFormData[] = [
      {
        student_code: 'TEST01',
        full_name: 'Nguyễn Văn Test',
        gender: 'male',
        date_of_birth: '2011-01-01',
      },
    ];

    const result = StudentService.importStudents(testClassId, studentsToImport, mockUnauthorizedTeacher);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Bạn không có quyền nhập học sinh');
  });

  it('chặn Giáo viên chủ nhiệm (GVCN) nhập học sinh vì quyền quản lý học sinh thuộc về Admin', () => {
    const studentsToImport: StudentFormData[] = [
      {
        student_code: 'TEST02',
        full_name: 'Nguyễn Văn Test 2',
        gender: 'male',
        date_of_birth: '2011-01-01',
      },
    ];

    const result = StudentService.importStudents(testClassId, studentsToImport, mockGVCN_6A1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Bạn không có quyền nhập học sinh');
  });

  it('chặn danh sách học sinh rỗng', () => {
    const result = StudentService.importStudents(testClassId, [], mockAdmin);
    expect(result.success).toBe(false);
    expect(result.error).toContain('trống');
  });

  it('chặn khi mã học sinh bị trùng lặp ngay trong file tải lên', () => {
    const duplicateFileStudents: StudentFormData[] = [
      {
        student_code: 'HS_DUP_01',
        full_name: 'Học sinh A',
        gender: 'male',
        date_of_birth: '2011-01-01',
      },
      {
        student_code: 'HS_DUP_01',
        full_name: 'Học sinh B',
        gender: 'female',
        date_of_birth: '2011-02-02',
      },
    ];

    const result = StudentService.importStudents(testClassId, duplicateFileStudents, mockAdmin);
    expect(result.success).toBe(false);
    expect(result.error).toContain('trùng lặp trong file');
  });

  it('chặn khi mã học sinh đã tồn tại trong lớp học', () => {
    const existingStudents = LocalStore.getStudents(testClassId);
    expect(existingStudents.length).toBeGreaterThan(0);
    const existingCode = existingStudents[0].student_code;

    const conflictStudents: StudentFormData[] = [
      {
        student_code: existingCode,
        full_name: 'Học sinh Trùng Mã',
        gender: 'male',
        date_of_birth: '2011-03-03',
      },
    ];

    const result = StudentService.importStudents(testClassId, conflictStudents, mockAdmin);
    expect(result.success).toBe(false);
    expect(result.error).toContain('đã tồn tại trong lớp');
  });

  it('chặn nhập khi tổng sĩ số sau khi nhập vượt quá giới hạn 40 học sinh', () => {
    const currentStudents = LocalStore.getStudents(testClassId).filter((s) => s.status === 'active');
    const targetClass = LocalStore.getClassById(testClassId);
    const maxAllowed = targetClass?.max_students || 40;
    const remainingSlots = maxAllowed - currentStudents.length;

    // Create more students than remaining slots
    const overCapacityList: StudentFormData[] = Array.from({ length: remainingSlots + 5 }, (_, i) => ({
      student_code: `TEST_OVER_${Date.now()}_${i}`,
      full_name: `Học sinh Vượt Sĩ Số ${i}`,
      gender: 'male',
      date_of_birth: '2011-05-05',
    }));

    const result = StudentService.importStudents(testClassId, overCapacityList, mockAdmin);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Không thể nhập');
    expect(result.error).toContain(`${maxAllowed}`);
  });

  it('nhập thành công khi dữ liệu hợp lệ và còn đủ chỗ trong lớp', () => {
    LocalStore.updateClass(testClassId, { max_students: 40 });
    const currentStudents = LocalStore.getStudents(testClassId).filter((s) => s.status === 'active');
    const remainingSlots = 40 - currentStudents.length;

    expect(remainingSlots).toBeGreaterThan(0);

    const validStudent: StudentFormData = {
      student_code: `HS_NEW_${Date.now().toString().slice(-4)}`,
      full_name: 'Học Sinh Mới Nhập',
      gender: 'male',
      date_of_birth: '2011-06-15',
      phone: '0912345678',
    };

    const result = StudentService.importStudents(testClassId, [validStudent], mockAdmin);
    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(1);

    // Verify student is in store
    const updatedStudents = LocalStore.getStudents(testClassId);
    const found = updatedStudents.find((s) => s.student_code === validStudent.student_code);
    expect(found).toBeDefined();
    expect(found?.full_name).toBe('Học Sinh Mới Nhập');
  });
});
