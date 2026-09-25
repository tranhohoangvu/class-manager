import { describe, it, expect } from 'vitest';
import { classSettingsSchema } from '@/lib/validations/forms';
import { ClassService } from '@/services/class.service';
import { LocalStore } from '@/lib/store';
import { UserRow } from '@/types';

describe('Class Settings & 20 Desks / 40 Students Constraint Tests', () => {
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

  const mockOtherTeacher: UserRow = {
    id: 'u-tea-99',
    name: 'Giáo viên khác',
    email: 'other@school.edu.vn',
    phone: null,
    role: 'TEACHER',
    status: 'active',
    assigned_class_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('classSettingsSchema validates max_students range (1 to 40)', () => {
    // Valid cases
    const valid40 = classSettingsSchema.safeParse({
      name: 'Lớp 6A1',
      max_students: 40,
    });
    expect(valid40.success).toBe(true);

    const valid35 = classSettingsSchema.safeParse({
      name: 'Lớp 6A1',
      max_students: 35,
    });
    expect(valid35.success).toBe(true);

    // Invalid: > 40
    const invalidOver40 = classSettingsSchema.safeParse({
      name: 'Lớp 6A1',
      max_students: 45,
    });
    expect(invalidOver40.success).toBe(false);
    expect(invalidOver40.error?.errors[0].message).toContain('tối đa là 40');

    // Invalid: < 1
    const invalidZero = classSettingsSchema.safeParse({
      name: 'Lớp 6A1',
      max_students: 0,
    });
    expect(invalidZero.success).toBe(false);
  });

  it('ClassService.updateClassSettings rejects unauthorized users', () => {
    const res = ClassService.updateClassSettings(
      'c-6a1',
      {
        name: 'Lớp 6A1 Đổi Tên',
        max_students: 38,
      },
      mockOtherTeacher
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('Bạn không có quyền');
  });

  it('ClassService.updateClassSettings rejects max_students lower than active students count', () => {
    const activeCount = LocalStore.getStudents('c-6a1').filter((s) => s.status === 'active').length;
    expect(activeCount).toBe(30);

    // Try to set max_students = 25 while class has 30 active students
    const res = ClassService.updateClassSettings(
      'c-6a1',
      {
        name: 'Lớp 6A1',
        max_students: 25,
      },
      mockGVCN_6A1
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('không thể đặt sĩ số tối đa nhỏ hơn');
  });

  it('ClassService.updateClassSettings successfully updates settings and persists max_students', () => {
    const res = ClassService.updateClassSettings(
      'c-6a1',
      {
        name: 'Lớp 6A1 Mới',
        room_name: 'Phòng 201 - Nhà A',
        school_year: '2026 - 2027',
        max_students: 38,
      },
      mockGVCN_6A1
    );

    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Lớp 6A1 Mới');
    expect(res.data?.max_students).toBe(38);

    // Check store reflection
    const stored = LocalStore.getClassById('c-6a1');
    expect(stored?.max_students).toBe(38);
    expect(stored?.desk_count).toBe(20);
  });
});
