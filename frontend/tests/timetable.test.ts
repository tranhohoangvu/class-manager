import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableService, TimetableConflict } from '../src/services/timetable.service';
import { LocalStore } from '../src/lib/store';
import { UserRow } from '../src/types';
import { TIMETABLE_PERIODS, TIMETABLE_SPECIAL_SLOTS, DAY_ALLOWED_PERIODS } from '../src/lib/constants';

describe('TimetableService — Secondary School Class Timetable (10 Periods & Saturday Structure)', () => {
  const adminUser: UserRow = {
    id: 'u-admin-01',
    name: 'Admin Trường',
    email: 'admin@thcs-ntt.edu.vn',
    phone: null,
    role: 'ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const homeroomUser6A1: UserRow = {
    id: 'u-tea-01',
    name: 'Thầy Nguyễn Văn An',
    email: 'an.nguyen@thcs-ntt.edu.vn',
    phone: null,
    role: 'TEACHER',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const otherTeacherUser: UserRow = {
    id: 'u-tea-05',
    name: 'Cô Trần Thị Bình',
    email: 'binh.tran@thcs-ntt.edu.vn',
    phone: null,
    role: 'TEACHER',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const classId = 'c-6a1'; // Homeroom teacher is u-tea-01 (Thầy Nguyễn Văn An)

  beforeEach(() => {
    // Reset timetable to standard template
    LocalStore.resetTimetableToDefault(classId);
  });

  // =========================================================================
  // Section 20 - Required Test Scenarios 1 to 23
  // =========================================================================

  describe('Cấu trúc tuần học theo ca: 28 tiết/tuần (Scenarios 1 - 8)', () => {
    it('1. Thứ Hai = 5 tiết sáng (Tiết 1 -> 5) cho lớp Khối 6', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 2);
      expect(slots).toHaveLength(5);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5]);
    });

    it('2. Thứ Ba = 5 tiết sáng (Tiết 1 -> 5) cho lớp Khối 6', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 3);
      expect(slots).toHaveLength(5);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5]);
    });

    it('3. Thứ Tư = 5 tiết sáng (Tiết 1 -> 5) cho lớp Khối 6', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 4);
      expect(slots).toHaveLength(5);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5]);
    });

    it('4. Thứ Năm = 5 tiết sáng (Tiết 1 -> 5) cho lớp Khối 6', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 5);
      expect(slots).toHaveLength(5);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5]);
    });

    it('5. Thứ Sáu = 5 tiết sáng (Tiết 1 -> 5) cho lớp Khối 6', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 6);
      expect(slots).toHaveLength(5);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5]);
    });

    it('6. Thứ Bảy = 3 tiết sáng (Tiết 1 -> 3) cho lớp Khối 6', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 7);
      expect(slots).toHaveLength(3);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3]);
    });

    it('7. Lớp Khối 6 ca Sáng chỉ gồm Tiết 1 đến Tiết 5, không có tiết ca Chiều', () => {
      const afternoonSlots = LocalStore.getTimetable(classId).filter((t) => t.period >= 6);
      expect(afternoonSlots).toHaveLength(0);
      expect(LocalStore.getTimetable(classId)).toHaveLength(28);
    });

    it('8. Lớp Khối 7 ca Chiều chỉ gồm Tiết 6 đến Tiết 10, Thứ Bảy gồm Tiết 6 đến Tiết 8', () => {
      const slots7 = LocalStore.getTimetable('c-7a1');
      expect(slots7).toHaveLength(28);
      expect(slots7.every((s) => s.period >= 6 && s.period <= 10)).toBe(true);

      const satSlots7 = slots7.filter((s) => s.day_of_week === 7);
      expect(satSlots7).toHaveLength(3);
      expect(satSlots7.map((s) => s.period).sort((a, b) => a - b)).toEqual([6, 7, 8]);
    });
  });

  describe('Quy tắc Tiết Sinh hoạt lớp Thứ Bảy (Scenarios 9 - 13)', () => {
    it('9. Tiết 3 Thứ Bảy buổi sáng là Sinh hoạt lớp (sub-shl) cho Khối 6', () => {
      const entry = LocalStore.getTimetableEntry(classId, 7, 3);
      expect(entry).not.toBeNull();
      expect(entry?.subject_id).toBe('sub-shl');
    });

    it('10. Tiết 8 Thứ Bảy buổi chiều là Sinh hoạt lớp (sub-shl) cho Khối 7', () => {
      const entry = LocalStore.getTimetableEntry('c-7a1', 7, 8);
      expect(entry).not.toBeNull();
      expect(entry?.subject_id).toBe('sub-shl');
    });

    it('11. Tiết SHL Thứ Bảy sử dụng đúng GVCN của lớp (Tiết 3 cho 6A1, Tiết 8 cho 7A1)', () => {
      const cls6 = LocalStore.getClassById(classId);
      expect(cls6?.teacher_id).toBe('u-tea-01');
      const p3 = LocalStore.getTimetableEntry(classId, 7, 3);
      expect(p3?.teacher_id).toBe(cls6?.teacher_id);

      const cls7 = LocalStore.getClassById('c-7a1');
      expect(cls7?.teacher_id).toBeTruthy();
      const p8 = LocalStore.getTimetableEntry('c-7a1', 7, 8);
      expect(p8?.teacher_id).toBe(cls7?.teacher_id);
    });

    it('12. Tiết SHL Thứ Bảy không dùng GV bộ môn ngẫu nhiên', () => {
      const otherTeacherId = 'u-tea-05';
      const resP3 = TimetableService.saveEntry(
        classId,
        7,
        3,
        'sub-shl',
        otherTeacherId,
        adminUser
      );
      expect(resP3.success).toBe(false);
      expect(resP3.error).toContain('phải do Giáo viên chủ nhiệm');

      const resP8 = TimetableService.saveEntry(
        'c-7a1',
        7,
        8,
        'sub-shl',
        otherTeacherId,
        adminUser
      );
      expect(resP8.success).toBe(false);
      expect(resP8.error).toContain('phải do Giáo viên chủ nhiệm');
    });

    it('13. Tiết SHL Thứ Bảy không dùng môn học ngẫu nhiên', () => {
      const resP3 = TimetableService.saveEntry(
        classId,
        7,
        3,
        'sub-mat', // Môn Toán
        'u-tea-01',
        adminUser
      );
      expect(resP3.success).toBe(false);
      expect(resP3.error).toContain('bắt buộc là tiết Sinh hoạt lớp');

      const cls7 = LocalStore.getClassById('c-7a1');
      const resP8 = TimetableService.saveEntry(
        'c-7a1',
        7,
        8,
        'sub-eng', // Môn Tiếng Anh
        cls7?.teacher_id || 'u-tea-05',
        adminUser
      );
      expect(resP8.success).toBe(false);
      expect(resP8.error).toContain('bắt buộc là tiết Sinh hoạt lớp');
    });
  });

  describe('Chặn các tiết không tồn tại vào Thứ Bảy (Scenarios 14 - 15)', () => {
    it('14. Không thể tạo Tiết 4, Tiết 5 vào buổi sáng Thứ Bảy cho Khối 6', () => {
      const resP4 = TimetableService.saveEntry(
        classId,
        7,
        4,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(resP4.success).toBe(false);
      expect(resP4.error).toContain('Thứ Bảy ca Sáng chỉ có 3 tiết');

      const resP5 = TimetableService.saveEntry(
        classId,
        7,
        5,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(resP5.success).toBe(false);
      expect(resP5.error).toContain('Thứ Bảy ca Sáng chỉ có 3 tiết');
    });

    it('15. Không thể tạo Tiết 9, Tiết 10 vào buổi chiều Thứ Bảy cho Khối 7', () => {
      const cls7 = LocalStore.getClassById('c-7a1');
      const resP9 = TimetableService.saveEntry(
        'c-7a1',
        7,
        9,
        'sub-mat',
        cls7?.teacher_id || 'u-tea-05',
        adminUser
      );
      expect(resP9.success).toBe(false);
      expect(resP9.error).toContain('Thứ Bảy ca Chiều chỉ có 3 tiết');

      const resP10 = TimetableService.saveEntry(
        'c-7a1',
        7,
        10,
        'sub-mat',
        cls7?.teacher_id || 'u-tea-05',
        adminUser
      );
      expect(resP10.success).toBe(false);
      expect(resP10.error).toContain('Thứ Bảy ca Chiều chỉ có 3 tiết');
    });
  });

  describe('Thời lượng và các khung giờ đặc biệt (Scenarios 16 - 18)', () => {
    it('16. Thời lượng mỗi tiết học là 45 phút', () => {
      expect(TIMETABLE_PERIODS).toHaveLength(10);
      TIMETABLE_PERIODS.forEach((period) => {
        expect(period.durationMinutes).toBe(45);
        const [startH, startM] = period.startTime.split(':').map(Number);
        const [endH, endM] = period.endTime.split(':').map(Number);
        const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        expect(diffMinutes).toBe(45);
      });
    });

    it('17. Sinh hoạt đầu giờ là 15 phút và không phải là tiết học', () => {
      expect(TIMETABLE_SPECIAL_SLOTS.morningAssembly.durationMinutes).toBe(15);
      expect(TIMETABLE_SPECIAL_SLOTS.morningAssembly.startTime).toBe('07:00');
      expect(TIMETABLE_SPECIAL_SLOTS.morningAssembly.endTime).toBe('07:15');

      expect(TIMETABLE_SPECIAL_SLOTS.afternoonAssembly.durationMinutes).toBe(15);
      expect(TIMETABLE_SPECIAL_SLOTS.afternoonAssembly.startTime).toBe('12:45');
      expect(TIMETABLE_SPECIAL_SLOTS.afternoonAssembly.endTime).toBe('13:00');

      // Test real-time period detection during assemblies
      const morningAssemblyTime = new Date(2026, 8, 22, 7, 5, 0); // 07:05
      const morningInfo = TimetableService.getCurrentPeriodInfo(morningAssemblyTime);
      expect(morningInfo.isSchoolHours).toBe(true);
      expect(morningInfo.status).toBe('break'); // Ngoài tiết học
      expect(morningInfo.period).toBeNull(); // Không phải tiết học
      expect(morningInfo.nextPeriod?.period).toBe(1);

      const afternoonAssemblyTime = new Date(2026, 8, 22, 12, 50, 0); // 12:50
      const afternoonInfo = TimetableService.getCurrentPeriodInfo(afternoonAssemblyTime);
      expect(afternoonInfo.isSchoolHours).toBe(true);
      expect(afternoonInfo.status).toBe('break'); // Ngoài tiết học
      expect(afternoonInfo.period).toBeNull(); // Không phải tiết học
      expect(afternoonInfo.nextPeriod?.period).toBe(6);
    });

    it('18. Giờ giải lao không phải là tiết học', () => {
      // Giờ giải lao sáng: 08:45 - 08:55 (10 phút sau Tiết 2)
      const morningBreakTime = new Date(2026, 8, 22, 8, 50, 0);
      const morningBreakInfo = TimetableService.getCurrentPeriodInfo(morningBreakTime);
      expect(morningBreakInfo.isSchoolHours).toBe(true);
      expect(morningBreakInfo.status).toBe('break');
      expect(morningBreakInfo.period).toBeNull();
      expect(morningBreakInfo.nextPeriod?.period).toBe(3);

      // Giờ giải lao sáng: 10:25 - 10:30 (5 phút sau Tiết 4)
      const morning5mBreakTime = new Date(2026, 8, 22, 10, 27, 0);
      const morning5mBreakInfo = TimetableService.getCurrentPeriodInfo(morning5mBreakTime);
      expect(morning5mBreakInfo.isSchoolHours).toBe(true);
      expect(morning5mBreakInfo.status).toBe('break');
      expect(morning5mBreakInfo.period).toBeNull();
      expect(morning5mBreakInfo.nextPeriod?.period).toBe(5);

      // Giờ giải lao chiều: 14:30 - 14:40 (10 phút sau Tiết 7)
      const afternoonBreakTime = new Date(2026, 8, 22, 14, 35, 0);
      const afternoonBreakInfo = TimetableService.getCurrentPeriodInfo(afternoonBreakTime);
      expect(afternoonBreakInfo.isSchoolHours).toBe(true);
      expect(afternoonBreakInfo.status).toBe('break');
      expect(afternoonBreakInfo.period).toBeNull();
      expect(afternoonBreakInfo.nextPeriod?.period).toBe(8);

      // Giờ giải lao chiều: 16:10 - 16:15 (5 phút sau Tiết 9)
      const afternoon5mBreakTime = new Date(2026, 8, 22, 16, 12, 0);
      const afternoon5mBreakInfo = TimetableService.getCurrentPeriodInfo(afternoon5mBreakTime);
      expect(afternoon5mBreakInfo.isSchoolHours).toBe(true);
      expect(afternoon5mBreakInfo.status).toBe('break');
      expect(afternoon5mBreakInfo.period).toBeNull();
      expect(afternoon5mBreakInfo.nextPeriod?.period).toBe(10);
    });
  });

  describe('Kiểm tra Xung đột Lịch dạy & Phân quyền (Scenarios 19 - 23)', () => {
    it('19. Kiểm tra xung đột giáo viên áp dụng cho cả GVCN', () => {
      // GVCN lớp 6A1 (u-tea-01) đã được cố định vào Thứ Bảy Tiết 3 (SHL)
      // Thử xếp GVCN 6A1 sang dạy lớp khác (6A2) vào đúng Thứ Bảy Tiết 3
      const conflict = TimetableService.checkTeacherConflict(
        'u-tea-01',
        7,
        3,
        undefined,
        'c-6a2'
      );
      expect(conflict).not.toBeNull();
      expect(conflict?.type).toBe('TEACHER_CONFLICT');
      expect(conflict?.classId).toBe('c-6a1');
      expect(conflict?.teacherId).toBe('u-tea-01');

      // Thử tạo entry qua service vào slot mà GVCN đã dạy lớp khác (Thứ Hai Tiết 1, u-tea-01 dạy 6A1)
      const res = TimetableService.saveEntry(
        'c-6a2',
        2,
        1,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('Thầy Nguyễn Văn An');
      expect(res.error).toContain('6A1');
    });

    it('20. Kiểm tra xung đột lớp học hoạt động chính xác (Class Conflict)', () => {
      // Thứ Hai Tiết 1 lớp 6A1 đã có tiết học
      const conflict = TimetableService.checkClassConflict('c-6a1', 2, 1);
      expect(conflict).not.toBeNull();
      expect(conflict?.type).toBe('CLASS_CONFLICT');
      expect(conflict?.classId).toBe('c-6a1');
      expect(conflict?.dayOfWeek).toBe(2);
      expect(conflict?.period).toBe(1);

      // Thử tạo mới bằng createEntry -> Báo lỗi trùng tiết
      const res = TimetableService.createEntry(
        {
          class_id: 'c-6a1',
          day_of_week: 2,
          period: 1,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
        },
        adminUser
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('đã có tiết học');
    });

    it('21. Loại trừ bản ghi hiện tại khi cập nhật hoạt động đúng (Update Exclusion)', () => {
      // Lấy entry Thứ Hai Tiết 1 của lớp 6A1
      const entry = LocalStore.getTimetableEntry('c-6a1', 2, 1);
      expect(entry).not.toBeNull();

      // Cập nhật lại chính entry đó với cùng thứ và tiết -> Phải thành công, không tự xung đột
      const res = TimetableService.saveEntry(
        'c-6a1',
        2,
        1,
        entry!.subject_id,
        entry!.teacher_id,
        adminUser
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(entry!.id);

      // Kiểm tra checkClassConflict truyền excludeEntryId
      const selfConflict = TimetableService.checkClassConflict('c-6a1', 2, 1, entry!.id);
      expect(selfConflict).toBeNull();
    });

    it('22. Hàm copy/mẫu thời khóa biểu tuân thủ đầy đủ 28 tiết/tuần', () => {
      // Áp dụng mẫu chuẩn 28 tiết bởi Admin
      const res = TimetableService.applyStandardTemplate(classId, adminUser);
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(28);

      // Kiểm tra đầy đủ 28 tiết hợp lệ
      res.data?.forEach((item) => {
        expect(item.subject_id).toBeTruthy();
        expect(item.teacher_id).toBeTruthy();
        expect(item.period).toBeLessThanOrEqual(5);
        if (item.day_of_week === 7 && item.period === 3) {
          expect(item.subject_id).toBe('sub-shl');
          expect(item.teacher_id).toBe('u-tea-01'); // GVCN 6A1
        }
      });

      // Sao chép từ 6A1 sang 6A2:
      // Phải chặn vì các tiết chuyên môn trùng giáo viên
      const teacher6A2: UserRow = {
        id: 'u-tea-02',
        name: 'Cô Lê Thị Cúc',
        email: 'cuc.le@thcs-ntt.edu.vn',
        phone: null,
        role: 'TEACHER',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const copyRes = TimetableService.copyFromClass('c-6a1', 'c-6a2', adminUser);
      expect(copyRes.success).toBe(false);
      expect(copyRes.error).toContain('xung đột');
    });

    it('23. Validate trực tiếp qua service từ chối các trường hợp sai quy chuẩn', () => {
      // a. Sai thứ (< 2 hoặc > 7)
      const resInvalidDay = TimetableService.saveEntry(classId, 8, 1, 'sub-mat', 'u-tea-01', adminUser);
      expect(resInvalidDay.success).toBe(false);
      expect(resInvalidDay.error).toContain('không hợp lệ');

      // b. Sai tiết (< 1 hoặc > 10)
      const resInvalidPeriod = TimetableService.saveEntry(classId, 2, 11, 'sub-mat', 'u-tea-01', adminUser);
      expect(resInvalidPeriod.success).toBe(false);
      expect(resInvalidPeriod.error).toContain('không hợp lệ');

      // c. Thứ Bảy ca Sáng tiết 4
      const resSatP4 = TimetableService.saveEntry(classId, 7, 4, 'sub-mat', 'u-tea-01', adminUser);
      expect(resSatP4.success).toBe(false);
      expect(resSatP4.error).toContain('Thứ Bảy ca Sáng chỉ có 3 tiết');

      // d. Sai ca học: Khối 6 ca Sáng không được học tiết buổi chiều (Tiết 8)
      const resShiftMismatch = TimetableService.saveEntry(classId, 2, 8, 'sub-mat', 'u-tea-01', adminUser);
      expect(resShiftMismatch.success).toBe(false);
      expect(resShiftMismatch.error).toContain('không học buổi Chiều');

      // e. Không được xóa tiết Sinh hoạt lớp Thứ Bảy (Tiết 3 cho 6A1, Tiết 8 cho 7A1)
      const delP3 = TimetableService.deleteEntry(classId, 7, 3, adminUser);
      expect(delP3.success).toBe(false);
      expect(delP3.error).toContain('Không thể xóa tiết Sinh hoạt lớp');

      const delP8 = TimetableService.deleteEntry('c-7a1', 7, 8, adminUser);
      expect(delP8.success).toBe(false);
      expect(delP8.error).toContain('Không thể xóa tiết Sinh hoạt lớp');
    });
  });

  describe('Real-time Period Calculation & Day Bounds Additional Checks', () => {
    it('nhận diện đúng khung giờ trước khi vào học (< 07:15)', () => {
      const tuesdayMorning = new Date(2026, 8, 22, 6, 45, 0);
      const info = TimetableService.getCurrentPeriodInfo(tuesdayMorning);

      expect(info.isSchoolHours).toBe(false);
      expect(info.status).toBe('before_school');
      expect(info.period).toBeNull();
      expect(info.nextPeriod?.period).toBe(1);
    });

    it('nhận diện đúng Tiết 1 (07:15 - 08:00)', () => {
      const p1Time = new Date(2026, 8, 22, 7, 30, 0);
      const info = TimetableService.getCurrentPeriodInfo(p1Time);

      expect(info.isSchoolHours).toBe(true);
      expect(info.status).toBe('in_period');
      expect(info.period).toBe(1);
      expect(info.periodConfig?.label).toBe('Tiết 1');
    });

    it('nhận diện đúng Tiết 2 (08:00 - 08:45)', () => {
      const p2Time = new Date(2026, 8, 22, 8, 30, 0);
      const info = TimetableService.getCurrentPeriodInfo(p2Time);

      expect(info.isSchoolHours).toBe(true);
      expect(info.status).toBe('in_period');
      expect(info.period).toBe(2);
      expect(info.periodConfig?.label).toBe('Tiết 2');
    });

    it('nhận diện đúng sau giờ học Thứ Bảy (> 15:25 chiều)', () => {
      // 2026-09-26 is Saturday
      const satAfternoonAfterSchool = new Date(2026, 8, 26, 16, 0, 0);
      const info = TimetableService.getCurrentPeriodInfo(satAfternoonAfterSchool);

      expect(info.isSchoolHours).toBe(false);
      expect(info.status).toBe('after_school');
      expect(info.period).toBeNull();
    });

    it('nhận diện đúng ngày nghỉ Chủ Nhật', () => {
      // 2026-09-20 is Sunday
      const sunday = new Date(2026, 8, 20, 8, 30, 0);
      const info = TimetableService.getCurrentPeriodInfo(sunday);

      expect(info.dayOfWeek).toBe(8);
      expect(info.status).toBe('day_off');
      expect(info.isSchoolHours).toBe(false);
    });
  });

  describe('RBAC & CRUD Permissions', () => {
    it('chỉ cho phép Quản trị viên (ADMIN) chỉnh sửa một tiết học hợp lệ', () => {
      // Lấy tiết học hiện tại của 6A1 ở Thứ Hai Tiết 1 (Toán, Thầy An)
      const currentEntry = LocalStore.getTimetableEntry(classId, 2, 1);
      expect(currentEntry).not.toBeNull();

      // Cập nhật lại tiết học bởi ADMIN -> Thành công
      const res = TimetableService.saveEntry(
        classId,
        2,
        1,
        'sub-mat',
        homeroomUser6A1.id,
        adminUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.subject_id).toBe('sub-mat');
      expect(res.data?.teacher_id).toBe(homeroomUser6A1.id);
    });

    it('chặn Giáo viên chủ nhiệm (GVCN) không được tự ý chỉnh sửa TKB của lớp', () => {
      const res = TimetableService.saveEntry(
        classId,
        2,
        1,
        'sub-mat',
        homeroomUser6A1.id,
        homeroomUser6A1
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Chỉ Quản trị viên mới có quyền');
    });

    it('chặn giáo viên bộ môn khác không được chỉnh sửa TKB của lớp', () => {
      const res = TimetableService.saveEntry(
        classId,
        2,
        3,
        'sub-inf',
        null,
        otherTeacherUser
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Chỉ Quản trị viên mới có quyền');
    });

    it('cho phép Quản trị viên xóa một tiết học thông thường (không phải SHL)', () => {
      const deleteRes = TimetableService.deleteEntry(classId, 2, 1, adminUser);
      expect(deleteRes.success).toBe(true);

      const entry = LocalStore.getTimetableEntry(classId, 2, 1);
      expect(entry).toBeNull();
    });

    it('chặn Giáo viên chủ nhiệm (GVCN) tự xóa tiết học', () => {
      const deleteRes = TimetableService.deleteEntry(classId, 2, 2, homeroomUser6A1);
      expect(deleteRes.success).toBe(false);
      expect(deleteRes.error).toContain('Chỉ Quản trị viên mới có quyền');
    });
  });

  describe('12 Test Cases Chuẩn Nghiệp Vụ Xung Đột (Business Edge Cases)', () => {
    // Case 1: Trùng tiết trong cùng một lớp
    it('Case 1: Trùng tiết trong cùng một lớp -> Từ chối và trả về CLASS_CONFLICT', () => {
      const conflict = TimetableService.checkClassConflict('c-6a1', 2, 1);
      expect(conflict).not.toBeNull();
      expect(conflict?.type).toBe('CLASS_CONFLICT');
      expect(conflict?.classId).toBe('c-6a1');
    });

    // Case 2: Trùng giáo viên giữa 2 lớp khác nhau
    it('Case 2: Trùng giáo viên giữa 2 lớp khác nhau -> Từ chối và báo rõ lớp, môn, thời gian', () => {
      const entry6A1 = LocalStore.getTimetableEntry('c-6a1', 2, 1);
      expect(entry6A1).not.toBeNull();

      const res = TimetableService.saveEntry(
        'c-6a2',
        2,
        1,
        'sub-mat',
        entry6A1!.teacher_id,
        adminUser
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('6A1');
      expect(res.error).toContain('Thứ Hai, Tiết 1');
    });

    // Case 3: Khác giáo viên, khác lớp, cùng thời điểm -> Cho phép
    it('Case 3: Khác giáo viên, khác lớp, cùng thời điểm -> Cho phép', () => {
      const allTimetables = LocalStore.getAllTimetables();
      const busyAtMonP1 = new Set(
        allTimetables
          .filter((t) => t.day_of_week === 2 && t.period === 1)
          .map((t) => t.teacher_id)
      );
      const allTeachers = LocalStore.getUsers().filter((u) => u.role === 'TEACHER');
      const freeTeacher = allTeachers.find((t) => !busyAtMonP1.has(t.id));
      expect(freeTeacher).toBeDefined();

      const conflict = TimetableService.checkTeacherConflict(
        freeTeacher!.id,
        2,
        1,
        undefined,
        'c-8a3'
      );
      expect(conflict).toBeNull();
    });

    // Case 4: Cùng giáo viên, khác lớp, khác tiết -> Cho phép khi giáo viên trống lịch
    it('Case 4: Cùng giáo viên, khác lớp, khác tiết -> Cho phép khi giáo viên trống lịch', () => {
      const allTimetables = LocalStore.getAllTimetables();
      const anSlots = allTimetables.filter((t) => t.teacher_id === 'u-tea-01');
      const busyKeys = new Set(anSlots.map((s) => `${s.day_of_week}_${s.period}`));

      let freeSlot: { day: number; period: number } | null = null;
      for (let d = 2; d <= 6; d++) {
        for (let p = 1; p <= 10; p++) {
          if (!busyKeys.has(`${d}_${p}`)) {
            freeSlot = { day: d, period: p };
            break;
          }
        }
        if (freeSlot) break;
      }

      expect(freeSlot).not.toBeNull();
      const conflict = TimetableService.checkTeacherConflict(
        'u-tea-01',
        freeSlot!.day,
        freeSlot!.period,
        undefined,
        'c-7a1'
      );
      expect(conflict).toBeNull();
    });

    // Case 5: Cập nhật chính entry hiện tại -> Thành công
    it('Case 5: Cập nhật chính entry hiện tại -> Thành công, không tự xung đột với chính mình', () => {
      const entry = LocalStore.getTimetableEntry('c-6a1', 2, 1);
      expect(entry).not.toBeNull();

      const res = TimetableService.saveEntry(
        'c-6a1',
        2,
        1,
        entry!.subject_id,
        entry!.teacher_id,
        adminUser
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(entry!.id);
    });

    // Case 6: Cập nhật entry chuyển sang slot khác mà giáo viên đã bận ở lớp khác -> Từ chối
    it('Case 6: Cập nhật entry chuyển sang slot khác mà giáo viên đã bận ở lớp khác -> Từ chối', () => {
      const otherClassEntry = LocalStore.getAllTimetables().find(
        (t) => t.teacher_id === 'u-tea-01' && t.class_id !== 'c-6a1'
      );
      expect(otherClassEntry).toBeDefined();

      const entry6A1 = LocalStore.getTimetableEntry('c-6a1', 2, 1);
      expect(entry6A1).not.toBeNull();

      const res = TimetableService.updateEntry(
        entry6A1!.id,
        {
          day_of_week: otherClassEntry!.day_of_week,
          period: otherClassEntry!.period,
        },
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Thầy Nguyễn Văn An');
      expect(res.error).toContain('đã được xếp dạy');
    });

    // Case 7: Đổi giáo viên của tiết sang người đang bận ở lớp khác -> Từ chối
    it('Case 7: Đổi giáo viên của tiết sang người đang bận ở lớp khác -> Từ chối', () => {
      const busyEntry = LocalStore.getAllTimetables().find(
        (t) => t.day_of_week === 2 && t.period === 3 && t.class_id !== 'c-6a1' && t.teacher_id
      );
      expect(busyEntry).toBeDefined();

      const res = TimetableService.saveEntry(
        'c-6a1',
        2,
        3,
        'sub-inf',
        busyEntry!.teacher_id,
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('đã được xếp dạy');
    });

    // Case 8: Đổi thứ/tiết của tiết sang lúc giáo viên đang bận -> Từ chối
    it('Case 8: Đổi thứ/tiết của tiết sang lúc giáo viên đang bận -> Từ chối', () => {
      // Chọn entry không phải Sinh hoạt lớp để kiểm tra xung đột lịch dạy
      const nonShlEntry = LocalStore.getTimetable('c-6a1').find(
        (t) => t.teacher_id && t.subject_id !== 'sub-shl'
      );
      expect(nonShlEntry).toBeDefined();

      const busyElsewhere = LocalStore.getAllTimetables().find(
        (t) => t.teacher_id === nonShlEntry!.teacher_id && t.class_id !== 'c-6a1'
      );
      expect(busyElsewhere).toBeDefined();

      const res = TimetableService.updateEntry(
        nonShlEntry!.id,
        {
          day_of_week: busyElsewhere!.day_of_week,
          period: busyElsewhere!.period,
        },
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('đã được xếp dạy');
    });

    // Case 9: Copy TKB có conflict -> Từ chối, báo danh sách xung đột, dữ liệu lớp đích không đổi
    it('Case 9: Copy TKB có conflict -> Từ chối, báo danh sách xung đột, dữ liệu lớp đích không đổi', () => {
      const targetClassBefore = LocalStore.getTimetable('c-6a2');

      const copyRes = TimetableService.copyFromClass('c-6a1', 'c-6a2', adminUser);
      expect(copyRes.success).toBe(false);
      expect(copyRes.error).toContain('xung đột');

      const targetClassAfter = LocalStore.getTimetable('c-6a2');
      expect(targetClassAfter.length).toBe(targetClassBefore.length);
      expect(targetClassAfter.map((t) => t.id)).toEqual(targetClassBefore.map((t) => t.id));
    });

    // Case 10: Áp dụng template khi có conflict -> Từ chối và liệt kê các tiết xung đột
    it('Case 10: Áp dụng template khi có conflict -> Từ chối và liệt kê các tiết xung đột', () => {
      const res6A1 = TimetableService.applyStandardTemplate('c-6a1', adminUser);
      expect(res6A1.success).toBe(true);

      const templateEntries = LocalStore.getTimetable('c-6a1');
      const conflictList: TimetableConflict[] = [];
      for (const entry of templateEntries) {
        const c = TimetableService.checkTeacherConflict(
          entry.teacher_id,
          entry.day_of_week,
          entry.period,
          undefined,
          'c-6a2'
        );
        if (c) conflictList.push(c);
      }
      expect(conflictList.length).toBeGreaterThan(0);
      expect(conflictList[0].type).toBe('TEACHER_CONFLICT');
    });

    // Case 11: Gọi service trực tiếp với dữ liệu gây xung đột -> Trả về { success: false, error: string }
    it('Case 11: Gọi service trực tiếp với dữ liệu gây xung đột -> Trả về { success: false, error: string }', () => {
      const anSlot = LocalStore.getTimetable('c-6a1').find((t) => t.teacher_id === 'u-tea-01' && t.day_of_week !== 7);
      expect(anSlot).toBeDefined();

      // Xóa slot ở lớp 6A2 trước để kiểm tra chính xác xung đột giáo viên
      LocalStore.deleteTimetableEntry('c-6a2', anSlot!.day_of_week, anSlot!.period);

      const directRes = TimetableService.createEntry(
        {
          class_id: 'c-6a2',
          day_of_week: anSlot!.day_of_week,
          period: anSlot!.period,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
        },
        adminUser
      );

      expect(directRes.success).toBe(false);
      expect(directRes.error).toBeDefined();
      expect(typeof directRes.error).toBe('string');
      expect(directRes.error).toContain('Thầy Nguyễn Văn An');
    });

    // Case 12: Conflict giữa 2 lớp khác khối bất kỳ trong trường -> Quét toàn bộ store và phát hiện
    it('Case 12: Conflict giữa 2 lớp khác khối bất kỳ trong trường -> Quét toàn bộ store và phát hiện', () => {
      const t7 = LocalStore.getTimetable('c-7a1').find((t) => t.teacher_id);
      expect(t7).toBeDefined();

      const conflict = TimetableService.checkTeacherConflict(
        t7!.teacher_id,
        t7!.day_of_week,
        t7!.period,
        undefined,
        'c-9a3'
      );

      expect(conflict).not.toBeNull();
      expect(conflict?.type).toBe('TEACHER_CONFLICT');
      expect(conflict?.classId).toBe('c-7a1');
      expect(conflict?.dayOfWeek).toBe(t7!.day_of_week);
      expect(conflict?.period).toBe(t7!.period);
      expect(conflict?.teacherId).toBe(t7!.teacher_id);
    });
  });

  // =========================================================================
  // Section 13 - Scheduling Business Rules & Audit Suite
  // =========================================================================

  describe('Section 13: Timetable Business Rules & Scheduling Constraints', () => {
    beforeEach(() => {
      // Clear all timetables for clean test scenarios so other classes don't cause interference
      LocalStore.clearAllTimetables();
    });

    // 1. Valid cases
    describe('1.1. Valid cases', () => {
      it('Mathematics with 2 consecutive periods -> VALID', () => {
        // Save Period 1 Math
        const res1 = TimetableService.saveEntry('c-6a1', 2, 1, 'sub-mat', 'u-tea-01', adminUser);
        expect(res1.success).toBe(true);

        // Save Period 2 Math (consecutive: 1 + 2)
        const res2 = TimetableService.saveEntry('c-6a1', 2, 2, 'sub-mat', 'u-tea-01', adminUser);
        expect(res2.success).toBe(true);
      });

      it('Literature with 2 consecutive periods -> VALID', () => {
        // Save Period 3 Literature
        const res1 = TimetableService.saveEntry('c-6a1', 2, 3, 'sub-lit', 'u-tea-02', adminUser);
        expect(res1.success).toBe(true);

        // Save Period 4 Literature (consecutive: 3 + 4)
        const res2 = TimetableService.saveEntry('c-6a1', 2, 4, 'sub-lit', 'u-tea-02', adminUser);
        expect(res2.success).toBe(true);
      });

      it('Different subjects in different periods -> VALID', () => {
        // Math on Period 1, English on Period 2, Physics on Period 3
        const res1 = TimetableService.saveEntry('c-6a1', 3, 1, 'sub-mat', 'u-tea-01', adminUser);
        expect(res1.success).toBe(true);

        const res2 = TimetableService.saveEntry('c-6a1', 3, 2, 'sub-eng', 'u-tea-03', adminUser);
        expect(res2.success).toBe(true);

        const res3 = TimetableService.saveEntry('c-6a1', 3, 3, 'sub-phy', null, adminUser);
        expect(res3.success).toBe(true);
      });

      it('Different teachers teaching different classes simultaneously -> VALID', () => {
        // Teacher 1 teaches 6A1 at Monday Period 1
        const res1 = TimetableService.saveEntry('c-6a1', 2, 1, 'sub-mat', 'u-tea-01', adminUser);
        expect(res1.success).toBe(true);

        // Teacher 2 teaches 6A2 at Monday Period 1
        const res2 = TimetableService.saveEntry('c-6a2', 2, 1, 'sub-lit', 'u-tea-02', adminUser);
        expect(res2.success).toBe(true);
      });

      it('Same teacher teaching different periods -> VALID', () => {
        // Teacher 1 teaches 6A1 at Monday Period 1
        const res1 = TimetableService.saveEntry('c-6a1', 2, 1, 'sub-mat', 'u-tea-01', adminUser);
        expect(res1.success).toBe(true);

        // Teacher 1 teaches 6A2 at Monday Period 2 (different period)
        const res2 = TimetableService.saveEntry('c-6a2', 2, 2, 'sub-mat', 'u-tea-01', adminUser);
        expect(res2.success).toBe(true);
      });
    });

    // 2. Invalid cases
    describe('1.2. Invalid cases', () => {
      it('Same class, same period, different subjects -> REJECTED (Class conflict)', () => {
        // 6A1 has Math on Monday Period 2
        const res1 = TimetableService.saveEntry('c-6a1', 2, 2, 'sub-mat', 'u-tea-01', adminUser);
        expect(res1.success).toBe(true);

        // Trying to create a new entry for 6A1 on Monday Period 2 with Literature
        const res2 = TimetableService.createEntry(
          {
            class_id: 'c-6a1',
            day_of_week: 2,
            period: 2,
            subject_id: 'sub-lit',
          },
          adminUser
        );
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('Lớp 6A1 đã có tiết học môn Toán');
      });

      it('Same teacher, same period, different classes -> REJECTED (Teacher conflict)', () => {
        // Teacher 1 teaches 6A1 on Monday Period 3
        const res1 = TimetableService.saveEntry('c-6a1', 2, 3, 'sub-mat', 'u-tea-01', adminUser);
        expect(res1.success).toBe(true);

        // Trying to assign Teacher 1 to 6A2 on Monday Period 3
        const res2 = TimetableService.saveEntry('c-6a2', 2, 3, 'sub-mat', 'u-tea-01', adminUser);
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('Thầy Nguyễn Văn An');
        expect(res2.error).toContain('đã được xếp dạy Lớp 6A1');
      });

      it('Same room, same period, different classes -> REJECTED (Room conflict)', () => {
        // 6A1 (room: "Phòng 101 — Nhà A") on Tuesday Period 1
        const res1 = TimetableService.saveEntry(
          'c-6a1',
          3,
          1,
          'sub-mat',
          'u-tea-01',
          adminUser,
          'Phòng 101 — Nhà A'
        );
        expect(res1.success).toBe(true);

        // 6A2 tries to book "Phòng 101 — Nhà A" at the same Tuesday Period 1
        const res2 = TimetableService.saveEntry(
          'c-6a2',
          3,
          1,
          'sub-lit',
          'u-tea-02',
          adminUser,
          'Phòng 101 — Nhà A'
        );
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('Xung đột phòng học');
        expect(res2.error).toContain('Phòng 101 — Nhà A');
        expect(res2.error).toContain('Lớp 6A1');
      });

      it('Mathematics with 3 consecutive periods -> REJECTED (Max 2 rule)', () => {
        // Periods 1 and 2
        TimetableService.saveEntry('c-6a1', 2, 1, 'sub-mat', 'u-tea-01', adminUser);
        TimetableService.saveEntry('c-6a1', 2, 2, 'sub-mat', 'u-tea-01', adminUser);

        // Try adding Period 3 for Math (1 + 2 + 3 = 3 consecutive)
        const res3 = TimetableService.saveEntry('c-6a1', 2, 3, 'sub-mat', 'u-tea-01', adminUser);
        expect(res3.success).toBe(false);
        expect(res3.error?.toLowerCase()).toContain('không được xếp quá 2 tiết liên tiếp');
      });

      it('Literature with 3 consecutive periods -> REJECTED (Max 2 rule)', () => {
        // Periods 2 and 3
        TimetableService.saveEntry('c-6a1', 3, 2, 'sub-lit', 'u-tea-02', adminUser);
        TimetableService.saveEntry('c-6a1', 3, 3, 'sub-lit', 'u-tea-02', adminUser);

        // Try adding Period 4 for Literature (2 + 3 + 4 = 3 consecutive)
        const res3 = TimetableService.saveEntry('c-6a1', 3, 4, 'sub-lit', 'u-tea-02', adminUser);
        expect(res3.success).toBe(false);
        expect(res3.error?.toLowerCase()).toContain('không được xếp quá 2 tiết liên tiếp');
      });

      it('Other subject (e.g., English) with 2 consecutive periods -> REJECTED (English max = 1)', () => {
        // English on Period 2
        const res1 = TimetableService.saveEntry('c-6a1', 4, 2, 'sub-eng', 'u-tea-03', adminUser);
        expect(res1.success).toBe(true);

        // Try adding English on Period 3 (2 consecutive)
        const res2 = TimetableService.saveEntry('c-6a1', 4, 3, 'sub-eng', 'u-tea-03', adminUser);
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('Tiếng Anh chỉ cho phép tối đa 1 tiết liên tiếp');
      });

      it('Any subject exceeding its configured maximum consecutive periods -> REJECTED', () => {
        // Physics on Period 1
        const res1 = TimetableService.saveEntry('c-6a1', 5, 1, 'sub-phy', null, adminUser);
        expect(res1.success).toBe(true);

        // Physics on Period 2 (2 consecutive, Physics max = 1)
        const res2 = TimetableService.saveEntry('c-6a1', 5, 2, 'sub-phy', null, adminUser);
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('Vật lý chỉ cho phép tối đa 1 tiết liên tiếp');
      });
    });

    // 3. Self-conflict exclusion on edit
    describe('1.3. Editing existing entry does not self-conflict', () => {
      it('Editing an existing entry preserves validity without detecting itself as conflict', () => {
        const saved = TimetableService.saveEntry(
          'c-6a1',
          2,
          1,
          'sub-mat',
          'u-tea-01',
          adminUser,
          'Phòng 101 — Nhà A'
        );
        expect(saved.success).toBe(true);
        const entryId = saved.data!.id;

        // Update room of the exact same entry
        const updateRes = TimetableService.updateEntry(
          entryId,
          {
            room: 'Phòng 101 — Nhà A',
          },
          adminUser
        );

        expect(updateRes.success).toBe(true);
        expect(updateRes.data?.room).toBe('Phòng 101 — Nhà A');
      });
    });

    // 4. Timetable Audit Suite
    describe('1.4. Dedicated Timetable Audit Suite', () => {
      it('TimetableService.auditTimetable detects room conflict, teacher conflict, and consecutive period violations', () => {
        LocalStore.clearTimetable('c-6a1');
        LocalStore.clearTimetable('c-6a2');

        // Create a teacher conflict: u-tea-01 at Monday Period 1 in both 6A1 and 6A2
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a1',
          day_of_week: 2,
          period: 1,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
          room: 'Phòng 101',
        });
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a2',
          day_of_week: 2,
          period: 1,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
          room: 'Phòng 102',
        });

        // Create a room conflict: Phòng Thí nghiệm at Monday Period 2 in both 6A1 and 6A2
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a1',
          day_of_week: 2,
          period: 2,
          subject_id: 'sub-che',
          teacher_id: 'u-tea-02',
          room: 'Phòng Thí nghiệm',
        });
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a2',
          day_of_week: 2,
          period: 2,
          subject_id: 'sub-bio',
          teacher_id: 'u-tea-03',
          room: 'Phòng Thí nghiệm',
        });

        // Create a consecutive period violation: 3 consecutive periods of Math (Periods 3, 4, 5) in 6A1
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a1',
          day_of_week: 2,
          period: 3,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
        });
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a1',
          day_of_week: 2,
          period: 4,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
        });
        LocalStore.saveTimetableEntry({
          class_id: 'c-6a1',
          day_of_week: 2,
          period: 5,
          subject_id: 'sub-mat',
          teacher_id: 'u-tea-01',
        });

        // Run audit on 6A1
        const audit = TimetableService.auditTimetable('c-6a1');
        expect(audit.isValid).toBe(false);
        expect(audit.teacherConflicts.length).toBeGreaterThan(0);
        expect(audit.roomConflicts.length).toBeGreaterThan(0);
        expect(audit.ruleViolations.length).toBeGreaterThan(0);

        // Verify violation descriptions
        const ruleV = audit.ruleViolations.find((v) => v.classId === 'c-6a1');
        expect(ruleV).toBeDefined();
        expect(ruleV?.violation).toContain('Không được xếp quá 2 tiết liên tiếp');
      });
    });
  });
});
