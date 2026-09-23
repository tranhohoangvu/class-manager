import {
  TimetableEntryRow,
  UserRow,
  SubjectRow,
} from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';
import {
  TIMETABLE_PERIODS,
  TIMETABLE_DAYS,
  TimetablePeriodConfig,
} from '@/lib/constants';
import { generateTimetableForClass } from '@/lib/mock-data';

export interface CurrentPeriodInfo {
  dayOfWeek: number; // 2..7 (Thứ Hai -> Thứ Bảy), 8 = Chủ Nhật
  period: number | null; // 1..5 nếu đang trong tiết học, null nếu ngoài tiết
  isSchoolHours: boolean;
  status: 'in_period' | 'break' | 'before_school' | 'after_school' | 'day_off';
  periodConfig: TimetablePeriodConfig | null;
  nextPeriod: TimetablePeriodConfig | null;
}

export interface CurrentSessionInfo {
  periodInfo: TimetablePeriodConfig | null;
  entry: TimetableEntryRow | null;
  subject: SubjectRow | null;
  teacher: UserRow | null;
  isOngoing: boolean;
  isBreak: boolean;
  nextEntry: TimetableEntryRow | null;
  nextSubject: SubjectRow | null;
}

export interface TimetableConflict {
  type: 'CLASS_CONFLICT' | 'TEACHER_CONFLICT';
  classId: string;
  className: string;
  dayOfWeek: number;
  dayName: string;
  period: number;
  periodLabel: string;
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  message: string;
}

export interface TimetableValidationResult {
  valid: boolean;
  conflict?: TimetableConflict;
  conflicts?: TimetableConflict[];
  error?: string;
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export const TimetableService = {
  /**
   * Lấy toàn bộ thời khóa biểu của một lớp
   */
  getTimetableForClass(classId: string): TimetableEntryRow[] {
    return LocalStore.getTimetable(classId);
  },

  /**
   * Tính toán trạng thái thời gian và tiết học hiện tại
   */
  getCurrentPeriodInfo(now: Date = new Date()): CurrentPeriodInfo {
    const jsDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dayOfWeek = jsDay === 0 ? 8 : jsDay + 1; // 2 = Mon ... 7 = Sat, 8 = Sun

    if (dayOfWeek === 8) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: false,
        status: 'day_off',
        periodConfig: null,
        nextPeriod: null,
      };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const firstPeriodStart = timeToMinutes(TIMETABLE_PERIODS[0].startTime);
    const lastPeriodEnd = timeToMinutes(TIMETABLE_PERIODS[TIMETABLE_PERIODS.length - 1].endTime);

    if (currentMinutes < firstPeriodStart) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: false,
        status: 'before_school',
        periodConfig: null,
        nextPeriod: TIMETABLE_PERIODS[0],
      };
    }

    if (currentMinutes > lastPeriodEnd) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: false,
        status: 'after_school',
        periodConfig: null,
        nextPeriod: null,
      };
    }

    // Kiểm tra từng tiết học
    for (let i = 0; i < TIMETABLE_PERIODS.length; i++) {
      const p = TIMETABLE_PERIODS[i];
      const start = timeToMinutes(p.startTime);
      const end = timeToMinutes(p.endTime);

      if (currentMinutes >= start && currentMinutes <= end) {
        const next = i + 1 < TIMETABLE_PERIODS.length ? TIMETABLE_PERIODS[i + 1] : null;
        return {
          dayOfWeek,
          period: p.period,
          isSchoolHours: true,
          status: 'in_period',
          periodConfig: p,
          nextPeriod: next,
        };
      }
    }

    // Đang trong giờ ra chơi giữa các tiết
    let nextP: TimetablePeriodConfig | null = null;
    for (const p of TIMETABLE_PERIODS) {
      const start = timeToMinutes(p.startTime);
      if (currentMinutes < start) {
        nextP = p;
        break;
      }
    }

    return {
      dayOfWeek,
      period: null,
      isSchoolHours: true,
      status: 'break',
      periodConfig: null,
      nextPeriod: nextP,
    };
  },

  /**
   * Lấy phiên học hiện tại của một lớp học theo thời gian thực
   */
  getCurrentSession(classId: string, now: Date = new Date()): CurrentSessionInfo {
    const periodInfo = this.getCurrentPeriodInfo(now);
    const timetable = this.getTimetableForClass(classId);

    if (periodInfo.status === 'in_period' && periodInfo.period !== null) {
      const entry =
        timetable.find(
          (t) => t.day_of_week === periodInfo.dayOfWeek && t.period === periodInfo.period
        ) || null;

      const subject = entry ? LocalStore.getSubjectById(entry.subject_id) : null;
      const teacher = entry && entry.teacher_id ? LocalStore.getUserById(entry.teacher_id) : null;

      let nextEntry: TimetableEntryRow | null = null;
      let nextSubject: SubjectRow | null = null;
      if (periodInfo.nextPeriod) {
        nextEntry =
          timetable.find(
            (t) =>
              t.day_of_week === periodInfo.dayOfWeek && t.period === periodInfo.nextPeriod!.period
          ) || null;
        if (nextEntry) {
          nextSubject = LocalStore.getSubjectById(nextEntry.subject_id);
        }
      }

      return {
        periodInfo: periodInfo.periodConfig,
        entry,
        subject,
        teacher,
        isOngoing: true,
        isBreak: false,
        nextEntry,
        nextSubject,
      };
    }

    if (periodInfo.status === 'break' && periodInfo.nextPeriod) {
      const nextEntry =
        timetable.find(
          (t) =>
            t.day_of_week === periodInfo.dayOfWeek && t.period === periodInfo.nextPeriod!.period
        ) || null;
      const nextSubject = nextEntry ? LocalStore.getSubjectById(nextEntry.subject_id) : null;

      return {
        periodInfo: periodInfo.nextPeriod,
        entry: null,
        subject: null,
        teacher: null,
        isOngoing: false,
        isBreak: true,
        nextEntry,
        nextSubject,
      };
    }

    return {
      periodInfo: null,
      entry: null,
      subject: null,
      teacher: null,
      isOngoing: false,
      isBreak: false,
      nextEntry: null,
      nextSubject: null,
    };
  },

  /**
   * Kiểm tra xung đột trong cùng một lớp: Một lớp chỉ được có tối đa 1 timetable entry tại Class + Day + Period.
   */
  checkClassConflict(
    classId: string,
    dayOfWeek: number,
    period: number,
    excludeEntryId?: string
  ): TimetableConflict | null {
    const list = LocalStore.getTimetable(classId);
    const conflict = list.find(
      (t) =>
        t.day_of_week === dayOfWeek &&
        t.period === period &&
        t.id !== excludeEntryId
    );

    if (!conflict) return null;

    const cls = LocalStore.getClassById(classId);
    const subj = LocalStore.getSubjectById(conflict.subject_id);
    const dayObj = TIMETABLE_DAYS.find((d) => d.day === dayOfWeek);
    const periodObj = TIMETABLE_PERIODS.find((p) => p.period === period);
    const dayName = dayObj?.name || `Thứ ${dayOfWeek}`;
    const periodLabel = periodObj?.label || `Tiết ${period}`;
    const className = cls?.name || classId;
    const subjectName = subj?.name || conflict.subject_id;

    return {
      type: 'CLASS_CONFLICT',
      classId,
      className,
      dayOfWeek,
      dayName,
      period,
      periodLabel,
      subjectId: conflict.subject_id,
      subjectName,
      teacherId: conflict.teacher_id || undefined,
      message: `Lớp ${className} đã có tiết học môn ${subjectName} vào ${dayName}, ${periodLabel}.`,
    };
  },

  /**
   * Kiểm tra xung đột giáo viên giữa các lớp:
   * Một giáo viên không được dạy hai lớp khác nhau tại cùng một ngày và cùng một tiết.
   * Quét TOÀN BỘ timetable entries trên toàn trường.
   */
  checkTeacherConflict(
    teacherId: string | null | undefined,
    dayOfWeek: number,
    period: number,
    excludeEntryId?: string,
    targetClassId?: string
  ): TimetableConflict | null {
    if (!teacherId) return null;

    const all = LocalStore.getAllTimetables();
    const conflict = all.find(
      (t) =>
        t.teacher_id === teacherId &&
        t.day_of_week === dayOfWeek &&
        t.period === period &&
        (excludeEntryId ? t.id !== excludeEntryId : true) &&
        (targetClassId ? t.class_id !== targetClassId : true)
    );

    if (!conflict) return null;

    const teacher = LocalStore.getUserById(teacherId);
    const conflictClass = LocalStore.getClassById(conflict.class_id);
    const subj = LocalStore.getSubjectById(conflict.subject_id);
    const dayObj = TIMETABLE_DAYS.find((d) => d.day === dayOfWeek);
    const periodObj = TIMETABLE_PERIODS.find((p) => p.period === period);
    const dayName = dayObj?.name || `Thứ ${dayOfWeek}`;
    const periodLabel = periodObj?.label || `Tiết ${period}`;
    const teacherName = teacher?.name || 'Giáo viên';
    const conflictClassName = conflictClass?.name || conflict.class_id;
    const subjectName = subj?.name || conflict.subject_id;

    return {
      type: 'TEACHER_CONFLICT',
      classId: conflict.class_id,
      className: conflictClassName,
      dayOfWeek,
      dayName,
      period,
      periodLabel,
      subjectId: conflict.subject_id,
      subjectName,
      teacherId,
      teacherName,
      message: `Không thể xếp tiết học này. Giáo viên ${teacherName} đã được xếp dạy lớp ${conflictClassName} (môn ${subjectName}) vào ${dayName}, ${periodLabel}.`,
    };
  },

  /**
   * Validate toàn diện một entry trước khi persist.
   */
  validateTimetableEntry(
    entry: {
      class_id: string;
      day_of_week: number;
      period: number;
      subject_id: string;
      teacher_id?: string | null;
      id?: string;
    },
    excludeEntryId?: string
  ): TimetableValidationResult {
    if (entry.day_of_week < 2 || entry.day_of_week > 7) {
      return { valid: false, error: 'Ngày trong tuần không hợp lệ (chỉ từ Thứ Hai đến Thứ Bảy).' };
    }
    if (entry.period < 1 || entry.period > 5) {
      return { valid: false, error: 'Tiết học không hợp lệ (chỉ từ Tiết 1 đến Tiết 5).' };
    }

    const effectiveExcludeId = excludeEntryId || entry.id;

    // Resolve teacher if not explicitly provided
    let effectiveTeacherId = entry.teacher_id;
    if (!effectiveTeacherId) {
      const assignments = LocalStore.getSubjectAssignmentsForClass(entry.class_id);
      const match = assignments.find((a) => a.subject_id === entry.subject_id);
      if (match) {
        effectiveTeacherId = match.teacher_id;
      }
    }

    // 1. Check teacher conflict across ALL classes in the school
    const teacherConflict = this.checkTeacherConflict(
      effectiveTeacherId,
      entry.day_of_week,
      entry.period,
      effectiveExcludeId,
      entry.class_id
    );
    if (teacherConflict) {
      return {
        valid: false,
        conflict: teacherConflict,
        error: teacherConflict.message,
      };
    }

    // 2. Check class conflict within same class (different entry occupying this slot)
    const classConflict = this.checkClassConflict(
      entry.class_id,
      entry.day_of_week,
      entry.period,
      effectiveExcludeId
    );
    if (classConflict) {
      return {
        valid: false,
        conflict: classConflict,
        error: classConflict.message,
      };
    }

    return { valid: true };
  },

  /**
   * Lưu hoặc cập nhật một tiết học trong TKB (có kiểm tra và ngăn chặn xung đột)
   */
  saveEntry(
    classId: string,
    dayOfWeek: number,
    period: number,
    subjectId: string,
    teacherId: string | null,
    currentUser: UserRow | null
  ): OperationResult<TimetableEntryRow> {
    if (!AuthGuard.isHomeroomTeacher(currentUser, classId)) {
      return failure('Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên mới có quyền xếp Thời khóa biểu.');
    }

    if (dayOfWeek < 2 || dayOfWeek > 7) {
      return failure('Ngày trong tuần không hợp lệ (chỉ từ Thứ Hai đến Thứ Bảy).');
    }

    if (period < 1 || period > 5) {
      return failure('Tiết học không hợp lệ (chỉ từ Tiết 1 đến Tiết 5).');
    }

    const subject = LocalStore.getSubjectById(subjectId);
    if (!subject) {
      return failure('Môn học không tồn tại trong hệ thống.');
    }

    // Tự động gán giáo viên theo phân công nếu chưa chỉ định
    let effectiveTeacherId = teacherId;
    if (!effectiveTeacherId) {
      const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
      const match = assignments.find((a) => a.subject_id === subjectId);
      if (match) {
        effectiveTeacherId = match.teacher_id;
      }
    }

    // Tìm entry hiện có tại slot này để lấy id (tránh self-conflict khi update cùng slot)
    const existingEntry = LocalStore.getTimetableEntry(classId, dayOfWeek, period);

    // Validate conflict trước khi persist!
    const validation = this.validateTimetableEntry(
      {
        class_id: classId,
        day_of_week: dayOfWeek,
        period,
        subject_id: subjectId,
        teacher_id: effectiveTeacherId,
        id: existingEntry?.id,
      },
      existingEntry?.id
    );

    if (!validation.valid) {
      return failure(validation.error || 'Xung đột Thời khóa biểu.');
    }

    const saved = LocalStore.saveTimetableEntry({
      class_id: classId,
      day_of_week: dayOfWeek,
      period,
      subject_id: subjectId,
      teacher_id: effectiveTeacherId,
    });

    return success(saved);
  },

  /**
   * Tạo một timetable entry mới với đầy đủ kiểm tra conflict
   */
  createEntry(
    entry: {
      class_id: string;
      day_of_week: number;
      period: number;
      subject_id: string;
      teacher_id?: string | null;
    },
    currentUser: UserRow | null
  ): OperationResult<TimetableEntryRow> {
    return this.saveEntry(
      entry.class_id,
      entry.day_of_week,
      entry.period,
      entry.subject_id,
      entry.teacher_id || null,
      currentUser
    );
  },

  /**
   * Cập nhật một timetable entry hiện có (hỗ trợ đổi slot, đổi giáo viên, đổi môn)
   */
  updateEntry(
    entryId: string,
    changes: {
      day_of_week?: number;
      period?: number;
      subject_id?: string;
      teacher_id?: string | null;
    },
    currentUser: UserRow | null
  ): OperationResult<TimetableEntryRow> {
    const all = LocalStore.getAllTimetables();
    const currentEntry = all.find((t) => t.id === entryId);
    if (!currentEntry) {
      return failure('Không tìm thấy tiết học cần cập nhật.');
    }

    if (!AuthGuard.isHomeroomTeacher(currentUser, currentEntry.class_id)) {
      return failure('Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên mới có quyền cập nhật Thời khóa biểu.');
    }

    const targetDay = changes.day_of_week ?? currentEntry.day_of_week;
    const targetPeriod = changes.period ?? currentEntry.period;
    const targetSubjectId = changes.subject_id ?? currentEntry.subject_id;
    let targetTeacherId = changes.teacher_id !== undefined ? changes.teacher_id : currentEntry.teacher_id;

    if (!targetTeacherId) {
      const assignments = LocalStore.getSubjectAssignmentsForClass(currentEntry.class_id);
      const match = assignments.find((a) => a.subject_id === targetSubjectId);
      if (match) {
        targetTeacherId = match.teacher_id;
      }
    }

    // Validate conflict excluding currentEntry.id
    const validation = this.validateTimetableEntry(
      {
        id: entryId,
        class_id: currentEntry.class_id,
        day_of_week: targetDay,
        period: targetPeriod,
        subject_id: targetSubjectId,
        teacher_id: targetTeacherId,
      },
      entryId
    );

    if (!validation.valid) {
      return failure(validation.error || 'Xung đột Thời khóa biểu.');
    }

    // If slot changed (e.g. day or period moved), remove old slot from class
    if (targetDay !== currentEntry.day_of_week || targetPeriod !== currentEntry.period) {
      LocalStore.deleteTimetableEntry(currentEntry.class_id, currentEntry.day_of_week, currentEntry.period);
    }

    const saved = LocalStore.saveTimetableEntry({
      class_id: currentEntry.class_id,
      day_of_week: targetDay,
      period: targetPeriod,
      subject_id: targetSubjectId,
      teacher_id: targetTeacherId,
    });

    return success(saved);
  },

  /**
   * Xóa một tiết học
   */
  deleteEntry(
    classId: string,
    dayOfWeek: number,
    period: number,
    currentUser: UserRow | null
  ): OperationResult<boolean> {
    if (!AuthGuard.isHomeroomTeacher(currentUser, classId)) {
      return failure('Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên mới có quyền xóa tiết học.');
    }

    const ok = LocalStore.deleteTimetableEntry(classId, dayOfWeek, period);
    return success(ok);
  },

  /**
   * Áp dụng mẫu chuẩn THCS cho lớp (Validate conflict trước khi commit)
   */
  applyStandardTemplate(
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<TimetableEntryRow[]> {
    if (!AuthGuard.isHomeroomTeacher(currentUser, classId)) {
      return failure('Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên mới có quyền thiết lập mẫu Thời khóa biểu.');
    }

    // Sinh các entries mẫu cho classId
    const templateEntries = generateTimetableForClass(classId);

    // Validate conflict đối với các lớp khác
    const conflicts: TimetableConflict[] = [];
    for (const entry of templateEntries) {
      const teacherConflict = this.checkTeacherConflict(
        entry.teacher_id,
        entry.day_of_week,
        entry.period,
        undefined,
        classId
      );
      if (teacherConflict) {
        conflicts.push(teacherConflict);
      }
    }

    if (conflicts.length > 0) {
      const summaryList = conflicts
        .slice(0, 5)
        .map((c) => `• ${c.dayName} — ${c.periodLabel}: GV ${c.teacherName || 'phụ trách'} đang dạy lớp ${c.className}`)
        .join('\n');
      const moreText = conflicts.length > 5 ? `\n... và ${conflicts.length - 5} tiết khác.` : '';

      return failure(
        `Không thể áp dụng mẫu Thời khóa biểu. Có ${conflicts.length} tiết bị xung đột với lịch dạy của giáo viên ở lớp khác:\n${summaryList}${moreText}`
      );
    }

    const updated = LocalStore.setTimetableForClass(classId, templateEntries);
    return success(updated);
  },

  /**
   * Sao chép TKB từ một lớp học khác (Validate conflict toàn diện trước khi commit)
   */
  copyFromClass(
    sourceClassId: string,
    targetClassId: string,
    currentUser: UserRow | null
  ): OperationResult<TimetableEntryRow[]> {
    if (!AuthGuard.isHomeroomTeacher(currentUser, targetClassId)) {
      return failure('Bạn không có quyền chỉnh sửa Thời khóa biểu của lớp đích.');
    }

    if (sourceClassId === targetClassId) {
      return failure('Lớp nguồn và lớp đích không được trùng nhau.');
    }

    const sourceClass = LocalStore.getClassById(sourceClassId);
    if (!sourceClass) {
      return failure('Không tìm thấy lớp học nguồn.');
    }

    const sourceEntries = LocalStore.getTimetable(sourceClassId);
    if (sourceEntries.length === 0) {
      return failure('Thời khóa biểu lớp nguồn đang trống.');
    }

    const targetAssignments = LocalStore.getSubjectAssignmentsForClass(targetClassId);
    const teacherMap = new Map<string, string>();
    targetAssignments.forEach((a) => teacherMap.set(a.subject_id, a.teacher_id));

    // 1. Xác định toàn bộ entries đích dự kiến
    const candidateEntries = sourceEntries.map((item) => ({
      class_id: targetClassId,
      day_of_week: item.day_of_week,
      period: item.period,
      subject_id: item.subject_id,
      teacher_id: teacherMap.get(item.subject_id) || item.teacher_id,
    }));

    // 2. Validate conflict từng entry đối với các lớp KHÁC targetClassId
    const conflicts: TimetableConflict[] = [];

    for (const cand of candidateEntries) {
      const teacherConflict = this.checkTeacherConflict(
        cand.teacher_id,
        cand.day_of_week,
        cand.period,
        undefined,
        targetClassId
      );

      if (teacherConflict) {
        conflicts.push(teacherConflict);
      }
    }

    // 3. Nếu có bất kỳ conflict nào, KHÔNG commit dữ liệu (Atomic)
    if (conflicts.length > 0) {
      const summaryList = conflicts
        .slice(0, 5)
        .map((c) => `• ${c.dayName} — ${c.periodLabel}: GV ${c.teacherName || 'phụ trách'} đang dạy lớp ${c.className}`)
        .join('\n');
      const moreText = conflicts.length > 5 ? `\n... và ${conflicts.length - 5} tiết khác.` : '';

      return failure(
        `Không thể sao chép toàn bộ TKB. Có ${conflicts.length} tiết bị xung đột:\n${summaryList}${moreText}`
      );
    }

    // 4. Toàn bộ hợp lệ -> commit
    const updated = LocalStore.copyTimetable(sourceClassId, targetClassId);
    return success(updated);
  },

  /**
   * Xóa sạch thời khóa biểu của một lớp
   */
  clearTimetable(
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<boolean> {
    if (!AuthGuard.isHomeroomTeacher(currentUser, classId)) {
      return failure('Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên mới có quyền xóa Thời khóa biểu.');
    }

    const ok = LocalStore.clearTimetable(classId);
    return success(ok);
  },
};
