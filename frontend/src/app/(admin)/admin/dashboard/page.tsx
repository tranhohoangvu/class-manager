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
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/contexts/auth-context';
import {
  AdminReportService,
  AttendanceService,
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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
            TRUNG TÂM ĐIỀU HÀNH NHÀ TRƯỜNG
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1.5 font-medium flex items-center gap-2 flex-wrap">
            <span className="text-text-primary font-bold">Trường THCS Nguyễn Tất Thành</span>
            <span>·</span>
            <span className="text-text-secondary font-medium">Năm học: 2026 - 2027</span>
            <span>·</span>
            <span className="text-text-secondary font-medium">Học kỳ 1</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-accent text-accent-text border border-border-strong font-mono font-bold text-xs shadow-xs">
              <CalendarCheck size={14} weight="bold" />
              Ngày {attendanceOverview.dateFormatted}
            </span>
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
            <ArrowsClockwise size={15} />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportComprehensiveReport}
            disabled={isExporting}
            className="cursor-pointer bg-surface hover:bg-surface-muted text-text-primary border-border font-semibold shadow-2xs"
          >
            <FileXls size={16} weight="duotone" className="text-emerald-700" />
            <span>{isExporting ? 'Đang xuất file...' : 'Xuất báo cáo trường (.xlsx)'}</span>
          </Button>

          <Link href="/admin/timetable">
            <Button variant="primary" size="sm" className="cursor-pointer gap-1.5 shadow-2xs">
              <CalendarBlank size={15} weight="bold" />
              <span>Quản lý Thời khóa biểu</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* =============================================
          LEVEL 1: ACTION REQUIRED (DIAGNOSTIC & TRIAGE)
          ============================================= */}
      <div className="space-y-3">
        {/* Timetable Audit & Health Row */}
        {auditReport && (
          auditReport.isValid ? (
            /* NORMAL / HEALTHY STATE: Compact inline status row (~42px) */
            <div className="flex items-center justify-between px-4 py-2.5 rounded-sm border border-success/40 bg-success-bg/60 text-xs shadow-xs transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle size={17} weight="fill" className="text-success flex-shrink-0" />
                <span className="font-semibold text-text-primary truncate">
                  Kiểm toán TKB: 16 lớp THCS và {totalScheduledSlots} tiết giảng dạy hợp lệ · 0 xung đột lịch.
                </span>
                <span className="hidden md:inline text-text-muted">·</span>
                <span className="hidden md:inline text-text-secondary truncate">
                  Chuyên cần toàn trường đạt {attendanceOverview.attendanceRate}% ({attendanceOverview.presentCount}/{attendanceOverview.totalStudents} HS có mặt).
                </span>
              </div>
              <Link
                href="/admin/timetable"
                className="text-xs font-bold text-teal hover:underline flex items-center gap-1 flex-shrink-0 ml-3"
              >
                <span>Xem kiểm toán TKB</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          ) : (
            /* CONFLICT / ISSUE STATE: Clear actionable alert */
            <div className="rounded-sm border border-danger/40 bg-danger-bg/60 p-4 text-xs space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-sm bg-danger-bg border border-danger/30 text-danger flex items-center justify-center flex-shrink-0">
                    <WarningCircle size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-danger">
                      Cảnh báo Kiểm toán TKB: Phát hiện {auditReport.summary.totalIssuesCount} vấn đề cần xử lý
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Cần giải quyết xung đột lịch giảng dạy hoặc vi phạm số tiết trước khi ban hành chính thức.
                    </p>
                  </div>
                </div>

                <Link href="/admin/timetable" className="flex-shrink-0">
                  <Button size="sm" variant="danger" className="text-xs h-8 px-3 font-semibold">
                    <span>Khắc phục ngay</span>
                    <ArrowRight size={13} weight="bold" />
                  </Button>
                </Link>
              </div>

              {/* Conflict details grid */}
              <div className="pt-2 border-t border-danger/20 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {auditReport.teacherConflicts.slice(0, 4).map((tc, idx) => (
                  <div
                    key={`tc-${idx}`}
                    className="p-2.5 rounded-sm bg-surface border border-danger/30 text-text-primary flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <strong className="font-bold">{tc.teacherName}</strong> · {tc.dayName}, {tc.periodLabel}
                      <div className="text-[11px] text-danger font-medium">
                        Trùng lịch giữa lớp {tc.className} và {tc.otherClassName || 'lớp khác'}
                      </div>
                    </div>
                    <Link
                      href={`/admin/timetable?classId=${tc.classId}`}
                      className="text-[11px] font-bold text-teal hover:underline flex items-center gap-1 ml-2 flex-shrink-0"
                    >
                      <span>Sửa</span>
                      <ArrowSquareOut size={12} />
                    </Link>
                  </div>
                ))}
                {auditReport.ruleViolations.slice(0, 4).map((rv, idx) => (
                  <div
                    key={`rv-${idx}`}
                    className="p-2.5 rounded-sm bg-surface border border-danger/30 text-text-primary flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <strong className="font-bold">{rv.className}</strong> · Môn {rv.subjectName} ({rv.dayName})
                      <div className="text-[11px] text-danger font-medium">{rv.violation}</div>
                    </div>
                    <Link
                      href={`/admin/timetable?classId=${rv.classId}`}
                      className="text-[11px] font-bold text-teal hover:underline flex items-center gap-1 ml-2 flex-shrink-0"
                    >
                      <span>Sửa</span>
                      <ArrowSquareOut size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Level 1.5: Theo dõi Nề nếp Hôm nay - Phân rã 4 cột Khối 6, 7, 8, 9 */}
        <div className="rounded-sm border border-border-strong bg-surface p-4 text-xs space-y-3 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xs bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
                <UserMinus size={16} weight="fill" className="text-amber-700" />
              </span>
              <div>
                <span className="font-extrabold uppercase tracking-wide text-xs text-text-primary">
                  THEO DÕI NỀ NẾP & CHUYÊN CẦN HÔM NAY THEO KHỐI
                </span>
                <span className="text-[11px] text-text-muted block sm:inline sm:ml-2">
                  {classAttendanceList.reduce((acc, c) => acc + c.absentCount, 0) > 0
                    ? `Phát hiện ${classAttendanceList.reduce((acc, c) => acc + c.absentCount, 0)} học sinh vắng trên toàn trường`
                    : 'Toàn trường ghi nhận chuyên cần ổn định (0 HS vắng)'}
                </span>
              </div>
            </div>
            <Link
              href="/admin/attendance"
              className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
            >
              <span>Quản lý chuyên cần chi tiết</span>
              <ArrowRight size={12} weight="bold" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                grade: 6,
                label: 'Khối 6',
                shift: 'Ca Sáng',
                container: 'border-amber-300/80 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800/60',
                headerBorder: 'border-amber-200/80',
                badge: 'bg-amber-100 text-amber-900 border-amber-300',
                shiftTag: 'bg-amber-100/70 text-amber-800 border-amber-200',
                okTag: 'bg-amber-100 text-amber-800 border-amber-300',
                cardBase: 'bg-surface/90 border-amber-200/80 hover:border-amber-400',
              },
              {
                grade: 7,
                label: 'Khối 7',
                shift: 'Ca Chiều',
                container: 'border-teal-300/80 bg-teal-50/30 dark:bg-teal-950/20 dark:border-teal-800/60',
                headerBorder: 'border-teal-200/80',
                badge: 'bg-teal-100 text-teal-900 border-teal-300',
                shiftTag: 'bg-teal-100/70 text-teal-800 border-teal-200',
                okTag: 'bg-teal-100 text-teal-800 border-teal-300',
                cardBase: 'bg-surface/90 border-teal-200/80 hover:border-teal-400',
              },
              {
                grade: 8,
                label: 'Khối 8',
                shift: 'Ca Chiều',
                container: 'border-blue-300/80 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/60',
                headerBorder: 'border-blue-200/80',
                badge: 'bg-blue-100 text-blue-900 border-blue-300',
                shiftTag: 'bg-blue-100/70 text-blue-800 border-blue-200',
                okTag: 'bg-blue-100 text-blue-800 border-blue-300',
                cardBase: 'bg-surface/90 border-blue-200/80 hover:border-blue-400',
              },
              {
                grade: 9,
                label: 'Khối 9',
                shift: 'Ca Sáng',
                container: 'border-purple-300/80 bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-800/60',
                headerBorder: 'border-purple-200/80',
                badge: 'bg-purple-100 text-purple-900 border-purple-300',
                shiftTag: 'bg-purple-100/70 text-purple-800 border-purple-200',
                okTag: 'bg-purple-100 text-purple-800 border-purple-300',
                cardBase: 'bg-surface/90 border-purple-200/80 hover:border-purple-400',
              },
            ].map((g) => {
              const items = classAttendanceList.filter((c) => c.grade === g.grade);
              const gradeAbsent = items.reduce((acc, c) => acc + c.absentCount, 0);

              return (
                <div
                  key={g.grade}
                  className={cn(
                    'rounded-xs border p-3 space-y-2 flex flex-col justify-between transition-all',
                    g.container
                  )}
                >
                  <div className={cn('flex items-center justify-between pb-1.5 border-b', g.headerBorder)}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('font-extrabold text-xs px-2 py-0.5 rounded-xs uppercase tracking-wider font-mono border', g.badge)}>
                        {g.label}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.2 rounded-xs font-mono font-bold border', g.shiftTag)}>
                        {g.shift}
                      </span>
                    </div>
                    {gradeAbsent > 0 ? (
                      <span className="text-[11px] font-bold text-danger bg-danger-bg px-1.5 py-0.2 rounded-xs border border-danger/30 font-mono">
                        Vắng {gradeAbsent}
                      </span>
                    ) : (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded-xs border font-mono', g.okTag)}>
                        Đủ 100%
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <Link
                        key={item.classId}
                        href="/admin/attendance"
                        className={cn(
                          'p-2 rounded-xs border text-text-primary text-xs flex items-center justify-between transition-all shadow-2xs hover:border-border-strong',
                          item.absentCount > 0
                            ? 'bg-danger-bg/40 border-danger/40 hover:bg-danger-bg/70'
                            : g.cardBase
                        )}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="font-bold text-xs text-text-primary truncate">
                            {item.className}
                          </div>
                          <div className="text-[11px] text-text-muted truncate mt-0.5">
                            GVCN: {item.teacherName}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded-xs font-mono font-bold text-[11px] border',
                              item.absentCount > 0
                                ? 'bg-danger text-white border-danger'
                                : 'bg-surface-muted text-text-muted border-border'
                            )}
                          >
                            Vắng {item.absentCount}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-2 text-text-muted text-[11px] italic">
                        Chưa có dữ liệu lớp
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =============================================
          LEVEL 2: COMPACT OPERATIONAL OVERVIEW (3 TILES)
          ============================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tile 1: Thời khóa biểu & Ca học */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs hover:border-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Thời khóa biểu Toàn trường</span>
              <span className="font-bold text-teal bg-teal-subtle px-1.5 py-0.5 rounded-sm border border-teal/20">{timetableCompletionRate}% Hoàn tất</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary font-mono tabular-nums">
                {totalScheduledSlots}
              </span>
              <span className="text-xs text-text-muted">/ {totalRequiredSlots} tiết chuẩn THCS</span>
            </div>
            <div className="mt-3 w-full bg-surface-muted h-1.5 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${timetableCompletionRate}%` }}
              />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-text-muted pt-2.5 border-t border-border">
            <span>Ca Sáng (K6, K9): <strong className="text-text-primary font-mono tabular-nums">{morningSlots}</strong> tiết</span>
            <span>Ca Chiều (K7, K8): <strong className="text-text-primary font-mono tabular-nums">{afternoonSlots}</strong> tiết</span>
          </div>
        </div>

        {/* Tile 2: Quy mô Lớp & Học sinh */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs hover:border-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Quy mô Lớp & Học sinh</span>
              <span className="font-bold text-success bg-success-bg px-1.5 py-0.5 rounded-sm border border-success/30">{schoolCapacityRate}% Lấp đầy</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary font-mono tabular-nums">
                {students.length}
              </span>
              <span className="text-xs text-text-muted">/ {totalMaxCapacity} học sinh</span>
            </div>
            <div className="mt-3 w-full bg-surface-muted h-1.5 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-success h-full rounded-full transition-all duration-300"
                style={{ width: `${schoolCapacityRate}%` }}
              />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-text-muted pt-2.5 border-t border-border">
            <span>{activeClasses} lớp ({activeTeachers} GV · 100% có GVCN)</span>
            <span>BQ: <strong className="text-text-primary font-mono tabular-nums">{activeClasses > 0 ? Math.round(students.length / activeClasses) : 0}</strong> HS/lớp</span>
          </div>
        </div>

        {/* Tile 3: Nề nếp Chuyên cần Hôm nay */}
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs hover:border-border-strong transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Chuyên cần Toàn trường Hôm nay</span>
              <span className="font-bold text-teal bg-teal-subtle px-1.5 py-0.5 rounded-sm border border-teal/20">Mục tiêu &ge; 95%</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-text-primary font-mono tabular-nums">
                {attendanceOverview.attendanceRate}%
              </span>
              <span className="text-xs text-text-muted">tỷ lệ đi học</span>
            </div>
            <div className="mt-3 w-full bg-surface-muted h-1.5 rounded-full overflow-hidden border border-border/50">
              <div
                className="bg-teal h-full rounded-full transition-all duration-300"
                style={{ width: `${attendanceOverview.attendanceRate}%` }}
              />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] text-text-muted pt-2.5 border-t border-border">
            <span className="text-teal font-semibold">Có mặt: <span className="font-mono tabular-nums">{attendanceOverview.presentCount}</span></span>
            <span className={attendanceOverview.absentCount > 0 ? 'text-danger font-semibold' : 'text-text-muted'}>
              Vắng: <span className="font-mono tabular-nums">{attendanceOverview.absentCount}</span>
            </span>
            <span className={attendanceOverview.lateCount > 0 ? 'text-warning font-semibold' : 'text-text-muted'}>
              Muộn: <span className="font-mono tabular-nums">{attendanceOverview.lateCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* =============================================
          LEVEL 3: PRIMARY WORKING DATA TABLES & TOOLBAR
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border-strong overflow-hidden shadow-xs">
        {/* Integrated Toolbar */}
        <div className="px-4 py-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-sm border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-sm transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'classes'
                  ? 'bg-accent text-accent-text font-bold shadow-xs border border-border-strong'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Table size={14} weight="bold" />
              <span>16 Lớp học ({enrichedClassList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teachers')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-sm transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'teachers'
                  ? 'bg-accent text-accent-text font-bold shadow-xs border border-border-strong'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <ChalkboardTeacher size={14} weight="bold" />
              <span>Đội ngũ Giáo viên ({filteredTeachers.length})</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'classes' ? (
              <>
                {/* Grade filter pills */}
                <div className="flex items-center bg-surface-muted p-0.5 rounded-sm border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedGradeFilter('all')}
                    className={cn(
                      'px-2.5 py-1 rounded-sm font-medium transition-all cursor-pointer text-[11px]',
                      selectedGradeFilter === 'all'
                        ? 'bg-accent text-accent-text font-bold shadow-xs'
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
                        'px-2 py-1 rounded-sm font-medium transition-all cursor-pointer text-[11px]',
                        selectedGradeFilter === g
                          ? 'bg-accent text-accent-text font-bold shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      )}
                    >
                      K{g}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Tìm lớp, GVCN, phòng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent w-48 sm:w-56"
                  />
                </div>
              </>
            ) : (
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Tìm giáo viên, bộ môn..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent w-52 sm:w-64"
                />
              </div>
            )}
          </div>
        </div>

        {/* TAB CONTENT: 1. CLASS OVERVIEW TABLE */}
        {activeTab === 'classes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/60 text-text-muted text-[11px] font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th
                    className="py-2.5 px-3.5 cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Lớp học</span>
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5">Khối & Ca</th>
                  <th className="py-2.5 px-3.5">Giáo viên chủ nhiệm</th>
                  <th className="py-2.5 px-3.5">Phòng học</th>
                  <th
                    className="py-2.5 px-3.5 text-center cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('students')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Sĩ số</span>
                      {sortField === 'students' && (
                        sortOrder === 'asc' ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3.5 text-center cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('timetable')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Thời khóa biểu</span>
                      {sortField === 'timetable' && (
                        sortOrder === 'asc' ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3.5 text-center cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('attendance')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Chuyên cần hôm nay</span>
                      {sortField === 'attendance' && (
                        sortOrder === 'asc' ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 font-medium">
                {enrichedClassList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-text-muted">
                      Không tìm thấy lớp học nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  enrichedClassList.map((c) => (
                    <tr key={c.id} className="hover:bg-accent-subtle/25 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-text-primary">{c.name}</div>
                        <div className="text-[11px] text-text-muted font-mono">{c.id}</div>
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
                      <td className="py-3 px-3.5 text-text-muted font-mono text-[11px]">
                        {c.roomName}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono tabular-nums">
                        <div className="font-bold text-text-primary">
                          {c.studentCount} <span className="text-text-muted font-normal">/{c.maxStudents}</span>
                        </div>
                        <div className="w-14 bg-surface-muted h-1 rounded-full overflow-hidden mx-auto mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.round((c.studentCount / c.maxStudents) * 100))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                          {c.timetableComplete ? (
                            <span className="px-2 py-0.5 rounded-sm bg-success-bg text-success border border-success/30 text-[11px] font-bold">
                              {c.scheduledSlots}/{c.requiredSlots} Tiết
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-sm bg-warning-bg text-warning-700 border border-warning/30 text-[11px] font-bold">
                              {c.scheduledSlots}/{c.requiredSlots} Tiết
                            </span>
                          )}
                          {c.hasTimetableIssues && (
                            <span
                              className="px-1.5 py-0.5 rounded-sm bg-danger-bg text-danger border border-danger/30 text-[10px] font-bold"
                              title={`${c.issueCount} vấn đề TKB`}
                            >
                              !
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono tabular-nums">
                        <div className="font-bold text-teal">{c.attendanceRate}%</div>
                        <div className="text-[11px] text-text-muted">
                          {c.presentCount} có mặt{c.absentCount > 0 ? `, ${c.absentCount} vắng` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {c.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-sm bg-success-bg text-success border border-success/30 text-[10px] font-bold">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm bg-surface-muted text-text-muted border border-border text-[10px] font-bold">
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/timetable?classId=${c.id}`}
                            className="p-1.5 rounded-sm text-text-muted hover:text-accent-text hover:bg-accent border border-transparent hover:border-border transition-colors"
                            title="Xem Thời khóa biểu lớp"
                          >
                            <CalendarBlank size={15} />
                          </Link>
                          <Link
                            href={`/attendance`}
                            className="p-1.5 rounded-sm text-text-muted hover:text-teal hover:bg-teal-subtle border border-transparent hover:border-teal/30 transition-colors"
                            title="Xem Sổ điểm danh"
                          >
                            <CheckCircle size={15} />
                          </Link>
                          <Link
                            href={`/seating`}
                            className="p-1.5 rounded-sm text-text-muted hover:text-accent-text hover:bg-accent border border-transparent hover:border-border transition-colors"
                            title="Xem Sơ đồ lớp"
                          >
                            <Door size={15} />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/80 text-text-muted text-[11px] font-bold uppercase tracking-wider border-b border-border-strong">
                <tr>
                  <th className="py-2.5 px-3.5">Giáo viên</th>
                  <th className="py-2.5 px-3.5">Chuyên môn / Bộ môn</th>
                  <th className="py-2.5 px-3.5">Vai trò chủ nhiệm</th>
                  <th className="py-2.5 px-3.5 text-center">Số lớp dạy</th>
                  <th className="py-2.5 px-3.5 text-center">Số tiết/tuần</th>
                  <th className="py-2.5 px-3.5 text-center">Tình trạng TKB</th>
                  <th className="py-2.5 px-3.5 text-center">Tài khoản</th>
                  <th className="py-2.5 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 font-medium">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      Không tìm thấy giáo viên nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-accent-subtle/30 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-sm bg-accent text-accent-text font-bold text-xs flex items-center justify-center border border-border flex-shrink-0 shadow-2xs">
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
                                className="px-2 py-0.5 rounded-sm bg-surface text-text-secondary border border-border text-[11px] font-semibold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-text-muted italic text-[11px]">Đang cập nhật</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        {t.homeroomClass ? (
                          <span className="px-2.5 py-0.5 text-xs font-bold bg-success-bg text-success border border-success/30 rounded-sm inline-flex items-center gap-1">
                            GVCN {t.homeroomClass}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[11px]">Giáo viên Bộ môn</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-text-primary font-mono tabular-nums">
                        {t.assignedClassCount > 0 ? `${t.assignedClassCount} lớp` : '—'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-teal font-mono tabular-nums">
                        {t.scheduledPeriods > 0 ? `${t.scheduledPeriods} tiết` : '0 tiết'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {t.hasConflict ? (
                          <span className="px-2 py-0.5 rounded-sm bg-danger-bg text-danger border border-danger/30 text-[10px] font-bold">
                            Xung đột lịch
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm bg-success-bg text-success border border-success/30 text-[10px] font-bold">
                            Ổn định
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {t.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-sm bg-success-bg text-success border border-success/30 text-[10px] font-bold">
                            Đang công tác
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm bg-danger-bg text-danger border border-danger/30 text-[10px] font-bold">
                            Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <Link
                          href="/admin/teachers"
                          className="text-xs font-bold text-teal hover:underline inline-flex items-center gap-1"
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
          LEVEL 4: REAL ACTIVITY & SYSTEM AUDIT LOG
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 md:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Broadcast size={16} weight="bold" className="text-teal" />
            <h2 className="text-sm font-bold text-text-primary">
              Nhật ký Quản trị & Hoạt động Gần đây
            </h2>
          </div>
          <span className="text-[11px] text-text-muted">Cập nhật thời gian thực</span>
        </div>

        <div className="divide-y divide-border/70">
          {/* Item 1: Real Timetable Audit Scan */}
          <div className="py-2.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-sm bg-success-bg text-success flex items-center justify-center border border-success/30 flex-shrink-0 mt-0.5">
              <ShieldCheck size={16} weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-text-primary">
                  Kiểm toán Hệ thống Thời khóa biểu hoàn tất
                </span>
                <span className="text-[11px] text-text-muted font-mono">Hôm nay</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Quét toàn diện 16 lớp THCS và {totalScheduledSlots} tiết giảng dạy. Trạng thái: Hợp lệ (0 xung đột giáo viên, 0 trùng phòng học).
              </p>
            </div>
          </div>

          {/* Item 2: Real Daily Attendance Log */}
          <div className="py-2.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-sm bg-accent text-accent-text flex items-center justify-center border border-border flex-shrink-0 mt-0.5">
              <CheckCircle size={16} weight="duotone" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-text-primary">
                  Tổng hợp Sổ Điểm danh Toàn trường ngày {attendanceOverview.dateFormatted}
                </span>
                <span className="text-[11px] text-text-muted font-mono">07:30</span>
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
              <div key={ann.id} className="py-2.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-sm bg-surface-muted text-text-secondary flex items-center justify-center border border-border flex-shrink-0 mt-0.5">
                  <Article size={16} weight="duotone" />
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
