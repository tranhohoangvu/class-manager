'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Printer,
  Lightning,
  Copy,
  Trash,
  CalendarCheck,
  Clock,
  ChalkboardTeacher,
  Plus,
  PencilSimple,
  Check,
  X,
  CaretRight,
  Info,
  CalendarBlank,
  BookOpen,
  WarningCircle,
  Eye,
  EyeSlash,
  CaretDown,
  CaretUp,
  Lock,
} from '@phosphor-icons/react';
import { useCurrentClass } from '@/contexts/class-context';
import { useAuth } from '@/contexts/auth-context';
import { LocalStore } from '@/lib/store';
import { TimetableService, CurrentPeriodInfo, AuthGuard } from '@/services';
import {
  TimetableEntryRow,
  SubjectRow,
  UserRow,
  ClassRow,
} from '@/types';
import {
  TIMETABLE_PERIODS,
  TIMETABLE_DAYS,
  SUBJECT_COLOR_MAP,
  DEFAULT_SUBJECT_COLOR,
  getGradeShift,
  isAllowedPeriodForClass,
  getClassHomeroomSlot,
  getClassAllowedPeriods,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TimetablePage() {
  const { currentClassId, currentClass, isHomeroom, switchClass } = useCurrentClass();
  const { user } = useAuth();

  const [timetable, setTimetable] = useState<TimetableEntryRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);
  const [periodInfo, setPeriodInfo] = useState<CurrentPeriodInfo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Class Selection & View State
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClassId || 'c-6a1');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');

  // Toggle show/hide the opposite session rows (collapse/expand)
  // For morning classes: control whether afternoon rows (P6-P10) are visible
  // For afternoon classes: control whether morning rows (P1-P5) are visible
  const [showOppositeShift, setShowOppositeShift] = useState<boolean>(false);

  // Edit Cell Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ day: number; period: number } | null>(null);
  const [editSubjectId, setEditSubjectId] = useState<string>('');
  const [editTeacherId, setEditTeacherId] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Copy Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [sourceClassId, setSourceClassId] = useState<string>('');
  const [copyError, setCopyError] = useState<string | null>(null);

  // Mobile selected day tab (2..7)
  const [mobileSelectedDay, setMobileSelectedDay] = useState<number>(2);

  // Allowed classes for current user:
  // - ADMIN: Can view all classes in the school.
  // - TEACHERS: Can ONLY view timetable of classes they teach (Homeroom or Subject teacher).
  const allowedClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') {
      return allClasses;
    }
    return allClasses.filter((c) => AuthGuard.canViewTimetable(user, c.id));
  }, [allClasses, user]);

  // Sync selectedClassId if currentClassId changes from external switcher
  useEffect(() => {
    if (currentClassId) {
      if (user?.role === 'ADMIN' || allowedClasses.some((c) => c.id === currentClassId)) {
        setSelectedClassId(currentClassId);
      }
    }
  }, [currentClassId, allowedClasses, user]);

  // Ensure selectedClassId stays within allowedClasses for teachers
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && allowedClasses.length > 0) {
      if (!allowedClasses.some((c) => c.id === selectedClassId)) {
        setSelectedClassId(allowedClasses[0].id);
      }
    }
  }, [allowedClasses, selectedClassId, user]);

  // Resolve active class from allowed classes
  const activeClass =
    allowedClasses.find((c) => c.id === selectedClassId) ||
    allowedClasses[0] ||
    null;
  const activeClassId = activeClass?.id || selectedClassId || 'c-6a1';

  // Load class data
  const loadData = () => {
    const classes = LocalStore.getClasses().filter((c) => c.status === 'active');
    setAllClasses(classes);

    const targetId = activeClassId || (classes.length > 0 ? classes[0].id : null);
    if (!targetId) return;

    const entries = TimetableService.getTimetableForClass(targetId, user);
    const subjs = LocalStore.getSubjects();
    const usrs = LocalStore.getUsers().filter((u) => u.role === 'TEACHER');

    setTimetable(entries);
    setSubjects(subjs);
    setTeachers(usrs);
    setPeriodInfo(TimetableService.getCurrentPeriodInfo());
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
    // Update live period every minute
    const interval = setInterval(() => {
      setPeriodInfo(TimetableService.getCurrentPeriodInfo());
    }, 60000);
    return () => clearInterval(interval);
  }, [activeClassId]);

  // Set default mobile tab to today's day of week (if Monday..Saturday)
  useEffect(() => {
    const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon ...
    const mappedDay = todayDay === 0 ? 2 : todayDay + 1;
    if (mappedDay >= 2 && mappedDay <= 7) {
      setMobileSelectedDay(mappedDay);
    }
  }, []);

  const canEdit = AuthGuard.canManageTimetable(user, activeClass?.id);

  // Handle class switch from page chips
  const handleSelectClass = (clsId: string) => {
    setSelectedClassId(clsId);
    switchClass(clsId);
  };

  // Map entries for quick lookup: [day-period] => TimetableEntryRow
  const timetableMap = useMemo(() => {
    const map = new Map<string, TimetableEntryRow>();
    timetable.forEach((entry) => {
      map.set(`${entry.day_of_week}-${entry.period}`, entry);
    });
    return map;
  }, [timetable]);

  const subjectsMap = useMemo(() => {
    const map = new Map<string, SubjectRow>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const teachersMap = useMemo(() => {
    const map = new Map<string, UserRow>();
    teachers.forEach((t) => map.set(t.id, t));
    return map;
  }, [teachers]);

  const classGrade = activeClass?.grade || 6;
  const classShift = getGradeShift(classGrade);
  const homeroomSlot = getClassHomeroomSlot(classGrade);

  // Open slot edit modal
  const handleOpenEdit = (day: number, period: number) => {
    if (!canEdit) {
      toast.info('Chỉ Quản trị viên mới có quyền chỉnh sửa Thời khóa biểu.');
      return;
    }
    if (!isAllowedPeriodForClass(classGrade, day, period)) {
      toast.info(`Lớp ${activeClass?.name} học ca ${classShift === 'morning' ? 'Sáng' : 'Chiều'}, không học Tiết ${period}.`);
      return;
    }
    const entry = timetableMap.get(`${day}-${period}`);
    setEditingSlot({ day, period });
    if (day === 7 && period === homeroomSlot.period) {
      setEditSubjectId('sub-shl');
      setEditTeacherId(activeClass?.teacher_id || '');
    } else {
      setEditSubjectId(entry?.subject_id || '');
      setEditTeacherId(entry?.teacher_id || '');
    }
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // When subject changes in modal, auto-suggest teacher from assignments
  const handleSubjectChange = (subjectId: string) => {
    setEditSubjectId(subjectId);
    setEditError(null);
    if (activeClassId && subjectId) {
      const assignments = LocalStore.getSubjectAssignmentsForClass(activeClassId);
      const match = assignments.find((a) => a.subject_id === subjectId);
      if (match) {
        setEditTeacherId(match.teacher_id);
      }
    }
  };

  // Save slot edit
  const handleSaveSlot = () => {
    if (!activeClassId || !editingSlot) return;

    if (!editSubjectId) {
      // Clear this slot
      const res = TimetableService.deleteEntry(
        activeClassId,
        editingSlot.day,
        editingSlot.period,
        user
      );
      if (res.success) {
        toast.success(`Đã xóa tiết ${editingSlot.period} Thứ ${editingSlot.day}`);
        setEditError(null);
        setIsEditModalOpen(false);
        loadData();
      } else {
        setEditError(res.error || 'Có lỗi xảy ra');
        toast.error(res.error);
      }
      return;
    }

    const res = TimetableService.saveEntry(
      activeClassId,
      editingSlot.day,
      editingSlot.period,
      editSubjectId,
      editTeacherId || null,
      user
    );

    if (res.success) {
      toast.success(`Đã lưu tiết ${editingSlot.period} Thứ ${editingSlot.day}`);
      setEditError(null);
      setIsEditModalOpen(false);
      loadData();
    } else {
      setEditError(res.error || 'Có lỗi xảy ra');
      toast.error(res.error);
    }
  };

  // Delete slot button in modal
  const handleDeleteSlot = () => {
    if (!activeClassId || !editingSlot) return;
    const res = TimetableService.deleteEntry(
      activeClassId,
      editingSlot.day,
      editingSlot.period,
      user
    );
    if (res.success) {
      toast.success('Đã xóa môn học trong tiết này');
      setEditError(null);
      setIsEditModalOpen(false);
      loadData();
    } else {
      setEditError(res.error || 'Có lỗi xảy ra');
      toast.error(res.error);
    }
  };

  // Reset to standard template
  const handleApplyTemplate = () => {
    if (!activeClassId) return;
    if (window.confirm('Bạn có chắc muốn áp dụng Thời khóa biểu mẫu chuẩn cho lớp học này? Dữ liệu hiện tại sẽ được cập nhật lại theo khung chuẩn.')) {
      const res = TimetableService.applyStandardTemplate(activeClassId, user);
      if (res.success) {
        toast.success('Đã xếp nhanh Thời khóa biểu theo mẫu chuẩn!');
        loadData();
      } else {
        toast.error(res.error);
      }
    }
  };

  // Copy from another class
  const handleCopyFromClass = () => {
    if (!activeClassId || !sourceClassId) {
      toast.error('Vui lòng chọn lớp học nguồn để sao chép.');
      return;
    }
    const res = TimetableService.copyFromClass(sourceClassId, activeClassId, user);
    if (res.success) {
      toast.success('Đã sao chép Thời khóa biểu thành công!');
      setCopyError(null);
      setIsCopyModalOpen(false);
      loadData();
    } else {
      setCopyError(res.error || 'Xung đột khi sao chép Thời khóa biểu.');
      toast.error(res.error);
    }
  };

  // Clear all
  const handleClearAll = () => {
    if (!activeClassId) return;
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ Thời khóa biểu của lớp này?')) {
      const res = TimetableService.clearTimetable(activeClassId, user);
      if (res.success) {
        toast.success('Đã xóa sạch Thời khóa biểu của lớp.');
        loadData();
      } else {
        toast.error(res.error);
      }
    }
  };

  // Print A4
  const handlePrint = () => {
    window.print();
  };

  if (isLoaded && allowedClasses.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Chưa có phân công lớp học</h2>
        <p className="text-sm text-text-muted">
          Bạn chưa được phân công làm giáo viên chủ nhiệm hoặc giáo viên bộ môn cho lớp nào. Vui lòng liên hệ Quản trị viên để được phân công lớp.
        </p>
      </div>
    );
  }

  if (!isLoaded || !activeClass) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-96 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const homeroomTeacher = activeClass.teacher_id
    ? LocalStore.getUserById(activeClass.teacher_id)
    : null;

  const renderPeriodRow = (period: (typeof TIMETABLE_PERIODS)[0]) => {
    return (
      <tr key={period.period} className="hover:bg-surface-muted/30 transition-colors">
        {/* Period Label Header Column */}
        <td className="py-3.5 px-3 bg-surface-muted/30 text-center border-r border-border">
          <span className="text-xs font-bold text-text-primary block">
            {period.label}
          </span>
          <span className="text-[11px] text-text-muted font-medium mt-0.5 block">
            {period.startTime} - {period.endTime}
          </span>
        </td>

        {/* Day Columns */}
        {TIMETABLE_DAYS.map((day) => {
          const isAllowedSlot = isAllowedPeriodForClass(classGrade, day.day, period.period);
          const isSatSHL = day.day === 7 && period.period === homeroomSlot.period;
          const entry = timetableMap.get(`${day.day}-${period.period}`);
          const subj = entry ? subjectsMap.get(entry.subject_id) : null;
          const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;
          const colorStyle = (subj && SUBJECT_COLOR_MAP[subj.code]) || DEFAULT_SUBJECT_COLOR;

          const isOngoing =
            periodInfo?.dayOfWeek === day.day &&
            periodInfo?.period === period.period;

          if (!isAllowedSlot) {
            const isSatEmpty = day.day === 7 && [4, 5, 9, 10].includes(period.period);
            return (
              <td
                key={day.day}
                className="py-2.5 px-3 border-l border-border bg-surface-muted/15 text-center align-middle"
              >
                <div className="h-full min-h-[72px] rounded-xl border border-dashed border-border/40 bg-surface-muted/25 flex flex-col items-center justify-center text-text-muted/40 select-none">
                  <span className="text-xs font-bold">—</span>
                  <span className="text-[10px] font-medium">
                    {isSatEmpty
                      ? 'Không có tiết'
                      : classShift === 'morning'
                      ? 'Ca Chiều'
                      : 'Ca Sáng'}
                  </span>
                </div>
              </td>
            );
          }

          if (isSatSHL) {
            return (
              <td
                key={day.day}
                onClick={() => canEdit && handleOpenEdit(day.day, period.period)}
                className={cn(
                  'py-2.5 px-3 border-l border-border transition-all align-top',
                  canEdit ? 'cursor-pointer hover:bg-violet-50/20' : '',
                  isOngoing ? 'bg-violet-100/50 ring-2 ring-inset ring-violet-500' : ''
                )}
              >
                <div
                  className={cn(
                    'h-full min-h-[72px] p-2.5 rounded-xl border border-violet-300 bg-gradient-to-br from-violet-50 via-purple-50/70 to-indigo-50/50 shadow-2xs flex flex-col justify-between transition-all group relative'
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse flex-shrink-0" />
                      <span className="text-xs font-black text-violet-950 leading-tight truncate">
                        Sinh hoạt lớp
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-violet-600 text-white shadow-2xs flex-shrink-0">
                      SHL
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="truncate font-semibold text-violet-900 group-hover:text-violet-950">
                      {homeroomTeacher ? (
                        `GVCN: ${homeroomTeacher.name.replace('Thầy ', '').replace('Cô ', '')}`
                      ) : (
                        <span className="text-rose-600 font-bold">Chưa gán GVCN</span>
                      )}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-200/80 text-violet-800 flex-shrink-0">
                      Cố định
                    </span>
                  </div>
                </div>
              </td>
            );
          }

          return (
            <td
              key={day.day}
              onClick={() => canEdit && handleOpenEdit(day.day, period.period)}
              className={cn(
                'py-2.5 px-3 border-l border-border transition-all align-top',
                canEdit ? 'cursor-pointer hover:bg-accent/5' : '',
                isOngoing ? 'bg-blue-50/40 ring-1 ring-inset ring-blue-400' : ''
              )}
            >
              {subj ? (
                <div
                  className={cn(
                    'h-full min-h-[72px] p-2.5 rounded-xl border flex flex-col justify-between transition-all group relative',
                    colorStyle.bg,
                    colorStyle.border
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className={cn('text-xs font-bold leading-tight line-clamp-1', colorStyle.text)}>
                      {subj.name}
                    </span>
                    <span className={cn('text-[9px] font-extrabold px-1.5 py-0.2 rounded border', colorStyle.badgeBg, colorStyle.border)}>
                      {subj.code}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-text-secondary">
                    <span className="truncate text-text-muted group-hover:text-text-primary transition-colors">
                      {teacher ? teacher.name.replace('Thầy ', '').replace('Cô ', '') : '—'}
                    </span>
                    {canEdit && (
                      <PencilSimple
                        size={12}
                        className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity ml-1 flex-shrink-0"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'h-full min-h-[72px] rounded-xl border border-dashed border-border/80 flex flex-col items-center justify-center text-text-muted/60 hover:text-accent hover:border-accent/40 hover:bg-surface-muted/40 transition-all p-2',
                    canEdit ? 'cursor-pointer' : 'opacity-40'
                  )}
                >
                  {canEdit ? (
                    <Plus size={16} />
                  ) : (
                    <span className="text-[11px]">—</span>
                  )}
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <>
      {/* =============================================
          1. SCREEN VIEW (Interactive Desktop + Mobile)
          ============================================= */}
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto no-print">
        {/* Header & Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Thời khóa biểu — {activeClass.name}
              </h1>
              <span className={cn(
                "text-[11px] font-bold px-3 py-0.5 rounded-full border",
                classShift === 'morning'
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-indigo-50 text-indigo-900 border-indigo-200"
              )}>
                {classShift === 'morning' ? '☀️ Ca Sáng (Khối 6, 9 · Tiết 1–5)' : '🌤️ Ca Chiều (Khối 7, 8 · Tiết 6–10)'}
              </span>
              {!canEdit && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border">
                  Chế độ chỉ xem
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {activeClass.room_name || 'Chưa xếp phòng'} · Năm học {activeClass.school_year} · GVCN:{' '}
              <span className="font-medium text-text-secondary">{homeroomTeacher?.name || 'Chưa gán'}</span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={handlePrint} className="cursor-pointer">
              <Printer size={16} />
              <span>In TKB A4</span>
            </Button>

            {canEdit && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyTemplate}
                  className="cursor-pointer"
                  title="Áp dụng 30 tiết mẫu chuẩn THCS phân bổ đều các môn"
                >
                  <Lightning size={16} className="text-amber-600" />
                  <span>Xếp mẫu chuẩn</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCopyModalOpen(true)}
                  className="cursor-pointer"
                >
                  <Copy size={16} />
                  <span>Sao chép TKB</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                  title="Xóa toàn bộ các tiết"
                >
                  <Trash size={16} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* =============================================
            CLASS SELECTOR & GRADE SHIFT FILTER BAR
            ============================================= */}
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Lớp đang xem:
              </span>
              <span className="text-sm font-extrabold text-text-primary">
                {activeClass.name}
              </span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                classShift === 'morning'
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-indigo-50 text-indigo-900 border-indigo-200"
              )}>
                {classShift === 'morning' ? '☀️ Ca Sáng (Khối 6, 9)' : '🌤️ Ca Chiều (Khối 7, 8)'}
              </span>
            </div>

            {/* Toggle Show/Hide Opposite Shift Rows */}
            <button
              type="button"
              onClick={() => setShowOppositeShift(!showOppositeShift)}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto',
                showOppositeShift
                  ? 'bg-surface-muted text-text-primary border-border hover:bg-surface-muted/80'
                  : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
              )}
            >
              {showOppositeShift ? (
                <>
                  <EyeSlash size={15} />
                  <span>{classShift === 'morning' ? 'Ẩn các tiết ca Chiều' : 'Ẩn các tiết ca Sáng'}</span>
                </>
              ) : (
                <>
                  <Eye size={15} />
                  <span>{classShift === 'morning' ? 'Hiện các tiết ca Chiều' : 'Hiện các tiết ca Sáng'}</span>
                </>
              )}
            </button>
          </div>

          {/* Grade Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setGradeFilter('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                gradeFilter === 'all'
                  ? 'bg-text-primary text-surface shadow-2xs'
                  : 'bg-surface-muted/60 text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border/50'
              )}
            >
              Tất cả ({allowedClasses.length} lớp)
            </button>
            {[
              { grade: 6, label: 'Khối 6', shift: '☀️ Ca Sáng' },
              { grade: 7, label: 'Khối 7', shift: '🌤️ Ca Chiều' },
              { grade: 8, label: 'Khối 8', shift: '🌤️ Ca Chiều' },
              { grade: 9, label: 'Khối 9', shift: '☀️ Ca Sáng' },
            ]
              .filter((g) => allowedClasses.some((c) => c.grade === g.grade))
              .map((g) => {
                const count = allowedClasses.filter((c) => c.grade === g.grade).length;
                return (
                  <button
                    key={g.grade}
                    type="button"
                    onClick={() => setGradeFilter(g.grade)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border',
                      gradeFilter === g.grade
                        ? 'bg-accent text-white border-accent shadow-2xs font-bold'
                        : 'bg-surface-muted/60 border-border/50 text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                    )}
                  >
                    <span>{g.label}</span>
                    <span className="text-[10px] opacity-85 font-normal">({count} lớp · {g.shift})</span>
                  </button>
                );
              })}
          </div>

          {/* Class Quick-Select Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {allowedClasses
              .filter((c) => gradeFilter === 'all' || c.grade === gradeFilter)
              .map((c) => {
                const isSelected = c.id === activeClassId;
                const shift = getGradeShift(c.grade);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClass(c.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border',
                      isSelected
                        ? shift === 'morning'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                          : 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-300'
                        : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-accent/50'
                    )}
                  >
                    <span>{c.name}</span>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded font-semibold',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : shift === 'morning'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    )}>
                      {shift === 'morning' ? 'Sáng' : 'Chiều'}
                    </span>
                  </button>
                );
              })}
          </div>
          {user?.role !== 'ADMIN' && (
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted pt-1">
              <Lock size={12} className="text-text-muted" />
              <span>Chỉ hiển thị các lớp bạn được phân công giảng dạy hoặc chủ nhiệm ({allowedClasses.length} lớp).</span>
            </div>
          )}
        </div>

        {/* Real-time Current Period Notification Banner */}
        {periodInfo && periodInfo.isSchoolHours && (
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs animate-pulse">
                <Clock size={20} weight="bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    {periodInfo.status === 'in_period'
                      ? `Đang trong giờ học: ${periodInfo.periodConfig?.label} (${periodInfo.periodConfig?.startTime} - ${periodInfo.periodConfig?.endTime})`
                      : 'Giờ giải lao giữa tiết'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-xs text-blue-800/90 mt-0.5 font-medium">
                  {periodInfo.status === 'in_period' && periodInfo.period ? (
                    (() => {
                      const entry = timetableMap.get(`${periodInfo.dayOfWeek}-${periodInfo.period}`);
                      if (entry) {
                        const subj = subjectsMap.get(entry.subject_id);
                        const tea = entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;
                        return `Môn ${subj?.name || 'Môn học'} · Giáo viên: ${tea?.name || 'Chưa phân công'}`;
                      }
                      return 'Tiết tự học / Sinh hoạt tự quản';
                    })()
                  ) : (
                    periodInfo.nextPeriod && `Tiết tiếp theo: ${periodInfo.nextPeriod.label} lúc ${periodInfo.nextPeriod.startTime}`
                  )}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-blue-700/80 font-medium bg-white/70 px-3 py-1.5 rounded-lg border border-blue-100 self-start sm:self-auto">
              Hệ thống tự nhận diện theo thời gian thực
            </div>
          </div>
        )}

        {/* Mobile Day Tabs Selector */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
          {TIMETABLE_DAYS.map((d) => {
            const isSelected = mobileSelectedDay === d.day;
            const isToday = periodInfo?.dayOfWeek === d.day;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setMobileSelectedDay(d.day)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                  isSelected
                    ? 'bg-accent text-white shadow-2xs'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                )}
              >
                <span>{d.name}</span>
                {isToday && (
                  <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-emerald-500')} />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile View: Day Card List */}
        <div className="md:hidden space-y-3">
          {TIMETABLE_PERIODS.filter((p) => {
            if (mobileSelectedDay === 7 && [4, 5, 9, 10].includes(p.period)) {
              return false;
            }
            if (showOppositeShift) {
              return true;
            }
            return isAllowedPeriodForClass(classGrade, mobileSelectedDay, p.period);
          }).map((period) => {
            const isAllowedSlot = isAllowedPeriodForClass(classGrade, mobileSelectedDay, period.period);
            const isSaturdaySHL = mobileSelectedDay === 7 && period.period === homeroomSlot.period;
            const entry = timetableMap.get(`${mobileSelectedDay}-${period.period}`);
            const subj = entry ? subjectsMap.get(entry.subject_id) : null;
            const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;
            const colorStyle = (subj && SUBJECT_COLOR_MAP[subj.code]) || DEFAULT_SUBJECT_COLOR;

            const isCurrentPeriod =
              periodInfo?.dayOfWeek === mobileSelectedDay &&
              periodInfo?.period === period.period;

            if (!isAllowedSlot) {
              return (
                <div
                  key={period.period}
                  className="p-3 rounded-2xl border border-dashed border-border/60 bg-surface-muted/20 flex items-center justify-between text-text-muted"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-muted text-text-muted border border-border">
                      {period.label}
                    </span>
                    <span className="text-[11px]">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>
                  <span className="text-xs font-medium italic">
                    {classShift === 'morning' ? 'Ca Chiều' : 'Ca Sáng'} (Lớp không học)
                  </span>
                </div>
              );
            }

            return (
              <div
                key={period.period}
                onClick={() => canEdit && handleOpenEdit(mobileSelectedDay, period.period)}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  isSaturdaySHL
                    ? 'border-violet-300 bg-gradient-to-br from-violet-50/90 to-purple-50/70 shadow-2xs'
                    : isCurrentPeriod
                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30'
                    : 'bg-surface border-border',
                  canEdit && 'cursor-pointer hover:border-accent/40 active:scale-[0.99]'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-bold px-2.5 py-0.5 rounded-md border',
                      isSaturdaySHL
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-surface-muted text-text-primary border-border'
                    )}>
                      {period.label}
                    </span>
                    <span className="text-[11px] text-text-muted font-medium">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>
                  {isSaturdaySHL ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                      Cố định Thứ 7
                    </span>
                  ) : isCurrentPeriod && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                      Đang học
                    </span>
                  )}
                </div>

                {isSaturdaySHL ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-violet-950">
                        Sinh hoạt lớp
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-violet-600 text-white">
                        SHL
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-violet-900 font-medium">
                      <ChalkboardTeacher size={14} className="text-violet-700" />
                      <span>
                        GVCN: {homeroomTeacher ? homeroomTeacher.name : 'Chưa gán GVCN'}
                      </span>
                    </div>
                  </div>
                ) : subj ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary">
                        {subj.name}
                      </span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', colorStyle.badgeBg, colorStyle.border)}>
                        {subj.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <ChalkboardTeacher size={14} className="text-text-muted" />
                      <span>{teacher?.name || 'Chưa gán giáo viên'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-text-muted flex items-center justify-center gap-1 border border-dashed border-border rounded-xl">
                    <Plus size={14} />
                    <span>Tiết trống {canEdit ? '— Bấm để gán môn' : ''}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Matrix Grid with 2 Sessions */}
        <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-muted/60 border-b border-border">
                  <th className="py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider w-28 text-center">
                    Tiết / Giờ
                  </th>
                  {TIMETABLE_DAYS.map((day) => {
                    const isToday = periodInfo?.dayOfWeek === day.day;
                    return (
                      <th
                        key={day.day}
                        className={cn(
                          'py-3 px-4 text-xs font-bold uppercase tracking-wider text-center border-l border-border',
                          isToday ? 'bg-accent/10 text-accent font-extrabold' : 'text-text-primary'
                        )}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{day.name}</span>
                          {isToday && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Hôm nay" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* 1. MORNING SESSION BANNER */}
                <tr className={cn(
                  "border-b border-border/80 transition-colors",
                  classShift === 'morning'
                    ? "bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90"
                    : "bg-surface-muted/50"
                )}>
                  <td colSpan={7} className="py-2.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          classShift === 'morning' ? "bg-blue-600 animate-pulse" : "bg-gray-400"
                        )} />
                        <span className={cn(
                          "text-xs font-black uppercase tracking-wider",
                          classShift === 'morning' ? "text-blue-950" : "text-text-muted"
                        )}>
                          Buổi Sáng (Tiết 1 – Tiết 5 · 07:15 – 11:30)
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md",
                          classShift === 'morning'
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : "bg-surface text-text-muted border border-border"
                        )}>
                          {classShift === 'morning' ? 'Ca học chính khóa của lớp' : `Khối ${classGrade} không học ca này`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {classShift === 'afternoon' && (
                          <button
                            type="button"
                            onClick={() => setShowOppositeShift(!showOppositeShift)}
                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer bg-white/80 px-2.5 py-1 rounded-lg border border-border shadow-2xs"
                          >
                            {showOppositeShift ? (
                              <>
                                <EyeSlash size={14} />
                                <span>Ẩn các tiết ca Sáng</span>
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                <span>Hiện các tiết ca Sáng</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-[11px] font-medium text-blue-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                          07:00 – 07:15: Sinh hoạt đầu giờ (15 phút)
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 2. MORNING ROWS (P1-P5) - rendered if morning class or expanded */}
                {(classShift === 'morning' || showOppositeShift) && (
                  <>
                    {renderPeriodRow(TIMETABLE_PERIODS[0])}
                    {renderPeriodRow(TIMETABLE_PERIODS[1])}
                    {/* Break after P2 (10 mins) */}
                    <tr className="bg-amber-50/50 border-y border-amber-200/60">
                      <td colSpan={7} className="py-1 px-4 text-center text-[11px] font-semibold text-amber-800">
                        ☕ Giờ giải lao 10 phút (08:45 – 08:55)
                      </td>
                    </tr>
                    {renderPeriodRow(TIMETABLE_PERIODS[2])}
                    {renderPeriodRow(TIMETABLE_PERIODS[3])}
                    {/* Break after P4 (5 mins) */}
                    <tr className="bg-amber-50/30 border-y border-amber-100">
                      <td colSpan={7} className="py-1 px-4 text-center text-[11px] font-medium text-amber-700">
                        Giờ giải lao 5 phút (10:25 – 10:30) · Áp dụng Thứ Hai đến Thứ Sáu
                      </td>
                    </tr>
                    {renderPeriodRow(TIMETABLE_PERIODS[4])}
                  </>
                )}

                {/* 3. AFTERNOON SESSION BANNER */}
                <tr className={cn(
                  "border-y-2 border-border transition-colors",
                  classShift === 'afternoon'
                    ? "bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90"
                    : "bg-surface-muted/50"
                )}>
                  <td colSpan={7} className="py-2.5 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          classShift === 'afternoon' ? "bg-indigo-600 animate-pulse" : "bg-gray-400"
                        )} />
                        <span className={cn(
                          "text-xs font-black uppercase tracking-wider",
                          classShift === 'afternoon' ? "text-indigo-950" : "text-text-muted"
                        )}>
                          Buổi Chiều (Tiết 6 – Tiết 10 · 13:00 – 17:15)
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md",
                          classShift === 'afternoon'
                            ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                            : "bg-surface text-text-muted border border-border"
                        )}>
                          {classShift === 'afternoon' ? 'Ca học chính khóa của lớp' : `Khối ${classGrade} không học ca này`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {classShift === 'morning' && (
                          <button
                            type="button"
                            onClick={() => setShowOppositeShift(!showOppositeShift)}
                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer bg-white/80 px-2.5 py-1 rounded-lg border border-border shadow-2xs"
                          >
                            {showOppositeShift ? (
                              <>
                                <EyeSlash size={14} />
                                <span>Ẩn các tiết ca Chiều</span>
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                <span>Hiện các tiết ca Chiều</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-[11px] font-medium text-indigo-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          12:45 – 13:00: Sinh hoạt đầu giờ (15 phút)
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 4. AFTERNOON ROWS (P6-P10) - rendered if afternoon class or expanded */}
                {(classShift === 'afternoon' || showOppositeShift) && (
                  <>
                    {renderPeriodRow(TIMETABLE_PERIODS[5])}
                    {renderPeriodRow(TIMETABLE_PERIODS[6])}
                    {/* Break after P7 (10 mins) */}
                    <tr className="bg-amber-50/50 border-y border-amber-200/60">
                      <td colSpan={7} className="py-1 px-4 text-center text-[11px] font-semibold text-amber-800">
                        ☕ Giờ giải lao 10 phút (14:30 – 14:40)
                      </td>
                    </tr>
                    {renderPeriodRow(TIMETABLE_PERIODS[7])}
                    {renderPeriodRow(TIMETABLE_PERIODS[8])}
                    {/* Break after P9 (5 mins) */}
                    <tr className="bg-amber-50/30 border-y border-amber-100">
                      <td colSpan={7} className="py-1 px-4 text-center text-[11px] font-medium text-amber-700">
                        Giờ giải lao 5 phút (16:10 – 16:15) · Áp dụng Thứ Hai đến Thứ Sáu
                      </td>
                    </tr>
                    {renderPeriodRow(TIMETABLE_PERIODS[9])}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend / Palette of Subjects */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Bảng quy chuẩn Môn học & Sinh hoạt lớp THCS
            </span>
            <span className="text-[11px] text-text-muted font-medium">
              Tổng số tiết: {timetable.length} / 56 tiết tuần (Thứ 2 - 6: 10 tiết · Thứ 7: 6 tiết)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {subjects.map((s) => {
              const count = timetable.filter((t) => t.subject_id === s.id).length;
              const color = SUBJECT_COLOR_MAP[s.code] || DEFAULT_SUBJECT_COLOR;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'p-2.5 rounded-xl border flex items-center justify-between gap-2',
                    color.bg,
                    color.border
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color.dot)} />
                    <span className={cn('text-xs font-bold truncate', color.text)}>
                      {s.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-text-secondary border border-black/5 flex-shrink-0">
                    {count} tiết
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =============================================
          2. PRINT VIEW ONLY (A4 Landscape Bulletin Board)
          ============================================= */}
      <div className="hidden print:block p-2 max-w-[100%] mx-auto text-black bg-white printable-card">
        {/* Formal School Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
          <div>
            <p className="text-[11pt] font-semibold uppercase tracking-wider">
              SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI
            </p>
            <p className="text-[12pt] font-black uppercase tracking-tight">
              TRƯỜNG THCS NGUYỄN TẤT THÀNH
            </p>
            <p className="text-[9pt] italic mt-0.5 text-gray-700">
              Địa chỉ: Cầu Giấy, Hà Nội · Hotline: (024) 3833 4455
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-[15pt] font-black tracking-tight uppercase text-black">
              THỜI KHÓA BIỂU LỚP {activeClass.name}
            </h2>
            <p className="text-[10pt] font-medium text-gray-800 mt-0.5">
              Năm học 2026 - 2027 · Áp dụng từ Học kỳ I
            </p>
            <p className="text-[9pt] text-gray-700">
              Phòng học: {activeClass.room_name || 'Phòng học chính'} · Sĩ số: {activeClass.max_students} học sinh
            </p>
          </div>
        </div>

        {/* Printable Timetable Grid */}
        <table className="w-full border-collapse border-2 border-black text-center text-[10pt]">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black font-bold">
              <th className="border border-black py-2 px-2 w-28 uppercase text-[9pt]">
                Tiết / Giờ
              </th>
              {TIMETABLE_DAYS.map((d) => (
                <th key={d.day} className="border border-black py-2 px-3 uppercase text-[10pt]">
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMETABLE_PERIODS.map((period) => (
              <tr key={period.period} className="border-b border-black">
                <td className="border border-black py-2.5 px-2 bg-gray-50 font-bold text-[9pt]">
                  <div>{period.label}</div>
                  <div className="text-[8pt] text-gray-600 font-normal">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>
                {TIMETABLE_DAYS.map((day) => {
                  const isAllowedSlot = isAllowedPeriodForClass(classGrade, day.day, period.period);
                  const isSatSHL = day.day === 7 && period.period === homeroomSlot.period;
                  const entry = timetableMap.get(`${day.day}-${period.period}`);
                  const subj = entry ? subjectsMap.get(entry.subject_id) : null;
                  const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;

                  if (!isAllowedSlot) {
                    return (
                      <td key={day.day} className="border border-black py-2 px-2 bg-gray-100 text-gray-400 text-[8pt] italic text-center">
                        —
                      </td>
                    );
                  }

                  if (isSatSHL) {
                    return (
                      <td key={day.day} className="border border-black py-2 px-2 bg-gray-50 align-middle">
                        <div className="font-bold text-[9.5pt] text-black uppercase">
                          Sinh hoạt lớp
                        </div>
                        <div className="text-[8pt] text-gray-700 mt-0.5 font-medium">
                          GVCN: {homeroomTeacher ? homeroomTeacher.name : '—'}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={day.day} className="border border-black py-2 px-2 align-middle">
                      {subj ? (
                        <div>
                          <div className="font-bold text-[10pt] text-black">
                            {subj.name}
                          </div>
                          <div className="text-[8pt] text-gray-700 mt-0.5">
                            {teacher ? teacher.name : '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[9pt]">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Formal Signatures Block */}
        <div className="grid grid-cols-2 gap-8 mt-6 pt-4 text-center">
          <div>
            <p className="font-bold uppercase text-[10pt]">BAN GIÁM HIỆU PHÊ DUYỆT</p>
            <p className="text-[8.5pt] italic text-gray-600">(Ký và đóng dấu)</p>
            <div className="h-20" />
            <p className="font-bold text-[10pt] uppercase">TS. Lê Thị Quỳnh Mai</p>
          </div>

          <div>
            <p className="text-[9pt] italic text-gray-700 mb-0.5">Hà Nội, ngày 01 tháng 09 năm 2026</p>
            <p className="font-bold uppercase text-[10pt]">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="text-[8.5pt] italic text-gray-600">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold text-[10pt] uppercase">
              {homeroomTeacher?.name || 'Nguyễn Văn An'}
            </p>
          </div>
        </div>
      </div>

      {/* =============================================
          3. EDIT CELL MODAL
          ============================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          editingSlot
            ? `Chỉnh sửa: Thứ ${editingSlot.day} · Tiết ${editingSlot.period} (${
                TIMETABLE_PERIODS.find((p) => p.period === editingSlot.period)?.startTime || ''
              } - ${TIMETABLE_PERIODS.find((p) => p.period === editingSlot.period)?.endTime || ''})`
            : 'Xếp tiết học'
        }
      >
        <div className="space-y-4">
          {editError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <WarningCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-line leading-relaxed font-medium">{editError}</div>
            </div>
          )}

          {editingSlot?.day === 7 && editingSlot.period === homeroomSlot.period ? (
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-violet-900 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse" />
                <span className="text-sm font-bold text-violet-950">
                  Tiết Sinh hoạt lớp cố định (Thứ Bảy - Tiết {homeroomSlot.period})
                </span>
              </div>
              <p className="text-xs text-violet-800 leading-relaxed">
                Theo quy chế, Tiết {editingSlot.period} Thứ Bảy của Khối {classGrade} ({classShift === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}) luôn cố định là <strong>Sinh hoạt lớp</strong> cùng <strong>Giáo viên chủ nhiệm</strong> ({homeroomTeacher?.name || 'Chưa gán GVCN'}). Tiết học này không thể đổi sang môn học khác hoặc gán cho giáo viên bộ môn.
              </p>
              <div className="pt-2 text-xs">
                <p className="font-semibold text-violet-950">Giáo viên phụ trách:</p>
                <p className="text-violet-800 mt-0.5 font-medium">
                  {homeroomTeacher ? `${homeroomTeacher.name} (${homeroomTeacher.email})` : 'Lớp chưa được phân công Giáo viên chủ nhiệm'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Môn học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">-- Tiết trống / Chưa xếp --</option>
                  {subjects.filter((s) => s.id !== 'sub-shl').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Giáo viên giảng dạy
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => {
                    setEditTeacherId(e.target.value);
                    setEditError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">-- Tự động theo phân công môn --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted mt-1.5">
                  Hệ thống tự động tra cứu giáo viên phụ trách môn của lớp từ bảng phân công giảng dạy.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
            {editSubjectId && !(editingSlot?.day === 7 && editingSlot?.period === homeroomSlot.period) ? (
              <Button
                variant="ghost"
                type="button"
                onClick={handleDeleteSlot}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash size={16} />
                <span>Xóa tiết này</span>
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditError(null);
                  setIsEditModalOpen(false);
                }}
              >
                {editingSlot?.day === 7 && editingSlot.period === homeroomSlot.period ? 'Đóng' : 'Hủy'}
              </Button>
              {!(editingSlot?.day === 7 && editingSlot.period === homeroomSlot.period) && (
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleSaveSlot}
                >
                  <Check size={16} />
                  <span>Lưu thay đổi</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* =============================================
          4. COPY TIMETABLE MODAL
          ============================================= */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => {
          setCopyError(null);
          setIsCopyModalOpen(false);
        }}
        title="Sao chép Thời khóa biểu từ lớp khác"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Sao chép toàn bộ 28 tiết học từ một lớp khác sang lớp{' '}
            <strong className="text-text-primary">{activeClass.name}</strong>. Giáo viên phụ trách sẽ
            được tự động ánh xạ lại theo đúng danh sách GVBM của lớp{' '}
            <strong className="text-text-primary">{activeClass.name}</strong>. Tiết Sinh hoạt lớp Thứ Bảy sẽ tự động gán cho Giáo viên chủ nhiệm của lớp.
          </p>

          {copyError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 max-h-48 overflow-y-auto">
              <WarningCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="whitespace-pre-line leading-relaxed font-medium">{copyError}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Chọn lớp học nguồn
            </label>
            <select
              value={sourceClassId}
              onChange={(e) => {
                setSourceClassId(e.target.value);
                setCopyError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">-- Chọn một lớp nguồn --</option>
              {allClasses
                .filter((c) => c.id !== activeClassId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Khối {c.grade})
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <Info size={16} className="flex-shrink-0 mt-0.5 text-amber-700" />
            <span>
              Lưu ý: Hành động này sẽ thay thế toàn bộ lịch học hiện tại của lớp {activeClass.name}.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setCopyError(null);
                setIsCopyModalOpen(false);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleCopyFromClass}
              disabled={!sourceClassId}
            >
              <Copy size={16} />
              <span>Xác nhận sao chép</span>
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
