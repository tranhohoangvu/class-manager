'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  CalendarDots,
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  Plus,
  PencilSimple,
  Trash,
  Lightning,
  Copy,
  ArrowsClockwise,
  ArrowRight,
  MagnifyingGlass,
  Funnel,
  Chalkboard,
  ChalkboardTeacher,
  BookOpen,
  Buildings,
  Check,
  X,
  Info,
  Clock,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import {
  TimetableService,
  TimetableConflict,
  TimetableRuleViolation,
  TimetableAuditReport,
  EnrichedTimetableEntry,
} from '@/services';
import {
  ClassRow,
  UserRow,
  SubjectRow,
  TimetableEntryRow,
} from '@/types';
import {
  TIMETABLE_PERIODS,
  TIMETABLE_DAYS,
  SUBJECT_COLOR_MAP,
  DEFAULT_SUBJECT_COLOR,
  getGradeShift,
  isAllowedPeriodForClass,
  getClassHomeroomSlot,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

export default function AdminTimetablePage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [allTimetables, setAllTimetables] = useState<TimetableEntryRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('c-6a1');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Audit state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<TimetableAuditReport | null>(null);
  const [auditScope, setAuditScope] = useState<'school' | 'class'>('school');

  // Edit / Add Modal state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formClassId, setFormClassId] = useState<string>('c-6a1');
  const [formDay, setFormDay] = useState<number>(2);
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formSubjectId, setFormSubjectId] = useState<string>('sub-mat');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formRoom, setFormRoom] = useState<string>('');
  const [formValidation, setFormValidation] = useState<{ valid: boolean; error?: string } | null>(null);

  // Reorganize / Swap Modal
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapSourceSlot, setSwapSourceSlot] = useState<{ day: number; period: number } | null>(null);
  const [swapTargetDay, setSwapTargetDay] = useState<number>(2);
  const [swapTargetPeriod, setSwapTargetPeriod] = useState<number>(2);

  // Template & Copy modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState<string>('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Load all initial data
  const loadData = () => {
    const activeClasses = LocalStore.getClasses().filter((c) => c.status === 'active');
    const teacherList = LocalStore.getTeachers().filter((t) => t.status === 'active');
    const subjs = LocalStore.getSubjects();
    const tt = LocalStore.getAllTimetables();

    setClasses(activeClasses);
    setTeachers(teacherList);
    setSubjects(subjs);
    setAllTimetables(tt);

    // Initial audit report
    const report = TimetableService.auditTimetable();
    setAuditReport(report);

    if (activeClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(activeClasses[0].id);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Distinct rooms across all classes and entries
  const distinctRooms = useMemo(() => {
    const rooms = new Set<string>();
    classes.forEach((c) => {
      if (c.room_name?.trim()) rooms.add(c.room_name.trim());
    });
    allTimetables.forEach((t) => {
      if (t.room?.trim()) rooms.add(t.room.trim());
    });
    return Array.from(rooms).sort();
  }, [classes, allTimetables]);

  // Enriched entries for current view
  const enrichedEntries = useMemo(() => {
    return TimetableService.filterTimetableEntries({
      classId: selectedClassId === 'all' ? undefined : selectedClassId,
      teacherId: teacherFilter === 'all' ? undefined : teacherFilter,
      subjectId: subjectFilter === 'all' ? undefined : subjectFilter,
      room: roomFilter.trim() ? roomFilter.trim() : undefined,
      dayOfWeek: dayFilter === 'all' ? undefined : parseInt(dayFilter, 10),
    });
  }, [selectedClassId, teacherFilter, subjectFilter, roomFilter, dayFilter, allTimetables]);

  // Quick lookup map by (classId_day_period)
  const entryLookupMap = useMemo(() => {
    const map = new Map<string, EnrichedTimetableEntry>();
    enrichedEntries.forEach((e) => {
      map.set(`${e.class_id}_${e.day_of_week}_${e.period}`, e);
    });
    return map;
  }, [enrichedEntries]);

  // Slot-based mapping of issues from auditReport
  const issueMapBySlot = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!auditReport) return map;

    const addIssue = (key: string, msg: string) => {
      const existing = map.get(key) || [];
      if (!existing.includes(msg)) {
        existing.push(msg);
      }
      map.set(key, existing);
    };

    // Class conflicts
    auditReport.classConflicts.forEach((c) => {
      addIssue(`${c.classId}_${c.dayOfWeek}_${c.period}`, `Xung đột trùng tiết môn học tại cùng một lớp.`);
    });

    // Teacher conflicts
    auditReport.teacherConflicts.forEach((t) => {
      addIssue(`${t.classId}_${t.dayOfWeek}_${t.period}`, t.message);
      if (t.otherClassId) {
        addIssue(`${t.otherClassId}_${t.dayOfWeek}_${t.period}`, t.message);
      }
    });

    // Room conflicts
    auditReport.roomConflicts.forEach((r) => {
      addIssue(`${r.classId}_${r.dayOfWeek}_${r.period}`, r.message);
      if (r.otherClassId) {
        addIssue(`${r.otherClassId}_${r.dayOfWeek}_${r.period}`, r.message);
      }
    });

    // Rule violations (consecutive periods, etc.)
    auditReport.ruleViolations.forEach((v) => {
      v.periods.forEach((p) => {
        addIssue(`${v.classId}_${v.dayOfWeek}_${p}`, v.violation);
      });
    });

    return map;
  }, [auditReport]);

  const currentClassViolations = useMemo(() => {
    if (!auditReport || selectedClassId === 'all') return [];
    return auditReport.ruleViolations.filter((v) => v.classId === selectedClassId);
  }, [auditReport, selectedClassId]);

  const currentClassConflicts = useMemo(() => {
    if (!auditReport || selectedClassId === 'all') return { tc: [], rc: [], cc: [] };
    const tc = auditReport.teacherConflicts.filter((t) => t.classId === selectedClassId || t.otherClassId === selectedClassId);
    const rc = auditReport.roomConflicts.filter((r) => r.classId === selectedClassId || r.otherClassId === selectedClassId);
    const cc = auditReport.classConflicts.filter((c) => c.classId === selectedClassId);
    return { tc, rc, cc };
  }, [auditReport, selectedClassId]);

  // Real-time audit of form fields
  useEffect(() => {
    if (!isEntryModalOpen) {
      setFormValidation(null);
      return;
    }

    const val = TimetableService.validateTimetableEntry(
      {
        id: editingEntryId || undefined,
        class_id: formClassId,
        day_of_week: formDay,
        period: formPeriod,
        subject_id: formSubjectId,
        teacher_id: formTeacherId || null,
        room: formRoom || null,
      },
      editingEntryId || undefined
    );

    setFormValidation(val);
  }, [formClassId, formDay, formPeriod, formSubjectId, formTeacherId, formRoom, editingEntryId, isEntryModalOpen]);

  // Handlers
  const handleOpenAddModal = (day = 2, period = 1) => {
    setModalMode('add');
    setEditingEntryId(null);
    setFormClassId(selectedClassId === 'all' ? (classes[0]?.id || 'c-6a1') : selectedClassId);
    setFormDay(day);
    setFormPeriod(period);
    setFormSubjectId(subjects[0]?.id || 'sub-mat');

    // Auto-match teacher if assignments exist
    const assignments = LocalStore.getSubjectAssignmentsForClass(selectedClassId === 'all' ? classes[0]?.id : selectedClassId);
    const match = assignments.find((a) => a.subject_id === (subjects[0]?.id || 'sub-mat'));
    setFormTeacherId(match ? match.teacher_id : '');

    const targetCls = classes.find((c) => c.id === (selectedClassId === 'all' ? classes[0]?.id : selectedClassId));
    setFormRoom(targetCls?.room_name || '');

    setIsEntryModalOpen(true);
  };

  const handleOpenEditModal = (entry: EnrichedTimetableEntry) => {
    setModalMode('edit');
    setEditingEntryId(entry.id);
    setFormClassId(entry.class_id);
    setFormDay(entry.day_of_week);
    setFormPeriod(entry.period);
    setFormSubjectId(entry.subject_id);
    setFormTeacherId(entry.teacher_id || '');
    setFormRoom(entry.room || entry.effectiveRoom || '');
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = () => {
    if (formValidation && !formValidation.valid) {
      toast.error(formValidation.error || 'Xung đột hoặc vi phạm quy tắc thời khóa biểu.');
      return;
    }

    if (modalMode === 'add') {
      const res = TimetableService.saveEntry(
        formClassId,
        formDay,
        formPeriod,
        formSubjectId,
        formTeacherId || null,
        user,
        formRoom.trim() || null
      );

      if (res.success) {
        toast.success(`Đã thêm tiết học thành công.`);
        setIsEntryModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'Không thể lưu tiết học.');
      }
    } else if (editingEntryId) {
      const res = TimetableService.updateEntry(
        editingEntryId,
        {
          class_id: formClassId,
          day_of_week: formDay,
          period: formPeriod,
          subject_id: formSubjectId,
          teacher_id: formTeacherId || null,
          room: formRoom.trim() || null,
        },
        user
      );

      if (res.success) {
        toast.success(`Đã cập nhật tiết học thành công.`);
        setIsEntryModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'Không thể cập nhật tiết học.');
      }
    }
  };

  const handleDeleteEntry = (entry: EnrichedTimetableEntry) => {
    const res = TimetableService.deleteEntry(entry.class_id, entry.day_of_week, entry.period, user);
    if (res.success) {
      toast.success(`Đã xóa tiết học (${entry.subjectName}, Tiết ${entry.period}).`);
      loadData();
    } else {
      toast.error(res.error || 'Không thể xóa tiết học.');
    }
  };

  const handleOpenSwapModal = (day: number, period: number) => {
    setSwapSourceSlot({ day, period });
    setSwapTargetDay(day);
    setSwapTargetPeriod(period < 10 ? period + 1 : 1);
    setIsSwapModalOpen(true);
  };

  const handleExecuteSwap = () => {
    if (!swapSourceSlot || selectedClassId === 'all') return;
    const res = TimetableService.reorganizeSlot(
      selectedClassId,
      swapSourceSlot,
      { day: swapTargetDay, period: swapTargetPeriod },
      user
    );

    if (res.success) {
      toast.success('Đã hoán đổi/di chuyển vị trí tiết học thành công.');
      setIsSwapModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Không thể sắp xếp lại tiết học.');
    }
  };

  const handleApplyTemplate = () => {
    if (selectedClassId === 'all') {
      toast.error('Vui lòng chọn một lớp cụ thể để áp dụng mẫu chuẩn.');
      return;
    }
    const res = TimetableService.applyStandardTemplate(selectedClassId, user);
    if (res.success) {
      toast.success(`Đã áp dụng mẫu chuẩn 28 tiết cho lớp ${currentClass?.name}.`);
      setIsTemplateModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Không thể áp dụng mẫu thời khóa biểu.');
    }
  };

  const handleCopyTimetable = () => {
    if (!copySourceClassId || selectedClassId === 'all') {
      toast.error('Vui lòng chọn lớp nguồn và lớp đích hợp lệ.');
      return;
    }
    const res = TimetableService.copyFromClass(copySourceClassId, selectedClassId, user);
    if (res.success) {
      toast.success(`Đã sao chép thời khóa biểu sang lớp ${currentClass?.name}.`);
      setIsCopyModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Không thể sao chép thời khóa biểu.');
    }
  };

  const handleClearTimetable = () => {
    if (selectedClassId === 'all') return;
    const res = TimetableService.clearTimetable(selectedClassId, user);
    if (res.success) {
      toast.success(`Đã xóa toàn bộ thời khóa biểu lớp ${currentClass?.name}.`);
      setIsClearModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Không thể xóa thời khóa biểu.');
    }
  };

  const handleRunAudit = (scope: 'school' | 'class') => {
    setAuditScope(scope);
    const report = TimetableService.auditTimetable(scope === 'class' ? selectedClassId : undefined);
    setAuditReport(report);
    setIsAuditModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Đang tải dữ liệu Quản lý Thời khóa biểu...</p>
        </div>
      </div>
    );
  }

  const shift = currentClass ? getGradeShift(currentClass.grade) : 'morning';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-sm">
              <CalendarDots size={22} weight="duotone" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">
                Quản lý Thời khóa biểu & Xếp lịch
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Kiểm soát, điều phối, tổ chức và kiểm toán lịch học toàn trường theo quy chuẩn THCS.
              </p>
            </div>
          </div>
        </div>

        {/* Audit Status Badge & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleRunAudit('school')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer shadow-2xs',
              auditReport?.isValid
                ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50/90 text-rose-800 border-rose-200 hover:bg-rose-100 animate-pulse'
            )}
          >
            {auditReport?.isValid ? (
              <>
                <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                <span>Kiểm toán TKB: Hợp lệ (0 lỗi)</span>
              </>
            ) : (
              <>
                <WarningCircle size={16} weight="fill" className="text-rose-600" />
                <span>Kiểm toán TKB: {auditReport?.summary.totalIssuesCount} lỗi vi phạm</span>
              </>
            )}
          </button>

          <Button
            size="sm"
            onClick={() => handleOpenAddModal(2, shift === 'morning' ? 1 : 6)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            <span>Thêm tiết học</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplateModalOpen(true)}
            className="gap-1.5 text-xs text-text-primary hover:bg-surface-muted cursor-pointer"
          >
            <Lightning size={15} weight="duotone" className="text-amber-500" />
            <span>Mẫu chuẩn</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCopyModalOpen(true)}
            className="gap-1.5 text-xs text-text-primary hover:bg-surface-muted cursor-pointer"
          >
            <Copy size={15} weight="duotone" className="text-blue-500" />
            <span>Sao chép TKB</span>
          </Button>

          {selectedClassId !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer"
            >
              <Trash size={15} />
              <span>Xóa TKB</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface p-4 rounded-2xl border border-border space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-border/70 text-xs font-semibold text-text-secondary">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-indigo-600" />
            <span>Bộ lọc lịch học toàn trường</span>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-surface text-text-primary shadow-2xs font-semibold' : 'text-text-muted hover:text-text-primary'
              )}
            >
              Ma trận TKB
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                viewMode === 'list' ? 'bg-surface text-text-primary shadow-2xs font-semibold' : 'text-text-muted hover:text-text-primary'
              )}
            >
              Danh sách ({enrichedEntries.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
              <Chalkboard size={13} />
              <span>Lớp học</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-border bg-surface text-text-primary font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">-- Tất cả 16 lớp --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Khối {cls.grade} · {getGradeShift(cls.grade) === 'morning' ? 'Ca Sáng' : 'Ca Chiều'})
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
              <ChalkboardTeacher size={13} />
              <span>Giáo viên</span>
            </label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-border bg-surface text-text-primary font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">-- Tất cả giáo viên --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>Môn học</span>
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-border bg-surface text-text-primary font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">-- Tất cả môn học --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Tối đa {s.max_consecutive_periods ?? 1} tiết liên tiếp)
                </option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
              <Buildings size={13} />
              <span>Phòng học</span>
            </label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-border bg-surface text-text-primary font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Tất cả phòng học --</option>
              {distinctRooms.map((rm) => (
                <option key={rm} value={rm}>
                  {rm}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted mb-1 flex items-center gap-1.5">
              <Clock size={13} />
              <span>Ngày trong tuần</span>
            </label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-border bg-surface text-text-primary font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">-- Cả tuần (Thứ 2 - 7) --</option>
              {TIMETABLE_DAYS.map((d) => (
                <option key={d.day} value={String(d.day)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* In-view Class Scheduling Violations Alert Banner */}
      {selectedClassId !== 'all' && (currentClassViolations.length > 0 || currentClassConflicts.tc.length > 0 || currentClassConflicts.rc.length > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-300 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <WarningCircle size={18} weight="fill" className="text-rose-600 animate-bounce" />
              <span>Cảnh báo vi phạm quy chuẩn xếp lịch học ({currentClass?.name})</span>
            </div>
            <button
              type="button"
              onClick={() => handleRunAudit('class')}
              className="text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1 rounded-lg border border-rose-300 transition-colors cursor-pointer"
            >
              Xem chi tiết kiểm toán
            </button>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-rose-200 text-xs text-rose-800">
            {currentClassViolations.map((v, idx) => (
              <div key={`rule-${idx}`} className="flex items-start gap-1.5">
                <span className="font-bold text-rose-900">• {v.subjectName} ({v.dayName}, {v.periodLabels}):</span>
                <span>{v.violation}</span>
              </div>
            ))}
            {currentClassConflicts.tc.map((t, idx) => (
              <div key={`tc-${idx}`} className="flex items-start gap-1.5">
                <span className="font-bold text-rose-900">• Xung đột giáo viên ({t.dayName}, Tiết {t.period}):</span>
                <span>{t.message}</span>
              </div>
            ))}
            {currentClassConflicts.rc.map((r, idx) => (
              <div key={`rc-${idx}`} className="flex items-start gap-1.5">
                <span className="font-bold text-rose-900">• Xung đột phòng học ({r.dayName}, Tiết {r.period}):</span>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden">
          {/* Shift Banner */}
          <div className="px-5 py-3 bg-surface-muted/60 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-xs font-bold text-text-primary">
                {selectedClassId === 'all'
                  ? 'Tổng thể thời khóa biểu theo bộ lọc'
                  : `Thời khóa biểu ${currentClass?.name} · Khối ${currentClass?.grade} (${shift === 'morning' ? 'Ca Sáng: Tiết 1 - 5' : 'Ca Chiều: Tiết 6 - 10'})`}
              </span>
            </div>
            <span className="text-[11px] text-text-muted font-medium">
              Phòng học mặc định: <strong className="text-text-primary">{currentClass?.room_name || 'Chưa gán'}</strong>
            </span>
          </div>

          {/* Table Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px] text-left">
              <thead>
                <tr className="bg-surface-muted/40 border-b border-border">
                  <th className="w-28 px-4 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Tiết / Giờ
                  </th>
                  {TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).map((d) => (
                    <th key={d.day} className="px-3 py-3 text-xs font-bold text-text-primary border-l border-border">
                      <div className="flex items-center justify-between">
                        <span>{d.name}</span>
                        {d.day === 7 && (
                          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            3 tiết
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Morning Header */}
                <tr className="bg-indigo-50/40">
                  <td
                    colSpan={1 + TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).length}
                    className="px-4 py-1.5 text-[11px] font-bold text-indigo-900 tracking-wide uppercase"
                  >
                    Ca Sáng (07:15 — 11:15) · Khối 6 & Khối 9
                  </td>
                </tr>

                {/* Periods 1 to 5 */}
                {TIMETABLE_PERIODS.slice(0, 5).map((periodConfig) => (
                  <tr key={periodConfig.period} className="hover:bg-surface-muted/20 transition-colors">
                    <td className="px-4 py-3 border-r border-border bg-surface-muted/10 align-top">
                      <div className="font-bold text-xs text-text-primary">{periodConfig.label}</div>
                      <div className="text-[10px] text-text-muted font-medium mt-0.5">
                        {periodConfig.startTime} - {periodConfig.endTime}
                      </div>
                    </td>

                    {TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).map((d) => {
                      const isSaturday = d.day === 7;
                      const isProhibited = isSaturday && periodConfig.period > 3;

                      if (isProhibited) {
                        return (
                          <td key={d.day} className="p-2 border-l border-border bg-surface-muted/40 text-center align-middle">
                            <span className="text-[11px] font-medium text-text-muted italic">
                              Nghỉ
                            </span>
                          </td>
                        );
                      }

                      // Find entry matching class, day, period
                      const targetClassKey = selectedClassId === 'all' ? undefined : selectedClassId;
                      const entry = targetClassKey
                        ? entryLookupMap.get(`${targetClassKey}_${d.day}_${periodConfig.period}`)
                        : enrichedEntries.find((e) => e.day_of_week === d.day && e.period === periodConfig.period);

                      const slotIssues = entry ? issueMapBySlot.get(`${entry.class_id}_${entry.day_of_week}_${entry.period}`) : undefined;
                      const hasIssue = Boolean(slotIssues && slotIssues.length > 0);

                      return (
                        <td key={d.day} className="p-2 border-l border-border align-top h-24 min-w-[130px] group relative">
                          {entry ? (
                            <div
                              className={cn(
                                'h-full flex flex-col justify-between p-2 rounded-xl transition-all',
                                hasIssue
                                  ? 'bg-rose-50/90 border-2 border-rose-400 shadow-sm ring-1 ring-rose-300'
                                  : 'bg-surface border border-border shadow-2xs hover:border-indigo-300'
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={cn(
                                      'text-[11px] font-bold px-2 py-0.5 rounded-md truncate',
                                      SUBJECT_COLOR_MAP[entry.subject_id] || DEFAULT_SUBJECT_COLOR
                                    )}
                                  >
                                    {entry.subjectName}
                                  </span>

                                  {selectedClassId === 'all' && (
                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                      {entry.className}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-medium text-text-secondary mt-1.5 truncate flex items-center gap-1">
                                  <ChalkboardTeacher size={12} className="text-text-muted flex-shrink-0" />
                                  <span className="truncate">{entry.teacherName}</span>
                                </div>

                                <div className="text-[10px] text-text-muted mt-1 truncate flex items-center gap-1">
                                  <Buildings size={11} className="text-text-muted flex-shrink-0" />
                                  <span className="truncate">{entry.effectiveRoom}</span>
                                </div>

                                {hasIssue && (
                                  <div
                                    title={slotIssues?.join('\n')}
                                    className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-1.5 py-0.5 rounded-md cursor-help animate-pulse"
                                  >
                                    <WarningCircle size={12} weight="fill" className="text-rose-600 flex-shrink-0" />
                                    <span className="truncate">Cảnh báo vi phạm</span>
                                  </div>
                                )}
                              </div>

                              {/* Quick Hover Controls */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 mt-1 pt-1 border-t border-border/50">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSwapModal(d.day, periodConfig.period)}
                                  title="Hoán đổi/Di chuyển"
                                  className="p-1 rounded text-text-muted hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                >
                                  <ArrowsLeftRight size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(entry)}
                                  title="Sửa tiết"
                                  className="p-1 rounded text-text-muted hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                >
                                  <PencilSimple size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEntry(entry)}
                                  title="Xóa tiết"
                                  className="p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleOpenAddModal(d.day, periodConfig.period)}
                              className="h-full border border-dashed border-border/60 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl flex items-center justify-center cursor-pointer transition-colors group/empty"
                            >
                              <Plus size={16} className="text-text-muted/40 group-hover/empty:text-indigo-600 transition-colors" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Afternoon Header */}
                <tr className="bg-amber-50/40">
                  <td
                    colSpan={1 + TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).length}
                    className="px-4 py-1.5 text-[11px] font-bold text-amber-900 tracking-wide uppercase"
                  >
                    Ca Chiều (13:00 — 17:00) · Khối 7 & Khối 8
                  </td>
                </tr>

                {/* Periods 6 to 10 */}
                {TIMETABLE_PERIODS.slice(5, 10).map((periodConfig) => (
                  <tr key={periodConfig.period} className="hover:bg-surface-muted/20 transition-colors">
                    <td className="px-4 py-3 border-r border-border bg-surface-muted/10 align-top">
                      <div className="font-bold text-xs text-text-primary">{periodConfig.label}</div>
                      <div className="text-[10px] text-text-muted font-medium mt-0.5">
                        {periodConfig.startTime} - {periodConfig.endTime}
                      </div>
                    </td>

                    {TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).map((d) => {
                      const isSaturday = d.day === 7;
                      const isProhibited = isSaturday && periodConfig.period > 8;

                      if (isProhibited) {
                        return (
                          <td key={d.day} className="p-2 border-l border-border bg-surface-muted/40 text-center align-middle">
                            <span className="text-[11px] font-medium text-text-muted italic">
                              Nghỉ
                            </span>
                          </td>
                        );
                      }

                      const targetClassKey = selectedClassId === 'all' ? undefined : selectedClassId;
                      const entry = targetClassKey
                        ? entryLookupMap.get(`${targetClassKey}_${d.day}_${periodConfig.period}`)
                        : enrichedEntries.find((e) => e.day_of_week === d.day && e.period === periodConfig.period);

                      const slotIssues = entry ? issueMapBySlot.get(`${entry.class_id}_${entry.day_of_week}_${entry.period}`) : undefined;
                      const hasIssue = Boolean(slotIssues && slotIssues.length > 0);

                      return (
                        <td key={d.day} className="p-2 border-l border-border align-top h-24 min-w-[130px] group relative">
                          {entry ? (
                            <div
                              className={cn(
                                'h-full flex flex-col justify-between p-2 rounded-xl transition-all',
                                hasIssue
                                  ? 'bg-rose-50/90 border-2 border-rose-400 shadow-sm ring-1 ring-rose-300'
                                  : 'bg-surface border border-border shadow-2xs hover:border-indigo-300'
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={cn(
                                      'text-[11px] font-bold px-2 py-0.5 rounded-md truncate',
                                      SUBJECT_COLOR_MAP[entry.subject_id] || DEFAULT_SUBJECT_COLOR
                                    )}
                                  >
                                    {entry.subjectName}
                                  </span>

                                  {selectedClassId === 'all' && (
                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                      {entry.className}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-medium text-text-secondary mt-1.5 truncate flex items-center gap-1">
                                  <ChalkboardTeacher size={12} className="text-text-muted flex-shrink-0" />
                                  <span className="truncate">{entry.teacherName}</span>
                                </div>

                                <div className="text-[10px] text-text-muted mt-1 truncate flex items-center gap-1">
                                  <Buildings size={11} className="text-text-muted flex-shrink-0" />
                                  <span className="truncate">{entry.effectiveRoom}</span>
                                </div>

                                {hasIssue && (
                                  <div
                                    title={slotIssues?.join('\n')}
                                    className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300 px-1.5 py-0.5 rounded-md cursor-help animate-pulse"
                                  >
                                    <WarningCircle size={12} weight="fill" className="text-rose-600 flex-shrink-0" />
                                    <span className="truncate">Cảnh báo vi phạm</span>
                                  </div>
                                )}
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 mt-1 pt-1 border-t border-border/50">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSwapModal(d.day, periodConfig.period)}
                                  title="Hoán đổi/Di chuyển"
                                  className="p-1 rounded text-text-muted hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                >
                                  <ArrowsLeftRight size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(entry)}
                                  title="Sửa tiết"
                                  className="p-1 rounded text-text-muted hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                >
                                  <PencilSimple size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEntry(entry)}
                                  title="Xóa tiết"
                                  className="p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash size={13} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleOpenAddModal(d.day, periodConfig.period)}
                              className="h-full border border-dashed border-border/60 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl flex items-center justify-center cursor-pointer transition-colors group/empty"
                            >
                              <Plus size={16} className="text-text-muted/40 group-hover/empty:text-indigo-600 transition-colors" />
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
      ) : (
        /* List / Table View */
        <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">
              Danh sách chi tiết {enrichedEntries.length} tiết học được lọc
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-muted">Lớp</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Thứ</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Tiết</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Môn học</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Giáo viên</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Phòng học</th>
                  <th className="px-4 py-3 font-semibold text-text-muted text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {enrichedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                      Không tìm thấy tiết học nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  enrichedEntries.map((e) => {
                    const slotIssues = issueMapBySlot.get(`${e.class_id}_${e.day_of_week}_${e.period}`);
                    const hasIssue = Boolean(slotIssues && slotIssues.length > 0);

                    return (
                      <tr key={e.id} className={cn('hover:bg-surface-muted/20 transition-colors', hasIssue && 'bg-rose-50/70 border-l-4 border-l-rose-500')}>
                        <td className="px-4 py-3 font-bold text-text-primary">
                          <div className="flex items-center gap-1.5">
                            {hasIssue && <WarningCircle size={14} weight="fill" className="text-rose-600 flex-shrink-0" />}
                            <span>{e.className}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-text-secondary">
                          {TIMETABLE_DAYS.find((d) => d.day === e.day_of_week)?.name || `Thứ ${e.day_of_week}`}
                        </td>
                        <td className="px-4 py-3 font-semibold text-indigo-700">Tiết {e.period}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded font-bold text-[11px]', SUBJECT_COLOR_MAP[e.subject_id] || DEFAULT_SUBJECT_COLOR)}>
                            {e.subjectName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{e.teacherName}</td>
                        <td className="px-4 py-3 text-text-muted font-medium">{e.effectiveRoom}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasIssue && (
                              <span
                                title={slotIssues?.join('\n')}
                                className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded cursor-help"
                              >
                                Vi phạm
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(e)}
                              className="p-1 rounded text-text-muted hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            >
                              <PencilSimple size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(e)}
                              className="p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEDICATED AUDIT MODAL */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Kiểm toán Hệ thống Thời khóa biểu (Timetable Audit)"
        size="3xl"
      >
        <div className="space-y-6">
          {/* Header diagnostic summary */}
          <div className="p-4 rounded-xl bg-surface-muted/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-text-muted">Phạm vi kiểm toán:</div>
              <div className="text-sm font-bold text-text-primary">
                {auditScope === 'school' ? 'Toàn bộ 16 lớp THCS (Toàn trường)' : `Lớp ${currentClass?.name}`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={auditScope === 'school' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleRunAudit('school')}
                className={cn('text-xs cursor-pointer', auditScope === 'school' && 'bg-indigo-600 text-white')}
              >
                Quét toàn trường
              </Button>
              <Button
                variant={auditScope === 'class' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleRunAudit('class')}
                className={cn('text-xs cursor-pointer', auditScope === 'class' && 'bg-indigo-600 text-white')}
              >
                Quét lớp hiện tại
              </Button>
            </div>
          </div>

          {/* 4 Diagnostic Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={cn(
              'p-3.5 rounded-xl border flex flex-col justify-between',
              (auditReport?.classConflicts.length || 0) === 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            )}>
              <span className="text-[11px] font-semibold text-text-muted">Trùng lịch lớp</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold">{auditReport?.classConflicts.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.classConflicts.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>

            <div className={cn(
              'p-3.5 rounded-xl border flex flex-col justify-between',
              (auditReport?.teacherConflicts.length || 0) === 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            )}>
              <span className="text-[11px] font-semibold text-text-muted">Trùng giáo viên</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold">{auditReport?.teacherConflicts.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.teacherConflicts.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>

            <div className={cn(
              'p-3.5 rounded-xl border flex flex-col justify-between',
              (auditReport?.roomConflicts.length || 0) === 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            )}>
              <span className="text-[11px] font-semibold text-text-muted">Trùng phòng học</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold">{auditReport?.roomConflicts.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.roomConflicts.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>

            <div className={cn(
              'p-3.5 rounded-xl border flex flex-col justify-between',
              (auditReport?.ruleViolations.length || 0) === 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            )}>
              <span className="text-[11px] font-semibold text-text-muted">Tiết liên tiếp</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold">{auditReport?.ruleViolations.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.ruleViolations.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Details */}
          {auditReport?.isValid ? (
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2">
              <CheckCircle size={36} weight="fill" className="text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-emerald-900">
                Thời khóa biểu đạt chuẩn 100% không có xung đột!
              </div>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Không phát hiện trùng tiết lớp học, không trùng lịch giáo viên, không trùng phòng học và tất cả các môn đều tuân thủ định mức tiết học liên tiếp.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              <div className="text-xs font-bold text-text-primary uppercase tracking-wide">
                Chi tiết danh sách các vi phạm cần khắc phục:
              </div>

              {/* Class conflicts */}
              {auditReport?.classConflicts.map((c, idx) => (
                <div key={`cc-${idx}`} className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase">
                      Trùng tiết cùng lớp
                    </span>
                    <span className="text-xs font-bold text-rose-900">{c.className}</span>
                    <span className="text-xs text-rose-800">· {c.dayName}, {c.periodLabel}</span>
                  </div>
                  <div className="text-xs text-rose-800 font-medium">{c.message}</div>
                </div>
              ))}

              {/* Teacher conflicts */}
              {auditReport?.teacherConflicts.map((t, idx) => (
                <div key={`tc-${idx}`} className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600 text-white uppercase">
                      Trùng lịch giáo viên
                    </span>
                    <span className="text-xs font-bold text-amber-900">{t.teacherName}</span>
                    <span className="text-xs text-amber-800">· {t.dayName}, {t.periodLabel}</span>
                  </div>
                  <div className="text-xs text-amber-800 font-medium">{t.message}</div>
                </div>
              ))}

              {/* Room conflicts */}
              {auditReport?.roomConflicts.map((r, idx) => (
                <div key={`rc-${idx}`} className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-600 text-white uppercase">
                      Trùng phòng học
                    </span>
                    <span className="text-xs font-bold text-orange-900">{r.room}</span>
                    <span className="text-xs text-orange-800">· {r.dayName}, {r.periodLabel}</span>
                  </div>
                  <div className="text-xs text-orange-800 font-medium">{r.message}</div>
                </div>
              ))}

              {/* Rule violations (Consecutive periods) */}
              {auditReport?.ruleViolations.map((rv, idx) => (
                <div key={`rv-${idx}`} className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600 text-white uppercase">
                      Quy tắc tiết liên tiếp
                    </span>
                    <span className="text-xs font-bold text-purple-900">{rv.className}</span>
                    <span className="text-xs text-purple-800">· {rv.subjectName} ({rv.dayName}, {rv.periodLabels})</span>
                  </div>
                  <div className="text-xs text-purple-800 font-medium">{rv.violation}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsAuditModalOpen(false)}>
              Đóng bảng kiểm toán
            </Button>
          </div>
        </div>
      </Modal>

      {/* ADD / EDIT ENTRY MODAL */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title={modalMode === 'add' ? 'Thêm tiết học mới vào Thời khóa biểu' : 'Chỉnh sửa tiết học'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Class selection */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Lớp học
            </label>
            <select
              value={formClassId}
              onChange={(e) => {
                setFormClassId(e.target.value);
                const targetCls = classes.find((c) => c.id === e.target.value);
                if (targetCls) setFormRoom(targetCls.room_name || '');
              }}
              className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Khối {cls.grade} · {getGradeShift(cls.grade) === 'morning' ? 'Ca Sáng' : 'Ca Chiều'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Day */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Thứ trong tuần
              </label>
              <select
                value={formDay}
                onChange={(e) => setFormDay(parseInt(e.target.value, 10))}
                className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
              >
                {TIMETABLE_DAYS.map((d) => (
                  <option key={d.day} value={d.day}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Tiết học (1 - 10)
              </label>
              <select
                value={formPeriod}
                onChange={(e) => setFormPeriod(parseInt(e.target.value, 10))}
                className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
              >
                {TIMETABLE_PERIODS.map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.label} ({p.startTime} - {p.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1 flex items-center justify-between">
              <span>Môn học</span>
              <span className="text-[11px] text-text-muted font-normal">
                Toán & Ngữ văn: max 2 tiết; các môn khác: max 1 tiết
              </span>
            </label>
            <select
              value={formSubjectId}
              onChange={(e) => {
                setFormSubjectId(e.target.value);
                // Auto match assigned teacher for this class & subject
                const assignments = LocalStore.getSubjectAssignmentsForClass(formClassId);
                const match = assignments.find((a) => a.subject_id === e.target.value);
                if (match) setFormTeacherId(match.teacher_id);
              }}
              className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) · Tối đa {s.max_consecutive_periods ?? 1} tiết liên tiếp
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Giáo viên giảng dạy
            </label>
            <select
              value={formTeacherId}
              onChange={(e) => setFormTeacherId(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
            >
              <option value="">-- Chưa chỉ định (Hệ thống tự động gán) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Phòng học
            </label>
            <Input
              type="text"
              value={formRoom}
              onChange={(e) => setFormRoom(e.target.value)}
              placeholder="VD: Phòng 101 — Nhà A, Phòng Tin học 1..."
              className="text-xs h-9"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Để trống sẽ tự động kế thừa phòng học mặc định của lớp.
            </p>
          </div>

          {/* Real-time Validation Error Banner */}
          {formValidation && !formValidation.valid && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <WarningCircle size={16} weight="fill" className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Cảnh báo vi phạm quy tắc:</strong>
                <span>{formValidation.error}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEntry}
              disabled={formValidation !== null && !formValidation.valid}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {modalMode === 'add' ? 'Thêm tiết học' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* REORGANIZE / SWAP MODAL */}
      <Modal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        title="Hoán đổi hoặc di chuyển tiết học"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Chọn vị trí thứ và tiết mới để hoán đổi với tiết nguồn hoặc di chuyển nếu slot đích còn trống.
          </p>

          <div className="p-3 bg-surface-muted/60 rounded-xl border border-border text-xs">
            <span className="font-bold text-text-primary">Tiết nguồn:</span> Thứ {swapSourceSlot?.day}, Tiết {swapSourceSlot?.period}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">Thứ đích</label>
              <select
                value={swapTargetDay}
                onChange={(e) => setSwapTargetDay(parseInt(e.target.value, 10))}
                className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
              >
                {TIMETABLE_DAYS.map((d) => (
                  <option key={d.day} value={d.day}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">Tiết đích</label>
              <select
                value={swapTargetPeriod}
                onChange={(e) => setSwapTargetPeriod(parseInt(e.target.value, 10))}
                className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
              >
                {TIMETABLE_PERIODS.map((p) => (
                  <option key={p.period} value={p.period}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsSwapModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleExecuteSwap} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              Xác nhận di chuyển / hoán đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* TEMPLATE CONFIRM MODAL */}
      <ConfirmDialog
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onConfirm={handleApplyTemplate}
        title="Áp dụng Mẫu chuẩn 28 tiết THCS?"
        description={`Hệ thống sẽ điền lịch chuẩn THCS cho lớp ${currentClass?.name}. Mọi xung đột lịch dạy với các lớp khác sẽ được kiểm tra nguyên tử (atomic) trước khi ghi.`}
        confirmText="Áp dụng mẫu chuẩn"
        variant="primary"
      />

      {/* COPY MODAL */}
      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Sao chép Thời khóa biểu sang lớp đích"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-xs text-text-muted">
            Lớp đích nhận thời khóa biểu:{' '}
            <strong className="text-text-primary">{currentClass?.name}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Chọn Lớp nguồn để sao chép
            </label>
            <select
              value={copySourceClassId}
              onChange={(e) => setCopySourceClassId(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-surface text-text-primary font-medium"
            >
              <option value="">-- Chọn lớp nguồn --</option>
              {classes
                .filter((c) => c.id !== selectedClassId)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Khối {cls.grade} · {getGradeShift(cls.grade) === 'morning' ? 'Ca Sáng' : 'Ca Chiều'})
                  </option>
                ))}
            </select>
          </div>

          <p className="text-[11px] text-text-muted">
            Quá trình sao chép sẽ tự động gán lại tiết Sinh hoạt lớp Thứ Bảy cho GVCN của lớp đích, đồng thời kiểm tra xung đột nguyên tử (atomic) toàn diện trên toàn trường.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCopyModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleCopyTimetable} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
              Thực hiện sao chép
            </Button>
          </div>
        </div>
      </Modal>

      {/* CLEAR MODAL */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearTimetable}
        title="Xóa toàn bộ thời khóa biểu của lớp?"
        description={`Bạn có chắc chắn muốn xóa toàn bộ thời khóa biểu của lớp ${currentClass?.name}? Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xóa sạch"
        variant="danger"
      />
    </div>
  );
}
