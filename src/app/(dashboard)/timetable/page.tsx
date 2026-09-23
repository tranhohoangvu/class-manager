'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from '@phosphor-icons/react';
import { useCurrentClass } from '@/contexts/class-context';
import { useAuth } from '@/contexts/auth-context';
import { LocalStore } from '@/lib/store';
import { TimetableService, CurrentPeriodInfo } from '@/services';
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
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TimetablePage() {
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const { user } = useAuth();

  const [timetable, setTimetable] = useState<TimetableEntryRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);
  const [periodInfo, setPeriodInfo] = useState<CurrentPeriodInfo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Load class data
  const loadData = () => {
    if (!currentClassId) return;
    const entries = TimetableService.getTimetableForClass(currentClassId);
    const subjs = LocalStore.getSubjects();
    const usrs = LocalStore.getUsers().filter((u) => u.role === 'TEACHER');
    const classes = LocalStore.getClasses().filter((c) => c.status === 'active');

    setTimetable(entries);
    setSubjects(subjs);
    setTeachers(usrs);
    setAllClasses(classes);
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
  }, [currentClassId]);

  // Set default mobile tab to today's day of week (if Monday..Saturday)
  useEffect(() => {
    const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon ...
    const mappedDay = todayDay === 0 ? 2 : todayDay + 1;
    if (mappedDay >= 2 && mappedDay <= 7) {
      setMobileSelectedDay(mappedDay);
    }
  }, []);

  const canEdit = isHomeroom || user?.role === 'ADMIN';

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

  // Open slot edit modal
  const handleOpenEdit = (day: number, period: number) => {
    if (!canEdit) {
      toast.info('Bạn chỉ có quyền xem Thời khóa biểu.');
      return;
    }
    const entry = timetableMap.get(`${day}-${period}`);
    setEditingSlot({ day, period });
    setEditSubjectId(entry?.subject_id || '');
    setEditTeacherId(entry?.teacher_id || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // When subject changes in modal, auto-suggest teacher from assignments
  const handleSubjectChange = (subjectId: string) => {
    setEditSubjectId(subjectId);
    setEditError(null);
    if (currentClassId && subjectId) {
      const assignments = LocalStore.getSubjectAssignmentsForClass(currentClassId);
      const match = assignments.find((a) => a.subject_id === subjectId);
      if (match) {
        setEditTeacherId(match.teacher_id);
      }
    }
  };

  // Save slot edit
  const handleSaveSlot = () => {
    if (!currentClassId || !editingSlot) return;

    if (!editSubjectId) {
      // Clear this slot
      const res = TimetableService.deleteEntry(
        currentClassId,
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
      currentClassId,
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
    if (!currentClassId || !editingSlot) return;
    const res = TimetableService.deleteEntry(
      currentClassId,
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
    if (!currentClassId) return;
    if (window.confirm('Bạn có chắc muốn áp dụng Thời khóa biểu mẫu chuẩn cho lớp học này? Dữ liệu hiện tại sẽ được cập nhật lại theo khung chuẩn.')) {
      const res = TimetableService.applyStandardTemplate(currentClassId, user);
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
    if (!currentClassId || !sourceClassId) {
      toast.error('Vui lòng chọn lớp học nguồn để sao chép.');
      return;
    }
    const res = TimetableService.copyFromClass(sourceClassId, currentClassId, user);
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
    if (!currentClassId) return;
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ Thời khóa biểu của lớp này?')) {
      const res = TimetableService.clearTimetable(currentClassId, user);
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

  if (!isLoaded || !currentClass) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-96 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const homeroomTeacher = currentClass.teacher_id
    ? LocalStore.getUserById(currentClass.teacher_id)
    : null;

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
                Thời khóa biểu — {currentClass.name}
              </h1>
              {!canEdit && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Chế độ chỉ xem
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {currentClass.room_name || 'Chưa xếp phòng'} · Năm học {currentClass.school_year} · GVCN:{' '}
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
          {TIMETABLE_PERIODS.map((period) => {
            const entry = timetableMap.get(`${mobileSelectedDay}-${period.period}`);
            const subj = entry ? subjectsMap.get(entry.subject_id) : null;
            const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;
            const colorStyle = (subj && SUBJECT_COLOR_MAP[subj.code]) || DEFAULT_SUBJECT_COLOR;

            const isCurrentPeriod =
              periodInfo?.dayOfWeek === mobileSelectedDay &&
              periodInfo?.period === period.period;

            return (
              <div
                key={period.period}
                onClick={() => canEdit && handleOpenEdit(mobileSelectedDay, period.period)}
                className={cn(
                  'p-4 rounded-2xl border transition-all',
                  isCurrentPeriod ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30' : 'bg-surface border-border',
                  canEdit && 'cursor-pointer hover:border-accent/40 active:scale-[0.99]'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary px-2.5 py-0.5 rounded-md bg-surface-muted border border-border">
                      {period.label}
                    </span>
                    <span className="text-[11px] text-text-muted font-medium">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>
                  {isCurrentPeriod && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                      Đang học
                    </span>
                  )}
                </div>

                {subj ? (
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

        {/* Desktop View: Full Matrix Grid */}
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
                {TIMETABLE_PERIODS.map((period) => (
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
                      const entry = timetableMap.get(`${day.day}-${period.period}`);
                      const subj = entry ? subjectsMap.get(entry.subject_id) : null;
                      const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;
                      const colorStyle = (subj && SUBJECT_COLOR_MAP[subj.code]) || DEFAULT_SUBJECT_COLOR;

                      const isOngoing =
                        periodInfo?.dayOfWeek === day.day &&
                        periodInfo?.period === period.period;

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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend / Palette of 10 Subjects */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Bảng quy chuẩn 10 Môn học THCS
            </span>
            <span className="text-[11px] text-text-muted font-medium">
              Tổng số tiết: {timetable.length} / 30 tiết tuần
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
              THỜI KHÓA BIỂU LỚP {currentClass.name}
            </h2>
            <p className="text-[10pt] font-medium text-gray-800 mt-0.5">
              Năm học 2026 - 2027 · Áp dụng từ Học kỳ I
            </p>
            <p className="text-[9pt] text-gray-700">
              Phòng học: {currentClass.room_name || 'Phòng học chính'} · Sĩ số: {currentClass.max_students} học sinh
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
                  const entry = timetableMap.get(`${day.day}-${period.period}`);
                  const subj = entry ? subjectsMap.get(entry.subject_id) : null;
                  const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;
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
              {subjects.map((s) => (
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

          <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
            {editSubjectId ? (
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
                Hủy
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleSaveSlot}
              >
                <Check size={16} />
                <span>Lưu thay đổi</span>
              </Button>
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
            Sao chép toàn bộ 30 tiết học từ một lớp khác sang lớp{' '}
            <strong className="text-text-primary">{currentClass.name}</strong>. Giáo viên phụ trách sẽ
            được tự động ánh xạ lại theo đúng danh sách GVBM của lớp{' '}
            <strong className="text-text-primary">{currentClass.name}</strong>.
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
                .filter((c) => c.id !== currentClassId)
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
              Lưu ý: Hành động này sẽ thay thế toàn bộ lịch học hiện tại của lớp {currentClass.name}.
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
