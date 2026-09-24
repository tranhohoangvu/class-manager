import {
  AttendanceRow,
  AttendanceStatus,
  UserRow,
  StudentRow,
} from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';

const VALID_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export const AttendanceService = {
  getAttendanceRecords(
    classId?: string,
    subjectId?: string,
    currentUser?: UserRow | null
  ): AttendanceRow[] {
    if (currentUser !== undefined && currentUser !== null && classId) {
      if (!AuthGuard.canViewAttendance(currentUser, classId, subjectId)) {
        return [];
      }
    }
    return LocalStore.getAttendanceRecords(classId, subjectId);
  },

  getAttendanceForDate(
    dateStr: string,
    classId?: string,
    subjectId?: string,
    currentUser?: UserRow | null
  ): AttendanceRow[] {
    if (currentUser !== undefined && currentUser !== null && classId) {
      if (!AuthGuard.canViewAttendance(currentUser, classId, subjectId)) {
        return [];
      }
    }
    return LocalStore.getAttendanceForDate(dateStr, classId, subjectId);
  },

  saveAttendanceBatch(
    dateStr: string,
    entries: Array<{ student_id: string; status: AttendanceStatus; note: string }>,
    classId: string,
    subjectId: string | undefined,
    currentUser: UserRow | null
  ): OperationResult<void> {
    // 1. Authorization check
    if (!currentUser) {
      return failure('Thao tác yêu cầu đăng nhập tài khoản.');
    }
    if (currentUser.status === 'disabled') {
      return failure('Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa.');
    }

    const effectiveSubjectId = subjectId && subjectId.trim() !== '' ? subjectId : undefined;
    if (!AuthGuard.canManageAttendance(currentUser, classId, effectiveSubjectId)) {
      if (effectiveSubjectId) {
        return failure('Bạn không được phân công giảng dạy môn học này tại lớp đã chọn. Giáo viên chỉ được điểm danh các tiết/môn mà mình được phân công giảng dạy.');
      }
      return failure('Giáo viên chỉ được điểm danh các tiết/môn mà mình được phân công giảng dạy tại lớp này.');
    }

    // 2. Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return failure('Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD.');
    }

    // 3. Validate entries and statuses
    const classStudents = LocalStore.getStudents(classId);
    const validStudentIds = new Set(classStudents.map((s) => s.id));

    for (const entry of entries) {
      if (!validStudentIds.has(entry.student_id)) {
        return failure(`Học sinh ID "${entry.student_id}" không thuộc ${classId}.`);
      }
      if (!VALID_STATUSES.includes(entry.status)) {
        return failure(`Trạng thái điểm danh "${entry.status}" không hợp lệ.`);
      }
    }

    // 4. Save through LocalStore
    LocalStore.saveAttendanceBatch(
      dateStr,
      entries,
      classId,
      effectiveSubjectId,
      currentUser?.id
    );

    return success();
  },

  /**
   * Computes accurate historical metrics for a class across all recorded dates.
   */
  getAttendanceHistory(classId: string) {
    const students = LocalStore.getStudents(classId).filter((s) => s.status === 'active');
    const records = LocalStore.getAttendanceRecords(classId);

    // Get unique dates descending
    const dateSet = new Set<string>();
    records.forEach((r) => dateSet.add(r.date));
    const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

    // Build lookup map: `${student_id}_${date}` -> status
    const recordMap = new Map<string, AttendanceStatus>();
    records.forEach((r) => {
      recordMap.set(`${r.student_id}_${r.date}`, r.status);
    });

    const studentStats = students.map((stu) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      dates.forEach((d) => {
        const st = recordMap.get(`${stu.id}_${d}`);
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'late') late++;
        else if (st === 'excused') excused++;
      });

      const totalSessions = present + absent + late + excused;
      const rate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 100;

      return {
        student: stu,
        present,
        absent,
        late,
        excused,
        totalSessions,
        rate,
      };
    });

    const needAttention = studentStats
      .filter((s) => s.absent > 0 || s.late >= 2)
      .slice(0, 10);

    return {
      dates,
      studentStats,
      needAttention,
      totalDatesRecorded: dates.length,
    };
  },

  resetAttendanceForDate(
    dateStr: string,
    classId?: string,
    currentUser?: UserRow | null
  ): OperationResult<{ resetCount: number; date: string; classId?: string }> {
    if (!currentUser) {
      return failure('Thao tác yêu cầu đăng nhập.');
    }

    if (currentUser.status === 'disabled') {
      return failure('Tài khoản của bạn đã bị khóa.');
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return failure('Định dạng ngày không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.');
    }

    // RBAC:
    // Whole school reset (no classId provided): ADMIN only
    if (!classId) {
      if (currentUser.role !== 'ADMIN') {
        return failure('Chỉ Quản trị viên (Admin) mới có quyền đặt lại điểm danh cho toàn trường.');
      }
    } else {
      // Specific class reset: ADMIN or Homeroom Teacher of that class
      if (currentUser.role !== 'ADMIN') {
        const isHomeroom = LocalStore.getClassRole(currentUser.id, classId) === 'HOMEROOM_TEACHER';
        if (!isHomeroom) {
          return failure('Bạn chỉ có quyền đặt lại điểm danh cho lớp mà bạn làm Giáo viên chủ nhiệm.');
        }
      }
    }

    const resetCount = LocalStore.resetAttendanceForDate(dateStr, classId);
    return success({ resetCount, date: dateStr, classId });
  },
};

