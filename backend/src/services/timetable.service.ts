import { TimetableRepo, TimetableEntryDetail } from '../repositories/timetable.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { SubjectRepo } from '../repositories/subject.repo.js';
import { AuthUser, TimetableEntryRow } from '../types/index.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

export interface AuditConflictItem {
  type: 'CLASS_CONFLICT' | 'TEACHER_CONFLICT' | 'ROOM_CONFLICT';
  classId: string;
  className: string;
  dayOfWeek: number;
  period: number;
  message: string;
}

export interface AuditRuleViolationItem {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  dayOfWeek: number;
  periods: number[];
  violation: string;
}

export interface TimetableAuditReport {
  scannedClasses: number;
  scannedEntries: number;
  isValid: boolean;
  summary: {
    classConflictsCount: number;
    teacherConflictsCount: number;
    roomConflictsCount: number;
    ruleViolationsCount: number;
    totalIssuesCount: number;
  };
  classConflicts: AuditConflictItem[];
  teacherConflicts: AuditConflictItem[];
  roomConflicts: AuditConflictItem[];
  ruleViolations: AuditRuleViolationItem[];
}

export const TimetableService = {
  async getTimetableForClass(classId: string, currentUser: AuthUser): Promise<TimetableEntryRow[]> {
    return TimetableRepo.getByClassId(classId);
  },

  async getAllEntries(
    filter: {
      classId?: string;
      teacherId?: string;
      subjectId?: string;
      room?: string;
      dayOfWeek?: number;
    },
    currentUser: AuthUser
  ): Promise<TimetableEntryDetail[]> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xem toàn bộ thời khóa biểu nhà trường.');
    }
    return TimetableRepo.getAll(filter);
  },

  async validateConsecutivePeriods(
    classId: string,
    dayOfWeek: number,
    candidatePeriod: number,
    candidateSubjectId: string,
    excludeEntryId?: string
  ): Promise<void> {
    const classEntries = await TimetableRepo.getByClassId(classId);
    const subject = await SubjectRepo.getById(candidateSubjectId);
    const maxConsecutive = subject?.max_consecutive_periods ?? 1;
    const subjectName = subject?.name || 'Môn học';

    // Filter entries for the same day, excluding the target slot/entry
    const dayEntries = classEntries.filter((e) => {
      if (e.day_of_week !== dayOfWeek) return false;
      if (excludeEntryId && e.id === excludeEntryId) return false;
      if (e.period === candidatePeriod) return false;
      return true;
    });

    // Add candidate slot
    dayEntries.push({
      id: excludeEntryId || 'temp-id',
      class_id: classId,
      day_of_week: dayOfWeek,
      period: candidatePeriod,
      subject_id: candidateSubjectId,
      teacher_id: null,
      created_at: '',
      updated_at: '',
    });

    // Group periods by subject
    const subjectPeriodsMap = new Map<string, number[]>();
    for (const e of dayEntries) {
      if (!subjectPeriodsMap.has(e.subject_id)) {
        subjectPeriodsMap.set(e.subject_id, []);
      }
      subjectPeriodsMap.get(e.subject_id)!.push(e.period);
    }

    // Check candidate subject's periods
    const periods = (subjectPeriodsMap.get(candidateSubjectId) || []).sort((a, b) => a - b);

    // Find consecutive sequences
    let currentSequence: number[] = [];
    for (let i = 0; i < periods.length; i++) {
      if (currentSequence.length === 0) {
        currentSequence.push(periods[i]);
      } else {
        const last = currentSequence[currentSequence.length - 1];
        if (periods[i] === last + 1) {
          currentSequence.push(periods[i]);
        } else {
          // Check previous sequence
          if (currentSequence.length > 2) {
            throw new BadRequestError(
              `Quy tắc thời khóa biểu: Không được xếp quá 2 tiết liên tiếp (hiện có ${currentSequence.length} tiết liên tiếp: Tiết ${currentSequence.join(', ')}).`
            );
          }
          if (currentSequence.length > maxConsecutive) {
            throw new BadRequestError(
              `Quy tắc thời khóa biểu: Môn ${subjectName} chỉ cho phép tối đa ${maxConsecutive} tiết liên tiếp (hiện xếp ${currentSequence.length} tiết liên tiếp: Tiết ${currentSequence.join(', ')}).`
            );
          }
          currentSequence = [periods[i]];
        }
      }
    }

    if (currentSequence.length > 2) {
      throw new BadRequestError(
        `Quy tắc thời khóa biểu: Không được xếp quá 2 tiết liên tiếp (hiện có ${currentSequence.length} tiết liên tiếp: Tiết ${currentSequence.join(', ')}).`
      );
    }
    if (currentSequence.length > maxConsecutive) {
      throw new BadRequestError(
        `Quy tắc thời khóa biểu: Môn ${subjectName} chỉ cho phép tối đa ${maxConsecutive} tiết liên tiếp (hiện xếp ${currentSequence.length} tiết liên tiếp: Tiết ${currentSequence.join(', ')}).`
      );
    }
  },

  async saveEntry(
    classId: string,
    dayOfWeek: number,
    period: number,
    subjectId: string,
    teacherId: string | null | undefined,
    room: string | null | undefined,
    currentUser: AuthUser,
    excludeEntryId?: string
  ): Promise<TimetableEntryRow> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xếp hoặc chỉnh sửa thời khóa biểu.');
    }

    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    // Validate shift rules according to THCS standards
    const isMorningGrade = cls.grade === 6 || cls.grade === 9;
    const isAfternoonGrade = cls.grade === 7 || cls.grade === 8;

    if (isMorningGrade) {
      if (period > 5) {
        throw new BadRequestError(`Khối ${cls.grade} học ca sáng (Tiết 1 - 5). Tiết ${period} thuộc ca chiều.`);
      }
      if (dayOfWeek === 7 && period > 3) {
        throw new BadRequestError('Thứ Bảy ca sáng chỉ học tối đa 3 tiết.');
      }
    } else if (isAfternoonGrade) {
      if (period < 6 || period > 10) {
        throw new BadRequestError(`Khối ${cls.grade} học ca chiều (Tiết 6 - 10). Tiết ${period} không thuộc ca chiều.`);
      }
      if (dayOfWeek === 7 && period > 8) {
        throw new BadRequestError('Thứ Bảy ca chiều chỉ học tối đa 3 tiết (Tiết 6 - 8).');
      }
    }

    // 1. Check teacher conflict across entire school
    if (teacherId) {
      const conflict = await TimetableRepo.findTeacherConflict(teacherId, dayOfWeek, period, classId, excludeEntryId);
      if (conflict) {
        throw new BadRequestError(
          `Xung đột lịch giáo viên: Giáo viên đã có tiết dạy tại lớp ${conflict.class_name} vào Thứ ${dayOfWeek}, Tiết ${period}.`
        );
      }
    }

    // 2. Check room conflict across entire school
    const effectiveRoom = (room && room.trim()) || (cls.room_name && cls.room_name.trim()) || null;
    if (effectiveRoom) {
      const roomConflict = await TimetableRepo.findRoomConflict(effectiveRoom, dayOfWeek, period, classId, excludeEntryId);
      if (roomConflict) {
        throw new BadRequestError(
          `Xung đột phòng học: Phòng ${effectiveRoom} đã được xếp cho lớp ${roomConflict.class_name} vào Thứ ${dayOfWeek}, Tiết ${period}.`
        );
      }
    }

    // 3. Check consecutive periods rule
    await this.validateConsecutivePeriods(classId, dayOfWeek, period, subjectId, excludeEntryId);

    return TimetableRepo.saveEntry({
      class_id: classId,
      day_of_week: dayOfWeek,
      period,
      subject_id: subjectId,
      teacher_id: teacherId,
      room: room || null,
    });
  },

  async updateEntry(
    id: string,
    changes: {
      class_id?: string;
      day_of_week?: number;
      period?: number;
      subject_id?: string;
      teacher_id?: string | null;
      room?: string | null;
    },
    currentUser: AuthUser
  ): Promise<TimetableEntryRow> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền cập nhật tiết học.');
    }

    const currentEntry = await TimetableRepo.getById(id);
    if (!currentEntry) {
      throw new NotFoundError('Không tìm thấy tiết học cần cập nhật.');
    }

    const targetClassId = changes.class_id || currentEntry.class_id;
    const targetDay = changes.day_of_week ?? currentEntry.day_of_week;
    const targetPeriod = changes.period ?? currentEntry.period;
    const targetSubjectId = changes.subject_id || currentEntry.subject_id;
    const targetTeacherId = changes.teacher_id !== undefined ? changes.teacher_id : currentEntry.teacher_id;
    const targetRoom = changes.room !== undefined ? changes.room : currentEntry.room;

    // If slot moved (day or period changed), remove old entry first
    if (targetDay !== currentEntry.day_of_week || targetPeriod !== currentEntry.period || targetClassId !== currentEntry.class_id) {
      await TimetableRepo.deleteEntry(id);
    }

    return this.saveEntry(
      targetClassId,
      targetDay,
      targetPeriod,
      targetSubjectId,
      targetTeacherId,
      targetRoom,
      currentUser,
      id
    );
  },

  async deleteEntry(id: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xóa tiết học.');
    }

    const deleted = await TimetableRepo.deleteEntry(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy tiết học để xóa.');
    }
  },

  async copyFromClass(sourceClassId: string, targetClassId: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền sao chép thời khóa biểu.');
    }

    const sourceClass = await ClassRepo.getById(sourceClassId);
    const targetClass = await ClassRepo.getById(targetClassId);

    if (!sourceClass || !targetClass) {
      throw new NotFoundError('Không tìm thấy lớp học nguồn hoặc đích.');
    }

    // Check shift compatibility
    const sourceIsMorning = sourceClass.grade === 6 || sourceClass.grade === 9;
    const targetIsMorning = targetClass.grade === 6 || targetClass.grade === 9;

    if (sourceIsMorning !== targetIsMorning) {
      throw new BadRequestError('Không thể sao chép thời khóa biểu giữa hai lớp khác ca học (Sáng vs Chiều).');
    }

    await TimetableRepo.copyFromClass(sourceClassId, targetClassId);
  },

  async clearTimetable(classId: string, currentUser: AuthUser): Promise<void> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền xóa toàn bộ thời khóa biểu của lớp.');
    }

    await TimetableRepo.clearTimetable(classId);
  },

  async auditTimetable(filterClassId?: string, currentUser?: AuthUser): Promise<TimetableAuditReport> {
    if (currentUser && currentUser.role !== 'ADMIN') {
      throw new ForbiddenError('Chỉ Quản trị viên mới có quyền kiểm toán thời khóa biểu.');
    }

    const allEntries = await TimetableRepo.getAll(filterClassId ? { classId: filterClassId } : undefined);
    const classes = await ClassRepo.getAll();
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const classConflicts: AuditConflictItem[] = [];
    const teacherConflicts: AuditConflictItem[] = [];
    const roomConflicts: AuditConflictItem[] = [];
    const ruleViolations: AuditRuleViolationItem[] = [];

    // 1. Group entries by (class_id, day_of_week, period) to detect duplicate slots
    const slotMap = new Map<string, TimetableEntryDetail[]>();
    for (const entry of allEntries) {
      const key = `${entry.class_id}_${entry.day_of_week}_${entry.period}`;
      if (!slotMap.has(key)) slotMap.set(key, []);
      slotMap.get(key)!.push(entry);
    }

    for (const [key, entries] of slotMap.entries()) {
      if (entries.length > 1) {
        const e = entries[0];
        classConflicts.push({
          type: 'CLASS_CONFLICT',
          classId: e.class_id,
          className: e.class_name,
          dayOfWeek: e.day_of_week,
          period: e.period,
          message: `Lớp ${e.class_name} có ${entries.length} môn học cùng được xếp vào Thứ ${e.day_of_week}, Tiết ${e.period}.`,
        });
      }
    }

    // 2. Check Teacher conflicts across school at (day_of_week, period)
    const teacherSlotMap = new Map<string, TimetableEntryDetail[]>();
    for (const entry of allEntries) {
      if (!entry.teacher_id) continue;
      const key = `${entry.teacher_id}_${entry.day_of_week}_${entry.period}`;
      if (!teacherSlotMap.has(key)) teacherSlotMap.set(key, []);
      teacherSlotMap.get(key)!.push(entry);
    }

    for (const [, entries] of teacherSlotMap.entries()) {
      if (entries.length > 1) {
        // Distinct classes booked for same teacher at same time
        const distinctClasses = Array.from(new Set(entries.map((e) => e.class_name)));
        if (distinctClasses.length > 1) {
          const first = entries[0];
          teacherConflicts.push({
            type: 'TEACHER_CONFLICT',
            classId: first.class_id,
            className: first.class_name,
            dayOfWeek: first.day_of_week,
            period: first.period,
            message: `Giáo viên ${first.teacher_name || 'phụ trách'} bị xếp trùng lịch dạy tại các lớp: ${distinctClasses.join(', ')} vào Thứ ${first.day_of_week}, Tiết ${first.period}.`,
          });
        }
      }
    }

    // 3. Check Room conflicts across school at (day_of_week, period)
    const roomSlotMap = new Map<string, TimetableEntryDetail[]>();
    for (const entry of allEntries) {
      const room = entry.effective_room;
      if (!room || !room.trim()) continue;
      const key = `${room.trim().toLowerCase()}_${entry.day_of_week}_${entry.period}`;
      if (!roomSlotMap.has(key)) roomSlotMap.set(key, []);
      roomSlotMap.get(key)!.push(entry);
    }

    for (const [, entries] of roomSlotMap.entries()) {
      if (entries.length > 1) {
        const distinctClasses = Array.from(new Set(entries.map((e) => e.class_name)));
        if (distinctClasses.length > 1) {
          const first = entries[0];
          roomConflicts.push({
            type: 'ROOM_CONFLICT',
            classId: first.class_id,
            className: first.class_name,
            dayOfWeek: first.day_of_week,
            period: first.period,
            message: `Phòng học ${first.effective_room} bị xếp trùng cho các lớp: ${distinctClasses.join(', ')} vào Thứ ${first.day_of_week}, Tiết ${first.period}.`,
          });
        }
      }
    }

    // 4. Consecutive period rule checks per class, per day, per subject
    const classDaySubjectMap = new Map<string, { entry: TimetableEntryDetail; periods: number[] }>();
    for (const entry of allEntries) {
      const key = `${entry.class_id}_${entry.day_of_week}_${entry.subject_id}`;
      if (!classDaySubjectMap.has(key)) {
        classDaySubjectMap.set(key, { entry, periods: [] });
      }
      classDaySubjectMap.get(key)!.periods.push(entry.period);
    }

    for (const [, { entry, periods }] of classDaySubjectMap.entries()) {
      periods.sort((a, b) => a - b);
      const maxAllowed = entry.max_consecutive_periods ?? 1;

      let currentSeq: number[] = [];
      for (let i = 0; i < periods.length; i++) {
        if (currentSeq.length === 0) {
          currentSeq.push(periods[i]);
        } else {
          const last = currentSeq[currentSeq.length - 1];
          if (periods[i] === last + 1) {
            currentSeq.push(periods[i]);
          } else {
            // Check previous sequence
            if (currentSeq.length > 2) {
              ruleViolations.push({
                classId: entry.class_id,
                className: entry.class_name,
                subjectId: entry.subject_id,
                subjectName: entry.subject_name,
                dayOfWeek: entry.day_of_week,
                periods: [...currentSeq],
                violation: `Vượt quá giới hạn toàn cục: Không được xếp quá 2 tiết liên tiếp (hiện xếp ${currentSeq.length} tiết: Tiết ${currentSeq.join(', ')}).`,
              });
            } else if (currentSeq.length > maxAllowed) {
              ruleViolations.push({
                classId: entry.class_id,
                className: entry.class_name,
                subjectId: entry.subject_id,
                subjectName: entry.subject_name,
                dayOfWeek: entry.day_of_week,
                periods: [...currentSeq],
                violation: `Môn ${entry.subject_name} chỉ cho phép tối đa ${maxAllowed} tiết liên tiếp (hiện xếp ${currentSeq.length} tiết: Tiết ${currentSeq.join(', ')}).`,
              });
            }
            currentSeq = [periods[i]];
          }
        }
      }

      if (currentSeq.length > 2) {
        ruleViolations.push({
          classId: entry.class_id,
          className: entry.class_name,
          subjectId: entry.subject_id,
          subjectName: entry.subject_name,
          dayOfWeek: entry.day_of_week,
          periods: [...currentSeq],
          violation: `Vượt quá giới hạn toàn cục: Không được xếp quá 2 tiết liên tiếp (hiện xếp ${currentSeq.length} tiết: Tiết ${currentSeq.join(', ')}).`,
        });
      } else if (currentSeq.length > maxAllowed) {
        ruleViolations.push({
          classId: entry.class_id,
          className: entry.class_name,
          subjectId: entry.subject_id,
          subjectName: entry.subject_name,
          dayOfWeek: entry.day_of_week,
          periods: [...currentSeq],
          violation: `Môn ${entry.subject_name} chỉ cho phép tối đa ${maxAllowed} tiết liên tiếp (hiện xếp ${currentSeq.length} tiết: Tiết ${currentSeq.join(', ')}).`,
        });
      }
    }

    const totalIssuesCount =
      classConflicts.length + teacherConflicts.length + roomConflicts.length + ruleViolations.length;

    const scannedClassIds = new Set(allEntries.map((e) => e.class_id));

    return {
      scannedClasses: scannedClassIds.size,
      scannedEntries: allEntries.length,
      isValid: totalIssuesCount === 0,
      summary: {
        classConflictsCount: classConflicts.length,
        teacherConflictsCount: teacherConflicts.length,
        roomConflictsCount: roomConflicts.length,
        ruleViolationsCount: ruleViolations.length,
        totalIssuesCount,
      },
      classConflicts,
      teacherConflicts,
      roomConflicts,
      ruleViolations,
    };
  },
};
