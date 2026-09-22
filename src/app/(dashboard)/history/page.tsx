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
      return <span className="text-text-muted/30 font-mono">—</span>;
    }
    switch (status) {
      case 'present':
        return (
          <span
            className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center justify-center border border-emerald-300/60 shadow-2xs"
            title="Có mặt"
          >
            ✓
          </span>
        );
      case 'absent':
        return (
          <span
            className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold inline-flex items-center justify-center shadow-2xs"
            title="Vắng"
          >
            V
          </span>
        );
      case 'late':
        return (
          <span
            className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center shadow-2xs"
            title="Đi muộn"
          >
            M
          </span>
        );
      case 'excused':
        return (
          <span
            className="w-6 h-6 rounded-full bg-slate-600 text-white text-xs font-bold inline-flex items-center justify-center shadow-2xs"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Lịch sử điểm danh {currentClass ? currentClass.name : 'lớp học'}
            </h1>
            <span className="px-3 py-1 text-xs font-semibold bg-accent-subtle text-accent rounded-full border border-accent/20">
              {dates.length} buổi đã học
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
            Bảng theo dõi chuyên cần tổng thể qua các ngày học của <strong className="text-text-primary font-medium">{currentClass?.name || 'lớp'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap no-print">
          <Button variant="secondary" onClick={handleExportExcel} className="gap-2" title="Xuất ma trận điểm danh ra file Excel">
            <FileXls size={18} className="text-emerald-600" />
            <span>Xuất Excel</span>
          </Button>

          <Button variant="secondary" onClick={() => window.print()} className="gap-2" title="In bảng điểm danh A4">
            <Printer size={18} />
            <span>In báo cáo</span>
          </Button>

          <Link href="/attendance">
            <Button variant="primary" className="gap-2">
              <span>Điểm danh ngày mới</span>
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Warning Alert if students absent */}
      {studentsNeedingAttention.length > 0 && (
        <div className="p-5 rounded-2xl bg-warning-bg/90 border border-warning/30 flex items-start gap-4 no-print shadow-2xs">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
            <Warning size={22} weight="duotone" />
          </div>
          <div className="space-y-2 text-sm flex-1">
            <p className="font-bold text-text-primary">
              Học sinh cần lưu ý về chuyên cần:
            </p>
            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {studentsNeedingAttention.map((item) => (
                <Link
                  key={item.student.id}
                  href={`/students/${item.student.id}`}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-warning/40 hover:border-warning font-medium text-text-primary inline-flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all text-xs"
                >
                  <span className="font-semibold">{item.student.full_name}</span>
                  <span className="text-danger font-bold">({item.absent} vắng, {item.late} muộn)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend & Summary Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-text-secondary px-1 no-print">
        <div className="flex items-center gap-4 flex-wrap font-medium">
          <span className="text-text-primary font-bold text-xs uppercase tracking-wider">Chú giải:</span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center justify-center border border-emerald-300">✓</span>
            <span>Có mặt</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold inline-flex items-center justify-center">V</span>
            <span>Vắng</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold inline-flex items-center justify-center">M</span>
            <span>Đi muộn</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-full bg-slate-600 text-white text-xs font-bold inline-flex items-center justify-center">P</span>
            <span>Có phép</span>
          </span>
        </div>
        <div className="text-xs text-text-muted">
          <span>Hiển thị <strong className="text-text-primary font-semibold">{dates.length}</strong> buổi học gần nhất</span>
        </div>
      </div>

      {/* Main Matrix Table */}
      {dates.length === 0 ? (
        <EmptyStateView
          icon={<CalendarBlank size={36} className="opacity-60" />}
          title="Chưa có dữ liệu điểm danh"
          description={`Lớp ${currentClass?.name || 'này'} chưa có buổi học nào được ghi nhận điểm danh.`}
          actionText="Điểm danh buổi đầu tiên"
          actionHref="/attendance"
        />
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs printable-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-subtle/90 text-xs font-semibold text-text-muted border-b border-border">
                <tr>
                  <th className="px-5 py-4 font-semibold uppercase tracking-wider sticky left-0 bg-surface-subtle z-10 w-52 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    Học sinh ({students.length})
                  </th>
                  {dates.map((d) => (
                    <th key={d} className="px-2.5 py-4 text-center font-mono text-xs whitespace-nowrap min-w-[54px]">
                      {formatDateShort(d)}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center font-bold text-xs whitespace-nowrap text-success">
                    Có mặt
                  </th>
                  <th className="px-4 py-4 text-center font-bold text-xs whitespace-nowrap text-danger">
                    Vắng
                  </th>
                  <th className="px-4 py-4 text-center font-bold text-xs whitespace-nowrap text-accent">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentStats.map((item) => {
                  const initial = item.student.full_name.trim().split(' ').slice(-1)[0][0];

                  return (
                    <tr key={item.student.id} className="hover:bg-surface-subtle/60 transition-colors h-[56px]">
                      <td className="px-5 py-3 sticky left-0 bg-surface z-10 border-r border-border/60 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent-subtle text-accent font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/students/${item.student.id}`}
                              className="font-semibold text-text-primary hover:text-accent truncate block text-sm transition-colors"
                            >
                              {item.student.full_name}
                            </Link>
                            <span className="text-xs text-text-muted font-mono block">
                              {item.student.student_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      {dates.map((d) => {
                        const st = attendanceMap.get(`${item.student.id}_${d}`);
                        return (
                          <td key={d} className="px-1.5 py-3 text-center">
                            {renderStatusCell(st)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-sm font-bold text-success">
                        {item.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-danger">
                        {item.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-text-primary">
                        {item.rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
