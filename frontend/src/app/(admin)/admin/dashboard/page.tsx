'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChalkboardTeacher,
  Chalkboard,
  Student,
  CheckCircle,
  Plus,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  FileXls,
  Clock,
  UserMinus,
  WarningCircle,
  MagnifyingGlass,
  ArrowSquareOut,
  CalendarCheck,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { UserRow, ClassRow, StudentRow } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AdminReportService,
  SchoolAttendanceOverview,
  GradeAttendanceStat,
  ClassAttendanceStat,
} from '@/services';
import { exportSchoolComprehensiveReport } from '@/lib/export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Attendance metrics
  const [attendanceOverview, setAttendanceOverview] = useState<SchoolAttendanceOverview | null>(null);
  const [gradeStats, setGradeStats] = useState<GradeAttendanceStat[]>([]);
  const [classAttendanceList, setClassAttendanceList] = useState<ClassAttendanceStat[]>([]);
  const [highAbsenceClasses, setHighAbsenceClasses] = useState<ClassAttendanceStat[]>([]);

  // Filter & Search states for class attendance table
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const t = LocalStore.getTeachers();
    const c = LocalStore.getClasses();
    const s = LocalStore.getStudents();

    setTeachers(t);
    setClasses(c);
    setStudents(s);

    // Compute executive school-wide metrics
    const overview = AdminReportService.getSchoolAttendanceOverview();
    const gStats = AdminReportService.getGradeAttendanceStats();
    const cStats = AdminReportService.getClassAttendanceStats();
    const alertClasses = AdminReportService.getHighAbsenceClasses();

    setAttendanceOverview(overview);
    setGradeStats(gStats);
    setClassAttendanceList(cStats);
    setHighAbsenceClasses(alertClasses);

    setIsLoaded(true);
  }, []);

  // Filtered class attendance list
  const filteredClassAttendance = useMemo(() => {
    return classAttendanceList.filter((item) => {
      const matchGrade = selectedGradeFilter === 'all' || item.grade === selectedGradeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.className.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q) ||
        item.roomName.toLowerCase().includes(q);
      return matchGrade && matchSearch;
    });
  }, [classAttendanceList, selectedGradeFilter, searchQuery]);

  // Handle multi-sheet Excel export
  const handleExportComprehensiveReport = () => {
    try {
      setIsExporting(true);
      const reportData = AdminReportService.generateSchoolReportWorkbookData();
      exportSchoolComprehensiveReport(reportData);
      toast.success(
        'Đã xuất file Báo cáo tổng hợp trường học THCS thành công (4 sheets: Lớp học, Giáo viên, Chuyên cần, TKB)!'
      );
    } catch (err: any) {
      toast.error('Lỗi khi xuất báo cáo: ' + (err?.message || 'Không xác định'));
    } finally {
      setIsExporting(false);
    }
  };

  if (!isLoaded || !attendanceOverview) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-64 bg-surface-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeTeachers = teachers.filter((t) => t.status === 'active').length;
  const activeClasses = classes.filter((c) => c.status === 'active').length;
  const assignedClassesCount = classes.filter((c) => c.status === 'active' && c.teacher_id).length;
  const assignmentRate = activeClasses > 0 ? Math.round((assignedClassesCount / activeClasses) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* =============================================
          1. HEADER & EXECUTIVE ACTIONS
          ============================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-surface-muted text-text-secondary border border-border rounded-lg">
              Năm học: 2026 - 2027
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Học kỳ 1
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md flex items-center gap-1">
              <CalendarCheck size={12} weight="bold" />
              Dữ liệu ngày {attendanceOverview.dateFormatted}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mt-2">
            Trung tâm Điều hành & Báo cáo Trường học
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Giám sát thời gian thực nề nếp chuyên cần, quy mô học sinh và xuất báo cáo tổng hợp 16 lớp THCS
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportComprehensiveReport}
            disabled={isExporting}
            className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold shadow-2xs"
          >
            <FileXls size={18} weight="duotone" className="text-emerald-700" />
            <span>{isExporting ? 'Đang xuất file...' : 'Xuất báo cáo trường (.xlsx)'}</span>
          </Button>

          <Link href="/admin/teachers">
            <Button variant="secondary" size="sm" className="cursor-pointer">
              <Plus size={16} />
              <span>Thêm Giáo viên</span>
            </Button>
          </Link>

          <Link href="/admin/classes">
            <Button variant="primary" size="sm" className="cursor-pointer">
              <Plus size={16} />
              <span>Tạo Lớp học mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* =============================================
          2. REAL-TIME SCHOOL ATTENDANCE KPIS
          ============================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Chuyên cần Toàn trường Hôm nay ({attendanceOverview.dateFormatted})
            </h2>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Cập nhật tự động từ 16 sổ điểm danh
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Tỷ lệ chuyên cần bình quân */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Tỷ lệ đi học</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle size={22} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700">
                {attendanceOverview.attendanceRate}%
              </span>
              <span className="text-xs text-text-muted font-medium">toàn trường</span>
            </div>
            <div className="mt-2 w-full bg-surface-muted h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${attendanceOverview.attendanceRate}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between">
              <span>Đạt chuẩn chuyên cần</span>
              <span className="font-semibold text-emerald-700">
                {attendanceOverview.presentCount}/{attendanceOverview.totalStudents} HS
              </span>
            </div>
          </div>

          {/* KPI 2: Học sinh có mặt */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Có mặt tại lớp</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Student size={22} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-primary">
                {attendanceOverview.presentCount}
              </span>
              <span className="text-xs text-text-muted">/{attendanceOverview.totalStudents} học sinh</span>
            </div>
            <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Đang tham gia học tập sáng nay</span>
            </div>
          </div>

          {/* KPI 3: Học sinh vắng */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Vắng mặt hôm nay</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <UserMinus size={22} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-700">
                {attendanceOverview.absentCount + attendanceOverview.excusedCount}
              </span>
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                {attendanceOverview.absentCount} không phép
              </span>
            </div>
            <div className="mt-2 text-xs text-text-muted flex items-center justify-between">
              <span>{attendanceOverview.excusedCount} em có phép</span>
              <span className="text-[11px] text-rose-600 font-medium">BGH & Giám thị lưu ý</span>
            </div>
          </div>

          {/* KPI 4: Đi muộn */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Đi học muộn</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Clock size={22} weight="duotone" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700">
                {attendanceOverview.lateCount}
              </span>
              <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                lượt muộn
              </span>
            </div>
            <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
              <span>Ghi nhận trước giờ vào tiết 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* =============================================
          3. ATTENDANCE ALERTS: LỚP CÓ HỌC SINH VẮNG TRONG NGÀY
          ============================================= */}
      {highAbsenceClasses.length > 0 && (
        <div className="bg-surface rounded-2xl border border-rose-200/80 p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <WarningCircle size={20} weight="fill" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Cảnh báo Nề nếp Hôm nay: {highAbsenceClasses.length} lớp có học sinh vắng / muộn
                </h3>
                <p className="text-xs text-rose-700/80">
                  Thông tin phục vụ công tác giám thị đầu giờ và đối chiếu nề nếp với Giáo viên chủ nhiệm
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              Tổng {highAbsenceClasses.reduce((acc, c) => acc + c.absentCount, 0)} HS vắng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {highAbsenceClasses.map((item) => (
              <div
                key={item.classId}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary">{item.className}</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                      Vắng {item.absentCount}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-1 truncate">
                    GVCN: <span className="font-medium text-text-secondary">{item.teacherName}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {item.roomName} · Sĩ số: {item.totalStudents} HS
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs">
                  <span className="text-rose-700 font-semibold">Tỷ lệ: {item.attendanceRate}%</span>
                  <Link
                    href={`/attendance`}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    <span>Xem sổ</span>
                    <ArrowSquareOut size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =============================================
          4. GRADE SCALE & ATTENDANCE BREAKDOWN (KHỐI 6 - 9)
          ============================================= */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-text-primary">Quy mô & Tỷ lệ Chuyên cần theo 4 Khối lớp</h2>
            <p className="text-xs text-text-muted mt-0.5">Trường THCS Nguyễn Tất Thành · 16 lớp học chuẩn hóa (4 lớp / khối)</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
            10 môn học theo chuẩn Bộ GD&ĐT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gradeStats.map((item) => (
            <div
              key={item.grade}
              className="p-4 bg-surface-muted/40 rounded-xl border border-border/80 space-y-2 hover:bg-surface-muted/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-sm font-bold text-text-primary">{item.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface text-text-primary border border-border">
                  {item.classCount} lớp
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-text-muted">Tổng học sinh</span>
                <span className="text-sm font-bold text-text-primary">{item.totalStudents} HS</span>
              </div>

              {/* Attendance Progress for this Grade */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted text-[11px]">Chuyên cần hôm nay</span>
                  <span className="font-bold text-emerald-700">{item.attendanceRate}%</span>
                </div>
                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-black/5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${item.attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/50">
                <span>Có mặt: <strong className="text-emerald-700 font-semibold">{item.presentCount}</strong></span>
                <span>Vắng: <strong className="text-rose-600 font-semibold">{item.absentCount}</strong></span>
                <span>Muộn: <strong className="text-amber-700 font-semibold">{item.lateCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =============================================
          5. BẢNG GIÁM SÁT CHUYÊN CẦN 16 LỚP HỌC HÔM NAY
          ============================================= */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              Bảng Giám sát Chuyên cần 16 Lớp Toàn trường
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Theo dõi chi tiết số học sinh có mặt, vắng, muộn và tỷ lệ chuyên cần từng lớp trong ngày
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm lớp, GVCN, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent w-48 sm:w-56"
              />
            </div>

            {/* Grade Tabs */}
            <div className="flex items-center bg-surface-muted p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setSelectedGradeFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                  selectedGradeFilter === 'all'
                    ? 'bg-surface text-text-primary font-bold shadow-2xs'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Tất cả ({classAttendanceList.length})
              </button>
              {[6, 7, 8, 9].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGradeFilter(g)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer',
                    selectedGradeFilter === g
                      ? 'bg-surface text-text-primary font-bold shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Khối {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/70 text-text-muted font-bold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-3.5">Lớp học</th>
                <th className="py-3 px-3.5">Khối</th>
                <th className="py-3 px-3.5">Giáo viên chủ nhiệm</th>
                <th className="py-3 px-3.5">Phòng học</th>
                <th className="py-3 px-3.5 text-center">Sĩ số</th>
                <th className="py-3 px-3.5 text-center">Có mặt</th>
                <th className="py-3 px-3.5 text-center">Vắng</th>
                <th className="py-3 px-3.5 text-center">Muộn</th>
                <th className="py-3 px-3.5 text-center">Tỷ lệ</th>
                <th className="py-3 px-3.5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredClassAttendance.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-text-muted">
                    Không tìm thấy lớp học nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredClassAttendance.map((c) => (
                  <tr key={c.classId} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-text-primary">
                      {c.className}
                    </td>
                    <td className="py-3 px-3.5 text-text-muted">
                      Khối {c.grade}
                    </td>
                    <td className="py-3 px-3.5 text-text-secondary font-semibold">
                      {c.teacherName}
                    </td>
                    <td className="py-3 px-3.5 text-text-muted">
                      {c.roomName}
                    </td>
                    <td className="py-3 px-3.5 text-center text-text-primary font-bold">
                      {c.totalStudents}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold text-emerald-700">
                      {c.presentCount}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {c.absentCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold">
                          {c.absentCount}
                        </span>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {c.lateCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          {c.lateCount}
                        </span>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-extrabold text-emerald-700">
                        <span>{c.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {c.status === 'excellent' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Xuất sắc
                        </span>
                      )}
                      {c.status === 'good' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          Tốt
                        </span>
                      )}
                      {c.status === 'warning' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          Cần lưu ý
                        </span>
                      )}
                      {c.status === 'critical' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Vắng nhiều
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =============================================
          6. GENERAL OVERVIEW (TEACHERS & RECENT CLASSES)
          ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Overview */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">Đội ngũ Giáo viên ({teachers.length})</h2>
              <p className="text-xs text-text-muted mt-0.5">Giáo viên chủ nhiệm và phân công giảng dạy chuyên môn</p>
            </div>
            <Link
              href="/admin/teachers"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/20 transition-colors"
            >
              <span>Xem tất cả ({teachers.length})</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {teachers.slice(0, 5).map((t) => {
              const assigned = classes.filter((c) => c.teacher_id === t.id);
              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200/70 flex-shrink-0">
                      {t.name.charAt(t.name.lastIndexOf(' ') + 1) || t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate flex items-center gap-2">
                        <span>{t.name}</span>
                        {t.status === 'disabled' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            Đã khóa
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">{t.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {assigned.length > 0 ? (
                      assigned.map((c) => (
                        <span
                          key={c.id}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic bg-surface-muted px-2 py-0.5 rounded-md">
                        Chưa làm GVCN
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classes Overview */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">Danh mục Lớp học ({classes.length})</h2>
              <p className="text-xs text-text-muted mt-0.5">Sĩ số và phòng học các lớp đang hoạt động</p>
            </div>
            <Link
              href="/admin/classes"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/20 transition-colors"
            >
              <span>Xem tất cả ({classes.length})</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {classes
              .filter((c) => c.status === 'active')
              .slice(0, 5)
              .map((c) => {
                const teacher = teachers.find((t) => t.id === c.teacher_id);
                const classStudents = students.filter((s) => s.class_id === c.id);
                return (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className="text-[11px] text-text-muted font-normal">
                          {c.room_name || 'Chưa xếp phòng'}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        GVCN:{' '}
                        {teacher ? (
                          <span className="text-text-secondary font-semibold">{teacher.name}</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Chưa phân công</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-text-primary">
                        {classStudents.length}
                      </span>
                      <span className="text-xs text-text-muted">/{c.max_students} HS</span>
                      <div className="w-16 bg-surface-muted h-1 rounded-full mt-1 overflow-hidden ml-auto">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((classStudents.length / c.max_students) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
