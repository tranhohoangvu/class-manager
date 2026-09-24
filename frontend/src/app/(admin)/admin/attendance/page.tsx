'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  UserMinus,
  WarningCircle,
  MagnifyingGlass,
  ArrowRight,
  ArrowsClockwise,
  FileXls,
  Sparkle,
  Eye,
  Chalkboard,
  Door,
  UserCheck,
  CaretUp,
  CaretDown,
  Printer,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { PrintHeader, PrintSignatures } from '@/components/common/printable-paper';
import {
  ClassRow,
  StudentRow,
  UserRow,
  AttendanceRow,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/contexts/auth-context';
import {
  AdminReportService,
  AttendanceService,
  SchoolAttendanceOverview,
  GradeAttendanceStat,
  ClassAttendanceStat,
} from '@/services';
import { exportSchoolComprehensiveReport } from '@/lib/export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getGradeShift } from '@/lib/constants';

type StatusFilter = 'all' | 'has_absence' | 'perfect';
type AttendanceSortOption =
  | 'class_asc'
  | 'class_desc'
  | 'absent_desc'
  | 'absent_asc'
  | 'late_desc'
  | 'late_asc'
  | 'rate_asc'
  | 'rate_desc'
  | 'students_desc';

// Helper to normalize class display names and avoid "Lớp Lớp 6A1" duplicate prefixes
const formatClassName = (name?: string) => {
  if (!name) return '';
  const clean = name.replace(/^lớp\s+/i, '').trim();
  return `Lớp ${clean}`;
};

export default function AdminAttendanceManagementPage() {
  const { user } = useAuth();

  // Selected date for viewing / managing attendance (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [records, setRecords] = useState<AttendanceRow[]>([]);

  // Overview metrics
  const [attendanceOverview, setAttendanceOverview] = useState<SchoolAttendanceOverview | null>(null);
  const [gradeStats, setGradeStats] = useState<GradeAttendanceStat[]>([]);
  const [classList, setClassList] = useState<ClassAttendanceStat[]>([]);

  // Filters & Search
  const [gradeFilter, setGradeFilter] = useState<'all' | '6' | '7' | '8' | '9'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<AttendanceSortOption>('class_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetScope, setResetTargetScope] = useState<string>('all');
  const [isResetting, setIsResetting] = useState(false);

  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassAttendanceStat | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = () => {
    const c = LocalStore.getClasses().filter((cls) => cls.status === 'active');
    const s = LocalStore.getStudents().filter((stu) => stu.status === 'active');
    const t = LocalStore.getTeachers();
    const recs = LocalStore.getAttendanceForDate(selectedDate);

    setClasses(c);
    setStudents(s);
    setTeachers(t);
    setRecords(recs);

    // Compute metrics for the selected date
    const overview = AdminReportService.getSchoolAttendanceOverview(selectedDate);
    const gStats = AdminReportService.getGradeAttendanceStats(selectedDate);
    const cStats = AdminReportService.getClassAttendanceStats(selectedDate);

    setAttendanceOverview(overview);
    setGradeStats(gStats);
    setClassList(cStats);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Export excel report
  const handleExportReport = () => {
    try {
      setIsExporting(true);
      const reportData = AdminReportService.generateSchoolReportWorkbookData();
      exportSchoolComprehensiveReport(reportData);
      toast.success('Đã xuất file Báo cáo chuyên cần trường học thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi xuất báo cáo: ' + (err?.message || 'Không xác định'));
    } finally {
      setIsExporting(false);
    }
  };

  // Open reset modal
  const handleOpenResetModal = (targetClassId = 'all') => {
    setResetTargetScope(targetClassId);
    setIsResetModalOpen(true);
  };

  // Confirm reset
  const handleConfirmReset = () => {
    try {
      setIsResetting(true);
      const targetClassId = resetTargetScope === 'all' ? undefined : resetTargetScope;
      const currentUser = user || (LocalStore.getUsers().find((u) => u.role === 'ADMIN') || null);
      const res = AttendanceService.resetAttendanceForDate(
        selectedDate,
        targetClassId,
        currentUser
      );

      if (!res.success) {
        toast.error(res.error || 'Đặt lại điểm danh thất bại');
        return;
      }

      const scopeText =
        resetTargetScope === 'all'
          ? 'toàn bộ 16 lớp (480 học sinh)'
          : formatClassName(classes.find((c) => c.id === resetTargetScope)?.name || resetTargetScope);

      toast.success(`Đã đặt lại điểm danh ngày ${selectedDate} cho ${scopeText} về 100% Có mặt!`);
      setIsResetModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Lỗi khi đặt lại: ' + (err?.message || 'Không xác định'));
    } finally {
      setIsResetting(false);
    }
  };

  // View class detail modal
  const handleViewClassDetail = (cls: ClassAttendanceStat) => {
    setSelectedClassDetail(cls);
    setIsDetailModalOpen(true);
  };

  // Filtered class list
  const filteredClasses = useMemo(() => {
    const list = classList.filter((item) => {
      const matchGrade = gradeFilter === 'all' || item.grade.toString() === gradeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.className.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q) ||
        item.roomName.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'has_absence') {
        matchStatus = item.absentCount > 0 || item.lateCount > 0;
      } else if (statusFilter === 'perfect') {
        matchStatus = item.absentCount === 0 && item.lateCount === 0;
      }

      return matchGrade && matchSearch && matchStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'class_asc') {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.className.localeCompare(b.className, 'vi', { numeric: true });
      }
      if (sortBy === 'class_desc') {
        if (a.grade !== b.grade) return b.grade - a.grade;
        return b.className.localeCompare(a.className, 'vi', { numeric: true });
      }
      if (sortBy === 'absent_desc') return b.absentCount - a.absentCount;
      if (sortBy === 'absent_asc') return a.absentCount - b.absentCount;
      if (sortBy === 'late_desc') return b.lateCount - a.lateCount;
      if (sortBy === 'late_asc') return a.lateCount - b.lateCount;
      if (sortBy === 'rate_asc') return a.attendanceRate - b.attendanceRate;
      if (sortBy === 'rate_desc') return b.attendanceRate - a.attendanceRate;
      if (sortBy === 'students_desc') return b.totalStudents - a.totalStudents;
      return 0;
    });
  }, [classList, gradeFilter, searchQuery, statusFilter, sortBy]);

  // List of all students with non-present records across whole school for selected date
  const schoolWideExceptions = useMemo(() => {
    const studentMap = new Map<string, StudentRow>();
    students.forEach((s) => studentMap.set(s.id, s));

    const classMap = new Map<string, ClassRow>();
    classes.forEach((c) => classMap.set(c.id, c));

    // Map each student to their latest non-present status
    const exceptionMap = new Map<string, AttendanceRow>();
    records.forEach((r) => {
      if (r.status === 'absent' || r.status === 'late' || r.status === 'excused') {
        exceptionMap.set(r.student_id, r);
      }
    });

    return Array.from(exceptionMap.values()).map((rec) => {
      const student = studentMap.get(rec.student_id);
      const classObj = student ? classMap.get(student.class_id) : null;
      return {
        record: rec,
        student,
        classObj,
      };
    }).sort((a, b) => {
      const gradeA = a.classObj?.grade || 0;
      const gradeB = b.classObj?.grade || 0;
      if (gradeA !== gradeB) return gradeA - gradeB;
      return (a.classObj?.name || '').localeCompare(b.classObj?.name || '');
    });
  }, [records, students, classes]);

  if (!isLoaded || !attendanceOverview) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
        <div className="h-8 w-64 bg-surface-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* =============================================
          PRINT VIEW ONLY (A4 Formal Attendance Report)
          ============================================= */}
      <div className="hidden print:block p-2 max-w-[100%] mx-auto text-black bg-white printable-card space-y-5">
        <PrintHeader
          settings={schoolSettings}
          title="BÁO CÁO NỀ NẾP CHUYÊN CẦN TOÀN TRƯỜNG"
          subtitle={`Ngày khảo sát: ${attendanceOverview.dateFormatted} (${selectedDate ? selectedDate.split('-').reverse().join('/') : ''})`}
          rightMeta={
            <div className="space-y-0.5">
              <div>Quy mô: <strong>16 Lớp THCS · 480 Học sinh</strong></div>
              <div>Tỷ lệ chuyên cần chung: <strong>{attendanceOverview.attendanceRate}%</strong></div>
            </div>
          }
        />

        {/* ============================================================== */}
        {/* I. NỀ NẾP CHUYÊN CẦN PHÂN RÃ THEO 4 KHỐI LỚP (4 BẢNG RIÊNG BIỆT) */}
        {/* ============================================================== */}
        <div>
          <div className="font-bold uppercase text-[10pt] mb-2 tracking-wide text-black border-b border-black pb-1 flex justify-between items-center">
            <span>I. NỀ NẾP CHUYÊN CẦN PHÂN RÃ THEO 4 KHỐI LỚP</span>
            <span className="text-[8.5pt] font-mono normal-case">
              4 lớp / khối · 120 học sinh / khối
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {[6, 7, 8, 9].map((gradeNum) => {
              const stat = gradeStats.find((g) => g.grade === gradeNum);
              const classItems = classList.filter((c) => c.grade === gradeNum);
              const shiftLabel = getGradeShift(gradeNum) === 'morning' ? 'Ca Sáng (07:15 - 11:35)' : 'Ca Chiều (12:45 - 17:05)';
              const rate = stat?.attendanceRate || 100;
              const absentTotal = stat?.absentCount || 0;
              const lateTotal = stat?.lateCount || 0;
              const presentTotal = stat?.presentCount || 120;
              const totalStudents = stat?.totalStudents || 120;

              return (
                <div key={gradeNum} className="border-2 border-black p-2 space-y-1.5">
                  <div className="flex justify-between items-center pb-1 border-b border-black font-bold text-[8.5pt]">
                    <span className="uppercase text-[9pt]">KHỐI {gradeNum} · {shiftLabel}</span>
                    <span className="font-mono">Tỷ lệ: {rate}% ({presentTotal}/{totalStudents})</span>
                  </div>

                  <table className="w-full border-collapse border border-black text-center text-[8pt]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black font-bold uppercase text-[7.5pt]">
                        <th className="border border-black py-1 px-1 w-7">STT</th>
                        <th className="border border-black py-1 px-1.5 w-14">Lớp</th>
                        <th className="border border-black py-1 px-1 w-11">Sĩ số</th>
                        <th className="border border-black py-1 px-1 w-11">Có mặt</th>
                        <th className="border border-black py-1 px-1 w-10">Vắng</th>
                        <th className="border border-black py-1 px-1 w-10">Muộn</th>
                        <th className="border border-black py-1 px-1 w-12">Tỷ lệ</th>
                        <th className="border border-black py-1 px-2 text-left">GVCN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classItems.map((cls, idx) => (
                        <tr key={cls.classId} className="border-b border-black">
                          <td className="border border-black py-1 px-0.5 font-mono">{idx + 1}</td>
                          <td className="border border-black py-1 px-1 font-bold">{cls.className}</td>
                          <td className="border border-black py-1 px-1 font-mono">{cls.totalStudents}</td>
                          <td className="border border-black py-1 px-1 font-mono">{cls.presentCount}</td>
                          <td className="border border-black py-1 px-1 font-mono font-bold">{cls.absentCount}</td>
                          <td className="border border-black py-1 px-1 font-mono">{cls.lateCount}</td>
                          <td className="border border-black py-1 px-1 font-mono font-bold">{cls.attendanceRate}%</td>
                          <td className="border border-black py-1 px-2 text-left truncate">{cls.teacherName || '—'}</td>
                        </tr>
                      ))}
                      {/* Dòng tổng khối */}
                      <tr className="bg-gray-50 font-bold border-t border-black text-[8pt]">
                        <td colSpan={2} className="border border-black py-1 px-1 uppercase text-center font-bold">
                          TỔNG KHỐI {gradeNum}
                        </td>
                        <td className="border border-black py-1 px-1 font-mono">{totalStudents}</td>
                        <td className="border border-black py-1 px-1 font-mono">{presentTotal}</td>
                        <td className="border border-black py-1 px-1 font-mono font-bold">{absentTotal}</td>
                        <td className="border border-black py-1 px-1 font-mono">{lateTotal}</td>
                        <td className="border border-black py-1 px-1 font-mono font-bold">{rate}%</td>
                        <td className="border border-black py-1 px-2 text-left italic font-normal text-[7.5pt]">
                          {absentTotal === 0 ? '✓ Đủ 100%' : `Vắng ${absentTotal} HS`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* DÒNG TỔNG CỘNG TOÀN TRƯỜNG */}
          <div className="mt-3 p-2 border-2 border-black bg-gray-50 flex justify-between items-center text-[9pt] font-bold">
            <span className="uppercase">TỔNG CỘNG TOÀN TRƯỜNG (16 LỚP THCS):</span>
            <div className="flex gap-4 font-mono">
              <span>Sĩ số: <strong>{attendanceOverview.totalStudents}</strong></span>
              <span>Có mặt: <strong>{attendanceOverview.presentCount}</strong></span>
              <span>Vắng: <strong className="text-black">{attendanceOverview.absentCount}</strong></span>
              <span>Muộn: <strong>{attendanceOverview.lateCount}</strong></span>
              <span>Tỷ lệ chung: <strong>{attendanceOverview.attendanceRate}%</strong></span>
            </div>
          </div>
        </div>

        {/* BẢNG 2: DANH SÁCH HỌC SINH NGOẠI LỆ TOÀN TRƯỜNG (VẮNG / ĐI MUỘN) */}
        <div className="pt-2">
          <div className="font-bold uppercase text-[10pt] mb-2 tracking-wide text-black flex justify-between items-center">
            <span>II. DANH SÁCH HỌC SINH VẮNG / ĐI MUỘN TRONG NGÀY</span>
            <span className="text-[9pt] font-mono normal-case">
              (Tổng cộng: {schoolWideExceptions.length} trường hợp)
            </span>
          </div>
          {schoolWideExceptions.length > 0 ? (
            <table className="w-full border-collapse border-2 border-black text-left text-[9pt]">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-center">
                  <th className="border border-black py-2 px-1 w-10">STT</th>
                  <th className="border border-black py-2 px-2 w-24">Mã học sinh</th>
                  <th className="border border-black py-2 px-3 text-left">Họ và tên</th>
                  <th className="border border-black py-2 px-2 w-28 text-center">Lớp (Khối)</th>
                  <th className="border border-black py-2 px-2 w-16 text-center">Giới tính</th>
                  <th className="border border-black py-2 px-2 w-32 text-center">Trạng thái</th>
                  <th className="border border-black py-2 px-3">Ghi chú / Lý do</th>
                </tr>
              </thead>
              <tbody>
                {schoolWideExceptions.map((item, idx) => {
                  const isAbsent = item.record.status === 'absent';
                  const isLate = item.record.status === 'late';
                  const isExcused = item.record.status === 'excused' || (item.record.note && item.record.note.toLowerCase().includes('phép'));

                  const statusText = isExcused
                    ? 'Vắng có phép'
                    : isAbsent
                    ? 'Vắng không phép'
                    : isLate
                    ? 'Đi muộn'
                    : '---';

                  return (
                    <tr key={`${item.record.student_id}-${idx}`} className="border-b border-black">
                      <td className="border border-black py-1.5 px-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black py-1.5 px-2 text-center font-mono">{item.student?.student_code || '---'}</td>
                      <td className="border border-black py-1.5 px-3 font-bold text-left">{item.student?.full_name || 'Học sinh'}</td>
                      <td className="border border-black py-1.5 px-2 text-center font-medium">
                        {item.classObj?.name || '---'} (Khối {item.classObj?.grade})
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">
                        {item.student?.gender === 'female' ? 'Nữ' : 'Nam'}
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center font-bold">
                        {statusText}
                      </td>
                      <td className="border border-black py-1.5 px-3 text-left italic">
                        {item.record.note || 'Không có ghi chú'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-3 border-2 border-black text-center font-medium italic text-[9.5pt]">
              Toàn trường đạt chuyên cần 100% vào ngày {attendanceOverview.dateFormatted}. Không có học sinh nào vắng hoặc đi muộn.
            </div>
          )}
        </div>

        {/* CHỮ KÝ PHÊ DUYỆT */}
        <PrintSignatures
          settings={schoolSettings}
          principalTitle="Ban Giám Hiệu phê duyệt"
          creatorRoleTitle="Cán bộ Quản trị hệ thống"
          creatorName={user?.name || 'Ban Giám Hiệu'}
        />
      </div>

      {/* ============================================================== */}
      {/* SCREEN VIEW CONTAINER (Strictly hidden during print: no-print)  */}
      {/* ============================================================== */}
      <div className="no-print space-y-6">
        {/* =============================================
            1. HEADER & ACTIONS
            ============================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              QUẢN LÝ CHUYÊN CẦN TOÀN TRƯỜNG
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 font-bold text-xs whitespace-nowrap flex-shrink-0">
              <CalendarCheck size={14} weight="bold" />
              16 Lớp THCS
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium">
            Theo dõi nề nếp chuyên cần, học sinh vắng/muộn và điều hành điểm danh toàn trường.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-xs text-xs shadow-2xs whitespace-nowrap flex-shrink-0 h-8">
            <Calendar size={15} className="text-text-muted flex-shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none font-mono font-semibold cursor-pointer text-xs"
            />
          </div>

          {/* Reset Attendance Button - In Red */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleOpenResetModal('all')}
            className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold border border-red-700 shadow-xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
            title="Khôi phục trạng thái 100% Có mặt cho toàn trường hoặc lớp học khi có sai sót"
          >
            <ArrowsClockwise size={15} weight="bold" />
            <span>Đặt lại về Có mặt</span>
          </Button>

          {/* Export Report Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportReport}
            disabled={isExporting}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border font-semibold shadow-2xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
          >
            <FileXls size={16} weight="duotone" className="text-emerald-700" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </Button>

          {/* Print Report Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border font-semibold shadow-2xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
            title="In báo cáo chuyên cần toàn trường khổ A4"
          >
            <Printer size={15} weight="bold" />
            <span>In báo cáo</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadData();
              toast.success('Dữ liệu chuyên cần đã được làm mới!');
            }}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-secondary border-border font-semibold shadow-2xs flex-shrink-0 h-8 w-8 p-0 flex items-center justify-center"
            title="Làm mới dữ liệu"
          >
            <ArrowsClockwise size={15} />
          </Button>
        </div>
      </div>

      {/* =============================================
          2. SCHOOL ATTENDANCE OVERVIEW KPI TILES (4 CARDS)
          ============================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch no-print">
        {/* KPI 1: Tỷ lệ Chuyên cần */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span className="truncate">Tỷ lệ Chuyên cần Toàn trường</span>
              <span className={cn(
                'font-bold px-1.5 py-0.5 rounded-sm text-[11px] border whitespace-nowrap flex-shrink-0',
                attendanceOverview.attendanceRate >= 95
                  ? 'bg-teal-subtle text-teal border-teal/20'
                  : 'bg-warning-bg text-warning-700 border-warning/30'
              )}>
                Mục tiêu &ge; 95%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-primary font-mono tabular-nums">
                {attendanceOverview.attendanceRate}%
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">ngày {attendanceOverview.dateFormatted}</span>
            </div>
            <div className="mt-3 w-full bg-surface-muted h-2 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-teal h-full rounded-full transition-all duration-300"
                style={{ width: `${attendanceOverview.attendanceRate}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border flex items-center justify-between">
            <span>Sĩ số: <strong className="text-text-primary font-mono">{attendanceOverview.totalStudents}</strong> học sinh</span>
            <span><strong className="text-text-primary font-mono">{attendanceOverview.totalActiveClasses}</strong> lớp THCS</span>
          </div>
        </div>

        {/* KPI 2: Học sinh Có mặt */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Học sinh Có mặt</span>
              <span className="font-bold text-success bg-success-bg px-1.5 py-0.5 rounded-sm text-[11px] border border-success/30 whitespace-nowrap flex-shrink-0">
                Đầy đủ
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-text-primary font-mono tabular-nums text-success">
                {attendanceOverview.presentCount}
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">/ {attendanceOverview.totalStudents} học sinh</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              Mặc định toàn bộ học sinh có mặt khi sang ngày mới theo cơ chế quản lý theo ngoại lệ.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border">
            <span>Tỷ lệ có mặt: <strong className="text-success font-mono font-bold">{Math.round((attendanceOverview.presentCount / attendanceOverview.totalStudents) * 1000) / 10}%</strong></span>
          </div>
        </div>

        {/* KPI 3: Học sinh Vắng */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Học sinh Vắng hôm nay</span>
              <span className={cn(
                'font-bold px-1.5 py-0.5 rounded-sm text-[11px] border whitespace-nowrap flex-shrink-0',
                attendanceOverview.absentCount > 0
                  ? 'bg-danger-bg text-danger border-danger/30'
                  : 'bg-surface-muted text-text-muted border-border'
              )}>
                {attendanceOverview.absentCount > 0 ? 'Cần theo dõi' : '0 vắng'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn(
                'text-3xl font-extrabold font-mono tabular-nums',
                attendanceOverview.absentCount > 0 ? 'text-danger' : 'text-text-primary'
              )}>
                {attendanceOverview.absentCount}
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">học sinh vắng</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="text-danger font-medium whitespace-nowrap">Không phép: <strong className="font-mono">{attendanceOverview.absentCount - attendanceOverview.excusedCount > 0 ? attendanceOverview.absentCount - attendanceOverview.excusedCount : 0}</strong></span>
              <span className="text-text-muted font-medium whitespace-nowrap">Có phép: <strong className="font-mono">{attendanceOverview.excusedCount}</strong></span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border">
            <span>GVCN và GVBM ghi nhận trực tiếp vào sổ</span>
          </div>
        </div>

        {/* KPI 4: Học sinh Đi muộn */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium gap-2">
              <span>Học sinh Đi muộn</span>
              <span className={cn(
                'font-bold px-1.5 py-0.5 rounded-sm text-[11px] border whitespace-nowrap flex-shrink-0',
                attendanceOverview.lateCount > 0
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-surface-muted text-text-muted border-border'
              )}>
                {attendanceOverview.lateCount > 0 ? 'Cảnh báo nề nếp' : 'Đúng giờ'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn(
                'text-3xl font-extrabold font-mono tabular-nums',
                attendanceOverview.lateCount > 0 ? 'text-amber-800' : 'text-text-primary'
              )}>
                {attendanceOverview.lateCount}
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">học sinh muộn</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-2">
              Học sinh đến sau giờ truy bài hoặc vào tiết muộn được ghi nhận để nhắc nhở nề nếp.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-text-muted pt-2 border-t border-border">
            <span>Theo dõi chỉ số vi phạm đầu giờ</span>
          </div>
        </div>
      </div>

      {/* =============================================
          3. BREAKDOWN BY 4 GRADES (KHỐI 6, 7, 8, 9)
          ============================================= */}
      <div className="rounded-sm border border-border-strong bg-surface p-4 text-xs space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xs bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold flex-shrink-0">
              <UserMinus size={15} weight="fill" className="text-amber-700" />
            </span>
            <span className="font-extrabold uppercase tracking-wide text-xs text-text-primary">
              NỀ NẾP CHUYÊN CẦN PHÂN RÃ THEO 4 KHỐI LỚP (NGÀY {attendanceOverview.dateFormatted})
            </span>
          </div>
          <span className="text-[11px] text-text-muted whitespace-nowrap">4 lớp / khối · 120 học sinh / khối</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              grade: 6,
              label: 'Khối 6',
              shift: 'Ca Sáng (07:15 - 11:35)',
              container: 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/20',
              badge: 'bg-amber-100 text-amber-900 border-amber-300',
              accent: 'text-amber-800',
            },
            {
              grade: 7,
              label: 'Khối 7',
              shift: 'Ca Chiều (12:45 - 17:05)',
              container: 'border-teal-300 bg-teal-50/30 dark:bg-teal-950/20',
              badge: 'bg-teal-100 text-teal-900 border-teal-300',
              accent: 'text-teal-800',
            },
            {
              grade: 8,
              label: 'Khối 8',
              shift: 'Ca Chiều (12:45 - 17:05)',
              container: 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/20',
              badge: 'bg-blue-100 text-blue-900 border-blue-300',
              accent: 'text-blue-800',
            },
            {
              grade: 9,
              label: 'Khối 9',
              shift: 'Ca Sáng (07:15 - 11:35)',
              container: 'border-purple-300 bg-purple-50/30 dark:bg-purple-950/20',
              badge: 'bg-purple-100 text-purple-900 border-purple-300',
              accent: 'text-purple-800',
            },
          ].map((cfg) => {
            const stat = gradeStats.find((g) => g.grade === cfg.grade);
            const classItems = classList.filter((c) => c.grade === cfg.grade);
            const absentTotal = stat?.absentCount || 0;
            const lateTotal = stat?.lateCount || 0;
            const rate = stat?.attendanceRate || 100;

            return (
              <div
                key={cfg.grade}
                className={cn('rounded-xs border p-3 space-y-2.5 transition-all shadow-2xs', cfg.container)}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60 gap-2">
                  <span className={cn('font-extrabold text-xs px-2 py-0.5 rounded-xs uppercase tracking-wider font-mono border whitespace-nowrap flex-shrink-0', cfg.badge)}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium whitespace-nowrap">
                    {cfg.shift}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xl font-extrabold font-mono text-text-primary">
                      {rate}%
                    </div>
                    <div className="text-[10px] text-text-muted">Chuyên cần</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-text-primary font-mono whitespace-nowrap">
                      {stat?.presentCount || 120} / {stat?.totalStudents || 120}
                    </div>
                    <div className="text-[10px] text-text-muted">Có mặt</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-border/50">
                  <div className={cn('px-2 py-1 rounded-xs border font-medium text-center whitespace-nowrap', absentTotal > 0 ? 'bg-danger-bg text-danger border-danger/30 font-bold' : 'bg-surface/80 border-border text-text-muted')}>
                    Vắng: {absentTotal}
                  </div>
                  <div className={cn('px-2 py-1 rounded-xs border font-medium text-center whitespace-nowrap', lateTotal > 0 ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-surface/80 border-border text-text-muted')}>
                    Muộn: {lateTotal}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  {classItems.map((cls) => (
                    <div
                      key={cls.classId}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xs bg-surface/90 border border-border/70 text-[11px]"
                    >
                      <span className="font-bold text-text-primary whitespace-nowrap">{cls.className}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={cn(
                          'px-1.5 py-0.2 rounded-xs font-mono font-bold text-[10px] border whitespace-nowrap',
                          cls.absentCount > 0
                            ? 'bg-danger text-white border-danger'
                            : 'bg-surface-muted text-text-muted border-border'
                        )}>
                          Vắng {cls.absentCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleViewClassDetail(cls)}
                          className="text-teal hover:underline text-[10px] font-bold cursor-pointer whitespace-nowrap flex-shrink-0"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =============================================
          4. 16-CLASS ATTENDANCE MANAGEMENT TABLE
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 md:p-5 shadow-xs space-y-4 no-print">
        {/* Table Title & Filter Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Chalkboard size={18} className="text-teal" />
              <span>Bảng Quản lý Điểm danh Chi tiết 16 Lớp THCS</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Theo dõi và điều hành chuyên cần theo từng lớp học. Nhấn &quot;Đặt lại&quot; để khôi phục lớp về 100% có mặt.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Grade Tabs: Strict single-line, whitespace-nowrap, neat padding */}
            <div className="inline-flex items-center border border-border rounded-xs bg-surface-muted/50 p-0.5 text-xs font-bold flex-shrink-0">
              {[
                { key: 'all', label: 'Tất cả khối' },
                { key: '6', label: 'Khối 6' },
                { key: '7', label: 'Khối 7' },
                { key: '8', label: 'Khối 8' },
                { key: '9', label: 'Khối 9' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGradeFilter(tab.key as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-xs transition-colors cursor-pointer text-xs whitespace-nowrap flex-shrink-0 font-medium',
                    gradeFilter === tab.key
                      ? 'bg-surface text-text-primary shadow-2xs font-extrabold border border-border'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-8 bg-surface border border-border rounded-xs px-3 text-xs text-text-primary font-medium cursor-pointer focus:outline-none focus:border-teal whitespace-nowrap flex-shrink-0"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="has_absence">Lớp có học sinh vắng/muộn</option>
              <option value="perfect">Lớp chuyên cần đủ 100%</option>
            </select>

            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AttendanceSortOption)}
              className="h-8 bg-surface border border-border rounded-xs px-2.5 text-xs text-text-primary font-semibold cursor-pointer focus:outline-none focus:border-teal whitespace-nowrap flex-shrink-0"
              title="Sắp xếp danh sách chuyên cần"
            >
              <option value="class_asc">Mặc định: Khối 6 &rarr; Khối 9</option>
              <option value="class_desc">Tên lớp: Z &rarr; A</option>
              <option value="absent_desc">🚨 Vắng nhiều nhất</option>
              <option value="absent_asc">Vắng ít nhất</option>
              <option value="late_desc">⏱ Đi muộn nhiều nhất</option>
              <option value="late_asc">Đi muộn ít nhất</option>
              <option value="rate_asc">⚠️ Chuyên cần thấp nhất</option>
              <option value="rate_desc">✓ Chuyên cần cao nhất (100%)</option>
              <option value="students_desc">Sĩ số: Nhiều nhất</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[220px] h-8 flex-shrink-0">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm lớp, GVCN, phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-surface border border-border rounded-xs pl-8 pr-3 text-xs text-text-primary focus:outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>

        {/* The Table */}
        <div className="w-full border border-border rounded-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-muted/60 border-b border-border text-text-secondary font-bold uppercase tracking-wider text-[11px] whitespace-nowrap select-none">
                <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">STT</th>
                <th
                  className="py-2.5 px-3 whitespace-nowrap cursor-pointer hover:text-text-primary"
                  onClick={() => setSortBy(sortBy === 'class_asc' ? 'class_desc' : 'class_asc')}
                >
                  <div className="flex items-center gap-1">
                    <span>Lớp học</span>
                    {sortBy === 'class_asc' && <CaretUp size={11} weight="bold" />}
                    {sortBy === 'class_desc' && <CaretDown size={11} weight="bold" />}
                  </div>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ca học & Phòng</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Giáo viên chủ nhiệm</th>
                <th
                  className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:text-text-primary"
                  onClick={() => setSortBy(sortBy === 'students_desc' ? 'class_asc' : 'students_desc')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Sĩ số</span>
                    {sortBy === 'students_desc' && <CaretDown size={11} weight="bold" />}
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Có mặt</th>
                <th
                  className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:text-text-primary"
                  onClick={() => setSortBy(sortBy === 'absent_desc' ? 'absent_asc' : 'absent_desc')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Vắng</span>
                    {sortBy === 'absent_desc' && <CaretDown size={11} weight="bold" />}
                    {sortBy === 'absent_asc' && <CaretUp size={11} weight="bold" />}
                  </div>
                </th>
                <th
                  className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:text-text-primary"
                  onClick={() => setSortBy(sortBy === 'late_desc' ? 'late_asc' : 'late_desc')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Muộn</span>
                    {sortBy === 'late_desc' && <CaretDown size={11} weight="bold" />}
                    {sortBy === 'late_asc' && <CaretUp size={11} weight="bold" />}
                  </div>
                </th>
                <th
                  className="py-2.5 px-3 text-center whitespace-nowrap cursor-pointer hover:text-text-primary"
                  onClick={() => setSortBy(sortBy === 'rate_asc' ? 'rate_desc' : 'rate_asc')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Tỷ lệ</span>
                    {sortBy === 'rate_asc' && <CaretUp size={11} weight="bold" />}
                    {sortBy === 'rate_desc' && <CaretDown size={11} weight="bold" />}
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng thái</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredClasses.map((cls, idx) => {
                const shift = getGradeShift(cls.grade);
                return (
                  <tr
                    key={cls.classId}
                    className="hover:bg-surface-muted/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-text-muted font-mono whitespace-nowrap">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-text-primary whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-bold text-xs">{cls.className}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-surface-muted text-text-muted font-mono border border-border whitespace-nowrap">
                          Khối {cls.grade}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded-xs font-bold font-mono text-[10px] border whitespace-nowrap',
                          shift === 'morning' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-teal-100 text-teal-900 border-teal-300'
                        )}>
                          {shift === 'morning' ? 'Sáng' : 'Chiều'}
                        </span>
                        <span className="text-text-muted font-medium">· {cls.roomName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-text-primary font-medium whitespace-nowrap">
                      {cls.teacherName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-text-primary whitespace-nowrap">
                      {cls.totalStudents}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-success whitespace-nowrap">
                      {cls.presentCount}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-0.5 rounded-xs font-mono font-bold text-xs border whitespace-nowrap inline-block',
                        cls.absentCount > 0
                          ? 'bg-danger text-white border-danger'
                          : 'bg-surface-muted text-text-muted border-border'
                      )}>
                        {cls.absentCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-0.5 rounded-xs font-mono font-bold text-xs border whitespace-nowrap inline-block',
                        cls.lateCount > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-surface-muted text-text-muted border-border'
                      )}>
                        {cls.lateCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={cn(
                        'font-mono font-bold text-xs px-2 py-0.5 rounded-xs border whitespace-nowrap inline-block',
                        cls.attendanceRate >= 95
                          ? 'bg-teal-subtle text-teal border-teal/30'
                          : cls.attendanceRate >= 85
                            ? 'bg-warning-bg text-warning-700 border-warning/40'
                            : 'bg-danger-bg text-danger border-danger/40'
                      )}>
                        {cls.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {cls.absentCount === 0 && cls.lateCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success whitespace-nowrap">
                          <CheckCircle size={13} weight="fill" />
                          <span>Đủ 100%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger whitespace-nowrap">
                          <WarningCircle size={13} weight="fill" />
                          <span>Có vắng/muộn</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* Detail button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClassDetail(cls)}
                          className="h-7 px-2.5 text-xs font-semibold cursor-pointer text-text-secondary hover:text-text-primary gap-1 whitespace-nowrap flex-shrink-0"
                          title="Xem danh sách chi tiết học sinh vắng/muộn"
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </Button>

                        {/* Reset single class - In Red */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResetModal(cls.classId)}
                          className="h-7 px-2.5 text-xs font-bold cursor-pointer text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-300 hover:border-red-600 gap-1 transition-colors whitespace-nowrap flex-shrink-0"
                          title={`Đặt lại toàn bộ học sinh ${formatClassName(cls.className)} về Có mặt`}
                        >
                          <ArrowsClockwise size={13} weight="bold" />
                          <span>Đặt lại</span>
                        </Button>

                        {/* Go to teacher attendance view */}
                        <Link href={`/attendance?classId=${cls.classId}`} className="flex-shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-7 px-2.5 text-xs font-bold cursor-pointer gap-1 whitespace-nowrap flex-shrink-0"
                            title="Mở sổ điểm danh môn học"
                          >
                            <span>Sổ lớp</span>
                            <ArrowRight size={11} weight="bold" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-text-muted italic">
                    Không tìm thấy lớp học nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =============================================
          5. SCHOOL-WIDE EXCEPTIONS LIST (VẮNG / MUỘN HÔM NAY)
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 md:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xs bg-danger-bg text-danger border border-danger/30 flex items-center justify-center font-bold flex-shrink-0">
              <UserMinus size={15} weight="fill" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                DANH SÁCH HỌC SINH NGOẠI LỆ TOÀN TRƯỜNG NGÀY {attendanceOverview.dateFormatted}
              </h2>
              <span className="text-[11px] text-text-muted">
                Tổng hợp tất cả trường hợp vắng không phép, vắng có phép và đi muộn của toàn bộ 16 lớp THCS.
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-xs bg-surface-muted text-text-primary border border-border whitespace-nowrap flex-shrink-0">
            {schoolWideExceptions.length} trường hợp
          </span>
        </div>

        {schoolWideExceptions.length > 0 ? (
          <div className="w-full border border-border rounded-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-muted/50 border-b border-border text-text-secondary font-bold text-[11px] whitespace-nowrap">
                  <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">STT</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mã học sinh</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Họ và tên</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Lớp học</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Giới tính</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Trạng thái</th>
                  <th className="py-2.5 px-3">Ghi chú / Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {schoolWideExceptions.map((item, idx) => {
                  const isAbsent = item.record.status === 'absent';
                  const isLate = item.record.status === 'late';
                  const isExcused = item.record.status === 'excused' || (item.record.note && item.record.note.toLowerCase().includes('phép'));

                  return (
                    <tr key={`${item.record.student_id}-${idx}`} className="hover:bg-surface-muted/30">
                      <td className="py-2.5 px-3 text-center text-text-muted font-mono whitespace-nowrap">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-text-muted whitespace-nowrap">{item.student?.student_code || '---'}</td>
                      <td className="py-2.5 px-3 font-bold text-text-primary whitespace-nowrap">{item.student?.full_name || 'Học sinh'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-xs text-text-primary whitespace-nowrap">
                          {item.classObj?.name || '---'}
                        </span>
                        <span className="text-[10px] text-text-muted ml-1.5 font-mono whitespace-nowrap">
                          (Khối {item.classObj?.grade})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary whitespace-nowrap">
                        {item.student?.gender === 'female' ? 'Nữ' : 'Nam'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isExcused ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-bold text-[11px] bg-purple-100 text-purple-900 border border-purple-300 whitespace-nowrap">
                            📋 Vắng có phép
                          </span>
                        ) : isAbsent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-bold text-[11px] bg-danger text-white border border-danger whitespace-nowrap">
                            ✕ Vắng không phép
                          </span>
                        ) : isLate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap">
                            ⏱ Đi muộn
                          </span>
                        ) : (
                          <span className="text-text-muted whitespace-nowrap">---</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary italic">
                        {item.record.note || 'Không có ghi chú'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-xs border border-teal/20 bg-teal-subtle/30 space-y-1.5">
            <CheckCircle size={28} weight="fill" className="text-teal mx-auto" />
            <div className="text-sm font-bold text-text-primary">
              Toàn trường đạt chuyên cần 100% vào ngày {attendanceOverview.dateFormatted}
            </div>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Không có học sinh nào vắng hoặc đi muộn. Tất cả 480 học sinh tại 16 lớp THCS đều đang có mặt đầy đủ.
            </p>
          </div>
        )}
      </div>
      </div> {/* End of no-print screen container */}

      {/* =============================================
          MODAL: RESET ATTENDANCE TO PRESENT
          ============================================= */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Đặt lại điểm danh về Có mặt"
        description="Khôi phục trạng thái 100% Có mặt cho học sinh khi có sai sót nhập liệu hoặc làm mới dữ liệu chuyên cần."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
              className="cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold border border-red-700 shadow-xs gap-1.5"
            >
              <CheckCircle size={15} weight="bold" />
              <span>{isResetting ? 'Đang đặt lại...' : 'Xác nhận đặt lại về Có mặt'}</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1 text-xs">
          {/* Info Banner */}
          <div className="p-3 rounded-xs border border-teal/30 bg-teal-subtle/50 text-text-primary space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-teal text-xs">
              <Sparkle size={15} weight="fill" />
              <span>Quy chế Điểm danh theo ngoại lệ</span>
            </div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              Mỗi khi sang ngày mới, hệ thống tự động coi <strong>100% học sinh (480 em tại 16 lớp)</strong> là Có mặt. Giáo viên chỉ cần mở sổ điểm danh khi có học sinh <em>Vắng</em> hoặc <em>Đi muộn</em>.
            </p>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Công cụ này dùng khi thầy cô nhập nhầm hàng loạt hoặc Ban Giám hiệu muốn làm sạch các ngoại lệ và đưa ngày được chọn trở về trạng thái <strong>100% Có mặt ban đầu</strong>.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Ngày áp dụng đặt lại
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Phạm vi đặt lại chuyên cần
              </label>
              <select
                value={resetTargetScope}
                onChange={(e) => setResetTargetScope(e.target.value)}
                className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
              >
                <option value="all">⚡ Toàn bộ 16 lớp THCS (Toàn trường · 480 học sinh)</option>
                <optgroup label="Khối 6 (Ca Sáng)">
                  {classes.filter((c) => c.grade === 6).map((c) => (
                    <option key={c.id} value={c.id}>{formatClassName(c.name)} (30 học sinh · GVCN: {c.teacher_id ? teachers.find((t) => t.id === c.teacher_id)?.name || 'Chưa phân công' : 'Chưa phân công'})</option>
                  ))}
                </optgroup>
                <optgroup label="Khối 7 (Ca Chiều)">
                  {classes.filter((c) => c.grade === 7).map((c) => (
                    <option key={c.id} value={c.id}>{formatClassName(c.name)} (30 học sinh · GVCN: {c.teacher_id ? teachers.find((t) => t.id === c.teacher_id)?.name || 'Chưa phân công' : 'Chưa phân công'})</option>
                  ))}
                </optgroup>
                <optgroup label="Khối 8 (Ca Chiều)">
                  {classes.filter((c) => c.grade === 8).map((c) => (
                    <option key={c.id} value={c.id}>{formatClassName(c.name)} (30 học sinh · GVCN: {c.teacher_id ? teachers.find((t) => t.id === c.teacher_id)?.name || 'Chưa phân công' : 'Chưa phân công'})</option>
                  ))}
                </optgroup>
                <optgroup label="Khối 9 (Ca Sáng)">
                  {classes.filter((c) => c.grade === 9).map((c) => (
                    <option key={c.id} value={c.id}>{formatClassName(c.name)} (30 học sinh · GVCN: {c.teacher_id ? teachers.find((t) => t.id === c.teacher_id)?.name || 'Chưa phân công' : 'Chưa phân công'})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* High-Contrast Clear Warning Alert */}
            <div className="p-3.5 rounded-sm border-2 border-red-500 bg-red-50/90 dark:bg-red-950/40 text-text-primary dark:text-red-100 text-xs flex items-start gap-3 shadow-2xs">
              <WarningCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" weight="fill" />
              <div className="leading-relaxed space-y-1">
                <span className="font-extrabold text-red-700 dark:text-red-400 uppercase tracking-wide text-[11px] block">
                  CẢNH BÁO XÁC NHẬN THAO TÁC QUẢN TRỊ
                </span>
                <p className="text-text-primary dark:text-gray-100 text-xs font-medium">
                  Tất cả ghi nhận <strong>Vắng không phép, Vắng có phép, Đi muộn</strong> của ngày{' '}
                  <strong className="text-red-700 dark:text-red-400 font-mono underline font-bold">{selectedDate}</strong>{' '}
                  trong phạm vi{' '}
                  <strong className="text-red-700 dark:text-red-400 font-bold">
                    {resetTargetScope === 'all'
                      ? 'Toàn bộ 16 lớp THCS (Toàn trường · 480 học sinh)'
                      : formatClassName(classes.find((c) => c.id === resetTargetScope)?.name || resetTargetScope)}
                  </strong>{' '}
                  sẽ bị xóa và khôi phục về trạng thái <strong>100% Có mặt</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* =============================================
          MODAL: CHI TIẾT CHUYÊN CẦN TỪNG LỚP
          ============================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedClassDetail ? `Chi tiết Chuyên cần: ${formatClassName(selectedClassDetail.className)}` : 'Chi tiết lớp'}
        description={`Sĩ số: ${selectedClassDetail?.totalStudents} HS · GVCN: ${selectedClassDetail?.teacherName} · Ngày: ${attendanceOverview.dateFormatted}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (selectedClassDetail) {
                  setIsDetailModalOpen(false);
                  handleOpenResetModal(selectedClassDetail.classId);
                }
              }}
              className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold border border-red-700 gap-1.5 shadow-2xs"
            >
              <ArrowsClockwise size={13} weight="bold" />
              <span>Đặt lại lớp này về Có mặt</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="cursor-pointer"
              >
                Đóng
              </Button>
              {selectedClassDetail && (
                <Link href={`/attendance?classId=${selectedClassDetail.classId}`}>
                  <Button variant="primary" size="sm" className="cursor-pointer gap-1">
                    <span>Mở sổ điểm danh</span>
                    <ArrowRight size={12} weight="bold" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        }
      >
        {selectedClassDetail && (
          <div className="space-y-4 py-1 text-xs">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xs bg-surface-muted/50 border border-border">
              <div>
                <div className="text-[10px] text-text-muted">Có mặt</div>
                <div className="text-base font-bold font-mono text-success">{selectedClassDetail.presentCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-muted">Vắng</div>
                <div className="text-base font-bold font-mono text-danger">{selectedClassDetail.absentCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-muted">Đi muộn</div>
                <div className="text-base font-bold font-mono text-amber-800">{selectedClassDetail.lateCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-text-muted">Chuyên cần</div>
                <div className="text-base font-bold font-mono text-teal">{selectedClassDetail.attendanceRate}%</div>
              </div>
            </div>

            {/* List of class students with exceptions */}
            <div>
              <div className="font-bold text-text-primary text-xs mb-2">
                Danh sách học sinh có ngoại lệ (Vắng / Muộn) ngày {attendanceOverview.dateFormatted}:
              </div>
              {(() => {
                const classExceptions = schoolWideExceptions.filter(
                  (e) => e.classObj?.id === selectedClassDetail.classId
                );

                if (classExceptions.length === 0) {
                  return (
                    <div className="p-4 rounded-xs bg-success-bg/40 border border-success/30 text-success text-center">
                      <CheckCircle size={20} weight="fill" className="mx-auto mb-1" />
                      <div className="font-bold">Lớp học chuyên cần 100%</div>
                      <div className="text-[11px] text-text-muted mt-0.5">Tất cả {selectedClassDetail.totalStudents} học sinh đều có mặt đầy đủ.</div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1.5 border border-border rounded-xs divide-y divide-border/60 max-h-60 overflow-y-auto">
                    {classExceptions.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-surface">
                        <div>
                          <div className="font-bold text-text-primary">
                            {item.student?.full_name}
                            <span className="text-[11px] font-mono text-text-muted ml-1.5 font-normal">
                              ({item.student?.student_code})
                            </span>
                          </div>
                          {item.record.note && (
                            <div className="text-[11px] text-text-secondary italic mt-0.5">
                              Lý do: {item.record.note}
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          'px-2 py-0.5 rounded-xs font-bold text-[11px] border flex-shrink-0',
                          item.record.status === 'absent'
                            ? 'bg-danger text-white border-danger'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        )}>
                          {item.record.status === 'absent' ? 'Vắng' : 'Đi muộn'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
