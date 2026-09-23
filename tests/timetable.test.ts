import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableService, TimetableConflict } from '../src/services/timetable.service';
import { LocalStore } from '../src/lib/store';
import { UserRow } from '../src/types';

describe('TimetableService — Secondary School Class Timetable', () => {
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

  const homeroomUser: UserRow = {
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

  const classId = 'c-6a1'; // Homeroom teacher is u-tea-01

  beforeEach(() => {
    // Reset timetable to standard template
    LocalStore.resetTimetableToDefault(classId);
  });

  describe('1. Real-time Period Calculation (getCurrentPeriodInfo)', () => {
    it('nhận diện đúng khung giờ trước khi vào học (< 07:15)', () => {
      // Thứ Ba 06:45
      const tuesdayMorning = new Date(2026, 8, 22, 6, 45, 0); // Month is 0-indexed: 8 = Sep
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

    it('nhận diện đúng Tiết 2 (08:05 - 08:50)', () => {
      const p2Time = new Date(2026, 8, 22, 8, 30, 0);
      const info = TimetableService.getCurrentPeriodInfo(p2Time);

      expect(info.isSchoolHours).toBe(true);
      expect(info.status).toBe('in_period');
      expect(info.period).toBe(2);
      expect(info.periodConfig?.label).toBe('Tiết 2');
    });

    it('nhận diện đúng giờ ra chơi lớn (08:50 - 09:10)', () => {
      const breakTime = new Date(2026, 8, 22, 9, 0, 0);
      const info = TimetableService.getCurrentPeriodInfo(breakTime);

      expect(info.isSchoolHours).toBe(true);
      expect(info.status).toBe('break');
      expect(info.period).toBeNull();
      expect(info.nextPeriod?.period).toBe(3);
    });

    it('nhận diện đúng sau giờ học buổi sáng (> 11:40)', () => {
      const afterSchool = new Date(2026, 8, 22, 12, 15, 0);
      const info = TimetableService.getCurrentPeriodInfo(afterSchool);

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

  describe('2. Phân quyền và Chỉnh sửa Thời khóa biểu (RBAC & CRUD)', () => {
    it('cho phép GVCN hoặc Admin chỉnh sửa một tiết học', () => {
      const res = TimetableService.saveEntry(
        classId,
        2, // Thứ Hai
        3, // Tiết 3
        'sub-inf', // Tin học
        null,
        homeroomUser
      );

      expect(res.success).toBe(true);
      expect(res.data?.subject_id).toBe('sub-inf');

      // Tự động gán giáo viên theo phân công nếu teacherId truyền null
      expect(res.data?.teacher_id).toBeTruthy();
    });

    it('chặn giáo viên bộ môn khác không được chỉnh sửa TKB', () => {
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

    it('từ chối thứ hoặc tiết nằm ngoài quy chuẩn (day 2..7, period 1..5)', () => {
      const resDay = TimetableService.saveEntry(
        classId,
        8, // Chủ Nhật (không có tiết)
        1,
        'sub-mat',
        null,
        homeroomUser
      );
      expect(resDay.success).toBe(false);

      const resPeriod = TimetableService.saveEntry(
        classId,
        2,
        6, // Tiết 6 (buổi sáng chỉ có 5 tiết)
        'sub-mat',
        null,
        homeroomUser
      );
      expect(resPeriod.success).toBe(false);
    });

    it('cho phép xóa một tiết học và trả về tiết trống', () => {
      const deleteRes = TimetableService.deleteEntry(classId, 2, 1, homeroomUser);
      expect(deleteRes.success).toBe(true);

      const entry = LocalStore.getTimetableEntry(classId, 2, 1);
      expect(entry).toBeNull();
    });
  });

  describe('3. Áp dụng Mẫu chuẩn & Sao chép TKB giữa các lớp', () => {
    it('cho phép áp dụng mẫu chuẩn 30 tiết cho lớp', () => {
      const res = TimetableService.applyStandardTemplate(classId, homeroomUser);
      expect(res.success).toBe(true);
      expect(res.data?.length).toBe(30);

      // Mọi tiết học đều phải có subject_id và teacher_id hợp lệ
      res.data?.forEach((item) => {
        expect(item.subject_id).toBeTruthy();
        expect(item.teacher_id).toBeTruthy();
      });
    });

    it('từ chối sao chép thời khóa biểu từ lớp 6A1 sang lớp 6A2 do xung đột giáo viên giảng dạy', () => {
      // 6A2 homeroom teacher is u-tea-02
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

    it('từ chối sao chép từ một lớp sang chính nó', () => {
      const copyRes = TimetableService.copyFromClass('c-6a1', 'c-6a1', homeroomUser);
      expect(copyRes.success).toBe(false);
      expect(copyRes.error).toContain('không được trùng nhau');
    });
  });

  describe('4. Timetable Conflict Detection & Prevention (12 Test Cases Chuẩn Nghiệp Vụ)', () => {
    // Case 1: Trùng tiết trong cùng một lớp (Class Conflict)
    it('Case 1: Trùng tiết trong cùng một lớp -> Từ chối và trả về CLASS_CONFLICT', () => {
      const conflict = TimetableService.checkClassConflict('c-6a1', 2, 1);
      expect(conflict).not.toBeNull();
      expect(conflict?.type).toBe('CLASS_CONFLICT');
      expect(conflict?.classId).toBe('c-6a1');
      expect(conflict?.dayOfWeek).toBe(2);
      expect(conflict?.period).toBe(1);
    });

    // Case 2: Trùng giáo viên giữa 2 lớp khác nhau (Teacher Conflict)
    it('Case 2: Trùng giáo viên giữa 2 lớp khác nhau -> Từ chối và báo rõ lớp, môn, thời gian', () => {
      // u-tea-01 is teaching 6A1 on Monday Period 1 (Toán)
      const res = TimetableService.saveEntry('c-6a2', 2, 1, 'sub-mat', 'u-tea-01', adminUser);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Thầy Nguyễn Văn An');
      expect(res.error).toContain('6A1');
      expect(res.error).toContain('Thứ Hai, Tiết 1');
    });

    // Case 3: Khác giáo viên, khác lớp, cùng thời điểm
    it('Case 3: Khác giáo viên, khác lớp, cùng thời điểm -> Cho phép', () => {
      const allTimetables = LocalStore.getAllTimetables();
      const busyAtMonP1 = new Set(
        allTimetables
          .filter((t) => t.day_of_week === 2 && t.period === 1)
          .map((t) => t.teacher_id)
      );
      // There are 25+ teachers and only 16 classes, so at least 9 teachers are free at Monday Period 1
      const allTeachers = LocalStore.getUsers().filter((u) => u.role === 'TEACHER');
      const freeTeacher = allTeachers.find((t) => !busyAtMonP1.has(t.id));
      expect(freeTeacher).toBeDefined();

      const conflict = TimetableService.checkTeacherConflict(freeTeacher!.id, 2, 1, undefined, 'c-8a3');
      expect(conflict).toBeNull();
    });

    // Case 4: Cùng giáo viên, khác lớp, khác tiết
    it('Case 4: Cùng giáo viên, khác lớp, khác tiết -> Cho phép khi giáo viên trống lịch', () => {
      const allTimetables = LocalStore.getAllTimetables();
      const anSlots = allTimetables.filter((t) => t.teacher_id === 'u-tea-01');
      const busyKeys = new Set(anSlots.map((s) => `${s.day_of_week}_${s.period}`));

      // Find any slot where Thầy An has no class scheduled
      let freeSlot: { day: number; period: number } | null = null;
      for (let d = 2; d <= 7; d++) {
        for (let p = 1; p <= 5; p++) {
          if (!busyKeys.has(`${d}_${p}`)) {
            freeSlot = { day: d, period: p };
            break;
          }
        }
        if (freeSlot) break;
      }

      expect(freeSlot).not.toBeNull();
      const conflict = TimetableService.checkTeacherConflict('u-tea-01', freeSlot!.day, freeSlot!.period, undefined, 'c-7a1');
      expect(conflict).toBeNull();
    });

    // Case 5: Cập nhật chính entry hiện tại (không tự xung đột với chính mình)
    it('Case 5: Cập nhật chính entry hiện tại -> Thành công, không tự xung đột với chính mình', () => {
      const entry = LocalStore.getTimetableEntry('c-6a1', 2, 1);
      expect(entry).not.toBeNull();

      const res = TimetableService.saveEntry(
        'c-6a1',
        2,
        1,
        'sub-mat',
        entry!.teacher_id,
        homeroomUser
      );
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(entry!.id);
    });

    // Case 6: Cập nhật entry chuyển sang tiết khác nhưng tiết đó giáo viên đã bận ở lớp khác
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

    // Case 7: Đổi giáo viên của tiết sang người đang bận ở lớp khác
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

    // Case 8: Đổi thời gian (thứ/tiết) của tiết sang lúc giáo viên đang bận
    it('Case 8: Đổi thứ/tiết của tiết sang lúc giáo viên đang bận -> Từ chối', () => {
      const entry = LocalStore.getTimetable('c-6a1').find((t) => t.teacher_id);
      expect(entry).toBeDefined();

      const busyElsewhere = LocalStore.getAllTimetables().find(
        (t) => t.teacher_id === entry!.teacher_id && t.class_id !== 'c-6a1'
      );
      expect(busyElsewhere).toBeDefined();

      const res = TimetableService.updateEntry(
        entry!.id,
        {
          day_of_week: busyElsewhere!.day_of_week,
          period: busyElsewhere!.period,
        },
        adminUser
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('đã được xếp dạy');
    });

    // Case 9: Copy TKB có conflict
    it('Case 9: Copy TKB có conflict -> Từ chối, báo danh sách xung đột, dữ liệu lớp đích không đổi', () => {
      const targetClassBefore = LocalStore.getTimetable('c-6a2');
      const teacher6A2 = LocalStore.getUserById('u-tea-02') || adminUser;

      const res = TimetableService.copyFromClass('c-6a1', 'c-6a2', teacher6A2);
      expect(res.success).toBe(false);
      expect(res.error).toContain('xung đột');

      // Atomic verification: target class entries unmodified
      const targetClassAfter = LocalStore.getTimetable('c-6a2');
      expect(targetClassAfter.length).toBe(targetClassBefore.length);
      expect(targetClassAfter.map((t) => t.id)).toEqual(targetClassBefore.map((t) => t.id));
    });

    // Case 10: Áp dụng template có conflict với lớp khác
    it('Case 10: Áp dụng template khi có conflict -> Từ chối và liệt kê các tiết xung đột', () => {
      const res6A1 = TimetableService.applyStandardTemplate('c-6a1', homeroomUser);
      expect(res6A1.success).toBe(true);

      // Check conflicts for 6A2 if it were to use 6A1's exact slots
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

    // Case 11: Gọi service trực tiếp
    it('Case 11: Gọi service trực tiếp với dữ liệu gây xung đột -> Trả về { success: false, error: string }', () => {
      const anSlot = LocalStore.getAllTimetables().find((t) => t.teacher_id === 'u-tea-01');
      expect(anSlot).toBeDefined();

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

    // Case 12: Conflict giữa 2 lớp khác khối bất kỳ trong trường
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
