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
  DAY_ALLOWED_PERIODS,
  isAllowedPeriodForDay,
  getGradeShift,
  isAllowedPeriodForClass,
  getClassHomeroomSlot,
} from '@/lib/constants';
import { generateTimetableForClass } from '@/lib/mock-data';

export interface CurrentPeriodInfo {
  dayOfWeek: number; // 2..7 (Thứ Hai -> Thứ Bảy), 8 = Chủ Nhật
  period: number | null; // 1..10 nếu đang trong tiết học, null nếu ngoài tiết
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
   * Lấy toàn bộ thời khóa biểu của một lớp (hỗ trợ kiểm tra phân quyền giáo viên)
   */
  getTimetableForClass(classId: string, currentUser?: UserRow | null): TimetableEntryRow[] {
    if (currentUser && !AuthGuard.canViewTimetable(currentUser, classId)) {
      return [];
    }
    return LocalStore.getTimetable(classId);
  },

  /**
   * Tính toán trạng thái thời gian và tiết học hiện tại
   * Hỗ trợ 2 ca (Sáng & Chiều), Thứ Hai - Thứ Sáu 10 tiết, Thứ Bảy 6 tiết
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

    const isSaturday = dayOfWeek === 7;
    const allowedPeriods = isSaturday ? [1, 2, 3, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const dayPeriods = TIMETABLE_PERIODS.filter((p) => allowedPeriods.includes(p.period));

    const morningPeriods = dayPeriods.filter((p) => p.shift === 'morning');
    const afternoonPeriods = dayPeriods.filter((p) => p.shift === 'afternoon');

    const morningAssemblyStart = 7 * 60; // 07:00
    const morningAssemblyEnd = 7 * 60 + 15; // 07:15
    const afternoonAssemblyStart = 12 * 60 + 45; // 12:45
    const afternoonAssemblyEnd = 13 * 60; // 13:00

    const morningEnd = timeToMinutes(morningPeriods[morningPeriods.length - 1].endTime);
    const afternoonEnd = timeToMinutes(afternoonPeriods[afternoonPeriods.length - 1].endTime);

    // 1. Trước 07:00 (chưa đến sinh hoạt đầu giờ)
    if (currentMinutes < morningAssemblyStart) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: false,
        status: 'before_school',
        periodConfig: null,
        nextPeriod: morningPeriods[0] || null,
      };
    }

    // 2. Sinh hoạt đầu giờ sáng (07:00 - 07:15, không phải tiết học)
    if (currentMinutes >= morningAssemblyStart && currentMinutes < morningAssemblyEnd) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: true,
        status: 'break',
        periodConfig: null,
        nextPeriod: morningPeriods[0] || null,
      };
    }

    // 3. Sau giờ học chiều (> afternoonEnd)
    if (currentMinutes > afternoonEnd) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: false,
        status: 'after_school',
        periodConfig: null,
        nextPeriod: null,
      };
    }

    // 4. Nghỉ trưa (sau ca sáng và trước 12:45)
    if (currentMinutes > morningEnd && currentMinutes < afternoonAssemblyStart) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: false,
        status: 'after_school',
        periodConfig: null,
        nextPeriod: afternoonPeriods[0] || null,
      };
    }

    // 5. Sinh hoạt đầu giờ chiều (12:45 - 13:00, không phải tiết học)
    if (currentMinutes >= afternoonAssemblyStart && currentMinutes < afternoonAssemblyEnd) {
      return {
        dayOfWeek,
        period: null,
        isSchoolHours: true,
        status: 'break',
        periodConfig: null,
        nextPeriod: afternoonPeriods[0] || null,
      };
    }

    // 6. Kiểm tra các tiết học trong ngày
    for (let i = 0; i < dayPeriods.length; i++) {
      const p = dayPeriods[i];
      const start = timeToMinutes(p.startTime);
      const end = timeToMinutes(p.endTime);

      if (currentMinutes >= start && currentMinutes <= end) {
        const next = i + 1 < dayPeriods.length ? dayPeriods[i + 1] : null;
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

    // 7. Giờ ra chơi giữa các tiết
    let nextP: TimetablePeriodConfig | null = null;
    for (const p of dayPeriods) {
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

    const cls = LocalStore.getClassById(entry.class_id);
    const grade = cls?.grade || 6;
    const shift = getGradeShift(grade);
    const homeroomSlot = getClassHomeroomSlot(grade);

    // Kiểm tra tính hợp lệ của tiết theo khối và ca học:
    // Khối 6, 9 -> Buổi Sáng (P1-P5 Thứ 2-6, P1-P3 Thứ 7)
    // Khối 7, 8 -> Buổi Chiều (P6-P10 Thứ 2-6, P6-P8 Thứ 7)
    if (!isAllowedPeriodForClass(grade, entry.day_of_week, entry.period)) {
      if (shift === 'morning') {
        if (entry.period >= 6) {
          return {
            valid: false,
            error: `Lớp ${cls?.name || entry.class_id} thuộc Khối ${grade} học buổi Sáng (Tiết 1-5), không học buổi Chiều (Tiết ${entry.period}).`,
          };
        }
        if (entry.day_of_week === 7 && entry.period > 3) {
          return {
            valid: false,
            error: `Tiết ${entry.period} không tồn tại vào Thứ Bảy. Thứ Bảy ca Sáng chỉ có 3 tiết (Tiết 1-3).`,
          };
        }
      } else {
        if (entry.period <= 5) {
          return {
            valid: false,
            error: `Lớp ${cls?.name || entry.class_id} thuộc Khối ${grade} học buổi Chiều (Tiết 6-10), không học buổi Sáng (Tiết ${entry.period}).`,
          };
        }
        if (entry.day_of_week === 7 && (entry.period < 6 || entry.period > 8)) {
          return {
            valid: false,
            error: `Tiết ${entry.period} không tồn tại vào Thứ Bảy. Thứ Bảy ca Chiều chỉ có 3 tiết (Tiết 6-8).`,
          };
        }
      }
      return {
        valid: false,
        error: `Tiết học ${entry.period} không hợp lệ cho lớp ${cls?.name || entry.class_id} vào ngày Thứ ${entry.day_of_week}.`,
      };
    }

    // Business rule: Thứ Bảy Sinh hoạt lớp cùng GVCN của lớp
    // Khối 6, 9: Tiết 3 | Khối 7, 8: Tiết 8
    const isHomeroomSlot = entry.day_of_week === 7 && entry.period === homeroomSlot.period;

    if (isHomeroomSlot) {
      if (entry.subject_id !== 'sub-shl') {
        return {
          valid: false,
          error: `Tiết ${entry.period} Thứ Bảy bắt buộc là tiết "Sinh hoạt lớp", không được đổi sang môn học khác.`,
        };
      }
      if (cls?.teacher_id && entry.teacher_id && entry.teacher_id !== cls.teacher_id) {
        return {
          valid: false,
          error: 'Tiết Sinh hoạt lớp Thứ Bảy phải do chính Giáo viên chủ nhiệm của lớp phụ trách.',
        };
      }
    }

    // Tiết Sinh hoạt lớp không được xếp vào các ngày hoặc tiết khác
    if (entry.subject_id === 'sub-shl' && !isHomeroomSlot) {
      return {
        valid: false,
        error: `Tiết Sinh hoạt lớp của Khối ${grade} (ca ${shift === 'morning' ? 'Sáng' : 'Chiều'}) chỉ được xếp vào Tiết ${homeroomSlot.period} của Thứ Bảy.`,
      };
    }

    const effectiveExcludeId = excludeEntryId || entry.id;

    // Resolve teacher if not explicitly provided
    let effectiveTeacherId = entry.teacher_id;
    if (!effectiveTeacherId) {
      if (entry.day_of_week === 7 && (entry.period === 3 || entry.period === 8)) {
        effectiveTeacherId = cls?.teacher_id || null;
      } else {
        const assignments = LocalStore.getSubjectAssignmentsForClass(entry.class_id);
        const match = assignments.find((a) => a.subject_id === entry.subject_id);
        if (match) {
          effectiveTeacherId = match.teacher_id;
        }
      }
    }

    // 1. Check teacher conflict across ALL classes in the school (bao gồm cả GVCN trong tiết Sinh hoạt lớp)
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

    if (period < 1 || period > 10) {
      return failure('Tiết học không hợp lệ (Tiết 1 đến Tiết 10).');
    }

    const cls = LocalStore.getClassById(classId);
    const grade = cls?.grade || 6;
    const shift = getGradeShift(grade);
    const homeroomSlot = getClassHomeroomSlot(grade);

    if (!isAllowedPeriodForClass(grade, dayOfWeek, period)) {
      if (shift === 'morning') {
        if (period >= 6) {
          return failure(`Lớp ${cls?.name || classId} thuộc Khối ${grade} học buổi Sáng (Tiết 1-5), không học buổi Chiều (Tiết ${period}).`);
        }
        if (dayOfWeek === 7) {
          return failure(`Tiết ${period} không tồn tại vào Thứ Bảy. Thứ Bảy ca Sáng chỉ có 3 tiết (Tiết 1-3).`);
        }
      } else {
        if (period <= 5) {
          return failure(`Lớp ${cls?.name || classId} thuộc Khối ${grade} học buổi Chiều (Tiết 6-10), không học buổi Sáng (Tiết ${period}).`);
        }
        if (dayOfWeek === 7) {
          return failure(`Tiết ${period} không tồn tại vào Thứ Bảy. Thứ Bảy ca Chiều chỉ có 3 tiết (Tiết 6-8).`);
        }
      }
      return failure(`Tiết học ${period} không hợp lệ.`);
    }

    // Business rule: Thứ Bảy Sinh hoạt lớp cùng GVCN
    let effectiveSubjectId = subjectId;
    let effectiveTeacherId = teacherId;

    const isHomeroomSlot = dayOfWeek === 7 && period === homeroomSlot.period;
    if (isHomeroomSlot) {
      if (subjectId !== 'sub-shl') {
        return failure(`Tiết ${period} Thứ Bảy bắt buộc là tiết Sinh hoạt lớp. Không được xếp môn học khác.`);
      }
      if (teacherId && cls?.teacher_id && teacherId !== cls.teacher_id) {
        const gvcnUser = LocalStore.getUserById(cls.teacher_id);
        return failure(
          `Tiết Sinh hoạt lớp (Thứ Bảy, Tiết ${period}) phải do Giáo viên chủ nhiệm (${gvcnUser?.name || 'GVCN'}) phụ trách.`
        );
      }
      effectiveSubjectId = 'sub-shl';
      effectiveTeacherId = cls?.teacher_id || null;
    }

    const subject = LocalStore.getSubjectById(effectiveSubjectId);
    if (!subject) {
      return failure('Môn học không tồn tại trong hệ thống.');
    }

    // Tự động gán giáo viên theo phân công nếu chưa chỉ định
    if (!effectiveTeacherId && !isHomeroomSlot) {
      const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
      const match = assignments.find((a) => a.subject_id === effectiveSubjectId);
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
        subject_id: effectiveSubjectId,
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
      subject_id: effectiveSubjectId,
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
    const existing = LocalStore.getTimetableEntry(entry.class_id, entry.day_of_week, entry.period);
    if (existing) {
      const conflict = this.checkClassConflict(entry.class_id, entry.day_of_week, entry.period);
      return failure(conflict?.message || `Lớp đã có tiết học vào thời gian này.`);
    }

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

    const cls = LocalStore.getClassById(currentEntry.class_id);
    const targetDay = changes.day_of_week ?? currentEntry.day_of_week;
    const targetPeriod = changes.period ?? currentEntry.period;
    let targetSubjectId = changes.subject_id ?? currentEntry.subject_id;
    let targetTeacherId = changes.teacher_id !== undefined ? changes.teacher_id : currentEntry.teacher_id;

    if (targetDay === 7 && (targetPeriod === 3 || targetPeriod === 8)) {
      targetSubjectId = 'sub-shl';
      targetTeacherId = cls?.teacher_id || null;
    }

    if (!targetTeacherId && !(targetDay === 7 && (targetPeriod === 3 || targetPeriod === 8))) {
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

    const cls = LocalStore.getClassById(classId);
    const grade = cls?.grade || 6;
    const homeroomSlot = getClassHomeroomSlot(grade);

    if (dayOfWeek === 7 && period === homeroomSlot.period) {
      return failure('Không thể xóa tiết Sinh hoạt lớp cố định của Thứ Bảy.');
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
    const targetClass = LocalStore.getClassById(targetClassId);
    const targetShift = targetClass ? getGradeShift(targetClass.grade) : 'morning';
    const sourceShift = sourceClass ? getGradeShift(sourceClass.grade) : 'morning';
    const targetHomeroomPeriod = targetShift === 'morning' ? 3 : 8;

    const teacherMap = new Map<string, string>();
    targetAssignments.forEach((a) => teacherMap.set(a.subject_id, a.teacher_id));

    // 1. Xác định toàn bộ entries đích dự kiến
    const candidateEntries = sourceEntries.map((item) => {
      let targetPeriod = item.period;
      if (sourceShift !== targetShift) {
        if (targetShift === 'afternoon' && sourceShift === 'morning') {
          targetPeriod = item.period + 5;
        } else if (targetShift === 'morning' && sourceShift === 'afternoon') {
          targetPeriod = item.period - 5;
        }
      }

      const isSHL = item.subject_id === 'sub-shl' || (item.day_of_week === 7 && targetPeriod === targetHomeroomPeriod);
      const teacherId = isSHL ? (targetClass?.teacher_id || null) : (teacherMap.get(item.subject_id) || item.teacher_id);
      return {
        class_id: targetClassId,
        day_of_week: item.day_of_week,
        period: targetPeriod,
        subject_id: isSHL ? 'sub-shl' : item.subject_id,
        teacher_id: teacherId,
      };
    });

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
