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
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { StudentRow, AttendanceRow, AttendanceStatus } from '@/types';
import { formatDateShort } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCurrentClass } from '@/contexts/class-context';

export default function AttendanceHistoryPage() {
  const { currentClassId, currentClass } = useCurrentClass();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!currentClassId) return;
    setStudents(LocalStore.getStudents(currentClassId).filter((s) => s.status === 'active'));
    setAttendanceRecords(LocalStore.getAttendanceRecords(currentClassId));
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
            Bảng theo dõi chuyên cần tổng thể qua các ngày học của {currentClass?.name || 'lớp'}
          </p>
        </div>

        <Link href="/attendance">
          <Button variant="primary">
            <span>Điểm danh ngày mới</span>
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {/* Warning Alert if students absent */}
      {studentsNeedingAttention.length > 0 && (
        <div className="p-4 rounded-xl bg-warning-subtle/50 border border-warning/30 flex items-start gap-3">
          <Warning size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-text-primary">
              Học sinh cần lưu ý về chuyên cần:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {studentsNeedingAttention.map((item) => (
                <Link
                  key={item.student.id}
                  href={`/students/${item.student.id}`}
                  className="px-2.5 py-1 rounded bg-surface border border-warning/40 hover:border-warning font-medium text-text-primary inline-flex items-center gap-1.5"
                >
                  <span>{item.student.full_name}</span>
                  <span className="text-danger font-semibold">({item.absent} vắng, {item.late} muộn)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="text-text-muted font-medium">Ký hiệu:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-success/20 text-success text-[9px] font-bold inline-flex items-center justify-center">
            ✓
          </span>
          <span>Có mặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold inline-flex items-center justify-center">
            V
          </span>
          <span>Vắng mặt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-warning text-white text-[9px] font-bold inline-flex items-center justify-center">
            M
          </span>
          <span>Đi muộn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-zinc-600 text-white text-[9px] font-bold inline-flex items-center justify-center">
            P
          </span>
          <span>Có phép</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-border tracking-wider text-text-muted font-mono">
              <tr>
                <th className="px-4 py-3 w-10 text-center">STT</th>
                <th className="px-4 py-3 w-20">Mã HS</th>
                <th className="px-4 py-3 min-w-[160px] sticky left-0 bg-surface-subtle z-10">
                  Họ và tên
                </th>
                {dates.slice(0, 10).map((d) => (
                  <th key={d} className="px-2.5 py-3 text-center min-w-[50px]">
                    {formatDateShort(d)}
                  </th>
                ))}
                <th className="px-3 py-3 text-center w-16 text-success">Có mặt</th>
                <th className="px-3 py-3 text-center w-16 text-danger">Vắng</th>
                <th className="px-3 py-3 text-center w-16 text-warning">Muộn</th>
                <th className="px-4 py-3 text-right w-24">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentStats.map((item, idx) => (
                <tr key={item.student.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="px-4 py-2.5 text-center text-text-muted font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-text-secondary">
                    {item.student.student_code}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-primary sticky left-0 bg-surface z-10">
                    <Link
                      href={`/students/${item.student.id}`}
                      className="hover:text-accent transition-colors"
                    >
                      {item.student.full_name}
                    </Link>
                  </td>
                  {dates.slice(0, 10).map((d) => {
                    const status = attendanceMap.get(`${item.student.id}_${d}`);
                    return (
                      <td key={d} className="px-2.5 py-2.5 text-center">
                        {renderStatusCell(status)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center font-semibold text-success">
                    {item.present}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-danger">
                    {item.absent}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-warning">
                    {item.late}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-accent">
                    {item.rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
