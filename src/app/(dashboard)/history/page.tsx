'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarBlank,
  ClockCounterClockwise,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  FileXls,
  Printer,
} from '@phosphor-icons/react';
import { AttendanceService, StudentService } from '@/services';
import { StudentRow, AttendanceRow, AttendanceStatus } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { exportAttendanceToExcel } from '@/lib/export';
import { EmptyStateView } from '@/components/ui/state-views';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCurrentClass } from '@/contexts/class-context';

export default function AttendanceHistoryPage() {
  const { currentClassId, currentClass } = useCurrentClass();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!currentClassId) return;
    setStudents(StudentService.getStudents(currentClassId).filter((s) => s.status === 'active'));
    setAttendanceRecords(AttendanceService.getAttendanceRecords(currentClassId));
    setIsLoaded(true);
  }, [currentClassId]);

  // Distinct dates sorted descending
  const dates = useMemo(() => {
    const set = new Set<string>();
    attendanceRecords.forEach((r) => set.add(r.date));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [attendanceRecords]);

  // Map [student_id + '_' + date] -> status
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    attendanceRecords.forEach((r) => {
      map.set(`${r.student_id}_${r.date}`, r.status);
    });
    return map;
  }, [attendanceRecords]);

  // Calculate statistics per student
  const studentStats = useMemo(() => {
    return students.map((stu) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      dates.forEach((d) => {
        const st = attendanceMap.get(`${stu.id}_${d}`);
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'late') late++;
        else if (st === 'excused') excused++;
      });

      const recordedDays = present + absent + late + excused;
      const rate = recordedDays > 0 ? Math.round((present / recordedDays) * 100) : 100;

      return {
        student: stu,
        present,
        absent,
        late,
        excused,
        rate,
      };
    });
  }, [students, dates, attendanceMap]);

  // Students with high absence (> 1 absent)
  const studentsNeedingAttention = useMemo(() => {
    return studentStats.filter((s) => s.absent > 0 || s.late >= 2).slice(0, 5);
  }, [studentStats]);

  const handleExportExcel = () => {
    if (students.length === 0 || dates.length === 0) {
      toast.error('Chưa có dữ liệu điểm danh để xuất file!');
      return;
    }
    exportAttendanceToExcel(students, dates, attendanceMap, currentClass?.name || 'Lớp học');
    toast.success('Đã xuất file Excel bảng theo dõi điểm danh!');
  };

  if (!isLoaded) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-96 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const renderStatusCell = (status: AttendanceStatus | undefined) => {
    if (!status) {
      return <span className="text-text-muted/40">—</span>;
    }
    switch (status) {
      case 'present':
        return (
          <span
            className="w-5 h-5 rounded-full bg-success/20 text-success text-[10px] font-bold inline-flex items-center justify-center"
            title="Có mặt"
          >
            ✓
          </span>
        );
      case 'absent':
        return (
          <span
            className="w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold inline-flex items-center justify-center shadow-2xs"
            title="Vắng"
          >
            V
          </span>
        );
      case 'late':
        return (
          <span
            className="w-5 h-5 rounded-full bg-warning text-white text-[10px] font-bold inline-flex items-center justify-center shadow-2xs"
            title="Muộn"
          >
            M
          </span>
        );
      case 'excused':
        return (
          <span
            className="w-5 h-5 rounded-full bg-zinc-600 text-white text-[10px] font-bold inline-flex items-center justify-center shadow-2xs"
            title="Có phép"
          >
            P
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Lịch sử điểm danh {currentClass ? currentClass.name : 'lớp học'}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Bảng theo dõi chuyên cần tổng thể qua các ngày học của {currentClass?.name || 'lớp'} ({dates.length} buổi đã ghi nhận)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <Button variant="secondary" onClick={handleExportExcel} className="gap-1.5" title="Xuất ma trận điểm danh ra file Excel">
            <FileXls size={16} className="text-emerald-600" />
            <span>Xuất Excel</span>
          </Button>

          <Button variant="secondary" onClick={() => window.print()} className="gap-1.5" title="In bảng điểm danh A4">
            <Printer size={16} />
            <span>In báo cáo</span>
          </Button>

          <Link href="/attendance">
            <Button variant="primary" className="gap-1.5">
              <span>Điểm danh ngày mới</span>
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Warning Alert if students absent */}
      {studentsNeedingAttention.length > 0 && (
        <div className="p-4 rounded-xl bg-warning-bg border border-warning/30 flex items-start gap-3 no-print shadow-2xs">
          <Warning size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-text-primary">
              Học sinh cần lưu ý về chuyên cần:
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {studentsNeedingAttention.map((item) => (
                <Link
                  key={item.student.id}
                  href={`/students/${item.student.id}`}
                  className="px-2.5 py-1 rounded-md bg-surface border border-warning/40 hover:border-warning font-medium text-text-primary inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
                >
                  <span>{item.student.full_name}</span>
                  <span className="text-danger font-semibold">({item.absent} vắng, {item.late} muộn)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend & Summary Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted px-1 no-print">
        <div className="flex items-center gap-4 flex-wrap font-medium">
          <span className="text-text-secondary font-semibold">Chú giải:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-success text-white text-[10px] font-bold inline-flex items-center justify-center">✓</span>
            <span>Có mặt</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-danger text-white text-[10px] font-bold inline-flex items-center justify-center">V</span>
            <span>Vắng</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-warning text-white text-[10px] font-bold inline-flex items-center justify-center">M</span>
            <span>Đi muộn</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-zinc-600 text-white text-[10px] font-bold inline-flex items-center justify-center">P</span>
            <span>Có phép</span>
          </span>
        </div>
        <div>
          <span>Hiển thị <strong>{dates.length}</strong> buổi học gần nhất</span>
        </div>
      </div>

      {/* Main Matrix Table */}
      {dates.length === 0 ? (
        <EmptyStateView
          icon={<CalendarBlank size={32} className="opacity-60" />}
          title="Chưa có dữ liệu điểm danh"
          description={`Lớp ${currentClass?.name || 'này'} chưa có buổi học nào được ghi nhận điểm danh.`}
          actionText="Điểm danh buổi đầu tiên"
          actionHref="/attendance"
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs printable-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-subtle text-xs text-text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider sticky left-0 bg-surface-subtle z-10 w-44">
                    Học sinh ({students.length})
                  </th>
                  {dates.map((d) => (
                    <th key={d} className="px-2 py-3 text-center font-mono text-[11px] whitespace-nowrap min-w-[48px]">
                      {formatDateShort(d)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold text-xs whitespace-nowrap">
                    Có mặt
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-xs whitespace-nowrap">
                    Vắng
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-xs whitespace-nowrap">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentStats.map((item) => (
                  <tr key={item.student.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-surface z-10 border-r border-border/50">
                      <Link
                        href={`/students/${item.student.id}`}
                        className="font-medium text-text-primary hover:text-accent truncate block text-xs"
                      >
                        {item.student.full_name}
                      </Link>
                      <span className="text-[10px] text-text-muted font-mono block">
                        {item.student.student_code}
                      </span>
                    </td>
                    {dates.map((d) => {
                      const st = attendanceMap.get(`${item.student.id}_${d}`);
                      return (
                        <td key={d} className="px-1 py-2 text-center">
                          {renderStatusCell(st)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center text-xs font-semibold text-success">
                      {item.present}
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-semibold text-danger">
                      {item.absent}
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-bold text-text-primary">
                      {item.rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
