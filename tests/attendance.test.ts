import { describe, it, expect } from 'vitest';
import { AttendanceService } from '@/services/attendance.service';
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
});
