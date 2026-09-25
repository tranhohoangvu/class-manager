import { describe, it, expect } from 'vitest';
import { AttendanceService } from '@/services/attendance.service';
import { AuthGuard } from '@/services/auth-guard';
import { LocalStore } from '@/lib/store';
import { UserRow } from '@/types';

describe('Attendance System & Calculations Tests', () => {
  const mockAdmin: UserRow = {
    id: 'u-admin-01',
    name: 'Admin',
    email: 'admin@school.edu.vn',
    phone: null,
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('Rejects attendance save if date format is invalid', () => {
    const res = AttendanceService.saveAttendanceBatch(
      '22-09-2026', // wrong format, should be YYYY-MM-DD
      [],
      'c-6a1',
      undefined,
      mockAdmin
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('Định dạng ngày không hợp lệ');
  });

  it('Rejects attendance save with invalid attendance status', () => {
    const res = AttendanceService.saveAttendanceBatch(
      '2026-09-22',
      [
        {
          student_id: 'stu-c-6a1-01',
          status: 'unknown_status' as any,
          note: '',
        },
      ],
      'c-6a1',
      undefined,
      mockAdmin
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('không hợp lệ');
  });

  it('Calculates attendance history metrics correctly', () => {
    const history = AttendanceService.getAttendanceHistory('c-6a1');
    expect(history.dates).toBeInstanceOf(Array);
    expect(history.studentStats).toHaveLength(30);

    history.studentStats.forEach((s) => {
      expect(s.rate).toBeGreaterThanOrEqual(0);
      expect(s.rate).toBeLessThanOrEqual(100);
      expect(s.present + s.absent + s.late + s.excused).toBe(s.totalSessions);
    });
  });

  describe('Attendance Authorization & RBAC Tests', () => {
    const mockGVCN_6A1: UserRow = {
      id: 'u-tea-01', // Thầy Nguyễn Văn An: GVCN 6A1, dạy Toán (sub-mat)
      name: 'Thầy Nguyễn Văn An',
      email: 'an.nguyen@schoolops.local',
      phone: '0912345601',
      role: 'TEACHER',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockGVBM_Lit: UserRow = {
      id: 'u-tea-05', // Cô Trần Thị Bình: dạy Ngữ văn (sub-lit) ở 6A1
      name: 'Cô Trần Thị Bình',
      email: 'binh.tran@schoolops.local',
      phone: '0912345605',
      role: 'TEACHER',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockGVBM_Other: UserRow = {
      id: 'u-tea-24', // Thầy Hoàng Văn Cường: không dạy môn nào ở 6A1
      name: 'Thầy Hoàng Văn Cường',
      email: 'cuong.hoang@schoolops.local',
      phone: '0912345624',
      role: 'TEACHER',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockDisabledTeacher: UserRow = {
      id: 'u-tea-23',
      name: 'Thầy Vũ Đình Trọng',
      email: 'trong.vu@schoolops.local',
      phone: '0912345623',
      role: 'TEACHER',
      status: 'disabled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const validRecord = [
      {
        student_id: 'stu-c-6a1-01',
        status: 'present' as const,
        note: '',
      },
    ];

    it('1. Rejects attendance when user is not provided', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-mat',
        null
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('yêu cầu đăng nhập');
    });

    it('2. Rejects attendance when user account is disabled', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-mat',
        mockDisabledTeacher
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('bị khóa');
    });

    it('3. Admin can save attendance for any subject', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-mat',
        mockAdmin
      );
      expect(res.success).toBe(true);
    });

    it('4. Admin can save general attendance without a subject', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        undefined,
        mockAdmin
      );
      expect(res.success).toBe(true);
    });

    it('5. GVCN can save attendance for their own assigned subject (Toán)', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-mat',
        mockGVCN_6A1
      );
      expect(res.success).toBe(true);
    });

    it('6. GVCN CANNOT save attendance for another teacher\'s subject (Ngữ văn) in their own class', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-lit',
        mockGVCN_6A1
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('chỉ được điểm danh các tiết/môn mà mình được phân công');
    });

    it('7. GVCN CANNOT save general attendance without a subject', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        undefined,
        mockGVCN_6A1
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('chỉ được điểm danh các tiết/môn mà mình được phân công');
    });

    it('8. Subject Teacher (GVBM) can save attendance for their assigned subject (Ngữ văn)', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-lit',
        mockGVBM_Lit
      );
      expect(res.success).toBe(true);
    });

    it('9. Subject Teacher (GVBM) CANNOT save attendance for another subject (Toán)', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-mat',
        mockGVBM_Lit
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('chỉ được điểm danh các tiết/môn mà mình được phân công');
    });

    it('10. Teacher not assigned to this class CANNOT save attendance', () => {
      const res = AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-mat',
        mockGVBM_Other
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('chỉ được điểm danh các tiết/môn mà mình được phân công');
    });

    it('11. AuthGuard.canAttendPeriod checks timetable and assigned teachers accurately', () => {
      // Admin can attend any period
      expect(AuthGuard.canAttendPeriod(mockAdmin, 'c-6a1', 2, 1)).toBe(true);

      const entryP1 = LocalStore.getTimetableEntry('c-6a1', 2, 1);
      if (entryP1 && entryP1.subject_id) {
        if (entryP1.subject_id === 'sub-mat') {
          expect(AuthGuard.canAttendPeriod(mockGVCN_6A1, 'c-6a1', 2, 1)).toBe(true);
          expect(AuthGuard.canAttendPeriod(mockGVBM_Lit, 'c-6a1', 2, 1)).toBe(false);
        } else if (entryP1.subject_id === 'sub-lit') {
          expect(AuthGuard.canAttendPeriod(mockGVBM_Lit, 'c-6a1', 2, 1)).toBe(true);
          expect(AuthGuard.canAttendPeriod(mockGVCN_6A1, 'c-6a1', 2, 1)).toBe(false);
        }
      }

      // Teacher not in class can never attend any period
      expect(AuthGuard.canAttendPeriod(mockGVBM_Other, 'c-6a1', 2, 1)).toBe(false);
      // Disabled teacher can never attend any period
      expect(AuthGuard.canAttendPeriod(mockDisabledTeacher, 'c-6a1', 2, 1)).toBe(false);
    });

    it('12. AuthGuard.getTeacherAssignedSubjectsInClass returns only assigned subjects', () => {
      const gvcnSubjects = AuthGuard.getTeacherAssignedSubjectsInClass(mockGVCN_6A1, 'c-6a1');
      expect(gvcnSubjects.map((s) => s.id)).toContain('sub-mat');
      expect(gvcnSubjects.map((s) => s.id)).not.toContain('sub-lit');

      const gvbmSubjects = AuthGuard.getTeacherAssignedSubjectsInClass(mockGVBM_Lit, 'c-6a1');
      expect(gvbmSubjects.map((s) => s.id)).toContain('sub-lit');
      expect(gvbmSubjects.map((s) => s.id)).not.toContain('sub-mat');

      const otherSubjects = AuthGuard.getTeacherAssignedSubjectsInClass(mockGVBM_Other, 'c-6a1');
      expect(otherSubjects).toHaveLength(0);

      const adminSubjects = AuthGuard.getTeacherAssignedSubjectsInClass(mockAdmin, 'c-6a1');
      expect(adminSubjects.length).toBeGreaterThanOrEqual(10);
    });

    it('13. GVCN can VIEW attendance records of other subjects in their class, while GVBM is denied', () => {
      // First, save a valid record for Môn Ngữ văn (sub-lit) in 6A1 by GVBM Cô Bình
      AttendanceService.saveAttendanceBatch(
        '2026-09-23',
        validRecord,
        'c-6a1',
        'sub-lit',
        mockGVBM_Lit
      );

      // GVCN Thầy An (dạy Toán) CAN view the attendance of Ngữ văn in 6A1 (read-only)
      const gvcnRecords = AttendanceService.getAttendanceForDate(
        '2026-09-23',
        'c-6a1',
        'sub-lit',
        mockGVCN_6A1
      );
      expect(gvcnRecords.length).toBeGreaterThanOrEqual(1);

      // GVBM Thầy Cường (không dạy Ngữ văn) CANNOT view attendance of Ngữ văn in 6A1 -> returns empty []
      const unauthorizedRecords = AttendanceService.getAttendanceForDate(
        '2026-09-23',
        'c-6a1',
        'sub-lit',
        mockGVBM_Other
      );
      expect(unauthorizedRecords).toHaveLength(0);
    });

    it('14. resetAttendanceForDate RBAC: Rejects unauthenticated and non-admin whole-school reset', () => {
      // Unauthenticated
      const resNoUser = AttendanceService.resetAttendanceForDate('2026-09-25', undefined, null);
      expect(resNoUser.success).toBe(false);
      expect(resNoUser.error).toContain('yêu cầu đăng nhập');

      // Teacher attempting whole school reset
      const resTeacher = AttendanceService.resetAttendanceForDate('2026-09-25', undefined, mockGVCN_6A1);
      expect(resTeacher.success).toBe(false);
      expect(resTeacher.error).toContain('Chỉ Quản trị viên (Admin)');

      // Other teacher attempting class reset
      const resOtherTeacher = AttendanceService.resetAttendanceForDate('2026-09-25', 'c-6a1', mockGVBM_Other);
      expect(resOtherTeacher.success).toBe(false);
      expect(resOtherTeacher.error).toContain('Giáo viên chủ nhiệm');
    });

    it('15. resetAttendanceForDate: GVCN can reset their own class attendance', () => {
      const res = AttendanceService.resetAttendanceForDate('2026-09-25', 'c-6a1', mockGVCN_6A1);
      expect(res.success).toBe(true);
      expect(res.data?.resetCount).toBe(30);
    });

    it('16. resetAttendanceForDate: Admin can reset whole school attendance to 100% present', () => {
      // First, simulate some absentees on a test date
      AttendanceService.saveAttendanceBatch(
        '2026-09-26',
        [
          { student_id: 'stu-c-6a1-01', status: 'absent', note: 'Ốm' },
          { student_id: 'stu-c-6a1-02', status: 'late', note: 'Tắc đường' },
        ],
        'c-6a1',
        undefined,
        mockAdmin
      );

      // Verify that records exist
      const beforeReset = LocalStore.getAttendanceForDate('2026-09-26', 'c-6a1');
      expect(beforeReset.some((r) => r.status === 'absent')).toBe(true);

      // Perform whole school reset by Admin
      const resetRes = AttendanceService.resetAttendanceForDate('2026-09-26', undefined, mockAdmin);
      expect(resetRes.success).toBe(true);
      expect(resetRes.data?.resetCount).toBe(480);

      // Verify that all 480 students are now present, no absentees remain
      const afterReset = LocalStore.getAttendanceForDate('2026-09-26');
      expect(afterReset.length).toBe(480);
      expect(afterReset.every((r) => r.status === 'present')).toBe(true);
    });
  });
});
