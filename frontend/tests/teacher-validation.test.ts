import { describe, it, expect } from 'vitest';
import { TeacherService } from '@/services/teacher.service';
import { StudentService } from '@/services/student.service';
import { UserRow } from '@/types';

describe('Teacher Domain Rules & Student Validation Tests', () => {
  const mockAdmin: UserRow = {
    id: 'u-admin',
    name: 'Admin',
    email: 'admin@classmanager.local',
    phone: null,
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('Enforces "Max 2 Grades per Teacher" rule', () => {
    // Thầy Nguyễn Văn An (u-tea-01) hiện dạy ở Khối 6 (6A1, 6A2) và Khối 7 (7A1, 7A2) -> đã đủ 2 khối {6, 7}
    // Thử phân công Thầy An dạy lớp 8A1 (Khối 8) -> BẮT BUỘC PHẢI BỊ CHẶN!
    const checkGrade8 = TeacherService.checkGradeLimit('u-tea-01', 'c-8a1');
    expect(checkGrade8.allowed).toBe(false);
    expect(checkGrade8.error).toContain('không được phân công quá 2 khối học');

    // Nhưng phân công thêm lớp 6A3 (thuộc Khối 6 mà thầy đã dạy) -> CHO PHÉP
    const checkGrade6 = TeacherService.checkGradeLimit('u-tea-01', 'c-6a3');
    expect(checkGrade6.allowed).toBe(true);
  });

  it('Rejects duplicate student code in the same class', () => {
    // Class 6A1 already has student 6A1-01
    const res = StudentService.createStudent(
      {
        student_code: '6A1-01',
        full_name: 'Nguyễn Văn Test Trùng Mã',
        gender: 'male',
        date_of_birth: '2015-05-10',
        phone: '0912345678',
        email: '',
      },
      'c-6a1',
      mockAdmin
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('đã tồn tại trong lớp');
  });

  it('Rejects student creation with invalid schema (e.g. empty name)', () => {
    const res = StudentService.createStudent(
      {
        student_code: 'HS99',
        full_name: 'A', // too short (< 2 chars)
        gender: 'male',
        date_of_birth: '2011-05-10',
        phone: '',
        email: '',
      },
      'c-6a1',
      mockAdmin
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('tối thiểu 2 ký tự');
  });
});
