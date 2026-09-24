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
import { compareVietnameseNames } from '@/lib/constants';
import { LocalStore } from '@/lib/store';
import { PrintHeader, PrintSignatures } from '@/components/common/printable-paper';

export default function AttendanceHistoryPage() {
  const { currentClassId, currentClass } = useCurrentClass();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState(() => LocalStore.getSchoolSettings());

  useEffect(() => {
    const handleSettingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setSchoolSettings(detail);
      else setSchoolSettings(LocalStore.getSchoolSettings());
    };
    window.addEventListener('school-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('school-settings-updated', handleSettingsUpdate);
  }, []);
  const [timeRange, setTimeRange] = useState<'all' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'code_asc' | 'name_asc' | 'name_desc' | 'rate_asc' | 'rate_desc' | 'absent_desc'>('code_asc');

  useEffect(() => {
    if (!currentClassId) return;
    setStudents(StudentService.getStudents(currentClassId).filter((s) => s.status === 'active'));
    setAttendanceRecords(AttendanceService.getAttendanceRecords(currentClassId));
    setIsLoaded(true);
  }, [currentClassId]);

  // All distinct dates sorted descending
  const allDates = useMemo(() => {
    const set = new Set<string>();
    attendanceRecords.forEach((r) => set.add(r.date));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [attendanceRecords]);

  // Filtered dates based on time range
  const dates = useMemo(() => {
    if (timeRange === 'all') return allDates;

    if (timeRange === 'this_week') {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const startStr = monday.toISOString().split('T')[0];
      const endStr = sunday.toISOString().split('T')[0];
      return allDates.filter((d) => d >= startStr && d <= endStr);
    }

    if (timeRange === 'this_month') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${yyyy}-${mm}`;
      return allDates.filter((d) => d.startsWith(prefix));
    }

    if (timeRange === 'custom') {
      return allDates.filter((d) => {
        const matchStart = !customStartDate || d >= customStartDate;
        const matchEnd = !customEndDate || d <= customEndDate;
        return matchStart && matchEnd;
      });
    }

    return allDates;
  }, [allDates, timeRange, customStartDate, customEndDate]);

  // Map [student_id + '_' + date] -> status
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    attendanceRecords.forEach((r) => {
      map.set(`${r.student_id}_${r.date}`, r.status);
    });
    return map;
  }, [attendanceRecords]);

  // Calculate statistics per student strictly within the filtered dates
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

  // Sorted student statistics based on selected sort criteria
  const sortedStudentStats = useMemo(() => {
    return [...studentStats].sort((a, b) => {
      if (sortBy === 'name_asc') return compareVietnameseNames(a.student.full_name, b.student.full_name);
      if (sortBy === 'name_desc') return compareVietnameseNames(b.student.full_name, a.student.full_name);
      if (sortBy === 'code_asc') return a.student.student_code.localeCompare(b.student.student_code, 'vi', { numeric: true });
      if (sortBy === 'rate_asc') return a.rate - b.rate;
      if (sortBy === 'rate_desc') return b.rate - a.rate;
      if (sortBy === 'absent_desc') return b.absent - a.absent;
      return 0;
    });
  }, [studentStats, sortBy]);

  // Summary KPI for the selected time range
  const periodMetrics = useMemo(() => {
    const totalSessions = dates.length;
    let sumRate = 0;
    let sumAbsent = 0;
    let sumLate = 0;

    studentStats.forEach((s) => {
      sumRate += s.rate;
      sumAbsent += s.absent;
      sumLate += s.late;
    });

    const avgRate = studentStats.length > 0 ? Math.round(sumRate / studentStats.length) : 100;

    return {
      totalSessions,
      avgRate,
      sumAbsent,
      sumLate,
    };
  }, [dates, studentStats]);

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
        <div className="h-8 w-48 bg-surface-muted rounded-xs animate-pulse" />
        <div className="h-96 bg-surface-muted rounded-sm animate-pulse" />
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
            className="w-5 h-5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold font-mono inline-flex items-center justify-center text-[10px] shadow-2xs"
            title="Có mặt"
          >
            ✓
          </span>
        );
      case 'absent':
        return (
          <span
            className="w-5 h-5 rounded-xs bg-rose-50 text-rose-700 border border-rose-300 font-bold font-mono inline-flex items-center justify-center text-[10px] shadow-2xs"
            title="Vắng mặt"
          >
            V
          </span>
        );
      case 'late':
        return (
          <span
            className="w-5 h-5 rounded-xs bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold font-mono inline-flex items-center justify-center shadow-2xs"
            title="Đi muộn"
          >
            M
          </span>
        );
      case 'excused':
        return (
          <span
            className="w-5 h-5 rounded-xs bg-indigo-50 border border-indigo-300 text-indigo-700 text-[10px] font-bold font-mono inline-flex items-center justify-center shadow-2xs"
            title="Có phép"
          >
            P
          </span>
        );
    }
  };

  const homeroomTeacher = currentClass?.teacher_id
    ? LocalStore.getUserById(currentClass.teacher_id)
    : null;

  return (
    <div className="p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* =============================================
          1. FORMAL PRINT VIEW (A4 Attendance Matrix)
          ============================================= */}
      <div className="hidden print:block p-2 max-w-[100%] mx-auto text-black bg-white printable-card">
        <PrintHeader
          settings={schoolSettings}
          title={`BẢNG THEO DÕI CHUYÊN CẦN LỚP ${currentClass?.name || ''}`}
          metaLines={[
            `Phòng học: ${currentClass?.room_name || 'Phòng học chính'} · Sĩ số: ${students.length} học sinh · Tổng số buổi: ${dates.length} buổi`,
            `Giáo viên chủ nhiệm: ${homeroomTeacher?.name || '—'}`,
          ]}
        />

        <table className="w-full border-collapse border-2 border-black text-center text-[8.5pt]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase">
              <th className="border border-black py-2 px-1 w-8">STT</th>
              <th className="border border-black py-2 px-2 w-16">Mã HS</th>
              <th className="border border-black py-2 px-3 text-left">Họ và tên</th>
              {dates.slice(0, 10).map((d) => (
                <th key={d} className="border border-black py-2 px-1 w-11 font-mono text-[8pt]">
                  {formatDateShort(d)}
                </th>
              ))}
              <th className="border border-black py-2 px-1.5 w-12 text-black">Có mặt</th>
              <th className="border border-black py-2 px-1.5 w-12 text-black">Vắng</th>
              <th className="border border-black py-2 px-1.5 w-12 text-black">Muộn</th>
              <th className="border border-black py-2 px-2 w-14 text-black">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudentStats.map((item, idx) => (
              <tr key={item.student.id} className="border-b border-black">
                <td className="border border-black py-1.5 px-1 font-mono">{idx + 1}</td>
                <td className="border border-black py-1.5 px-2 font-mono font-bold">{item.student.student_code}</td>
                <td className="border border-black py-1.5 px-3 text-left font-bold">{item.student.full_name}</td>
                {dates.slice(0, 10).map((d) => {
                  const status = attendanceMap.get(`${item.student.id}_${d}`);
                  let label = '—';
                  if (status === 'present') label = '✓';
                  else if (status === 'absent') label = 'V';
                  else if (status === 'late') label = 'M';
                  else if (status === 'excused') label = 'P';
                  return (
                    <td key={d} className="border border-black py-1.5 px-1 font-mono font-bold text-[8.5pt]">
                      {label}
                    </td>
                  );
                })}
                <td className="border border-black py-1.5 px-1.5 font-mono">{item.present}</td>
                <td className="border border-black py-1.5 px-1.5 font-mono">{item.absent}</td>
                <td className="border border-black py-1.5 px-1.5 font-mono">{item.late}</td>
                <td className="border border-black py-1.5 px-2 font-mono font-bold">{item.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <PrintSignatures
          settings={schoolSettings}
          creatorRoleTitle="GIÁO VIÊN CHỦ NHIỆM"
          creatorName={homeroomTeacher?.name || 'Nguyễn Văn An'}
        />
      </div>

      {/* Screen View Container: Hidden on Print */}
      <div className="no-print space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              LỊCH SỬ CHUYÊN CẦN {currentClass ? currentClass.name : 'LỚP HỌC'}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-teal-subtle text-teal rounded-xs border border-teal/30">
              {dates.length} buổi đã học
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5 font-medium">
            Bảng theo dõi chuyên cần tổng thể qua các ngày học của <strong className="text-text-primary font-bold">{currentClass?.name || 'lớp'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap no-print">
          <Button variant="secondary" onClick={handleExportExcel} className="gap-2" title="Xuất ma trận điểm danh ra file Excel">
            <FileXls size={18} className="text-teal" />
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

      {/* Time Range Filter Bar */}
      <div className="bg-surface rounded-sm border border-border-strong p-4 shadow-xs no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono mr-1">Khoảng thời gian:</span>

          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${timeRange === 'all'
                ? 'bg-accent text-accent-text border border-border-strong shadow-xs'
                : 'bg-surface-muted hover:bg-surface text-text-secondary border border-border'
              }`}
          >
            Tất cả ({allDates.length} buổi)
          </button>

          <button
            type="button"
            onClick={() => setTimeRange('this_week')}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${timeRange === 'this_week'
                ? 'bg-accent text-accent-text border border-border-strong shadow-xs'
                : 'bg-surface-muted hover:bg-surface text-text-secondary border border-border'
              }`}
          >
            Tuần này
          </button>

          <button
            type="button"
            onClick={() => setTimeRange('this_month')}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${timeRange === 'this_month'
                ? 'bg-accent text-accent-text border border-border-strong shadow-xs'
                : 'bg-surface-muted hover:bg-surface text-text-secondary border border-border'
              }`}
          >
            Tháng này
          </button>

          <button
            type="button"
            onClick={() => setTimeRange('custom')}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${timeRange === 'custom'
                ? 'bg-accent text-accent-text border border-border-strong shadow-xs'
                : 'bg-surface-muted hover:bg-surface text-text-secondary border border-border'
              }`}
          >
            Tùy chọn khoảng ngày
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
              <span className="text-text-muted">Từ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-xs border border-border-strong bg-surface text-text-primary text-xs focus:outline-none focus:border-accent shadow-xs"
              />
              <span className="text-text-muted">Đến:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-xs border border-border-strong bg-surface text-text-primary text-xs focus:outline-none focus:border-accent shadow-xs"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 px-2.5 text-xs bg-surface rounded-xs border border-border-strong text-text-primary focus:outline-none focus:border-accent shadow-xs cursor-pointer font-medium"
              title="Sắp xếp danh sách bảng điểm danh"
            >
              <option value="code_asc">STT / Mã học sinh</option>
              <option value="name_asc">Tên Alphabet (A → Z)</option>
              <option value="name_desc">Tên Alphabet (Z → A)</option>
              <option value="rate_asc">Tỷ lệ chuyên cần (Thấp → Cao)</option>
              <option value="rate_desc">Tỷ lệ chuyên cần (Cao → Thấp)</option>
              <option value="absent_desc">Số lượt vắng nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Period KPI Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-surface rounded-sm border border-border-strong p-4 shadow-xs">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Số buổi đã học</span>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">{periodMetrics.totalSessions} buổi</div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-success uppercase tracking-wider font-mono">Chuyên cần kỳ này</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-success-bg text-success border border-success/30 font-mono">Bình quân</span>
          </div>
          <div className="text-2xl font-bold font-mono text-success mt-1">{periodMetrics.avgRate}%</div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-4 shadow-xs">
          <span className="text-xs font-bold text-danger uppercase tracking-wider font-mono">Tổng lượt vắng</span>
          <div className="text-2xl font-bold font-mono text-danger mt-1">{periodMetrics.sumAbsent} lượt</div>
        </div>

        <div className="bg-surface rounded-sm border border-border-strong p-4 shadow-xs">
          <span className="text-xs font-bold text-warning uppercase tracking-wider font-mono">Tổng lượt đi muộn</span>
          <div className="text-2xl font-bold font-mono text-warning mt-1">{periodMetrics.sumLate} lượt</div>
        </div>
      </div>

      {/* Warning Alert if students absent */}
      {studentsNeedingAttention.length > 0 && (
        <div className="p-4 rounded-sm bg-warning-bg border border-warning/40 flex items-start gap-4 no-print shadow-xs">
          <div className="p-1.5 rounded-xs bg-surface text-warning border border-warning/30 flex-shrink-0 shadow-xs">
            <Warning size={20} weight="duotone" />
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
                  className="px-2.5 py-1 rounded-xs bg-surface border border-warning/40 hover:border-warning font-medium text-text-primary inline-flex items-center gap-2 shadow-xs transition-all text-xs"
                >
                  <span className="font-bold">{item.student.full_name}</span>
                  <span className="text-danger font-bold font-mono">({item.absent} vắng, {item.late} muộn)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend & Summary Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-text-secondary px-1 no-print">
        <div className="flex items-center gap-4 flex-wrap font-medium">
          <span className="text-text-primary font-bold text-xs uppercase tracking-wider font-mono">Chú giải:</span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold font-mono inline-flex items-center justify-center">✓</span>
            <span className="text-text-secondary">Có mặt</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-xs bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold font-mono inline-flex items-center justify-center">V</span>
            <span className="text-text-secondary">Vắng</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-xs bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold font-mono inline-flex items-center justify-center shadow-2xs">M</span>
            <span className="text-text-secondary">Đi muộn</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 rounded-xs bg-indigo-50 border border-indigo-300 text-indigo-700 text-[10px] font-bold font-mono inline-flex items-center justify-center shadow-2xs">P</span>
            <span className="text-text-secondary">Có phép</span>
          </span>
        </div>
        <div className="text-xs text-text-secondary font-mono">
          <span>Hiển thị <strong className="text-text-primary font-bold">{dates.length}</strong> buổi học gần nhất</span>
        </div>
      </div>

      {/* Main Matrix Table */}
      {dates.length === 0 ? (
        <EmptyStateView
          icon={<CalendarBlank size={36} className="opacity-60" />}
          title="Chưa có dữ liệu điểm danh"
          description={`${currentClass?.name || 'Lớp học'} chưa có buổi học nào được ghi nhận điểm danh.`}
          actionText="Điểm danh buổi đầu tiên"
          actionHref="/attendance"
        />
      ) : (
        <div className="bg-surface rounded-sm border border-border-strong overflow-hidden shadow-xs no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-muted text-xs font-bold text-text-primary uppercase border-b border-border font-mono tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 sticky left-0 bg-surface-muted z-10 w-52 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    Học sinh ({students.length})
                  </th>
                  {dates.map((d) => (
                    <th key={d} className="px-2 py-3.5 text-center font-mono text-xs whitespace-nowrap min-w-[50px]">
                      {formatDateShort(d)}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-center font-bold text-xs whitespace-nowrap text-success">
                    Có mặt
                  </th>
                  <th className="px-4 py-3.5 text-center font-bold text-xs whitespace-nowrap text-danger">
                    Vắng
                  </th>
                  <th className="px-4 py-3.5 text-center font-bold text-xs whitespace-nowrap text-text-primary">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedStudentStats.map((item) => {
                  const initial = item.student.full_name.trim().split(' ').slice(-1)[0][0];

                  return (
                    <tr key={item.student.id} className="hover:bg-surface-muted/50 transition-colors h-[54px]">
                      <td className="px-5 py-3 sticky left-0 bg-surface z-10 border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xs bg-surface-muted text-text-secondary font-semibold text-xs flex items-center justify-center flex-shrink-0 border border-border font-mono shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/students/${item.student.id}`}
                              className="font-medium text-text-primary hover:text-teal truncate block text-sm transition-colors"
                            >
                              {item.student.full_name}
                            </Link>
                            <span className="text-[11px] text-text-muted font-mono block">
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
                      <td className="px-4 py-3 text-center text-sm font-semibold font-mono text-emerald-700">
                        {item.present}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold font-mono text-rose-700">
                        {item.absent}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold font-mono text-text-primary">
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
      </div> {/* End no-print */}
    </div>
  );
}
