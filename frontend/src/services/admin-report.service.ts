import { LocalStore } from '@/lib/store';
import { getTodayISO } from '@/lib/utils';
import {
  TIMETABLE_PERIODS,
  TIMETABLE_DAYS,
} from '@/lib/constants';
import { AttendanceRow } from '@/types';

export interface SchoolAttendanceOverview {
  date: string;
  dateFormatted: string;
  totalStudents: number;
  totalActiveClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  unrecordedCount: number;
  attendanceRate: number; // 0 - 100
}

export interface GradeAttendanceStat {
  grade: number;
  label: string;
  classCount: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface ClassAttendanceStat {
  classId: string;
  className: string;
  grade: number;
  roomName: string;
  teacherName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  unrecordedCount: number;
  attendanceRate: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface SchoolReportWorkbookData {
  summary: {
    schoolName: string;
    schoolYear: string;
    exportDate: string;
    totalClasses: number;
    totalTeachers: number;
    totalStudents: number;
  };
  classesSheet: Array<{
    STT: number;
    'Mã lớp': string;
    'Tên lớp': string;
    'Khối': number;
    'Phòng học': string;
    'Giáo viên chủ nhiệm': string;
    'Sĩ số hiện tại': number;
    'Sĩ số tối đa': number;
    'Số bàn học': number;
    'Trạng thái': string;
  }>;
  teachersSheet: Array<{
    STT: number;
    'Họ và tên': string;
    'Email': string;
    'Số điện thoại': string;
    'Vai trò': string;
    'Trạng thái': string;
    'Lớp chủ nhiệm': string;
    'Phân công giảng dạy': string;
  }>;
  monthlyAttendanceSheet: Array<{
    STT: number;
    'Tên lớp': string;
    'Khối': number;
    'Sĩ số': number;
    'Lượt có mặt': number;
    'Vắng không phép': number;
    'Vắng có phép': number;
    'Đi muộn': number;
    'Tổng lượt ghi nhận': number;
    'Tỷ lệ chuyên cần': string;
  }>;
  timetableSheet: Array<{
    STT: number;
    'Lớp học': string;
    'Khối': number;
    'Thứ': string;
    'Tiết học': string;
    'Khung giờ': string;
    'Môn học': string;
    'Giáo viên giảng dạy': string;
  }>;
}

export const AdminReportService = {
  /**
   * Lấy ngày có dữ liệu điểm danh theo thời gian thực (hôm nay) hoặc ngày được yêu cầu
   */
  getEffectiveAttendanceDate(preferredDate?: string): string {
    if (preferredDate) return preferredDate;
    // Tự động chuyển ngày theo thời gian thực (new Date()), không gán cứng, sang ngày mới luôn lấy ngày hiện tại
    return getTodayISO();
  },

  /**
   * Xác định bản ghi điểm danh có hiệu lực nhất của từng học sinh trong ngày.
   * Ưu tiên bản ghi cập nhật mới nhất (updated_at / created_at).
   * Nếu cùng thời gian, ưu tiên trạng thái ngoại lệ: absent / excused / late > present.
   */
  getEffectiveStudentRecords(records: AttendanceRow[]): Map<string, AttendanceRow> {
    const studentRecordMap = new Map<string, AttendanceRow>();
    records.forEach((r) => {
      const existing = studentRecordMap.get(r.student_id);
      if (!existing) {
        studentRecordMap.set(r.student_id, r);
      } else {
        const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
        const curTime = new Date(r.updated_at || r.created_at || 0).getTime();
        if (curTime > existingTime) {
          studentRecordMap.set(r.student_id, r);
        } else if (curTime === existingTime) {
          if (r.status !== 'present' && existing.status === 'present') {
            studentRecordMap.set(r.student_id, r);
          }
        }
      }
    });
    return studentRecordMap;
  },

  /**
   * Tính toán bức tranh chuyên cần toàn trường tại một ngày cụ thể (mặc định tất cả Có mặt)
   */
  getSchoolAttendanceOverview(targetDate?: string): SchoolAttendanceOverview {
    const effectiveDate = this.getEffectiveAttendanceDate(targetDate);
    const students = LocalStore.getStudents().filter((s) => s.status === 'active');
    const classes = LocalStore.getClasses().filter((c) => c.status === 'active');
    const records = LocalStore.getAttendanceForDate(effectiveDate);

    // Map studentId -> bản ghi điểm danh có hiệu lực nhất
    const studentRecordMap = this.getEffectiveStudentRecords(records);

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let unrecordedCount = 0;

    students.forEach((s) => {
      const rec = studentRecordMap.get(s.id);
      const status = rec?.status;
      if (status === 'excused') {
        // Chỉ ghi nhận có phép khi người dùng chọn đúng trạng thái 'excused' (có hoặc không có ghi chú)
        excusedCount++;
      } else if (status === 'absent') {
        // Trạng thái 'absent' luôn là vắng không phép (kể cả có ghi chú)
        absentCount++;
      } else if (status === 'late') {
        lateCount++;
      } else {
        // Mặc định toàn bộ học sinh Có mặt (Default-Present Attendance)
        presentCount++;
      }
    });

    const attendanceRate =
      students.length > 0
        ? Math.round((presentCount / students.length) * 1000) / 10
        : 100;

    const [y, m, d] = effectiveDate.split('-');
    const dateFormatted = `${d}/${m}/${y}`;

    return {
      date: effectiveDate,
      dateFormatted,
      totalStudents: students.length,
      totalActiveClasses: classes.length,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      unrecordedCount,
      attendanceRate,
    };
  },

  /**
   * Thống kê chuyên cần phân rã theo 4 khối (Khối 6, 7, 8, 9)
   */
  getGradeAttendanceStats(targetDate?: string): GradeAttendanceStat[] {
    const effectiveDate = this.getEffectiveAttendanceDate(targetDate);
    const classes = LocalStore.getClasses().filter((c) => c.status === 'active');
    const students = LocalStore.getStudents().filter((s) => s.status === 'active');
    const records = LocalStore.getAttendanceForDate(effectiveDate);

    const studentRecordMap = this.getEffectiveStudentRecords(records);

    const grades = [6, 7, 8, 9];

    return grades.map((grade) => {
      const gradeClasses = classes.filter((c) => c.grade === grade);
      const gradeClassIds = new Set(gradeClasses.map((c) => c.id));
      const gradeStudents = students.filter((s) => gradeClassIds.has(s.class_id));

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;

      gradeStudents.forEach((s) => {
        const rec = studentRecordMap.get(s.id);
        const status = rec?.status;
        if (status === 'excused') excusedCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
        else presentCount++; // Mặc định Có mặt
      });

      const attendanceRate =
        gradeStudents.length > 0
          ? Math.round((presentCount / gradeStudents.length) * 1000) / 10
          : 100;

      return {
        grade,
        label: `Khối ${grade}`,
        classCount: gradeClasses.length,
        totalStudents: gradeStudents.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      };
    });
  },

  /**
   * Thống kê chi tiết chuyên cần của từng lớp học trong ngày
   */
  getClassAttendanceStats(targetDate?: string): ClassAttendanceStat[] {
    const effectiveDate = this.getEffectiveAttendanceDate(targetDate);
    const classes = LocalStore.getClasses().filter((c) => c.status === 'active');
    const students = LocalStore.getStudents().filter((s) => s.status === 'active');
    const teachers = LocalStore.getUsers().filter((u) => u.role === 'TEACHER');
    const records = LocalStore.getAttendanceForDate(effectiveDate);

    const teacherMap = new Map<string, string>();
    teachers.forEach((t) => teacherMap.set(t.id, t.name));

    const studentRecordMap = this.getEffectiveStudentRecords(records);

    return classes
      .map((c) => {
        const classStudents = students.filter((s) => s.class_id === c.id);
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let excusedCount = 0;
        let unrecordedCount = 0;

        classStudents.forEach((s) => {
          const rec = studentRecordMap.get(s.id);
          const status = rec?.status;
          if (status === 'excused') excusedCount++;
          else if (status === 'absent') absentCount++;
          else if (status === 'late') lateCount++;
          else presentCount++; // Mặc định Có mặt
        });

        const attendanceRate =
          classStudents.length > 0
            ? Math.round((presentCount / classStudents.length) * 1000) / 10
            : 100;

        const totalAbsent = absentCount + excusedCount;
        let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
        if (attendanceRate < 85 || totalAbsent >= 3) status = 'critical';
        else if (attendanceRate < 95 || totalAbsent > 0) status = 'warning';
        else if (lateCount > 0) status = 'good';

        return {
          classId: c.id,
          className: c.name,
          grade: c.grade,
          roomName: c.room_name || 'Chưa xếp phòng',
          teacherName: c.teacher_id ? teacherMap.get(c.teacher_id) || 'Chưa phân công' : 'Chưa phân công',
          totalStudents: classStudents.length,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          unrecordedCount,
          attendanceRate,
          status,
        };
      })
      .sort((a, b) => a.grade - b.grade || a.className.localeCompare(b.className));
  },

  /**
   * Lọc danh sách các lớp có học sinh vắng hoặc chuyên cần dưới ngưỡng
   */
  getHighAbsenceClasses(targetDate?: string, thresholdRate = 95): ClassAttendanceStat[] {
    const all = this.getClassAttendanceStats(targetDate);
    return all
      .filter((c) => c.absentCount > 0 || c.attendanceRate < thresholdRate)
      .sort((a, b) => b.absentCount - a.absentCount || a.attendanceRate - b.attendanceRate);
  },

  /**
   * Chuẩn bị toàn bộ dữ liệu 4 sheet cho file Excel báo cáo trường học
   */
  generateSchoolReportWorkbookData(): SchoolReportWorkbookData {
    const classes = LocalStore.getClasses().filter((c) => c.status === 'active');
    const teachers = LocalStore.getTeachers();
    const students = LocalStore.getStudents().filter((s) => s.status === 'active');
    const subjects = LocalStore.getSubjects();
    const assignments = LocalStore.getSubjectAssignments();
    const timetables = LocalStore.getAllTimetables();
    const attendanceRecords = LocalStore.getAttendanceRecords();

    const teacherMap = new Map<string, string>();
    teachers.forEach((t) => teacherMap.set(t.id, t.name));

    const subjectMap = new Map<string, string>();
    subjects.forEach((s) => subjectMap.set(s.id, s.name));

    const classMap = new Map<string, string>();
    classes.forEach((c) => classMap.set(c.id, c.name));

    // 1. Sheet 1: Danh sách 16 Lớp học
    const classesSheet = classes.map((c, idx) => {
      const studentCount = students.filter((s) => s.class_id === c.id).length;
      return {
        STT: idx + 1,
        'Mã lớp': c.id,
        'Tên lớp': c.name,
        'Khối': c.grade,
        'Phòng học': c.room_name || 'Phòng học chính',
        'Giáo viên chủ nhiệm': c.teacher_id ? teacherMap.get(c.teacher_id) || 'Chưa gán' : 'Chưa gán',
        'Sĩ số hiện tại': studentCount,
        'Sĩ số tối đa': c.max_students,
        'Số bàn học': c.desk_count,
        'Trạng thái': c.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng',
      };
    });

    // 2. Sheet 2: Đội ngũ Giáo viên & Phân công
    const teachersSheet = teachers.map((t, idx) => {
      const homeroomClasses = classes.filter((c) => c.teacher_id === t.id).map((c) => c.name).join(', ') || 'Không';
      const teachingList = assignments
        .filter((a) => a.teacher_id === t.id)
        .map((a) => `${classMap.get(a.class_id) || a.class_id} (${subjectMap.get(a.subject_id) || a.subject_id})`)
        .join('; ') || 'Chưa phân công';

      return {
        STT: idx + 1,
        'Họ và tên': t.name,
        'Email': t.email,
        'Số điện thoại': t.phone || '—',
        'Vai trò': t.role === 'ADMIN' ? 'Ban Giám Hiệu' : 'Giáo viên',
        'Trạng thái': t.status === 'active' ? 'Đang công tác' : 'Tạm khóa',
        'Lớp chủ nhiệm': homeroomClasses,
        'Phân công giảng dạy': teachingList,
      };
    });

    // 3. Sheet 3: Chuyên cần toàn trường theo lớp
    const monthlyAttendanceSheet = classes.map((c, idx) => {
      const classStudents = students.filter((s) => s.class_id === c.id);
      const classStudentIds = new Set(classStudents.map((s) => s.id));
      const classRecords = attendanceRecords.filter((r) => classStudentIds.has(r.student_id));

      let presentSessions = 0;
      let absentSessions = 0;
      let lateSessions = 0;
      let excusedSessions = 0;

      classRecords.forEach((r) => {
        if (r.status === 'present') presentSessions++;
        else if (r.status === 'absent') absentSessions++;
        else if (r.status === 'late') lateSessions++;
        else if (r.status === 'excused') excusedSessions++;
      });

      const total = presentSessions + absentSessions + lateSessions + excusedSessions;
      const rateStr = total > 0 ? `${Math.round((presentSessions / total) * 1000) / 10}%` : '100%';

      return {
        STT: idx + 1,
        'Tên lớp': c.name,
        'Khối': c.grade,
        'Sĩ số': classStudents.length,
        'Lượt có mặt': presentSessions,
        'Vắng không phép': absentSessions,
        'Vắng có phép': excusedSessions,
        'Đi muộn': lateSessions,
        'Tổng lượt ghi nhận': total,
        'Tỷ lệ chuyên cần': rateStr,
      };
    });

    // 4. Sheet 4: Thời khóa biểu toàn trường
    const sortedTimetables = [...timetables].sort((a, b) => {
      const classCompare = a.class_id.localeCompare(b.class_id);
      if (classCompare !== 0) return classCompare;
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.period - b.period;
    });

    const timetableSheet = sortedTimetables.map((t, idx) => {
      const cls = classes.find((c) => c.id === t.class_id);
      const dayObj = TIMETABLE_DAYS.find((d) => d.day === t.day_of_week);
      const periodObj = TIMETABLE_PERIODS.find((p) => p.period === t.period);

      return {
        STT: idx + 1,
        'Lớp học': cls?.name || t.class_id,
        'Khối': cls?.grade || 0,
        'Thứ': dayObj?.name || `Thứ ${t.day_of_week}`,
        'Tiết học': periodObj?.label || `Tiết ${t.period}`,
        'Khung giờ': periodObj ? `${periodObj.startTime} - ${periodObj.endTime}` : '—',
        'Môn học': subjectMap.get(t.subject_id) || t.subject_id,
        'Giáo viên giảng dạy': t.teacher_id ? teacherMap.get(t.teacher_id) || 'Chưa xếp' : 'Chưa xếp',
      };
    });

    const now = new Date();
    const exportDateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    return {
      summary: {
        schoolName: 'Trường THCS Nguyễn Tất Thành',
        schoolYear: '2026 - 2027',
        exportDate: exportDateStr,
        totalClasses: classes.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
      },
      classesSheet,
      teachersSheet,
      monthlyAttendanceSheet,
      timetableSheet,
    };
  },
};
