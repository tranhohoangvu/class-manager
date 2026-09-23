/**
 * AUDIT SCRIPT — READ-ONLY
 * Tuyệt đối không chỉnh sửa, ghi đè dữ liệu trong script này.
 * Kiểm tra đầy đủ 5 điều kiện theo yêu cầu GIAI ĐOẠN 2.
 */

import { LocalStore } from '../src/lib/store';
import {
  GRADE_SHIFTS,
  getGradeShift,
  getClassHomeroomSlot,
  isAllowedPeriodForClass,
} from '../src/lib/constants';

interface AuditError {
  type: 'SESSION_MISMATCH' | 'CLASS_CONFLICT' | 'TEACHER_CONFLICT' | 'SATURDAY_HOMEROOM' | 'PERIOD_VALIDITY';
  classId?: string;
  className?: string;
  grade?: number;
  dayOfWeek?: number;
  period?: number;
  teacherId?: string;
  teacherName?: string;
  message: string;
}

function runAudit() {
  console.log('================================================================');
  console.log('  GIAI ĐOẠN 2 — AUDIT THỜI KHÓA BIỂU TOÀN TRƯỜNG (READ-ONLY)   ');
  console.log('================================================================\n');

  const classes = LocalStore.getClasses();
  const allTimetables = LocalStore.getAllTimetables();
  const users = LocalStore.getUsers();
  const teachers = users.filter((u) => u.role === 'TEACHER');
  const subjects = LocalStore.getSubjects();

  const teachersMap = new Map(teachers.map((t) => [t.id, t]));
  const classesMap = new Map(classes.map((c) => [c.id, c]));
  const subjectsMap = new Map(subjects.map((s) => [s.id, s]));

  const errors: AuditError[] = [];

  console.log(`[Thống kê dữ liệu]`);
  console.log(`- Tổng số lớp học: ${classes.length}`);
  console.log(`- Tổng số tiết học toàn trường: ${allTimetables.length} (Kỳ vọng: ${classes.length} x 28 = ${classes.length * 28})\n`);

  // -------------------------------------------------------------
  // 1. KIỂM TRA SESSION_MISMATCH
  // -------------------------------------------------------------
  console.log('--- 1. Kiểm tra SESSION_MISMATCH ---');
  for (const entry of allTimetables) {
    const cls = classesMap.get(entry.class_id);
    if (!cls) continue;

    const shift = getGradeShift(cls.grade);
    const isMorning = shift === 'morning';

    if (isMorning && entry.period >= 6) {
      errors.push({
        type: 'SESSION_MISMATCH',
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        teacherId: entry.teacher_id || undefined,
        message: `Lớp ${cls.name} (Khối ${cls.grade} - Ca Sáng) có tiết học ở ca Chiều: Thứ ${entry.day_of_week}, Tiết ${entry.period}`,
      });
    }

    if (!isMorning && entry.period <= 5) {
      errors.push({
        type: 'SESSION_MISMATCH',
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        teacherId: entry.teacher_id || undefined,
        message: `Lớp ${cls.name} (Khối ${cls.grade} - Ca Chiều) có tiết học ở ca Sáng: Thứ ${entry.day_of_week}, Tiết ${entry.period}`,
      });
    }
  }

  // -------------------------------------------------------------
  // 2. KIỂM TRA CLASS_CONFLICT (Trùng tiết trong cùng một lớp)
  // -------------------------------------------------------------
  console.log('--- 2. Kiểm tra CLASS_CONFLICT ---');
  const classSlotMap = new Map<string, string[]>(); // key: classId-day-period -> entryIds
  for (const entry of allTimetables) {
    const key = `${entry.class_id}-${entry.day_of_week}-${entry.period}`;
    const list = classSlotMap.get(key) || [];
    list.push(entry.id);
    classSlotMap.set(key, list);
  }

  for (const [key, entryIds] of classSlotMap.entries()) {
    if (entryIds.length > 1) {
      const [classId, dayStr, periodStr] = key.split('-');
      const cls = classesMap.get(classId);
      errors.push({
        type: 'CLASS_CONFLICT',
        classId,
        className: cls?.name,
        dayOfWeek: Number(dayStr),
        period: Number(periodStr),
        message: `Lớp ${cls?.name} bị trùng ${entryIds.length} tiết tại Thứ ${dayStr}, Tiết ${periodStr}`,
      });
    }
  }

  // -------------------------------------------------------------
  // 3. KIỂM TRA TEACHER_CONFLICT (Trùng lịch dạy giữa các lớp)
  // -------------------------------------------------------------
  console.log('--- 3. Kiểm tra TEACHER_CONFLICT ---');
  const teacherSlotMap = new Map<string, Array<{ classId: string; entryId: string; subjectId: string }>>();
  for (const entry of allTimetables) {
    if (!entry.teacher_id) continue;
    const key = `${entry.teacher_id}-${entry.day_of_week}-${entry.period}`;
    const list = teacherSlotMap.get(key) || [];
    list.push({ classId: entry.class_id, entryId: entry.id, subjectId: entry.subject_id });
    teacherSlotMap.set(key, list);
  }

  for (const [key, slots] of teacherSlotMap.entries()) {
    if (slots.length > 1) {
      const [teacherId, dayStr, periodStr] = key.split('-');
      const teacher = teachersMap.get(teacherId);
      const classNames = slots.map((s) => classesMap.get(s.classId)?.name || s.classId).join(', ');
      errors.push({
        type: 'TEACHER_CONFLICT',
        teacherId,
        teacherName: teacher?.name,
        dayOfWeek: Number(dayStr),
        period: Number(periodStr),
        message: `Giáo viên ${teacher?.name} (${teacher?.email}) bị trùng lịch dạy cùng lúc ở các lớp [${classNames}] vào Thứ ${dayStr}, Tiết ${periodStr}`,
      });
    }
  }

  // -------------------------------------------------------------
  // 4. KIỂM TRA SINH HOẠT LỚP THỨ 7
  // -------------------------------------------------------------
  console.log('--- 4. Kiểm tra SINH HOẠT LỚP THỨ 7 ---');
  for (const cls of classes) {
    const shift = getGradeShift(cls.grade);
    const homeroomSlot = getClassHomeroomSlot(cls.grade);
    const classEntries = allTimetables.filter((t) => t.class_id === cls.id);
    const shlEntries = classEntries.filter((t) => t.subject_id === 'sub-shl');

    // a. Kiểm tra số lượng tiết SHL
    if (shlEntries.length !== 1) {
      errors.push({
        type: 'SATURDAY_HOMEROOM',
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        message: `Lớp ${cls.name} có ${shlEntries.length} tiết Sinh hoạt lớp trong tuần (yêu cầu duy nhất 1 tiết vào Thứ Bảy).`,
      });
    }

    // b. Kiểm tra vị trí tiết SHL
    for (const shl of shlEntries) {
      if (shl.day_of_week !== 7 || shl.period !== homeroomSlot.period) {
        errors.push({
          type: 'SATURDAY_HOMEROOM',
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          dayOfWeek: shl.day_of_week,
          period: shl.period,
          message: `Lớp ${cls.name} (Khối ${cls.grade} - ca ${shift === 'morning' ? 'Sáng' : 'Chiều'}) có tiết SHL sai vị trí: Thứ ${shl.day_of_week}, Tiết ${shl.period} (Yêu cầu Thứ 7, Tiết ${homeroomSlot.period}).`,
        });
      }

      // c. Kiểm tra GVCN phụ trách SHL
      if (!shl.teacher_id || shl.teacher_id !== cls.teacher_id) {
        const assignedTeacher = shl.teacher_id ? teachersMap.get(shl.teacher_id)?.name : 'Chưa gán GV';
        const gvcn = cls.teacher_id ? teachersMap.get(cls.teacher_id)?.name : 'Chưa có GVCN';
        errors.push({
          type: 'SATURDAY_HOMEROOM',
          classId: cls.id,
          className: cls.name,
          grade: cls.grade,
          dayOfWeek: shl.day_of_week,
          period: shl.period,
          teacherId: shl.teacher_id || undefined,
          message: `Lớp ${cls.name} tiết Sinh hoạt lớp do "${assignedTeacher}" phụ trách, không đúng GVCN của lớp ("${gvcn}").`,
        });
      }
    }

    // d. Đảm bảo đúng slot homeroom có tiết SHL
    const expectedSlotEntry = classEntries.find((t) => t.day_of_week === 7 && t.period === homeroomSlot.period);
    if (!expectedSlotEntry) {
      errors.push({
        type: 'SATURDAY_HOMEROOM',
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        dayOfWeek: 7,
        period: homeroomSlot.period,
        message: `Lớp ${cls.name} bị thiếu tiết Sinh hoạt lớp tại vị trí quy định: Thứ 7, Tiết ${homeroomSlot.period}`,
      });
    } else if (expectedSlotEntry.subject_id !== 'sub-shl') {
      const subj = subjectsMap.get(expectedSlotEntry.subject_id)?.name || expectedSlotEntry.subject_id;
      errors.push({
        type: 'SATURDAY_HOMEROOM',
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        dayOfWeek: 7,
        period: homeroomSlot.period,
        message: `Lớp ${cls.name} tại vị trí Thứ 7 Tiết ${homeroomSlot.period} bị xếp môn "${subj}" thay vì môn Sinh hoạt lớp.`,
      });
    }
  }

  // -------------------------------------------------------------
  // 5. KIỂM TRA PERIOD_VALIDITY
  // -------------------------------------------------------------
  console.log('--- 5. Kiểm tra PERIOD_VALIDITY ---');
  for (const entry of allTimetables) {
    const cls = classesMap.get(entry.class_id);
    const grade = cls?.grade || 6;

    // a. Thứ trong tuần hợp lệ (2 - 7)
    if (entry.day_of_week < 2 || entry.day_of_week > 7) {
      errors.push({
        type: 'PERIOD_VALIDITY',
        classId: entry.class_id,
        className: cls?.name,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        message: `Ngày trong tuần không hợp lệ: Thứ ${entry.day_of_week}`,
      });
    }

    // b. Tiết học 1 - 10
    if (entry.period < 1 || entry.period > 10) {
      errors.push({
        type: 'PERIOD_VALIDITY',
        classId: entry.class_id,
        className: cls?.name,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        message: `Tiết học không hợp lệ: Tiết ${entry.period} (chỉ được từ 1 đến 10)`,
      });
    }

    // c. Không có P4, P5 vào Thứ 7 sáng
    if (entry.day_of_week === 7 && (entry.period === 4 || entry.period === 5)) {
      errors.push({
        type: 'PERIOD_VALIDITY',
        classId: entry.class_id,
        className: cls?.name,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        message: `Tồn tại tiết học Thứ 7 không hợp lệ: Tiết ${entry.period} (Thứ 7 ca Sáng chỉ có Tiết 1-3)`,
      });
    }

    // d. Không có P9, P10 vào Thứ 7 chiều
    if (entry.day_of_week === 7 && (entry.period === 9 || entry.period === 10)) {
      errors.push({
        type: 'PERIOD_VALIDITY',
        classId: entry.class_id,
        className: cls?.name,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        message: `Tồn tại tiết học Thứ 7 không hợp lệ: Tiết ${entry.period} (Thứ 7 ca Chiều chỉ có Tiết 6-8)`,
      });
    }

    // e. Kiểm tra isAllowedPeriodForClass
    if (!isAllowedPeriodForClass(grade, entry.day_of_week, entry.period)) {
      errors.push({
        type: 'PERIOD_VALIDITY',
        classId: entry.class_id,
        className: cls?.name,
        grade,
        dayOfWeek: entry.day_of_week,
        period: entry.period,
        message: `Tiết học không thuộc khung giờ cho phép của Khối ${grade}: Thứ ${entry.day_of_week}, Tiết ${entry.period}`,
      });
    }
  }

  // f. Kiểm tra số tiết của từng lớp
  for (const cls of classes) {
    const classEntries = allTimetables.filter((t) => t.class_id === cls.id);
    if (classEntries.length !== 28) {
      errors.push({
        type: 'PERIOD_VALIDITY',
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        message: `Lớp ${cls.name} có ${classEntries.length} tiết học (yêu cầu chuẩn 28 tiết/tuần: 5 ngày x 5 tiết + Thứ 7 x 3 tiết)`,
      });
    }
  }

  // -------------------------------------------------------------
  // BÁO CÁO KẾT QUẢ AUDIT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                     KẾT QUẢ AUDIT CHI TIẾT                     ');
  console.log('================================================================\n');

  if (errors.length === 0) {
    console.log('✅ TRẠNG THÁI: AUDIT PASSED');
    console.log('1. SESSION_MISMATCH: 0 lỗi (Khối 6, 9 ca Sáng Tiết 1-5; Khối 7, 8 ca Chiều Tiết 6-10).');
    console.log('2. CLASS_CONFLICT: 0 lỗi (Không có bất kỳ lớp nào bị trùng tiết).');
    console.log('3. TEACHER_CONFLICT: 0 lỗi (Không có bất kỳ giáo viên nào bị trùng lịch dạy, bao gồm cả GVCN trong tiết SHL).');
    console.log('4. SINH HOẠT LỚP THỨ 7: 0 lỗi (100% lớp đúng buổi: Ca Sáng Tiết 3, Ca Chiều Tiết 8; đúng GVCN phụ trách).');
    console.log('5. PERIOD_VALIDITY: 0 lỗi (Không có P4/P5 Thứ 7 sáng, không có P9/P10 Thứ 7 chiều; đúng 28 tiết/lớp; tổng 448 tiết toàn trường).');
    console.log('\n>>> AUDIT PASSED: HỆ THỐNG THỜI KHÓA BIỂU ĐẠT CHUẨN 100% <<<\n');
    process.exit(0);
  } else {
    console.error(`❌ TRẠNG THÁI: AUDIT FAILED (${errors.length} lỗi phát hiện):\n`);
    errors.forEach((err, idx) => {
      console.error(`${idx + 1}. [${err.type}] Lớp: ${err.className || err.classId || 'N/A'} | Thứ ${err.dayOfWeek ?? 'N/A'}, Tiết ${err.period ?? 'N/A'}`);
      console.error(`   Chi tiết: ${err.message}`);
    });
    process.exit(1);
  }
}

runAudit();
