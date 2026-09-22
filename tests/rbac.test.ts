import { describe, it, expect } from 'vitest';
import { AuthGuard } from '@/services/auth-guard';
import { UserRow } from '@/types';
import { LocalStore } from '@/lib/store';

describe('RBAC & AuthGuard Tests', () => {
  const mockAdmin: UserRow = {
    id: 'u-admin',
    name: 'Quản trị viên Hệ thống',
    email: 'admin@classmanager.local',
    phone: '0901234567',
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockGVCN_6A1: UserRow = {
    id: 'u-tea-01', // Thầy Nguyễn Văn An (GVCN 6A1, dạy Toán 6A1, 6A2, 7A1, 7A2)
    name: 'Thầy Nguyễn Văn An',
    email: 'an.nguyen@classmanager.local',
    phone: '0912345601',
    role: 'TEACHER',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockGVBM_Cuong: UserRow = {
    id: 'u-tea-24', // Thầy Hoàng Văn Cường (chỉ làm GVBM môn Công nghệ)
    name: 'Thầy Hoàng Văn Cường',
    email: 'cuong.hoang@classmanager.local',
    phone: '0912345624',
    role: 'TEACHER',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockDisabledTeacher: UserRow = {
    id: 'u-tea-23', // Thầy Vũ Đình Trọng (disabled)
    name: 'Thầy Vũ Đình Trọng',
    email: 'trong.vu@classmanager.local',
    phone: '0912345623',
    role: 'TEACHER',
    status: 'disabled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('Admin should have full permissions across all classes', () => {
    expect(AuthGuard.isAdmin(mockAdmin)).toBe(true);
    expect(AuthGuard.canEditStudent(mockAdmin, 'c-6a1')).toBe(true);
    expect(AuthGuard.canManageSeating(mockAdmin, 'c-6a1')).toBe(true);
    expect(AuthGuard.canManageAttendance(mockAdmin, 'c-6a1')).toBe(true);
    expect(AuthGuard.canManageTeacherAssignment(mockAdmin)).toBe(true);
  });

  it('Homeroom Teacher (GVCN) should have management rights in their own class', () => {
    expect(AuthGuard.isHomeroomTeacher(mockGVCN_6A1, 'c-6a1')).toBe(true);
    expect(AuthGuard.canEditStudent(mockGVCN_6A1, 'c-6a1')).toBe(true);
    expect(AuthGuard.canManageSeating(mockGVCN_6A1, 'c-6a1')).toBe(true);
    expect(AuthGuard.canManageAttendance(mockGVCN_6A1, 'c-6a1')).toBe(true);
    expect(AuthGuard.canManageAnnouncement(mockGVCN_6A1, 'c-6a1')).toBe(true);
  });

  it('GVCN should NOT have homeroom rights in a class where they only teach a subject', () => {
    // Thầy An chỉ dạy Toán ở 6A2 (GVCN 6A2 là Cô Trần Thị Bình)
    expect(AuthGuard.isHomeroomTeacher(mockGVCN_6A1, 'c-6a2')).toBe(false);
    expect(AuthGuard.canEditStudent(mockGVCN_6A1, 'c-6a2')).toBe(false);
    expect(AuthGuard.canManageSeating(mockGVCN_6A1, 'c-6a2')).toBe(false);
    expect(AuthGuard.canManageAnnouncement(mockGVCN_6A1, 'c-6a2')).toBe(false);
  });

  it('Subject Teacher (GVBM) can ONLY take attendance for their assigned subject', () => {
    // Thầy An dạy môn Toán (sub-mat) ở 6A2
    expect(AuthGuard.canManageAttendance(mockGVCN_6A1, 'c-6a2', 'sub-mat')).toBe(true);
    // Nhưng Thầy An KHÔNG ĐƯỢC điểm danh môn Ngữ văn (sub-lit) ở 6A2
    expect(AuthGuard.canManageAttendance(mockGVCN_6A1, 'c-6a2', 'sub-lit')).toBe(false);
    // Và KHÔNG ĐƯỢC điểm danh chung cả buổi không có môn ở 6A2
    expect(AuthGuard.canManageAttendance(mockGVCN_6A1, 'c-6a2', null)).toBe(false);
  });

  it('GVBM without homeroom duty should have NO management rights in any class', () => {
    expect(AuthGuard.canEditStudent(mockGVBM_Cuong, 'c-6a1')).toBe(false);
    expect(AuthGuard.canManageSeating(mockGVBM_Cuong, 'c-6a1')).toBe(false);
    expect(AuthGuard.canManageAnnouncement(mockGVBM_Cuong, 'c-6a1')).toBe(false);
  });

  it('Disabled teacher should be completely rejected from all operations', () => {
    expect(AuthGuard.hasAccessToClass(mockDisabledTeacher, 'c-6a1')).toBe(false);
    expect(AuthGuard.canEditStudent(mockDisabledTeacher, 'c-6a1')).toBe(false);
    expect(AuthGuard.canManageSeating(mockDisabledTeacher, 'c-6a1')).toBe(false);
    expect(AuthGuard.canManageAttendance(mockDisabledTeacher, 'c-6a1')).toBe(false);
  });
});
