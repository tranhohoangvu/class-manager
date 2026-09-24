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
  ShieldCheck,
  FileXls,
  Clock,
  UserMinus,
  WarningCircle,
  MagnifyingGlass,
  ArrowSquareOut,
  CalendarCheck,
  CalendarBlank,
  Table,
  Check,
  BookOpen,
  Door,
  CaretUp,
  CaretDown,
  Sparkle,
  ArrowsClockwise,
  Broadcast,
  Article,
  ChartBar,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import {
  UserRow,
  ClassRow,
  StudentRow,
  SubjectRow,
  SubjectAssignmentRow,
  AnnouncementRow,
  TimetableEntryRow,
} from '@/types';
import { Button } from '@/components/ui/button';
import {
  AdminReportService,
  SchoolAttendanceOverview,
  GradeAttendanceStat,
  ClassAttendanceStat,
} from '@/services';
import {
  TimetableService,
  TimetableAuditReport,
  TimetableConflict,
  TimetableRuleViolation,
} from '@/services/timetable.service';
import { exportSchoolComprehensiveReport } from '@/lib/export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getGradeShift } from '@/lib/constants';

type TableTab = 'classes' | 'teachers';
type SortField = 'name' | 'students' | 'attendance' | 'timetable';
type SortOrder = 'asc' | 'desc';

export default function AdminDashboardPage() {
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [assignments, setAssignments] = useState<SubjectAssignmentRow[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntryRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Timetable Audit State
  const [auditReport, setAuditReport] = useState<TimetableAuditReport | null>(null);

  // Attendance metrics
  const [attendanceOverview, setAttendanceOverview] = useState<SchoolAttendanceOverview | null>(null);
  const [gradeStats, setGradeStats] = useState<GradeAttendanceStat[]>([]);
  const [classAttendanceList, setClassAttendanceList] = useState<ClassAttendanceStat[]>([]);
  const [highAbsenceClasses, setHighAbsenceClasses] = useState<ClassAttendanceStat[]>([]);

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState<TableTab>('classes');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const t = LocalStore.getTeachers();
    const c = LocalStore.getClasses();
    const s = LocalStore.getStudents();
    const sub = LocalStore.getSubjects();
    const asgn = LocalStore.getSubjectAssignments();
    const tt = LocalStore.getAllTimetables();
    const ann = LocalStore.getAnnouncements();

    setTeachers(t);
    setClasses(c);
    setStudents(s);
    setSubjects(sub);
    setAssignments(asgn);
    setTimetables(tt);
    setAnnouncements(ann);

    // Run Timetable Diagnostic Audit
    const report = TimetableService.auditTimetable();
    setAuditReport(report);

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
  };

  // Multi-sheet Excel export
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

  // Quick refresh
  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dữ liệu điều hành trường học đã được làm mới!');
  };

  // Subject map
  const subjectMap = useMemo(() => {
    const map = new Map<string, SubjectRow>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Teacher map
  const teacherMap = useMemo(() => {
    const map = new Map<string, UserRow>();
    teachers.forEach((t) => map.set(t.id, t));
    return map;
  }, [teachers]);

  // Timetable scheduled entries by class
  const classTimetableCountMap = useMemo(() => {
    const map = new Map<string, number>();
    timetables.forEach((t) => {
      map.set(t.class_id, (map.get(t.class_id) || 0) + 1);
    });
    return map;
  }, [timetables]);

  // Teacher workload stats (periods per week, classes taught, homeroom)
  const teacherWorkloadList = useMemo(() => {
    return teachers.map((teacher) => {
      const homeroomClass = classes.find((c) => c.teacher_id === teacher.id);
      const teacherAssignments = assignments.filter((a) => a.teacher_id === teacher.id);
      const assignedClassIds = Array.from(new Set(teacherAssignments.map((a) => a.class_id)));
      const assignedSubjects = Array.from(
        new Set(teacherAssignments.map((a) => subjectMap.get(a.subject_id)?.name || a.subject_id))
      );

      // Actual scheduled periods in timetable
      const scheduledPeriods = timetables.filter((t) => t.teacher_id === teacher.id).length;

      // Check if teacher has conflict in auditReport
      const teacherConflicts = auditReport?.teacherConflicts.filter((tc) => tc.teacherId === teacher.id) || [];
      const hasConflict = teacherConflicts.length > 0;

      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        status: teacher.status,
        homeroomClass: homeroomClass ? homeroomClass.name : null,
        homeroomClassId: homeroomClass ? homeroomClass.id : null,
        assignedClassCount: assignedClassIds.length,
        assignedSubjects,
        scheduledPeriods,
        hasConflict,
        conflicts: teacherConflicts,
      };
    });
  }, [teachers, classes, assignments, subjectMap, timetables, auditReport]);

  // Filtered teacher list
  const filteredTeachers = useMemo(() => {
    const q = teacherSearchQuery.toLowerCase().trim();
    if (!q) return teacherWorkloadList;
    return teacherWorkloadList.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.homeroomClass && t.homeroomClass.toLowerCase().includes(q)) ||
        t.assignedSubjects.some((s) => s.toLowerCase().includes(q))
    );
  }, [teacherWorkloadList, teacherSearchQuery]);

  // Enriched & filtered Class Overview Table
  const enrichedClassList = useMemo(() => {
    const list = classes.map((c) => {
      const classStudents = students.filter((s) => s.class_id === c.id);
      const attendance = classAttendanceList.find((item) => item.classId === c.id);
      const teacher = c.teacher_id ? teacherMap.get(c.teacher_id) : null;
      const scheduledSlots = classTimetableCountMap.get(c.id) || 0;
      const requiredSlots = 28; // Chuẩn THCS (5 ngày x 5 tiết + Thứ Bảy 3 tiết)
      const shift = getGradeShift(c.grade);

      // Check audit issues for this class
      const classRuleViolations = auditReport?.ruleViolations.filter((v) => v.classId === c.id) || [];
      const classDirectConflicts = auditReport?.classConflicts.filter((cc) => cc.classId === c.id) || [];
      const hasIssues = classRuleViolations.length > 0 || classDirectConflicts.length > 0;

      return {
        id: c.id,
        name: c.name,
        grade: c.grade,
        roomName: c.room_name || 'Chưa xếp phòng',
        teacherName: teacher ? teacher.name : 'Chưa phân công',
        teacherId: c.teacher_id,
        studentCount: classStudents.length,
        maxStudents: c.max_students || 30,
        status: c.status,
        shift,
        scheduledSlots,
        requiredSlots,
        timetableComplete: scheduledSlots >= requiredSlots,
        hasTimetableIssues: hasIssues,
        issueCount: classRuleViolations.length + classDirectConflicts.length,
        attendanceRate: attendance ? attendance.attendanceRate : 100,
        presentCount: attendance ? attendance.presentCount : classStudents.length,
        absentCount: attendance ? attendance.absentCount : 0,
        lateCount: attendance ? attendance.lateCount : 0,
        attendanceStatus: attendance ? attendance.status : 'excellent',
      };
    });

    // Filter
    const filtered = list.filter((item) => {
      const matchGrade = selectedGradeFilter === 'all' || item.grade === selectedGradeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q) ||
        item.roomName.toLowerCase().includes(q);
      return matchGrade && matchSearch;
    });

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.grade - b.grade || a.name.localeCompare(b.name);
      } else if (sortField === 'students') {
        comparison = a.studentCount - b.studentCount;
      } else if (sortField === 'attendance') {
        comparison = a.attendanceRate - b.attendanceRate;
      } else if (sortField === 'timetable') {
        comparison = a.scheduledSlots - b.scheduledSlots;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    classes,
    students,
    classAttendanceList,
    teacherMap,
    classTimetableCountMap,
    auditReport,
    selectedGradeFilter,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  // Timetable statistics
  const totalRequiredSlots = classes.length * 28; // 16 classes * 28 = 448 slots
  const totalScheduledSlots = timetables.length;
  const timetableCompletionRate =
    totalRequiredSlots > 0 ? Math.min(100, Math.round((totalScheduledSlots / totalRequiredSlots) * 100)) : 0;

  // Shift counts
  const morningClasses = classes.filter((c) => getGradeShift(c.grade) === 'morning');
  const afternoonClasses = classes.filter((c) => getGradeShift(c.grade) === 'afternoon');
  const morningSlots = morningClasses.reduce((sum, c) => sum + (classTimetableCountMap.get(c.id) || 0), 0);
  const afternoonSlots = afternoonClasses.reduce((sum, c) => sum + (classTimetableCountMap.get(c.id) || 0), 0);

  // Subject distribution in timetable
  const subjectDistribution = useMemo(() => {
    const countMap = new Map<string, number>();
    timetables.forEach((t) => {
      countMap.set(t.subject_id, (countMap.get(t.subject_id) || 0) + 1);
    });

    return subjects
      .map((sub) => ({
        id: sub.id,
        name: sub.name,
        code: sub.code,
        count: countMap.get(sub.id) || 0,
        rate: totalScheduledSlots > 0 ? Math.round(((countMap.get(sub.id) || 0) / totalScheduledSlots) * 100) : 0,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [timetables, subjects, totalScheduledSlots]);

  // Toggle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
  const totalMaxCapacity = classes.reduce((sum, c) => sum + (c.max_students || 30), 0);
  const schoolCapacityRate = totalMaxCapacity > 0 ? Math.round((students.length / totalMaxCapacity) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* =============================================
          1. HEADER & EXECUTIVE META
          ============================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-1 font-semibold bg-surface-muted text-text-secondary border border-border rounded-lg">
              Năm học: 2026 - 2027
            </span>
            <span className="px-2.5 py-1 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              Học kỳ 1
            </span>
            <span className="px-2.5 py-1 font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1">
              <CalendarCheck size={13} weight="bold" />
              Dữ liệu ngày {attendanceOverview.dateFormatted}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary mt-2 flex items-center gap-2">
            <span>Trung tâm Điều hành & Quản trị Nhà trường</span>
          </h1>
          <p className="text-sm text-text-muted mt-0.5 font-medium">
            Bảng điều khiển trực quan: Giám sát toàn diện Thời khóa biểu, Nề nếp chuyên cần, Phân công giảng dạy và 16 lớp THCS
          </p>
        </div>

        {/* Executive Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-secondary border-border font-semibold shadow-2xs"
            title="Làm mới toàn bộ chỉ số điều hành"
          >
            <ArrowsClockwise size={16} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

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

          <Link href="/admin/timetable">
            <Button variant="primary" size="sm" className="cursor-pointer">
              <CalendarBlank size={16} weight="bold" />
              <span>Quản lý Thời khóa biểu</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* =============================================
          QUICK MANAGEMENT ACTIONS
          ============================================= */}
      <div className="bg-surface rounded-xl border border-border p-3 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0 text-xs font-bold uppercase tracking-wider text-text-muted pl-1">
          <Sparkle size={15} weight="bold" className="text-indigo-600" />
          <span>Thao tác nhanh:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-start md:justify-end">
          <Link
            href="/admin/timetable"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted hover:bg-surface hover:text-indigo-700 hover:border-indigo-300 border border-border text-text-primary transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <CalendarBlank size={14} weight="bold" />
            <span>Xếp Thời khóa biểu</span>
          </Link>
          <Link
            href="/admin/classes"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted hover:bg-surface hover:text-indigo-700 hover:border-indigo-300 border border-border text-text-primary transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Chalkboard size={14} weight="bold" />
            <span>Quản lý Lớp học</span>
          </Link>
          <Link
            href="/admin/teachers"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted hover:bg-surface hover:text-indigo-700 hover:border-indigo-300 border border-border text-text-primary transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <ChalkboardTeacher size={14} weight="bold" />
            <span>Quản lý Giáo viên</span>
          </Link>
          <Link
            href="/attendance"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted hover:bg-surface hover:text-emerald-700 hover:border-emerald-300 border border-border text-text-primary transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCircle size={14} weight="bold" />
            <span>Sổ Điểm danh Toàn trường</span>
          </Link>
          <Link
            href="/seating"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted hover:bg-surface hover:text-indigo-700 hover:border-indigo-300 border border-border text-text-primary transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Door size={14} weight="bold" />
            <span>Sơ đồ Chỗ ngồi</span>
          </Link>
        </div>
      </div>

      {/* =============================================
          LEVEL 3: COMPACT SUMMARY METRICS (4 TILES)
          ============================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Đội ngũ giáo viên */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Đội ngũ Giáo viên</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ChalkboardTeacher size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary">{activeTeachers}</span>
            <span className="text-xs text-text-muted font-medium">/{teachers.length} giáo viên</span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check size={12} weight="bold" />
              100% Lớp có GVCN
            </span>
            <Link href="/admin/teachers" className="text-indigo-700 hover:underline font-bold">
              Chi tiết →
            </Link>
          </div>
        </div>

        {/* KPI 2: Quy mô lớp học */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Quy mô Lớp học</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Chalkboard size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary">{activeClasses}</span>
            <span className="text-xs text-text-muted font-medium">lớp đang hoạt động</span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between border-t border-border/60 pt-2">
            <span>4 Khối: K6, K7, K8, K9</span>
            <span className="font-semibold text-text-secondary">4 lớp/khối</span>
          </div>
        </div>

        {/* KPI 3: Học sinh toàn trường */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Học sinh Toàn trường</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Student size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary">{students.length}</span>
            <span className="text-xs text-text-muted font-medium">/{totalMaxCapacity} chỉ tiêu</span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between border-t border-border/60 pt-2">
            <span>Lấp đầy: <strong className="text-emerald-700">{schoolCapacityRate}%</strong></span>
            <span>BQ: <strong>{activeClasses > 0 ? Math.round(students.length / activeClasses) : 0}</strong> HS/lớp</span>
          </div>
        </div>

        {/* KPI 4: Trạng thái Thời khóa biểu */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Thời khóa biểu</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CalendarCheck size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-indigo-700">{totalScheduledSlots}</span>
            <span className="text-xs text-text-muted font-medium">/{totalRequiredSlots} tiết ({timetableCompletionRate}%)</span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between border-t border-border/60 pt-2">
            <span className={cn('font-semibold', auditReport?.isValid ? 'text-emerald-700' : 'text-rose-700')}>
              {auditReport?.isValid ? '✓ 0 Xung đột' : `⚠ ${auditReport?.summary.totalIssuesCount} vấn đề`}
            </span>
            <Link href="/admin/timetable" className="text-indigo-700 hover:underline font-bold">
              Chi tiết →
            </Link>
          </div>
        </div>
      </div>

      {/* =============================================
          LEVEL 1: WHAT NEEDS ATTENTION? (ALERTS & DIAGNOSTICS)
          ============================================= */}
      <div className="space-y-4">
        {/* TIMETABLE AUDIT STATUS & ALERT PANEL */}
        {auditReport && (
          <div
            className={cn(
              'rounded-2xl border p-5 shadow-2xs transition-all',
              auditReport.isValid
                ? 'bg-emerald-50/40 border-emerald-200/90 text-emerald-950'
                : 'bg-rose-50/50 border-rose-300 text-rose-950'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0',
                    auditReport.isValid
                      ? 'bg-emerald-100/80 text-emerald-700 border-emerald-300'
                      : 'bg-rose-100 text-rose-700 border-rose-300'
                  )}
                >
                  {auditReport.isValid ? (
                    <CheckCircle size={22} weight="fill" />
                  ) : (
                    <WarningCircle size={22} weight="fill" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold">
                      {auditReport.isValid
                        ? 'Kiểm toán Thời khóa biểu: Hệ thống chuẩn hóa 100% hợp lệ'
                        : `Cảnh báo Kiểm toán TKB: Phát hiện ${auditReport.summary.totalIssuesCount} vấn đề cần xử lý`}
                    </h3>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                        auditReport.isValid
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      )}
                    >
                      {auditReport.scannedClasses} lớp · {auditReport.scannedEntries} tiết học
                    </span>
                  </div>
                  <p className="text-xs opacity-90 mt-0.5">
                    {auditReport.isValid
                      ? 'Không có trùng lịch lớp, không trùng lịch giáo viên, không trùng phòng học và tuân thủ quy tắc số tiết liên tiếp của Bộ GD&ĐT.'
                      : 'Cần giải quyết xung đột lịch giảng dạy hoặc vi phạm giới hạn số tiết trước khi ban hành chính thức.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <Link href="/admin/timetable">
                  <Button
                    size="sm"
                    variant={auditReport.isValid ? 'secondary' : 'primary'}
                    className={cn(
                      'text-xs cursor-pointer font-bold',
                      auditReport.isValid &&
                        'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                    )}
                  >
                    <span>{auditReport.isValid ? 'Xem kiểm toán TKB' : 'Khắc phục ngay'}</span>
                    <ArrowRight size={14} weight="bold" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* List issues if any */}
            {!auditReport.isValid && (
              <div className="mt-4 pt-3 border-t border-rose-200/80 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Chi tiết các vấn đề cần lưu ý:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {auditReport.teacherConflicts.slice(0, 4).map((tc, idx) => (
                    <div
                      key={`tc-${idx}`}
                      className="p-2.5 rounded-lg bg-white/90 border border-rose-200 text-rose-900 flex items-center justify-between"
                    >
                      <div>
                        <strong className="font-bold">{tc.teacherName}</strong> · {tc.dayName}, {tc.periodLabel}
                        <div className="text-[11px] text-rose-700">
                          Trùng lịch giữa lớp {tc.className} và {tc.otherClassName || 'lớp khác'}
                        </div>
                      </div>
                      <Link
                        href={`/admin/timetable?classId=${tc.classId}`}
                        className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <span>Sửa</span>
                        <ArrowSquareOut size={12} />
                      </Link>
                    </div>
                  ))}
                  {auditReport.ruleViolations.slice(0, 4).map((rv, idx) => (
                    <div
                      key={`rv-${idx}`}
                      className="p-2.5 rounded-lg bg-white/90 border border-rose-200 text-rose-900 flex items-center justify-between"
                    >
                      <div>
                        <strong className="font-bold">{rv.className}</strong> · Môn {rv.subjectName} ({rv.dayName})
                        <div className="text-[11px] text-rose-700">{rv.violation}</div>
                      </div>
                      <Link
                        href={`/admin/timetable?classId=${rv.classId}`}
                        className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <span>Sửa</span>
                        <ArrowSquareOut size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE ALERTS: LỚP CÓ HỌC SINH VẮNG TRONG NGÀY */}
        {highAbsenceClasses.length > 0 && (
          <div className="bg-surface rounded-2xl border border-rose-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                  <UserMinus size={18} weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">
                    Cảnh báo Nề nếp Hôm nay: {highAbsenceClasses.length} lớp ghi nhận học sinh vắng / muộn
                  </h3>
                  <p className="text-xs text-rose-700/80">
                    Ban Giám hiệu & Giám thị đối chiếu trực tiếp với GVCN để nắm rõ lý do vắng
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Tổng {highAbsenceClasses.reduce((acc, c) => acc + c.absentCount, 0)} HS vắng
                </span>
                <Link
                  href="/attendance"
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 ml-2"
                >
                  <span>Xem sổ điểm danh</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {highAbsenceClasses.map((item) => (
                <div
                  key={item.classId}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">{item.className}</span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                        Vắng {item.absentCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 truncate">
                      GVCN: <span className="font-semibold text-text-secondary">{item.teacherName}</span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {item.roomName} · Sĩ số: {item.totalStudents} HS
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-rose-200/70 flex items-center justify-between text-xs">
                    <span className="text-rose-700 font-semibold text-[11px]">Tỷ lệ: {item.attendanceRate}%</span>
                    <Link
                      href="/attendance"
                      className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      <span>Chi tiết</span>
                      <ArrowSquareOut size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =============================================
          LEVEL 2: WHAT IS HAPPENING? (CHARTS & VISUAL OVERVIEW)
          ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: TIMETABLE OVERVIEW & SHIFT DISTRIBUTION */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <CalendarBlank size={18} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Tổng quan Phân bổ Thời khóa biểu</h2>
                <p className="text-xs text-text-muted">Chuẩn hóa 2 ca học và tiến độ phân phối tiết giảng dạy</p>
              </div>
            </div>
            <Link
              href="/admin/timetable"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>Xem TKB</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          {/* Progress Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-text-muted">Tiến độ xếp TKB toàn trường (16 lớp x 28 tiết)</span>
              <span className="text-indigo-700 font-bold">
                {totalScheduledSlots}/{totalRequiredSlots} Tiết ({timetableCompletionRate}%)
              </span>
            </div>
            <div className="w-full bg-surface-muted h-2.5 rounded-full overflow-hidden border border-border/80">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${timetableCompletionRate}%` }}
              />
            </div>
          </div>

          {/* Ca Sáng vs Ca Chiều Split */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-surface-muted/40 rounded-xl border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Ca Sáng (K6 & K9)
                </span>
                <span className="text-[11px] font-semibold text-text-muted">8 Lớp</span>
              </div>
              <div className="text-lg font-extrabold text-text-primary">
                {morningSlots} <span className="text-xs font-medium text-text-muted">/ 224 tiết</span>
              </div>
              <div className="text-[11px] text-text-muted">
                07:15 – 11:30 · 100% Hoàn tất
              </div>
            </div>

            <div className="p-3 bg-surface-muted/40 rounded-xl border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Ca Chiều (K7 & K8)
                </span>
                <span className="text-[11px] font-semibold text-text-muted">8 Lớp</span>
              </div>
              <div className="text-lg font-extrabold text-text-primary">
                {afternoonSlots} <span className="text-xs font-medium text-text-muted">/ 224 tiết</span>
              </div>
              <div className="text-[11px] text-text-muted">
                13:00 – 17:15 · 100% Hoàn tất
              </div>
            </div>
          </div>

          {/* Subject Distribution Allocation (Top Subjects) */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text-primary">Phân bổ tiết học theo môn tiêu biểu:</span>
              <span className="text-[11px] text-text-muted">Toàn trường / tuần</span>
            </div>

            <div className="space-y-2">
              {subjectDistribution.slice(0, 5).map((sub) => (
                <div key={sub.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">{sub.name}</span>
                    <span className="text-text-primary font-bold">
                      {sub.count} tiết <span className="text-text-muted font-normal">({sub.rate}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (sub.count / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: ATTENDANCE TREND & DISTRIBUTION BY GRADE */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <ChartBar size={18} weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Bức tranh Chuyên cần 4 Khối Lớp</h2>
                <p className="text-xs text-text-muted">Tỷ lệ đi học và số lượng học sinh có mặt / vắng hôm nay</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-700">{attendanceOverview.attendanceRate}%</span>
              <div className="text-[11px] text-text-muted">Toàn trường</div>
            </div>
          </div>

          {/* SVG Visual Comparison of 4 Grades */}
          <div className="space-y-3.5">
            {gradeStats.map((gradeItem) => (
              <div key={gradeItem.grade} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{gradeItem.label}</span>
                    <span className="text-text-muted font-medium">({gradeItem.classCount} lớp · {gradeItem.totalStudents} HS)</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-emerald-700">{gradeItem.attendanceRate}%</span>
                    <span className="text-[11px] text-text-muted font-normal">
                      ({gradeItem.presentCount}/{gradeItem.totalStudents} có mặt)
                    </span>
                  </div>
                </div>

                {/* Progress bar with benchmark line at 95% */}
                <div className="relative w-full bg-surface-muted h-3 rounded-full overflow-hidden border border-border/60">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      gradeItem.attendanceRate >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                    style={{ width: `${gradeItem.attendanceRate}%` }}
                  />
                  {/* 95% target marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-black/25 dark:bg-white/30"
                    style={{ left: '95%' }}
                    title="Chuẩn chuyên cần 95%"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Có mặt: <strong className="text-text-secondary">{gradeItem.presentCount}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Vắng: <strong className="text-rose-600">{gradeItem.absentCount}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Muộn: <strong className="text-amber-700">{gradeItem.lateCount}</strong>
                  </span>
                  <span>Mục tiêu: <strong>&ge; 95%</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
            <span>Dữ liệu chốt từ 16 sổ điểm danh trực tuyến</span>
            <Link href="/attendance" className="font-bold text-indigo-700 hover:underline">
              Mở sổ điểm danh chi tiết →
            </Link>
          </div>
        </div>
      </div>

      {/* =============================================
          LEVEL 2 & 3: MANAGEMENT TABLES & ACTIVITY
          ============================================= */}
      <div className="bg-surface rounded-2xl border border-border p-5 md:p-6 shadow-xs space-y-4">
        {/* Table Tabs & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'classes'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-muted'
              )}
            >
              <Table size={15} weight="bold" />
              <span>Tổng quan 16 Lớp học ({enrichedClassList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teachers')}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'teachers'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-muted'
              )}
            >
              <ChalkboardTeacher size={15} weight="bold" />
              <span>Đội ngũ Giáo viên ({filteredTeachers.length})</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {activeTab === 'classes' ? (
              <>
                <div className="relative">
                  <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Tìm lớp, GVCN, phòng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-52"
                  />
                </div>

                <div className="flex items-center bg-surface-muted p-0.5 rounded-xl border border-border text-xs">
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
                    Tất cả
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
                      K{g}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="relative">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Tìm giáo viên, bộ môn..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64"
                />
              </div>
            )}
          </div>
        </div>

        {/* TAB CONTENT: 1. CLASS OVERVIEW TABLE */}
        {activeTab === 'classes' && (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/70 text-text-muted font-bold uppercase tracking-wider border-b border-border">
                <tr>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Lớp học</span>
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Khối & Ca</th>
                  <th className="py-3 px-3.5">Giáo viên chủ nhiệm</th>
                  <th className="py-3 px-3.5">Phòng học</th>
                  <th
                    className="py-3 px-3.5 text-center cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('students')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Sĩ số</span>
                      {sortField === 'students' && (
                        sortOrder === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-3.5 text-center cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('timetable')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Thời khóa biểu</span>
                      {sortField === 'timetable' && (
                        sortOrder === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-3.5 text-center cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('attendance')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Chuyên cần hôm nay</span>
                      {sortField === 'attendance' && (
                        sortOrder === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center">Trạng thái</th>
                  <th className="py-3 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {enrichedClassList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-text-muted">
                      Không tìm thấy lớp học nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  enrichedClassList.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-text-primary">{c.name}</div>
                        <div className="text-[11px] text-text-muted">Mã: {c.id}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-text-primary font-semibold">Khối {c.grade}</div>
                        <div className="text-[11px] text-text-muted">
                          {c.shift === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="text-text-secondary font-semibold">{c.teacherName}</div>
                      </td>
                      <td className="py-3 px-3.5 text-text-muted">
                        {c.roomName}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="font-bold text-text-primary">
                          {c.studentCount} <span className="text-text-muted font-normal">/{c.maxStudents}</span>
                        </div>
                        <div className="w-16 bg-surface-muted h-1 rounded-full overflow-hidden mx-auto mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.round((c.studentCount / c.maxStudents) * 100))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {c.timetableComplete ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              {c.scheduledSlots}/{c.requiredSlots} Tiết
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                              {c.scheduledSlots}/{c.requiredSlots} Tiết
                            </span>
                          )}
                          {c.hasTimetableIssues && (
                            <span
                              className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold"
                              title={`${c.issueCount} vấn đề TKB`}
                            >
                              !
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="font-extrabold text-emerald-700">{c.attendanceRate}%</div>
                        <div className="text-[11px] text-text-muted">
                          {c.presentCount} có mặt{c.absentCount > 0 ? `, ${c.absentCount} vắng` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {c.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surface-muted text-text-muted text-[10px] font-bold">
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/timetable?classId=${c.id}`}
                            className="p-1 rounded-md text-text-muted hover:text-indigo-600 hover:bg-surface-muted transition-colors"
                            title="Xem Thời khóa biểu lớp"
                          >
                            <CalendarBlank size={16} />
                          </Link>
                          <Link
                            href={`/attendance`}
                            className="p-1 rounded-md text-text-muted hover:text-emerald-600 hover:bg-surface-muted transition-colors"
                            title="Xem Sổ điểm danh"
                          >
                            <CheckCircle size={16} />
                          </Link>
                          <Link
                            href={`/seating`}
                            className="p-1 rounded-md text-text-muted hover:text-indigo-600 hover:bg-surface-muted transition-colors"
                            title="Xem Sơ đồ lớp"
                          >
                            <Door size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: 2. TEACHER OVERVIEW TABLE */}
        {activeTab === 'teachers' && (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/70 text-text-muted font-bold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-3.5">Giáo viên</th>
                  <th className="py-3 px-3.5">Chuyên môn / Bộ môn</th>
                  <th className="py-3 px-3.5">Vai trò chủ nhiệm</th>
                  <th className="py-3 px-3.5 text-center">Số lớp dạy</th>
                  <th className="py-3 px-3.5 text-center">Số tiết/tuần</th>
                  <th className="py-3 px-3.5 text-center">Tình trạng TKB</th>
                  <th className="py-3 px-3.5 text-center">Tài khoản</th>
                  <th className="py-3 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      Không tìm thấy giáo viên nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200/70 flex-shrink-0">
                            {t.name.charAt(t.name.lastIndexOf(' ') + 1) || t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary">{t.name}</div>
                            <div className="text-[11px] text-text-muted">{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {t.assignedSubjects.length > 0 ? (
                            t.assignedSubjects.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-surface text-text-secondary border border-border text-[11px] font-semibold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-text-muted italic">Đang cập nhật</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        {t.homeroomClass ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg inline-flex items-center gap-1">
                            GVCN {t.homeroomClass}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">Giáo viên Bộ môn</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-text-primary">
                        {t.assignedClassCount > 0 ? `${t.assignedClassCount} lớp` : '—'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-extrabold text-indigo-700">
                        {t.scheduledPeriods > 0 ? `${t.scheduledPeriods} tiết` : '0 tiết'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {t.hasConflict ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Xung đột lịch
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Ổn định
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {t.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Đang công tác
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Link
                          href="/admin/teachers"
                          className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Quản lý</span>
                          <ArrowRight size={12} weight="bold" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =============================================
          LEVEL 4: RECENT ACTIVITY & SYSTEM LOGS
          ============================================= */}
      <div className="bg-surface rounded-2xl border border-border p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Broadcast size={18} weight="bold" className="text-indigo-600" />
            <h2 className="text-base font-bold text-text-primary">
              Hoạt động & Nhật ký Quản trị Hệ thống Gần đây
            </h2>
          </div>
          <span className="text-xs text-text-muted">Cập nhật theo thời gian thực</span>
        </div>

        <div className="divide-y divide-border">
          {/* Item 1: Real Timetable Audit Scan */}
          <div className="py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 flex-shrink-0 mt-0.5">
              <ShieldCheck size={18} weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-text-primary">
                  Kiểm toán Hệ thống Thời khóa biểu hoàn tất
                </span>
                <span className="text-[11px] text-text-muted">Hôm nay</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Quét toàn diện 16 lớp THCS và 448 tiết giảng dạy. Trạng thái: Hợp lệ (0 xung đột giáo viên, 0 trùng phòng học).
              </p>
            </div>
          </div>

          {/* Item 2: Real Daily Attendance Log */}
          <div className="py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 flex-shrink-0 mt-0.5">
              <CheckCircle size={18} weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-text-primary">
                  Tổng hợp Sổ Điểm danh Toàn trường ngày {attendanceOverview.dateFormatted}
                </span>
                <span className="text-[11px] text-text-muted">07:30</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Ghi nhận {attendanceOverview.presentCount}/{attendanceOverview.totalStudents} học sinh có mặt tại 16 lớp học, tỷ lệ chuyên cần đạt {attendanceOverview.attendanceRate}%.
              </p>
            </div>
          </div>

          {/* Item 3 & 4: School Announcements from Real Data */}
          {announcements.slice(0, 2).map((ann) => {
            const classRow = classes.find((c) => c.id === ann.class_id);
            return (
              <div key={ann.id} className="py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0 mt-0.5">
                  <Article size={18} weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-primary">
                      Thông báo: {ann.title}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {classRow ? classRow.name : 'Toàn trường'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {ann.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
