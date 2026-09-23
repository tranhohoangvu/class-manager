import * as XLSX from 'xlsx';
import { StudentRow, AttendanceStatus } from '@/types';
import { formatDate } from './utils';

/**
 * Export student list of a class to formatted Excel (.xlsx).
 */
export function exportStudentsToExcel(
  students: StudentRow[],
  className: string,
  seatMap: Map<string, string>
): void {
  const rows = students.map((s, index) => ({
    STT: index + 1,
    'Mã học sinh': s.student_code,
    'Họ và tên': s.full_name,
    'Giới tính': s.gender === 'male' ? 'Nam' : s.gender === 'female' ? 'Nữ' : '—',
    'Ngày sinh': s.date_of_birth ? formatDate(s.date_of_birth) : '—',
    'Lớp': className,
    'Vị trí chỗ ngồi': seatMap.get(s.id) || 'Chưa xếp',
    'Số điện thoại': s.phone || '—',
    'Trạng thái': s.status === 'active' ? 'Đang học' : 'Nghỉ học',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã HS
    { wch: 26 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Lớp
    { wch: 20 }, // Vị trí chỗ ngồi
    { wch: 16 }, // SĐT
    { wch: 14 }, // Trạng thái
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Danh sách ${className}`);

  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Danh_sach_hoc_sinh_${safeClassName}.xlsx`);
}

/**
 * Export attendance matrix (Students × Dates) to Excel (.xlsx).
 */
export function exportAttendanceToExcel(
  students: StudentRow[],
  dates: string[],
  recordMap: Map<string, AttendanceStatus>,
  className: string
): void {
  const statusLabel = (st: AttendanceStatus | undefined) => {
    switch (st) {
      case 'present':
        return '✓';
      case 'absent':
        return 'V';
      case 'late':
        return 'M';
      case 'excused':
        return 'P';
      default:
        return '—';
    }
  };

  const rows = students.map((stu, index) => {
    const rowObj: Record<string, any> = {
      STT: index + 1,
      'Mã HS': stu.student_code,
      'Họ và tên': stu.full_name,
      'Lớp': className,
    };

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    dates.forEach((d) => {
      const st = recordMap.get(`${stu.id}_${d}`);
      rowObj[d] = statusLabel(st);
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
    });

    const total = present + absent + late + excused;
    rowObj['Có mặt (buổi)'] = present;
    rowObj['Vắng (buổi)'] = absent;
    rowObj['Muộn (buổi)'] = late;
    rowObj['Có phép (buổi)'] = excused;
    rowObj['Tỷ lệ chuyên cần'] = total > 0 ? `${Math.round((present / total) * 100)}%` : '100%';

    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng điểm danh');

  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Bang_diem_danh_${safeClassName}.xlsx`);
}

/**
 * Download sample Excel template (.xlsx) for bulk importing students.
 */
export function downloadStudentImportTemplate(): void {
  const sampleData = [
    {
      'STT': 1,
      'Mã học sinh (*)': 'HS41',
      'Họ và tên (*)': 'Nguyễn Văn An',
      'Giới tính': 'Nam',
      'Ngày sinh': '2011-05-15',
      'SĐT phụ huynh': '0912345678',
      'Email': 'an.nguyen@example.com',
    },
    {
      'STT': 2,
      'Mã học sinh (*)': 'HS42',
      'Họ và tên (*)': 'Trần Thị Bình',
      'Giới tính': 'Nữ',
      'Ngày sinh': '2011-08-20',
      'SĐT phụ huynh': '0987654321',
      'Email': 'binh.tran@example.com',
    },
    {
      'STT': 3,
      'Mã học sinh (*)': 'HS43',
      'Họ và tên (*)': 'Lê Hoàng Cường',
      'Giới tính': 'Nam',
      'Ngày sinh': '2011-11-02',
      'SĐT phụ huynh': '0901234567',
      'Email': 'cuong.le@example.com',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 18 }, // SĐT phụ huynh
    { wch: 26 }, // Email
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mẫu danh sách');

  XLSX.writeFile(workbook, 'mau_danh_sach_hoc_sinh.xlsx');
}

/**
 * Xuất file Excel Báo cáo tổng hợp trường học THCS đa trang (4 sheets).
 */
export function exportSchoolComprehensiveReport(data: import('@/services/admin-report.service').SchoolReportWorkbookData): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Danh sách 16 Lớp học
  const wsClasses = XLSX.utils.json_to_sheet(data.classesSheet);
  wsClasses['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã lớp
    { wch: 14 }, // Tên lớp
    { wch: 8 },  // Khối
    { wch: 22 }, // Phòng học
    { wch: 24 }, // GVCN
    { wch: 14 }, // Sĩ số hiện tại
    { wch: 14 }, // Sĩ số tối đa
    { wch: 12 }, // Số bàn học
    { wch: 16 }, // Trạng thái
  ];
  XLSX.utils.book_append_sheet(workbook, wsClasses, '16 Lớp học');

  // Sheet 2: Đội ngũ Giáo viên & Phân công
  const wsTeachers = XLSX.utils.json_to_sheet(data.teachersSheet);
  wsTeachers['!cols'] = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ và tên
    { wch: 28 }, // Email
    { wch: 14 }, // Số điện thoại
    { wch: 16 }, // Vai trò
    { wch: 16 }, // Trạng thái
    { wch: 14 }, // Lớp chủ nhiệm
    { wch: 45 }, // Phân công giảng dạy
  ];
  XLSX.utils.book_append_sheet(workbook, wsTeachers, 'Đội ngũ Giáo viên');

  // Sheet 3: Chuyên cần toàn trường
  const wsAttendance = XLSX.utils.json_to_sheet(data.monthlyAttendanceSheet);
  wsAttendance['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Tên lớp
    { wch: 8 },  // Khối
    { wch: 10 }, // Sĩ số
    { wch: 14 }, // Lượt có mặt
    { wch: 16 }, // Vắng không phép
    { wch: 16 }, // Vắng có phép
    { wch: 12 }, // Đi muộn
    { wch: 18 }, // Tổng lượt ghi nhận
    { wch: 18 }, // Tỷ lệ chuyên cần
  ];
  XLSX.utils.book_append_sheet(workbook, wsAttendance, 'Chuyên cần toàn trường');

  // Sheet 4: Thời khóa biểu toàn trường
  const wsTimetable = XLSX.utils.json_to_sheet(data.timetableSheet);
  wsTimetable['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Lớp học
    { wch: 8 },  // Khối
    { wch: 12 }, // Thứ
    { wch: 10 }, // Tiết học
    { wch: 16 }, // Khung giờ
    { wch: 16 }, // Môn học
    { wch: 24 }, // Giáo viên giảng dạy
  ];
  XLSX.utils.book_append_sheet(workbook, wsTimetable, 'Thời khóa biểu');

  const filename = `Bao_cao_tong_hop_THCS_Nguyen_Tat_Thanh_2026_2027.xlsx`;
  XLSX.writeFile(workbook, filename);
}

