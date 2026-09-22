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
