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

  describe('Cấu trúc tuần học: 56 tiết/tuần (Scenarios 1 - 8)', () => {
    it('1. Thứ Hai = 5 sáng + 5 chiều = 10 tiết', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 2);
      expect(slots).toHaveLength(10);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(slots.filter((s) => s.period <= 5)).toHaveLength(5);
      expect(slots.filter((s) => s.period >= 6)).toHaveLength(5);
    });

    it('2. Thứ Ba = 5 sáng + 5 chiều = 10 tiết (ngày học bình thường)', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 3);
      expect(slots).toHaveLength(10);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(slots.filter((s) => s.period <= 5)).toHaveLength(5);
      expect(slots.filter((s) => s.period >= 6)).toHaveLength(5);
    });

    it('3. Thứ Tư = 5 sáng + 5 chiều = 10 tiết', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 4);
      expect(slots).toHaveLength(10);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(slots.filter((s) => s.period <= 5)).toHaveLength(5);
      expect(slots.filter((s) => s.period >= 6)).toHaveLength(5);
    });

    it('4. Thứ Năm = 5 sáng + 5 chiều = 10 tiết', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 5);
      expect(slots).toHaveLength(10);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(slots.filter((s) => s.period <= 5)).toHaveLength(5);
      expect(slots.filter((s) => s.period >= 6)).toHaveLength(5);
    });

    it('5. Thứ Sáu = 5 sáng + 5 chiều = 10 tiết', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 6);
      expect(slots).toHaveLength(10);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(slots.filter((s) => s.period <= 5)).toHaveLength(5);
      expect(slots.filter((s) => s.period >= 6)).toHaveLength(5);
    });

    it('6. Thứ Bảy = 3 sáng + 3 chiều = 6 tiết', () => {
      const slots = LocalStore.getTimetable(classId).filter((t) => t.day_of_week === 7);
      expect(slots).toHaveLength(6);
      const periods = slots.map((s) => s.period).sort((a, b) => a - b);
      expect(periods).toEqual([1, 2, 3, 6, 7, 8]);
    });

    it('7. Buổi sáng Thứ Bảy chỉ gồm Tiết 1, Tiết 2, Tiết 3', () => {
      const morningSaturday = LocalStore.getTimetable(classId)
        .filter((t) => t.day_of_week === 7 && t.period <= 5)
        .map((s) => s.period)
        .sort((a, b) => a - b);
      expect(morningSaturday).toEqual([1, 2, 3]);
      expect(morningSaturday).not.toContain(4);
      expect(morningSaturday).not.toContain(5);
    });

    it('8. Buổi chiều Thứ Bảy chỉ gồm Tiết 6, Tiết 7, Tiết 8', () => {
      const afternoonSaturday = LocalStore.getTimetable(classId)
        .filter((t) => t.day_of_week === 7 && t.period >= 6)
        .map((s) => s.period)
        .sort((a, b) => a - b);
      expect(afternoonSaturday).toEqual([6, 7, 8]);
      expect(afternoonSaturday).not.toContain(9);
      expect(afternoonSaturday).not.toContain(10);
    });
  });

  describe('Quy tắc Tiết Sinh hoạt lớp Thứ Bảy (Scenarios 9 - 13)', () => {
    it('9. Tiết 3 Thứ Bảy buổi sáng là Sinh hoạt lớp (sub-shl)', () => {
      const entry = LocalStore.getTimetableEntry(classId, 7, 3);
      expect(entry).not.toBeNull();
      expect(entry?.subject_id).toBe('sub-shl');
    });

    it('10. Tiết 8 Thứ Bảy buổi chiều là Sinh hoạt lớp (sub-shl)', () => {
      const entry = LocalStore.getTimetableEntry(classId, 7, 8);
      expect(entry).not.toBeNull();
      expect(entry?.subject_id).toBe('sub-shl');
    });

    it('11. Tiết 3 và Tiết 8 Thứ Bảy sử dụng đúng GVCN của lớp', () => {
      const cls = LocalStore.getClassById(classId);
      expect(cls?.teacher_id).toBe('u-tea-01');

      const p3 = LocalStore.getTimetableEntry(classId, 7, 3);
      const p8 = LocalStore.getTimetableEntry(classId, 7, 8);

      expect(p3?.teacher_id).toBe(cls?.teacher_id);
      expect(p8?.teacher_id).toBe(cls?.teacher_id);
    });

    it('12. Tiết 3 và Tiết 8 Thứ Bảy không dùng GV bộ môn ngẫu nhiên', () => {
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
        classId,
        7,
        8,
        'sub-shl',
        otherTeacherId,
        adminUser
      );
      expect(resP8.success).toBe(false);
      expect(resP8.error).toContain('phải do Giáo viên chủ nhiệm');
    });

    it('13. Tiết 3 và Tiết 8 Thứ Bảy không dùng môn học ngẫu nhiên', () => {
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

      const resP8 = TimetableService.saveEntry(
        classId,
        7,
        8,
        'sub-eng', // Môn Tiếng Anh
        'u-tea-01',
        adminUser
      );
      expect(resP8.success).toBe(false);
      expect(resP8.error).toContain('bắt buộc là tiết Sinh hoạt lớp');
    });
  });

  describe('Chặn các tiết không tồn tại vào Thứ Bảy (Scenarios 14 - 15)', () => {
    it('14. Không thể tạo Tiết 4, Tiết 5 vào buổi sáng Thứ Bảy', () => {
      const resP4 = TimetableService.saveEntry(
        classId,
        7,
        4,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(resP4.success).toBe(false);
      expect(resP4.error).toContain('Thứ Bảy chỉ có 6 tiết');

      const resP5 = TimetableService.saveEntry(
        classId,
        7,
        5,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(resP5.success).toBe(false);
      expect(resP5.error).toContain('Thứ Bảy chỉ có 6 tiết');
    });

    it('15. Không thể tạo Tiết 9, Tiết 10 vào buổi chiều Thứ Bảy', () => {
      const resP9 = TimetableService.saveEntry(
        classId,
        7,
        9,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(resP9.success).toBe(false);
      expect(resP9.error).toContain('Thứ Bảy chỉ có 6 tiết');

      const resP10 = TimetableService.saveEntry(
        classId,
        7,
        10,
        'sub-mat',
        'u-tea-01',
        adminUser
      );
      expect(resP10.success).toBe(false);
      expect(resP10.error).toContain('Thứ Bảy chỉ có 6 tiết');
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
        homeroomUser6A1
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(entry!.id);

      // Kiểm tra checkClassConflict truyền excludeEntryId
      const selfConflict = TimetableService.checkClassConflict('c-6a1', 2, 1, entry!.id);
      expect(selfConflict).toBeNull();
    });

    it('22. Hàm copy/mẫu thời khóa biểu tuân thủ đầy đủ 56 tiết/tuần', () => {
      // Áp dụng mẫu chuẩn 56 tiết
      const res = TimetableService.applyStandardTemplate(classId, homeroomUser6A1);
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(56);

      // Kiểm tra đầy đủ 56 tiết hợp lệ
      res.data?.forEach((item) => {
        expect(item.subject_id).toBeTruthy();
        expect(item.teacher_id).toBeTruthy();
        if (item.day_of_week === 7 && (item.period === 3 || item.period === 8)) {
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

      const copyRes = TimetableService.copyFromClass('c-6a1', 'c-6a2', teacher6A2);
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

      // c. Thứ Bảy tiết 4
      const resSatP4 = TimetableService.saveEntry(classId, 7, 4, 'sub-mat', 'u-tea-01', adminUser);
      expect(resSatP4.success).toBe(false);
      expect(resSatP4.error).toContain('Thứ Bảy chỉ có 6 tiết');

      // d. Thứ Bảy tiết 10
      const resSatP10 = TimetableService.saveEntry(classId, 7, 10, 'sub-mat', 'u-tea-01', adminUser);
      expect(resSatP10.success).toBe(false);
      expect(resSatP10.error).toContain('Thứ Bảy chỉ có 6 tiết');

      // e. Không được xóa tiết Sinh hoạt lớp Thứ Bảy
      const delP3 = TimetableService.deleteEntry(classId, 7, 3, adminUser);
      expect(delP3.success).toBe(false);
      expect(delP3.error).toContain('Không thể xóa tiết Sinh hoạt lớp');

      const delP8 = TimetableService.deleteEntry(classId, 7, 8, adminUser);
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
    it('cho phép GVCN hoặc Admin chỉnh sửa một tiết học hợp lệ', () => {
      // Lấy tiết học hiện tại của 6A1 ở Thứ Hai Tiết 1 (Toán, Thầy An)
      const currentEntry = LocalStore.getTimetableEntry(classId, 2, 1);
      expect(currentEntry).not.toBeNull();

      // Cập nhật lại tiết học
      const res = TimetableService.saveEntry(
        classId,
        2,
        1,
        'sub-mat',
        homeroomUser6A1.id,
        homeroomUser6A1
      );

      expect(res.success).toBe(true);
      expect(res.data?.subject_id).toBe('sub-mat');
      expect(res.data?.teacher_id).toBe(homeroomUser6A1.id);
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
      expect(res.error).toContain('Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên');
    });

    it('cho phép xóa một tiết học thông thường (không phải SHL)', () => {
      const deleteRes = TimetableService.deleteEntry(classId, 2, 1, homeroomUser6A1);
      expect(deleteRes.success).toBe(true);

      const entry = LocalStore.getTimetableEntry(classId, 2, 1);
      expect(entry).toBeNull();
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
        homeroomUser6A1
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
      const teacher6A2 = LocalStore.getUserById('u-tea-02') || adminUser;

      const copyRes = TimetableService.copyFromClass('c-6a1', 'c-6a2', teacher6A2);
      expect(copyRes.success).toBe(false);
      expect(copyRes.error).toContain('xung đột');

      const targetClassAfter = LocalStore.getTimetable('c-6a2');
      expect(targetClassAfter.length).toBe(targetClassBefore.length);
      expect(targetClassAfter.map((t) => t.id)).toEqual(targetClassBefore.map((t) => t.id));
    });

    // Case 10: Áp dụng template khi có conflict -> Từ chối và liệt kê các tiết xung đột
    it('Case 10: Áp dụng template khi có conflict -> Từ chối và liệt kê các tiết xung đột', () => {
      const res6A1 = TimetableService.applyStandardTemplate('c-6a1', homeroomUser6A1);
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
      const anSlot = LocalStore.getAllTimetables().find((t) => t.teacher_id === 'u-tea-01');
      expect(anSlot).toBeDefined();

      // Xóa slot ở lớp 8A2 trước để kiểm tra chính xác xung đột giáo viên
      LocalStore.deleteTimetableEntry('c-8a2', anSlot!.day_of_week, anSlot!.period);

      const directRes = TimetableService.createEntry(
        {
          class_id: 'c-8a2',
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
});
