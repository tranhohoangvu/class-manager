import { describe, it, expect } from 'vitest';
import { AdminReportService } from '../src/services/admin-report.service';

describe('AdminReportService — School-Wide Executive Analytics & Multi-Sheet Report', () => {
  describe('1. School-Wide Attendance Overview (getSchoolAttendanceOverview)', () => {
    it('tính toán chính xác chỉ số chuyên cần toàn trường hôm nay (tổng 480 học sinh, 16 lớp)', () => {
      const overview = AdminReportService.getSchoolAttendanceOverview();

      expect(overview).toBeDefined();
      expect(overview.totalStudents).toBe(480);
      expect(overview.totalActiveClasses).toBe(16);
      expect(overview.date).toBeTruthy();
      expect(overview.dateFormatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

      // Tổng các nhóm trạng thái phải bằng đúng tổng sĩ số học sinh
      const sum =
        overview.presentCount +
        overview.absentCount +
        overview.lateCount +
        overview.excusedCount +
        overview.unrecordedCount;
      expect(sum).toBe(overview.totalStudents);

      // Tỷ lệ chuyên cần trong khoảng hợp lệ
      expect(overview.attendanceRate).toBeGreaterThanOrEqual(0);
      expect(overview.attendanceRate).toBeLessThanOrEqual(100);
    });

    it('tính toán chuyên cần chính xác cho một ngày cụ thể trong quá khứ', () => {
      const specificDate = '2026-09-22';
      const overview = AdminReportService.getSchoolAttendanceOverview(specificDate);

      expect(overview.date).toBe(specificDate);
      expect(overview.presentCount).toBeGreaterThan(0);
      expect(overview.attendanceRate).toBeGreaterThan(80);
    });
  });

  describe('2. Phân rã chuyên cần theo 4 Khối lớp (getGradeAttendanceStats)', () => {
    it('thống kê đầy đủ và chính xác 4 khối THCS (Khối 6, 7, 8, 9)', () => {
      const gradeStats = AdminReportService.getGradeAttendanceStats();

      expect(gradeStats).toHaveLength(4);

      const grades = gradeStats.map((g) => g.grade);
      expect(grades).toEqual([6, 7, 8, 9]);

      // Mỗi khối chuẩn hóa 4 lớp và 120 học sinh
      let totalSchoolStudents = 0;
      gradeStats.forEach((g) => {
        expect(g.classCount).toBe(4);
        expect(g.totalStudents).toBe(120);
        expect(g.label).toBe(`Khối ${g.grade}`);
        expect(g.attendanceRate).toBeGreaterThanOrEqual(0);
        expect(g.attendanceRate).toBeLessThanOrEqual(100);
        totalSchoolStudents += g.totalStudents;
      });

      expect(totalSchoolStudents).toBe(480);
    });
  });

  describe('3. Giám sát chi tiết chuyên cần 16 lớp & Cảnh báo (getClassAttendanceStats, getHighAbsenceClasses)', () => {
    it('trả về chi tiết nề nếp chuyên cần của toàn bộ 16 lớp', () => {
      const classStats = AdminReportService.getClassAttendanceStats();

      expect(classStats).toHaveLength(16);

      classStats.forEach((c) => {
        expect(c.classId).toBeTruthy();
        expect(c.className).toMatch(/^(Lớp )?[6-9]A[1-4]$/);
        expect([6, 7, 8, 9]).toContain(c.grade);
        expect(c.totalStudents).toBe(30);
        expect(['excellent', 'good', 'warning', 'critical']).toContain(c.status);
        expect(c.teacherName).toBeTruthy();
      });
    });

    it('phát hiện và sắp xếp ưu tiên các lớp có học sinh vắng trong ngày', () => {
      const highAbsence = AdminReportService.getHighAbsenceClasses('2026-09-22');

      // Danh sách lớp cảnh báo phải có học sinh vắng hoặc tỷ lệ < 95%
      highAbsence.forEach((c) => {
        expect(c.absentCount > 0 || c.attendanceRate < 95).toBe(true);
      });

      // Kiểm tra sắp xếp giảm dần theo số lượng vắng
      for (let i = 0; i < highAbsence.length - 1; i++) {
        expect(highAbsence[i].absentCount).toBeGreaterThanOrEqual(highAbsence[i + 1].absentCount);
      }
    });
  });

  describe('4. Báo cáo tổng hợp xuất Excel 4 Sheet (generateSchoolReportWorkbookData)', () => {
    it('chuẩn bị đầy đủ cấu trúc dữ liệu cho 4 Sheet nghiệp vụ', () => {
      const data = AdminReportService.generateSchoolReportWorkbookData();

      // Thông tin tóm tắt
      expect(data.summary.schoolName).toBe('Trường THCS Nguyễn Tất Thành');
      expect(data.summary.schoolYear).toBe('2026 - 2027');
      expect(data.summary.totalClasses).toBe(16);
      expect(data.summary.totalStudents).toBe(480);
      expect(data.summary.totalTeachers).toBeGreaterThanOrEqual(24);

      // Sheet 1: 16 Lớp học
      expect(data.classesSheet).toHaveLength(16);
      expect(data.classesSheet[0]).toHaveProperty('Mã lớp');
      expect(data.classesSheet[0]).toHaveProperty('Tên lớp');
      expect(data.classesSheet[0]).toHaveProperty('Sĩ số hiện tại');
      expect(data.classesSheet[0]).toHaveProperty('Số bàn học');

      // Sheet 2: Đội ngũ Giáo viên
      expect(data.teachersSheet.length).toBeGreaterThanOrEqual(24);
      expect(data.teachersSheet[0]).toHaveProperty('Họ và tên');
      expect(data.teachersSheet[0]).toHaveProperty('Email');
      expect(data.teachersSheet[0]).toHaveProperty('Lớp chủ nhiệm');
      expect(data.teachersSheet[0]).toHaveProperty('Phân công giảng dạy');

      // Sheet 3: Chuyên cần toàn trường theo tháng
      expect(data.monthlyAttendanceSheet).toHaveLength(16);
      expect(data.monthlyAttendanceSheet[0]).toHaveProperty('Tên lớp');
      expect(data.monthlyAttendanceSheet[0]).toHaveProperty('Tỷ lệ chuyên cần');

      // Sheet 4: Thời khóa biểu toàn trường (16 lớp x 28 tiết = 448 tiết học)
      expect(data.timetableSheet).toHaveLength(448);
      expect(data.timetableSheet[0]).toHaveProperty('Lớp học');
      expect(data.timetableSheet[0]).toHaveProperty('Thứ');
      expect(data.timetableSheet[0]).toHaveProperty('Tiết học');
      expect(data.timetableSheet[0]).toHaveProperty('Môn học');
      expect(data.timetableSheet[0]).toHaveProperty('Giáo viên giảng dạy');
    });
  });
});
