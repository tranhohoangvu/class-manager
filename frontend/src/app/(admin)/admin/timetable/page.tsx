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
  Sun,
  SunHorizon,
  Eye,
  EyeSlash,
  Printer,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import {
  TimetableService,
  TimetableConflict,
  TimetableRuleViolation,
  TimetableAuditReport,
  EnrichedTimetableEntry,
  formatClassName,
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
  SubjectColorStyle,
  getGradeShift,
  isAllowedPeriodForClass,
  getClassHomeroomSlot,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';
import { PrintHeader, PrintSignatures } from '@/components/common/printable-paper';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

function getSubjectStyle(subjectCode?: string, subjectId?: string): SubjectColorStyle {
  if (subjectCode && SUBJECT_COLOR_MAP[subjectCode.toUpperCase()]) {
    return SUBJECT_COLOR_MAP[subjectCode.toUpperCase()];
  }
  if (subjectId) {
    const raw = subjectId.replace('sub-', '').toUpperCase();
    if (SUBJECT_COLOR_MAP[raw]) return SUBJECT_COLOR_MAP[raw];
  }
  return DEFAULT_SUBJECT_COLOR;
}

export default function AdminTimetablePage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [allTimetables, setAllTimetables] = useState<TimetableEntryRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOppositeShift, setShowOppositeShift] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Audit state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<TimetableAuditReport | null>(null);
  const [auditScope, setAuditScope] = useState<'school' | 'class'>('school');

  // Edit / Add Modal state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<EnrichedTimetableEntry | null>(null);
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

    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentClass = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return null;
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  const selectedTeacher = useMemo(() => {
    if (teacherFilter === 'all') return null;
    return teachers.find((t) => t.id === teacherFilter) || null;
  }, [teacherFilter, teachers]);

  // Teachers who teach the currently selected class (or all teachers if all classes)
  const availableTeachers = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return teachers;
    const assignments = LocalStore.getSubjectAssignmentsForClass(selectedClassId);
    const teacherIds = new Set<string>();
    assignments.forEach((a) => teacherIds.add(a.teacher_id));
    const targetCls = classes.find((c) => c.id === selectedClassId);
    if (targetCls?.teacher_id) teacherIds.add(targetCls.teacher_id);
    allTimetables
      .filter((t) => t.class_id === selectedClassId && t.teacher_id)
      .forEach((t) => teacherIds.add(t.teacher_id!));
    return teachers.filter((t) => teacherIds.has(t.id));
  }, [selectedClassId, classes, teachers, allTimetables]);

  // Classes taught by the currently selected teacher (if teacher filter is active)
  const availableClasses = useMemo(() => {
    if (teacherFilter === 'all') return classes;
    const assignments = LocalStore.getSubjectAssignmentsForTeacher(teacherFilter);
    const classIds = new Set<string>();
    assignments.forEach((a) => classIds.add(a.class_id));
    classes.filter((c) => c.teacher_id === teacherFilter).forEach((c) => classIds.add(c.id));
    allTimetables
      .filter((t) => t.teacher_id === teacherFilter)
      .forEach((t) => classIds.add(t.class_id));
    return classes.filter((c) => classIds.has(c.id));
  }, [teacherFilter, classes, allTimetables]);

  // Phân tích ca giảng dạy của giáo viên (chỉ ca chiều, chỉ ca sáng, hay cả hai)
  const teacherShiftInfo = useMemo(() => {
    if (teacherFilter === 'all') return null;

    const teacherClassShifts = new Set<'morning' | 'afternoon'>();
    availableClasses.forEach((c) => teacherClassShifts.add(getGradeShift(c.grade)));

    const teacherTimetables = allTimetables.filter((t) => t.teacher_id === teacherFilter);
    teacherTimetables.forEach((t) => {
      teacherClassShifts.add(t.period <= 5 ? 'morning' : 'afternoon');
    });

    const teachesMorning = teacherClassShifts.has('morning');
    const teachesAfternoon = teacherClassShifts.has('afternoon');

    if (teachesAfternoon && !teachesMorning) return 'afternoon-only';
    if (teachesMorning && !teachesAfternoon) return 'morning-only';
    if (teachesMorning && teachesAfternoon) return 'both';
    return 'none';
  }, [teacherFilter, availableClasses, allTimetables]);

  // Ca học tích cực để hiển thị trên ma trận
  const shift: 'morning' | 'afternoon' = useMemo(() => {
    if (currentClass) {
      return getGradeShift(currentClass.grade);
    }
    if (teacherFilter !== 'all') {
      if (teacherShiftInfo === 'afternoon-only') return 'afternoon';
      if (teacherShiftInfo === 'morning-only') return 'morning';
    }
    return 'morning';
  }, [currentClass, teacherFilter, teacherShiftInfo]);

  // Subjects taught in selected class / by selected teacher
  const availableSubjects = useMemo(() => {
    if (selectedClassId === 'all') {
      if (teacherFilter !== 'all') {
        const assignments = LocalStore.getSubjectAssignmentsForTeacher(teacherFilter);
        const subIds = new Set(assignments.map((a) => a.subject_id));
        allTimetables
          .filter((t) => t.teacher_id === teacherFilter)
          .forEach((t) => subIds.add(t.subject_id));
        return subjects.filter((s) => subIds.has(s.id));
      }
      return subjects;
    }
    const assignments = LocalStore.getSubjectAssignmentsForClass(selectedClassId);
    const subjectIds = new Set<string>();

    if (teacherFilter !== 'all') {
      assignments
        .filter((a) => a.teacher_id === teacherFilter)
        .forEach((a) => subjectIds.add(a.subject_id));
      allTimetables
        .filter((t) => t.class_id === selectedClassId && t.teacher_id === teacherFilter)
        .forEach((t) => subjectIds.add(t.subject_id));
      const targetCls = classes.find((c) => c.id === selectedClassId);
      if (targetCls?.teacher_id === teacherFilter) {
        subjectIds.add('sub-shl');
      }
    } else {
      assignments.forEach((a) => subjectIds.add(a.subject_id));
      allTimetables
        .filter((t) => t.class_id === selectedClassId)
        .forEach((t) => subjectIds.add(t.subject_id));
      subjectIds.add('sub-shl');
    }
    return subjects.filter((s) => subjectIds.has(s.id));
  }, [selectedClassId, teacherFilter, classes, subjects, allTimetables]);

  // Modal available teachers for formClassId
  const modalAvailableTeachers = useMemo(() => {
    const asgns = LocalStore.getSubjectAssignmentsForClass(formClassId);
    const teacherIds = new Set<string>();
    asgns.forEach((a) => teacherIds.add(a.teacher_id));
    const targetCls = classes.find((c) => c.id === formClassId);
    if (targetCls?.teacher_id) teacherIds.add(targetCls.teacher_id);
    allTimetables
      .filter((t) => t.class_id === formClassId && t.teacher_id)
      .forEach((t) => teacherIds.add(t.teacher_id!));
    return teachers.filter((t) => teacherIds.has(t.id));
  }, [formClassId, classes, teachers, allTimetables]);

  // Enriched entries for current view
  const enrichedEntries = useMemo(() => {
    // Nếu chưa chọn lớp (selectedClassId rỗng) và không chọn giáo viên cụ thể: TKB trống trơn
    if (!selectedClassId && teacherFilter === 'all') {
      return [];
    }

    return TimetableService.filterTimetableEntries({
      classId: (!selectedClassId || selectedClassId === 'all') ? undefined : selectedClassId,
      teacherId: teacherFilter === 'all' ? undefined : teacherFilter,
      subjectId: subjectFilter === 'all' ? undefined : subjectFilter,
      dayOfWeek: dayFilter === 'all' ? undefined : parseInt(dayFilter, 10),
    });
  }, [selectedClassId, teacherFilter, subjectFilter, dayFilter, allTimetables]);

  // Handle class switch
  const handleSelectClass = (newClassId: string) => {
    setSelectedClassId(newClassId);
    setShowOppositeShift(false);
    if (newClassId && newClassId !== 'all' && teacherFilter !== 'all') {
      const teachesNewClass =
        LocalStore.getSubjectAssignmentsForClass(newClassId).some((a) => a.teacher_id === teacherFilter) ||
        classes.find((c) => c.id === newClassId)?.teacher_id === teacherFilter ||
        allTimetables.some((t) => t.class_id === newClassId && t.teacher_id === teacherFilter);
      if (!teachesNewClass) {
        setTeacherFilter('all');
      }
    }
    setSubjectFilter('all');
  };

  // Handle teacher switch
  const handleSelectTeacher = (newTeacherId: string) => {
    setTeacherFilter(newTeacherId);
    setSubjectFilter('all');
    if (newTeacherId !== 'all') {
      // Khi đã chọn 1 giáo viên cụ thể: Bỏ lựa chọn "Chọn lớp học", tự động chuyển sang "Tất cả các lớp của GV"
      if (!selectedClassId || selectedClassId === '') {
        setSelectedClassId('all');
      }

      // Tự động nhận diện ca giảng dạy của giáo viên:
      // Nếu chỉ dạy ca chiều -> show ca chiều, ẩn ca sáng.
      // Nếu chỉ dạy ca sáng -> show ca sáng, ẩn ca chiều.
      const asgns = LocalStore.getSubjectAssignmentsForTeacher(newTeacherId);
      const teacherClassIds = new Set<string>();
      asgns.forEach((a) => teacherClassIds.add(a.class_id));
      classes.filter((c) => c.teacher_id === newTeacherId).forEach((c) => teacherClassIds.add(c.id));
      allTimetables.filter((t) => t.teacher_id === newTeacherId).forEach((t) => teacherClassIds.add(t.class_id));

      const shifts = new Set<'morning' | 'afternoon'>();
      classes.filter((c) => teacherClassIds.has(c.id)).forEach((c) => shifts.add(getGradeShift(c.grade)));
      allTimetables.filter((t) => t.teacher_id === newTeacherId).forEach((t) => {
        shifts.add(t.period <= 5 ? 'morning' : 'afternoon');
      });

      const teachesMorning = shifts.has('morning');
      const teachesAfternoon = shifts.has('afternoon');

      if (teachesAfternoon && !teachesMorning) {
        // Chỉ dạy ca chiều: show ca chiều, ẩn ca sáng
        setShowOppositeShift(false);
      } else if (teachesMorning && !teachesAfternoon) {
        // Chỉ dạy ca sáng: show ca sáng, ẩn ca chiều
        setShowOppositeShift(false);
      } else if (teachesMorning && teachesAfternoon) {
        // Dạy cả 2 ca: mở cả 2 ca để xem toàn diện
        setShowOppositeShift(true);
      } else {
        setShowOppositeShift(false);
      }
    } else {
      // Khi quay lại "Tất cả giáo viên": Bỏ lựa chọn "Tất cả các lớp", chuyển về "Chọn lớp học" để TKB trống trơn
      if (selectedClassId === 'all') {
        setSelectedClassId('');
      }
      setShowOppositeShift(false);
    }
  };

  // Quick lookup map by (classId_day_period)
  const entryLookupMap = useMemo(() => {
    const map = new Map<string, EnrichedTimetableEntry>();
    enrichedEntries.forEach((e) => {
      map.set(`${e.class_id}_${e.day_of_week}_${e.period}`, e);
    });
    return map;
  }, [enrichedEntries]);

  // Quick lookup entries array by (day_period) - crucial for multi-class and teacher schedule views
  const entriesBySlotMap = useMemo(() => {
    const map = new Map<string, EnrichedTimetableEntry[]>();
    enrichedEntries.forEach((e) => {
      const key = `${e.day_of_week}_${e.period}`;
      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
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

  // Check if form is dirty when editing entry
  const isEntryDirty = useMemo(() => {
    if (modalMode === 'add') return true;
    if (!editingEntry) return false;
    const origRoom = (editingEntry.room || '').trim();
    const currRoom = formRoom.trim();
    return (
      formClassId !== editingEntry.class_id ||
      formDay !== editingEntry.day_of_week ||
      formPeriod !== editingEntry.period ||
      formSubjectId !== editingEntry.subject_id ||
      formTeacherId !== (editingEntry.teacher_id || '') ||
      currRoom !== origRoom
    );
  }, [modalMode, editingEntry, formClassId, formDay, formPeriod, formSubjectId, formTeacherId, formRoom]);

  const printDays = useMemo(() => {
    if (dayFilter === 'all') return TIMETABLE_DAYS;
    const dNum = parseInt(dayFilter, 10);
    return TIMETABLE_DAYS.filter((d) => d.day === dNum);
  }, [dayFilter]);

  const printPeriods = useMemo(() => {
    if (showOppositeShift) return TIMETABLE_PERIODS;
    if (teacherFilter !== 'all' && (!selectedClassId || selectedClassId === 'all')) {
      if (teacherShiftInfo === 'afternoon-only') {
        return TIMETABLE_PERIODS.filter((p) => p.period > 5);
      }
      if (teacherShiftInfo === 'morning-only') {
        return TIMETABLE_PERIODS.filter((p) => p.period <= 5);
      }
      return TIMETABLE_PERIODS;
    }
    if (selectedClassId === 'all') return TIMETABLE_PERIODS;
    if (shift === 'morning') {
      return TIMETABLE_PERIODS.filter((p) => p.period <= 5);
    }
    return TIMETABLE_PERIODS.filter((p) => p.period > 5);
  }, [selectedClassId, teacherFilter, showOppositeShift, shift, teacherShiftInfo]);

  // Handlers
  const handleOpenAddModal = (day = 2, period = 1) => {
    setModalMode('add');
    setEditingEntryId(null);
    const targetClassId = (!selectedClassId || selectedClassId === 'all') ? (classes[0]?.id || 'c-6a1') : selectedClassId;
    setFormClassId(targetClassId);
    setFormDay(day);
    setFormPeriod(period);
    setFormSubjectId(subjects[0]?.id || 'sub-mat');

    // Auto-match teacher if assignments exist
    const assignments = LocalStore.getSubjectAssignmentsForClass(targetClassId);
    const match = assignments.find((a) => a.subject_id === (subjects[0]?.id || 'sub-mat'));
    setFormTeacherId(match ? match.teacher_id : '');

    const targetCls = classes.find((c) => c.id === targetClassId);
    setFormRoom(targetCls?.room_name || '');

    setIsEntryModalOpen(true);
  };

  const handleOpenEditModal = (entry: EnrichedTimetableEntry) => {
    setModalMode('edit');
    setEditingEntryId(entry.id);
    setEditingEntry(entry);
    setFormClassId(entry.class_id);
    setFormDay(entry.day_of_week);
    setFormPeriod(entry.period);
    setFormSubjectId(entry.subject_id);
    setFormTeacherId(entry.teacher_id || '');
    setFormRoom(entry.room || '');
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
    if (!selectedClassId || selectedClassId === 'all') {
      toast.error('Vui lòng chọn một lớp cụ thể để áp dụng mẫu chuẩn.');
      return;
    }
    const res = TimetableService.applyStandardTemplate(selectedClassId, user);
    if (res.success) {
      toast.success(`Đã áp dụng mẫu chuẩn 28 tiết cho ${currentClass?.name || 'lớp'}.`);
      setIsTemplateModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Không thể áp dụng mẫu thời khóa biểu.');
    }
  };

  const handleCopyTimetable = () => {
    if (!copySourceClassId || !selectedClassId || selectedClassId === 'all') {
      toast.error('Vui lòng chọn lớp nguồn và lớp đích hợp lệ.');
      return;
    }
    const res = TimetableService.copyFromClass(copySourceClassId, selectedClassId, user);
    if (res.success) {
      toast.success(`Đã sao chép thời khóa biểu sang ${currentClass?.name || 'lớp'}.`);
      setIsCopyModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Không thể sao chép thời khóa biểu.');
    }
  };

  const handleClearTimetable = () => {
    if (!selectedClassId || selectedClassId === 'all') {
      toast.error('Vui lòng chọn một lớp cụ thể để xóa thời khóa biểu.');
      return;
    }
    const res = TimetableService.clearTimetable(selectedClassId, user);
    if (res.success) {
      toast.success(`Đã xóa toàn bộ thời khóa biểu ${currentClass?.name || 'lớp'}.`);
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

  const handleResetFilters = () => {
    setSelectedClassId('');
    setTeacherFilter('all');
    setSubjectFilter('all');
    setDayFilter('all');
    setShowOppositeShift(false);
    toast.info('Đã đặt lại toàn bộ bộ lọc về mặc định.');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full mx-auto pb-12">
      <div className="no-print space-y-6">
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-teal-subtle text-teal border border-teal/30 rounded-sm inline-flex items-center gap-1.5">
              <ShieldCheck size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-surface-muted text-text-secondary border border-border rounded-sm">
              Năm học: 2026 - 2027
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-text-primary mt-2">
            QUẢN LÝ THỜI KHÓA BIỂU TOÀN TRƯỜNG
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Kiểm soát, điều phối, tổ chức và kiểm toán lịch học toàn trường theo quy chuẩn THCS
          </p>
        </div>

        {/* Audit Status Badge & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleRunAudit('school')}
            className={cn(
              'px-3.5 py-2 rounded-sm text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-xs',
              auditReport?.isValid
                ? 'bg-success-bg text-success border-success/40 hover:bg-success-bg/80'
                : 'bg-danger-bg text-danger border-danger/40 hover:bg-danger-bg/80 animate-pulse'
            )}
          >
            {auditReport?.isValid ? (
              <>
                <CheckCircle size={16} weight="fill" className="text-success" />
                <span>Kiểm toán TKB: Hợp lệ (0 lỗi)</span>
              </>
            ) : (
              <>
                <WarningCircle size={16} weight="fill" className="text-danger" />
                <span>Kiểm toán TKB: {auditReport?.summary.totalIssuesCount} lỗi vi phạm</span>
              </>
            )}
          </button>

          {/* Button Sửa TKB - Chỉ khi ấn nút này Admin mới có thể chỉnh sửa */}
          <Button
            variant={isEditMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              const next = !isEditMode;
              setIsEditMode(next);
              if (next) {
                toast.success('Đã bật chế độ chỉnh sửa Thời khóa biểu.');
              } else {
                toast.info('Đã thoát chế độ chỉnh sửa Thời khóa biểu.');
              }
            }}
            className={cn(
              'gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs',
              isEditMode
                ? 'bg-teal text-white hover:bg-teal-hover border-teal ring-2 ring-teal/30'
                : 'text-text-primary hover:text-teal hover:border-teal/50'
            )}
            title={isEditMode ? 'Nhấn để hoàn tất và thoát chế độ sửa' : 'Bật chế độ chỉnh sửa để thêm, sửa, xóa các tiết học'}
          >
            {isEditMode ? (
              <>
                <Check size={15} weight="bold" />
                <span>Hoàn tất sửa</span>
              </>
            ) : (
              <>
                <PencilSimple size={15} weight="bold" />
                <span>Sửa TKB</span>
              </>
            )}
          </Button>

          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAddModal(2, shift === 'morning' ? 1 : 6)}
              className="gap-1.5 cursor-pointer text-xs"
            >
              <Plus size={15} weight="bold" />
              <span>Thêm tiết</span>
            </Button>
          )}

          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateModalOpen(true)}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Lightning size={15} weight="duotone" className="text-warning-600" />
              <span>Mẫu chuẩn</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs font-bold shadow-xs border-border-strong text-text-primary hover:bg-surface-muted cursor-pointer"
          >
            <Printer size={15} weight="bold" className="text-teal" />
            <span>In TKB</span>
          </Button>

          {isEditMode && selectedClassId && selectedClassId !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              className="gap-1.5 text-xs text-danger hover:bg-danger-bg border-danger/30 cursor-pointer"
            >
              <Trash size={15} />
              <span>Xóa TKB</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface p-4 rounded-sm border border-border space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-semibold text-text-secondary">
          <div className="flex items-center gap-2">
            <Funnel size={16} className="text-teal" />
            <span className="font-bold text-text-primary">Bộ lọc lịch học toàn trường</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:text-text-primary bg-surface-muted hover:bg-surface border border-border rounded-xs transition-all cursor-pointer shadow-2xs"
              title="Đặt lại toàn bộ bộ lọc về mặc định"
            >
              <ArrowsClockwise size={13} weight="bold" />
              <span>Đặt lại lọc</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-sm border border-border">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2.5 py-1 rounded-sm text-xs font-medium transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-accent text-accent-text shadow-xs font-bold border border-border-strong'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Ma trận TKB
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2.5 py-1 rounded-sm text-xs font-medium transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-accent text-accent-text shadow-xs font-bold border border-border-strong'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Danh sách ({enrichedEntries.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1.5">
              <Chalkboard size={13} className="text-teal" />
              <span>Lớp học</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
            >
              {/* Khi ở tất cả giáo viên: Bỏ Tất cả các lớp, chỉ có Chọn lớp học */}
              {teacherFilter === 'all' && (
                <option value="">-- Chọn lớp học --</option>
              )}
              {/* Khi đã chọn giáo viên: Bỏ Chọn lớp học, chỉ có Tất cả các lớp của GV */}
              {teacherFilter !== 'all' && (
                <option value="all">
                  -- Tất cả các lớp ({availableClasses.length} lớp của GV) --
                </option>
              )}
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Khối {cls.grade} · {getGradeShift(cls.grade) === 'morning' ? 'Ca Sáng' : 'Ca Chiều'})
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1.5">
              <ChalkboardTeacher size={13} className="text-teal" />
              <span>Giáo viên</span>
            </label>
            <select
              value={teacherFilter}
              onChange={(e) => handleSelectTeacher(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
            >
              <option value="all">
                {selectedClassId === 'all'
                  ? `-- Tất cả giáo viên (${availableTeachers.length} GV) --`
                  : `-- Tất cả GV dạy lớp này (${availableTeachers.length} GV) --`}
              </option>
              {availableTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter (Chỉ lọc môn khi đã chọn lớp hoặc GV) */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1.5">
              <BookOpen size={13} className="text-teal" />
              <span>Môn học</span>
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
            >
              <option value="all">-- Tất cả môn học của lớp ({availableSubjects.length} môn) --</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) · Tối đa {s.max_consecutive_periods ?? 1} tiết/buổi
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week Filter */}
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1.5">
              <Clock size={13} className="text-teal" />
              <span>Ngày trong tuần</span>
            </label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="w-full text-xs h-9 px-2.5 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
        <div className="p-4 rounded-sm bg-danger-bg/70 border border-danger/40 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <WarningCircle size={18} weight="fill" className="text-danger animate-bounce" />
              <span>Cảnh báo vi phạm quy chuẩn xếp lịch học ({currentClass?.name})</span>
            </div>
            <button
              type="button"
              onClick={() => handleRunAudit('class')}
              className="text-xs font-bold text-danger bg-surface hover:bg-danger-bg px-3 py-1 rounded-sm border border-danger/40 transition-colors cursor-pointer"
            >
              Xem chi tiết kiểm toán
            </button>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-danger/20 text-xs text-danger font-medium">
            {currentClassViolations.map((v, idx) => (
              <div key={`rule-${idx}`} className="flex items-start gap-1.5">
                <span className="font-bold">• {v.subjectName} ({v.dayName}, {v.periodLabels}):</span>
                <span>{v.violation}</span>
              </div>
            ))}
            {currentClassConflicts.tc.map((t, idx) => (
              <div key={`tc-${idx}`} className="flex items-start gap-1.5">
                <span className="font-bold">• Xung đột giáo viên ({t.dayName}, Tiết {t.period}):</span>
                <span>{t.message}</span>
              </div>
            ))}
            {currentClassConflicts.rc.map((r, idx) => (
              <div key={`rc-${idx}`} className="flex items-start gap-1.5">
                <span className="font-bold">• Xung đột phòng học ({r.dayName}, Tiết {r.period}):</span>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="bg-surface rounded-sm border border-border-strong shadow-xs overflow-hidden">
          {/* Shift Banner */}
          <div className="px-5 py-3.5 bg-surface-muted border-b border-border-strong flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-3 h-3 rounded-full bg-teal ring-4 ring-teal/20 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-text-primary uppercase tracking-wide">
                  {!selectedClassId
                    ? (teacherFilter !== 'all'
                        ? `Lịch dạy GV: ${teachers.find((t) => t.id === teacherFilter)?.name}`
                        : 'Chưa chọn lớp học')
                    : selectedClassId === 'all'
                    ? (teacherFilter !== 'all'
                        ? `Lịch dạy GV: ${teachers.find((t) => t.id === teacherFilter)?.name}`
                        : 'Thời khóa biểu toàn trường')
                    : currentClass?.name}
                </span>
                {!selectedClassId ? (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-surface border border-border text-text-muted">
                    {teacherFilter !== 'all' ? `${availableClasses.length} lớp phụ trách` : 'Chưa chọn lớp'}
                  </span>
                ) : selectedClassId === 'all' ? (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-surface border border-border text-text-secondary">
                    {teacherFilter !== 'all' ? `${availableClasses.length} lớp phụ trách` : 'Tất cả 16 lớp THCS'}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs bg-surface border border-border text-text-secondary">
                    Khối {currentClass?.grade}
                  </span>
                )}
                <span
                  className={cn(
                    'text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs border',
                    selectedClassId === 'all' && teacherFilter === 'all'
                      ? 'bg-indigo-100 text-indigo-950 border-indigo-300'
                      : (shift === 'morning'
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-teal-100 text-teal-950 border-teal-300')
                  )}
                >
                  {!selectedClassId || selectedClassId === 'all'
                    ? (teacherFilter !== 'all'
                      ? (teacherShiftInfo === 'afternoon-only'
                        ? 'Ca Chiều: Tiết 6 — 10'
                        : teacherShiftInfo === 'morning-only'
                        ? 'Ca Sáng: Tiết 1 — 5'
                        : 'Hiển thị: Tiết 1 — 10')
                      : 'Hiển thị: Tiết 1 — 10')
                    : (shift === 'morning' ? 'Ca Sáng: Tiết 1 - 5' : 'Ca Chiều: Tiết 6 - 10')}
                </span>
                {selectedTeacher && (
                  <>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                      <ChalkboardTeacher size={14} className="text-teal" />
                      <span>
                        Giảng dạy:{' '}
                        <strong className="text-text-primary">
                          {teacherShiftInfo === 'afternoon-only'
                            ? 'Các lớp Ca Chiều'
                            : teacherShiftInfo === 'morning-only'
                            ? 'Các lớp Ca Sáng'
                            : 'Cả Ca Sáng & Chiều'}
                        </strong>
                      </span>
                    </span>
                  </>
                )}
                {selectedClassId && selectedClassId !== 'all' && (
                  <>
                    <span className="text-xs text-text-muted">·</span>
                    <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                      <Buildings size={14} className="text-teal" />
                      <span>
                        Phòng cố định:{' '}
                        <strong className="text-text-primary">
                          {currentClass?.room_name || 'Chưa gán'}
                        </strong>
                      </span>
                    </span>
                    {currentClass?.teacher_id && (
                      <>
                        <span className="text-xs text-text-muted">·</span>
                        <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                          <ChalkboardTeacher size={14} className="text-teal" />
                          <span>
                            GVCN:{' '}
                            <strong className="text-text-primary">
                              {teachers.find((t) => t.id === currentClass.teacher_id)?.name ||
                                'Chưa phân công'}
                            </strong>
                          </span>
                        </span>
                      </>
                    )}
                  </>
                )}
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs font-mono font-bold text-teal bg-teal-subtle px-1.5 py-0.5 rounded-xs border border-teal/20">
                  {enrichedEntries.length} tiết đã xếp
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowOppositeShift((prev) => !prev)}
                className={cn(
                  'px-3 py-1.5 rounded-xs border border-border-strong text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs',
                  showOppositeShift
                    ? 'bg-surface-muted text-text-primary hover:bg-surface-muted/80'
                    : 'bg-accent/20 text-accent-text hover:bg-accent/35'
                )}
              >
                {showOppositeShift ? (
                  <>
                    <EyeSlash size={14} />
                    <span>{shift === 'morning' ? 'Ẩn ca Chiều' : 'Ẩn ca Sáng'}</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    <span>{shift === 'morning' ? 'Hiện ca Chiều' : 'Hiện ca Sáng'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Empty Class Notice */}
          {!selectedClassId && teacherFilter === 'all' && (
            <div className="px-5 py-3.5 bg-accent-subtle/30 border-b border-border text-xs text-text-secondary flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
                <span>
                  Thời khóa biểu hiện đang trống. Vui lòng chọn một <strong>Lớp học</strong> hoặc chọn một <strong>Giáo viên</strong> ở thanh bộ lọc bên trên để hiển thị lịch học chi tiết.
                </span>
              </div>
            </div>
          )}

          {/* Edit Mode Active Banner */}
          {isEditMode && (
            <div className="px-5 py-3 bg-teal-500/15 border-b border-teal-500/30 text-teal-950 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <PencilSimple size={16} weight="bold" className="text-teal" />
                <span>
                  <strong>Chế độ Sửa TKB đang bật:</strong> Bạn có thể nhấn <strong>+ Thêm</strong> tại các ô trống hoặc rê chuột vào tiết học để <strong>Sửa</strong>, <strong>Xóa</strong>, <strong>Hoán đổi</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                  toast.info('Đã thoát chế độ chỉnh sửa.');
                }}
                className="px-2.5 py-1 rounded-xs bg-teal text-white hover:bg-teal-hover font-bold text-[11px] cursor-pointer shadow-2xs transition-colors flex-shrink-0"
              >
                Hoàn tất sửa
              </button>
            </div>
          )}

          {/* Table Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px] text-left">
              <thead>
                <tr className="bg-surface-muted border-b-2 border-border-strong">
                  <th className="w-28 px-4 py-3 text-[11px] font-extrabold text-text-primary uppercase tracking-wider font-mono">
                    TIẾT / GIỜ
                  </th>
                  {TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).map((d) => (
                    <th key={d.day} className="px-3 py-3 text-xs font-extrabold text-text-primary border-l border-border uppercase tracking-wide">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{d.name}</span>
                        {d.day === 7 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-amber-200 text-amber-950 border border-amber-400 font-mono">
                            3 TIẾT
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Morning Shift */}
                {(shift === 'morning' || showOppositeShift) && (
                  <>
                    <tr className="bg-amber-100/70 text-amber-950 border-y border-amber-300">
                      <td
                        colSpan={1 + TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).length}
                        className="px-4 py-2 text-xs font-extrabold tracking-wide uppercase font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sun size={16} weight="fill" className="text-amber-600" />
                            <span>CA SÁNG (07:15 — 11:15) · KHỐI 6 & KHỐI 9</span>
                          </div>
                          {shift === 'morning' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-200/90 text-amber-950 border border-amber-400">
                              Ca học chính
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {TIMETABLE_PERIODS.slice(0, 5).map((periodConfig) => (
                      <tr key={periodConfig.period} className="hover:bg-accent-subtle/10 transition-colors">
                        <td className="px-4 py-3 border-r border-border bg-surface-muted/30 align-top">
                          <div className="font-extrabold text-xs text-text-primary font-mono">{periodConfig.label}</div>
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">
                            {periodConfig.startTime} - {periodConfig.endTime}
                          </div>
                        </td>

                        {TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).map((d) => {
                          const isSaturday = d.day === 7;
                          const isProhibited = isSaturday && periodConfig.period > 3;

                          if (isProhibited) {
                            return (
                              <td key={d.day} className="p-2 border-l border-border bg-surface-muted/50 text-center align-middle">
                                <span className="text-[11px] font-medium text-text-muted italic">
                                  Nghỉ
                                </span>
                              </td>
                            );
                          }

                          const slotEntries = selectedClassId === 'all'
                            ? (entriesBySlotMap.get(`${d.day}_${periodConfig.period}`) || [])
                            : (entryLookupMap.get(`${selectedClassId}_${d.day}_${periodConfig.period}`)
                                ? [entryLookupMap.get(`${selectedClassId}_${d.day}_${periodConfig.period}`)!]
                                : []);

                          return (
                            <td key={d.day} className="p-2 border-l border-border align-top h-24 min-w-[130px] group relative">
                              {slotEntries.length > 0 ? (
                                <div className="h-full flex flex-col justify-start gap-2">
                                  {slotEntries.map((entry) => {
                                    const slotIssues = issueMapBySlot.get(`${entry.class_id}_${entry.day_of_week}_${entry.period}`);
                                    const hasIssue = Boolean(slotIssues && slotIssues.length > 0);
                                    const colorStyle = getSubjectStyle(entry.subjectCode, entry.subject_id);

                                    return (
                                      <div
                                        key={entry.id}
                                        className={cn(
                                          'p-2 rounded-xs transition-all shadow-2xs border group/item relative',
                                          hasIssue
                                            ? 'bg-danger-bg border-2 border-danger shadow-xs ring-1 ring-danger/30'
                                            : cn(colorStyle.bg, colorStyle.border, 'hover:border-border-strong hover:shadow-xs')
                                        )}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                                            {(!selectedClassId || selectedClassId === 'all' || teacherFilter !== 'all') && (
                                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-xs bg-sky-100 text-sky-950 border border-sky-400 font-mono shadow-2xs">
                                                {entry.className || classes.find((c) => c.id === entry.class_id)?.name}
                                              </span>
                                            )}
                                            <span
                                              className={cn(
                                                'text-[11px] font-extrabold px-1.5 py-0.5 rounded-xs font-mono border truncate flex items-center gap-1',
                                                colorStyle.badgeBg,
                                                colorStyle.border
                                              )}
                                            >
                                              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colorStyle.dot)} />
                                              <span className="truncate">{entry.subjectName}</span>
                                            </span>
                                          </div>

                                          <div className="text-[11px] font-semibold text-text-primary mt-1 truncate flex items-center gap-1.5">
                                            <ChalkboardTeacher size={13} className="text-text-muted flex-shrink-0" />
                                            <span className="truncate">{entry.teacherName || 'Chưa phân công'}</span>
                                          </div>

                                          <div className="text-[10px] text-text-muted mt-0.5 truncate flex items-center gap-1.5 font-mono">
                                            <Buildings size={12} className="text-text-muted flex-shrink-0" />
                                            <span className="truncate">{entry.effectiveRoom || 'Phòng cố định'}</span>
                                          </div>

                                          {hasIssue && (
                                            <div
                                              title={slotIssues?.join('\n')}
                                              className="mt-1 flex items-center gap-1 text-[10px] font-bold text-danger bg-danger-bg border border-danger/40 px-1 py-0.5 rounded-xs cursor-help animate-pulse"
                                            >
                                              <WarningCircle size={12} weight="fill" className="text-danger flex-shrink-0" />
                                              <span className="truncate">Cảnh báo vi phạm</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Quick Hover Controls - Chỉ hiển thị khi Admin bật Sửa TKB */}
                                        {isEditMode && (
                                          <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-black/10">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenSwapModal(d.day, periodConfig.period)}
                                              title="Hoán đổi/Di chuyển tiết"
                                              className="p-1 rounded-xs text-text-secondary hover:text-accent-text hover:bg-accent cursor-pointer transition-colors"
                                            >
                                              <ArrowsLeftRight size={12} weight="bold" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditModal(entry)}
                                              title="Sửa tiết"
                                              className="p-1 rounded-xs text-text-secondary hover:text-accent-text hover:bg-accent cursor-pointer transition-colors"
                                            >
                                              <PencilSimple size={12} weight="bold" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteEntry(entry)}
                                              title="Xóa tiết"
                                              className="p-1 rounded-xs text-text-secondary hover:text-danger hover:bg-danger-bg cursor-pointer transition-colors"
                                            >
                                              <Trash size={12} weight="bold" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : isEditMode ? (
                                <div
                                  onClick={() => handleOpenAddModal(d.day, periodConfig.period)}
                                  className="h-full min-h-[75px] border-2 border-dashed border-teal/40 hover:border-teal hover:bg-teal-subtle/30 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-all group/empty p-1.5"
                                >
                                  <Plus size={16} className="text-teal group-hover/empty:scale-110 transition-all" weight="bold" />
                                  <span className="text-[10px] text-teal mt-0.5 font-mono font-bold">
                                    + Thêm
                                  </span>
                                </div>
                              ) : (
                                <div className="h-full min-h-[75px] border border-dashed border-border/40 rounded-xs flex items-center justify-center p-1.5 bg-surface-muted/15 select-none">
                                  <span className="text-[12px] text-text-muted/40 font-mono font-medium">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}

                {/* Afternoon Shift */}
                {(shift === 'afternoon' || showOppositeShift) && (
                  <>
                    <tr className="bg-teal-100/70 text-teal-950 border-y border-teal-300">
                      <td
                        colSpan={1 + TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).length}
                        className="px-4 py-2 text-xs font-extrabold tracking-wide uppercase font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SunHorizon size={16} weight="fill" className="text-teal" />
                            <span>CA CHIỀU (13:00 — 17:00) · KHỐI 7 & KHỐI 8</span>
                          </div>
                          {shift === 'afternoon' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-teal-200 text-teal-950 border border-teal-400">
                              Ca học chính
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {TIMETABLE_PERIODS.slice(5, 10).map((periodConfig) => (
                      <tr key={periodConfig.period} className="hover:bg-accent-subtle/10 transition-colors">
                        <td className="px-4 py-3 border-r border-border bg-surface-muted/30 align-top">
                          <div className="font-extrabold text-xs text-text-primary font-mono">{periodConfig.label}</div>
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">
                            {periodConfig.startTime} - {periodConfig.endTime}
                          </div>
                        </td>

                        {TIMETABLE_DAYS.filter((d) => dayFilter === 'all' || d.day === parseInt(dayFilter, 10)).map((d) => {
                          const isSaturday = d.day === 7;
                          const isProhibited = isSaturday && periodConfig.period > 8;

                          if (isProhibited) {
                            return (
                              <td key={d.day} className="p-2 border-l border-border bg-surface-muted/50 text-center align-middle">
                                <span className="text-[11px] font-medium text-text-muted italic">
                                  Nghỉ
                                </span>
                              </td>
                            );
                          }

                          const slotEntries = selectedClassId === 'all'
                            ? (entriesBySlotMap.get(`${d.day}_${periodConfig.period}`) || [])
                            : (entryLookupMap.get(`${selectedClassId}_${d.day}_${periodConfig.period}`)
                                ? [entryLookupMap.get(`${selectedClassId}_${d.day}_${periodConfig.period}`)!]
                                : []);

                          return (
                            <td key={d.day} className="p-2 border-l border-border align-top h-24 min-w-[130px] group relative">
                              {slotEntries.length > 0 ? (
                                <div className="h-full flex flex-col justify-start gap-2">
                                  {slotEntries.map((entry) => {
                                    const slotIssues = issueMapBySlot.get(`${entry.class_id}_${entry.day_of_week}_${entry.period}`);
                                    const hasIssue = Boolean(slotIssues && slotIssues.length > 0);
                                    const colorStyle = getSubjectStyle(entry.subjectCode, entry.subject_id);

                                    return (
                                      <div
                                        key={entry.id}
                                        className={cn(
                                          'p-2 rounded-xs transition-all shadow-2xs border group/item relative',
                                          hasIssue
                                            ? 'bg-danger-bg border-2 border-danger shadow-xs ring-1 ring-danger/30'
                                            : cn(colorStyle.bg, colorStyle.border, 'hover:border-border-strong hover:shadow-xs')
                                        )}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
                                            {(!selectedClassId || selectedClassId === 'all' || teacherFilter !== 'all') && (
                                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-xs bg-sky-100 text-sky-950 border border-sky-400 font-mono shadow-2xs">
                                                {entry.className || classes.find((c) => c.id === entry.class_id)?.name}
                                              </span>
                                            )}
                                            <span
                                              className={cn(
                                                'text-[11px] font-extrabold px-1.5 py-0.5 rounded-xs font-mono border truncate flex items-center gap-1',
                                                colorStyle.badgeBg,
                                                colorStyle.border
                                              )}
                                            >
                                              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colorStyle.dot)} />
                                              <span className="truncate">{entry.subjectName}</span>
                                            </span>
                                          </div>

                                          <div className="text-[11px] font-semibold text-text-primary mt-1 truncate flex items-center gap-1.5">
                                            <ChalkboardTeacher size={13} className="text-text-muted flex-shrink-0" />
                                            <span className="truncate">{entry.teacherName || 'Chưa phân công'}</span>
                                          </div>

                                          <div className="text-[10px] text-text-muted mt-0.5 truncate flex items-center gap-1.5 font-mono">
                                            <Buildings size={12} className="text-text-muted flex-shrink-0" />
                                            <span className="truncate">{entry.effectiveRoom || 'Phòng cố định'}</span>
                                          </div>

                                          {hasIssue && (
                                            <div
                                              title={slotIssues?.join('\n')}
                                              className="mt-1 flex items-center gap-1 text-[10px] font-bold text-danger bg-danger-bg border border-danger/40 px-1 py-0.5 rounded-xs cursor-help animate-pulse"
                                            >
                                              <WarningCircle size={12} weight="fill" className="text-danger flex-shrink-0" />
                                              <span className="truncate">Cảnh báo vi phạm</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Quick Hover Controls - Chỉ hiển thị khi Admin bật Sửa TKB */}
                                        {isEditMode && (
                                          <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-black/10">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenSwapModal(d.day, periodConfig.period)}
                                              title="Hoán đổi/Di chuyển tiết"
                                              className="p-1 rounded-xs text-text-secondary hover:text-accent-text hover:bg-accent cursor-pointer transition-colors"
                                            >
                                              <ArrowsLeftRight size={12} weight="bold" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditModal(entry)}
                                              title="Sửa tiết"
                                              className="p-1 rounded-xs text-text-secondary hover:text-accent-text hover:bg-accent cursor-pointer transition-colors"
                                            >
                                              <PencilSimple size={12} weight="bold" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteEntry(entry)}
                                              title="Xóa tiết"
                                              className="p-1 rounded-xs text-text-secondary hover:text-danger hover:bg-danger-bg cursor-pointer transition-colors"
                                            >
                                              <Trash size={12} weight="bold" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : isEditMode ? (
                                <div
                                  onClick={() => handleOpenAddModal(d.day, periodConfig.period)}
                                  className="h-full min-h-[75px] border-2 border-dashed border-teal/40 hover:border-teal hover:bg-teal-subtle/30 rounded-xs flex flex-col items-center justify-center cursor-pointer transition-all group/empty p-1.5"
                                >
                                  <Plus size={16} className="text-teal group-hover/empty:scale-110 transition-all" weight="bold" />
                                  <span className="text-[10px] text-teal mt-0.5 font-mono font-bold">
                                    + Thêm
                                  </span>
                                </div>
                              ) : (
                                <div className="h-full min-h-[75px] border border-dashed border-border/40 rounded-xs flex items-center justify-center p-1.5 bg-surface-muted/15 select-none">
                                  <span className="text-[12px] text-text-muted/40 font-mono font-medium">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-surface rounded-sm border border-border-strong shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border-strong flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary">
              Danh sách chi tiết {enrichedEntries.length} tiết học được lọc
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/90 border-b border-border-strong text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Thứ</th>
                  <th className="px-4 py-3">Tiết</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3">Giáo viên</th>
                  <th className="px-4 py-3">Phòng học</th>
                  <th className="px-4 py-3 text-right">{isEditMode ? 'Thao tác' : 'Trạng thái'}</th>
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
                      <tr key={e.id} className={cn('hover:bg-accent-subtle/30 transition-colors', hasIssue && 'bg-danger-bg/50 border-l-4 border-l-danger')}>
                        <td className="px-4 py-3 font-bold text-text-primary">
                          <div className="flex items-center gap-1.5">
                            {hasIssue && <WarningCircle size={14} weight="fill" className="text-danger flex-shrink-0" />}
                            <span>{e.className}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-text-secondary">
                          {TIMETABLE_DAYS.find((d) => d.day === e.day_of_week)?.name || `Thứ ${e.day_of_week}`}
                        </td>
                        <td className="px-4 py-3 font-bold text-teal">Tiết {e.period}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-sm font-bold text-[11px]', SUBJECT_COLOR_MAP[e.subject_id] || DEFAULT_SUBJECT_COLOR)}>
                            {e.subjectName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary font-medium">{e.teacherName}</td>
                        <td className="px-4 py-3 text-text-muted font-mono">{e.effectiveRoom}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasIssue && (
                              <span
                                title={slotIssues?.join('\n')}
                                className="text-[10px] font-bold text-danger bg-danger-bg border border-danger/40 px-1.5 py-0.5 rounded-sm cursor-help"
                              >
                                Vi phạm
                              </span>
                            )}
                            {isEditMode ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(e)}
                                  className="p-1 rounded-sm text-text-muted hover:text-accent-text hover:bg-accent cursor-pointer"
                                  title="Sửa tiết"
                                >
                                  <PencilSimple size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEntry(e)}
                                  className="p-1 rounded-sm text-text-muted hover:text-danger hover:bg-danger-bg cursor-pointer"
                                  title="Xóa tiết"
                                >
                                  <Trash size={15} />
                                </button>
                              </>
                            ) : (
                              !hasIssue && <span className="text-[11px] text-text-muted font-mono">—</span>
                            )}
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
      </div>

      {/* PRINT LAYOUT (A4 Chuẩn In Ấn Theo Bộ Lọc) */}
      <div className="hidden print:block p-4 max-w-[100%] mx-auto text-black bg-white printable-card font-sans">
        <PrintHeader
          title={
            selectedTeacher
              ? `THỜI KHÓA BIỂU GIẢNG DẠY - GIÁO VIÊN ${selectedTeacher.name.toUpperCase()}`
              : selectedClassId === 'all'
              ? 'THỜI KHÓA BIỂU TỔNG THỂ TOÀN TRƯỜNG'
              : `THỜI KHÓA BIỂU - ${currentClass?.name ? currentClass.name.toUpperCase() : 'LỚP HỌC'}`
          }
          subtitle={
            selectedTeacher
              ? `Tổ bộ môn: ${subjects.find((s) => s.id === selectedTeacher.subject_id)?.name || 'Bộ môn THCS'}`
              : selectedClassId === 'all'
              ? `Toàn bộ ${classes.length} lớp học (Khối 6, 7, 8, 9)`
              : `Khối ${currentClass?.grade || 6} · Buổi học: ${shift === 'morning' ? 'Ca Sáng (Tiết 1 - 5)' : 'Ca Chiều (Tiết 6 - 10)'}`
          }
          rightMeta={
            <span className="font-mono text-[9pt] font-bold text-gray-700">
              {selectedTeacher
                ? `Mã: TKB-GV-${selectedTeacher.id}`
                : selectedClassId === 'all'
                ? 'Mã: TKB-TOAN-TRUONG'
                : `Mã: TKB-${currentClass?.name || 'THCS'}`}
            </span>
          }
        />

        {/* Metadata info */}
        {selectedTeacher ? (
          <div className="mb-4 p-3 border border-black text-xs leading-relaxed bg-neutral-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <strong>Giáo viên:</strong> {selectedTeacher.name} ({selectedTeacher.id})
              </div>
              <div>
                <strong>Tổ bộ môn:</strong> {subjects.find((s) => s.id === selectedTeacher.subject_id)?.name || 'Bộ môn THCS'}
              </div>
              <div>
                <strong>Tổng số tiết dạy:</strong> {enrichedEntries.length} tiết / tuần
              </div>
              <div>
                <strong>Các lớp giảng dạy:</strong>{' '}
                {Array.from(new Set(enrichedEntries.map((e) => e.className || classes.find((c) => c.id === e.class_id)?.name || e.class_id))).join(', ') || 'Chưa phân công'}
              </div>
            </div>
            {(subjectFilter !== 'all' || dayFilter !== 'all' || selectedClassId !== 'all') && (
              <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-[11px] text-gray-700 flex flex-wrap gap-4">
                <span><strong>Bộ lọc in đang áp dụng:</strong></span>
                {selectedClassId !== 'all' && (
                  <span>• Lớp: <strong>{currentClass?.name}</strong></span>
                )}
                {subjectFilter !== 'all' && (
                  <span>• Môn học: <strong>{subjects.find((s) => s.id === subjectFilter)?.name || subjectFilter}</strong></span>
                )}
                {dayFilter !== 'all' && (
                  <span>• Ngày trong tuần: <strong>Thứ {dayFilter}</strong></span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 p-3 border border-black text-xs leading-relaxed bg-neutral-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <strong>{selectedClassId === 'all' ? 'Phạm vi:' : 'Lớp:'}</strong>{' '}
                {selectedClassId === 'all'
                  ? `Toàn trường (${classes.length} lớp)`
                  : currentClass
                  ? `${currentClass.name} (Khối ${currentClass.grade})`
                  : 'Chưa chọn lớp'}
              </div>
              <div>
                <strong>Buổi học:</strong>{' '}
                {selectedClassId === 'all' ? 'Toàn bộ Ca Sáng & Ca Chiều' : shift === 'morning' ? 'Ca Sáng (Tiết 1 - 5)' : 'Ca Chiều (Tiết 6 - 10)'}
              </div>
              <div>
                <strong>Phòng học:</strong>{' '}
                {selectedClassId === 'all' ? 'Theo phòng học các lớp' : currentClass?.room_name || 'Phòng học cố định'}
              </div>
              <div>
                <strong>{selectedClassId === 'all' ? 'Quản lý biểu:' : 'GVCN:'}</strong>{' '}
                {selectedClassId === 'all'
                  ? 'Ban Giám Hiệu'
                  : teachers.find((t) => t.id === currentClass?.teacher_id)?.name || 'Chưa phân công'}
              </div>
            </div>
            {(teacherFilter !== 'all' || subjectFilter !== 'all' || dayFilter !== 'all') && (
              <div className="mt-2 pt-2 border-t border-dashed border-gray-400 text-[11px] text-gray-700 flex flex-wrap gap-4">
                <span><strong>Bộ lọc in đang áp dụng:</strong></span>
                {teacherFilter !== 'all' && (
                  <span>• Giáo viên: <strong>{teachers.find((t) => t.id === teacherFilter)?.name || teacherFilter}</strong></span>
                )}
                {subjectFilter !== 'all' && (
                  <span>• Môn học: <strong>{subjects.find((s) => s.id === subjectFilter)?.name || subjectFilter}</strong></span>
                )}
                {dayFilter !== 'all' && (
                  <span>• Ngày trong tuần: <strong>Thứ {dayFilter}</strong></span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timetable Matrix Print Table */}
        <table className="w-full border-collapse border border-black text-black text-xs text-center mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-14 font-bold text-center">BUỔI</th>
              <th className="border border-black p-2 w-14 font-bold text-center">TIẾT</th>
              <th className="border border-black p-2 w-24 font-bold text-center">THỜI GIAN</th>
              {printDays.map((d) => (
                <th key={d.day} className="border border-black p-2 font-bold uppercase text-center">
                  {d.name}
                  {d.day === 7 && <span className="block text-[10px] font-normal">(3 Tiết)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {printPeriods.map((p) => {
              const isFirstOfMorning = p.period === 1;
              const isFirstOfAfternoon = p.period === 6;
              const morningPeriodsCount = printPeriods.filter((item) => item.period <= 5).length;
              const afternoonPeriodsCount = printPeriods.filter((item) => item.period > 5).length;

              return (
                <tr key={p.period}>
                  {isFirstOfMorning && (
                    <td
                      rowSpan={morningPeriodsCount}
                      className="border border-black p-2 font-bold bg-neutral-50 align-middle text-center w-14"
                    >
                      SÁNG
                    </td>
                  )}
                  {isFirstOfAfternoon && (
                    <td
                      rowSpan={afternoonPeriodsCount}
                      className="border border-black p-2 font-bold bg-neutral-50 align-middle text-center w-14"
                    >
                      CHIỀU
                    </td>
                  )}
                  <td className="border border-black p-2 font-bold text-center">{p.period}</td>
                  <td className="border border-black p-2 font-mono text-[11px] text-center whitespace-nowrap">
                    {p.startTime} - {p.endTime}
                  </td>
                  {printDays.map((d) => {
                    const slotEntries = selectedClassId === 'all'
                      ? (entriesBySlotMap.get(`${d.day}_${p.period}`) || [])
                      : (entryLookupMap.get(`${selectedClassId}_${d.day}_${p.period}`)
                          ? [entryLookupMap.get(`${selectedClassId}_${d.day}_${p.period}`)!]
                          : []);

                    return (
                      <td key={d.day} className="border border-black p-2 align-middle text-center">
                        {slotEntries.length > 0 ? (
                          <div className="space-y-1">
                            {slotEntries.map((entry) => (
                              <div key={entry.id} className="leading-tight">
                                {(!selectedClassId || selectedClassId === 'all' || selectedTeacher) && (
                                  <div className="font-bold text-[10px] uppercase text-sky-950 bg-sky-100 px-1.5 py-0.5 rounded-xs inline-block mb-0.5 border border-sky-300">
                                    LỚP {entry.className || classes.find((c) => c.id === entry.class_id)?.name}
                                  </div>
                                )}
                                <div className="font-bold text-xs uppercase text-black">{entry.subjectName}</div>
                                {!selectedTeacher && entry.teacherName && (
                                  <div className="text-[11px] text-neutral-800">{entry.teacherName}</div>
                                )}
                                {entry.effectiveRoom && (
                                  <div className="text-[10px] text-neutral-600 italic">P: {entry.effectiveRoom}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Audit / Violation notes if any */}
        {currentClassViolations.length > 0 && (
          <div className="mb-4 p-2.5 border border-black text-[11px] leading-relaxed bg-neutral-50">
            <strong>Ghi chú cảnh báo TKB của lớp:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {currentClassViolations.map((v, i) => (
                <li key={i}>{v.violation}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Signatures */}
        <PrintSignatures
          principalTitle="HIỆU TRƯỞNG PHÊ DUYỆT"
          creatorRoleTitle={
            selectedTeacher
              ? 'GIÁO VIÊN GIẢNG DẠY'
              : selectedClassId === 'all'
              ? 'NGƯỜI LẬP THỜI KHÓA BIỂU'
              : 'GIÁO VIÊN CHỦ NHIỆM'
          }
          creatorName={
            selectedTeacher
              ? selectedTeacher.name
              : selectedClassId === 'all'
              ? (user?.name || 'Ban Giám Hiệu')
              : (teachers.find((t) => t.id === currentClass?.teacher_id)?.name || user?.name || 'Ban Giám Hiệu')
          }
        />
      </div>

      {/* DEDICATED AUDIT MODAL */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Kiểm toán Hệ thống Thời khóa biểu (Timetable Audit)"
        size="3xl"
      >
        <div className="space-y-6">
          {/* Header diagnostic summary */}
          <div className="p-4 rounded-sm bg-surface-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-text-muted font-medium">Phạm vi kiểm toán:</div>
              <div className="text-sm font-bold text-text-primary">
                {auditScope === 'school' ? 'Toàn bộ 16 lớp THCS (Toàn trường)' : (currentClass?.name || 'Chưa chọn lớp')}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={auditScope === 'school' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleRunAudit('school')}
                className="text-xs cursor-pointer"
              >
                Quét toàn trường
              </Button>
              <Button
                variant={auditScope === 'class' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleRunAudit('class')}
                className="text-xs cursor-pointer"
              >
                Quét lớp hiện tại
              </Button>
            </div>
          </div>

          {/* 4 Diagnostic Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={cn(
              'p-3.5 rounded-sm border flex flex-col justify-between shadow-xs',
              (auditReport?.classConflicts.length || 0) === 0 ? 'bg-success-bg/40 border-success/30 text-success' : 'bg-danger-bg/60 border-danger/40 text-danger'
            )}>
              <span className="text-[11px] font-bold text-text-muted">Trùng lịch lớp</span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold">{auditReport?.classConflicts.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.classConflicts.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>

            <div className={cn(
              'p-3.5 rounded-sm border flex flex-col justify-between shadow-xs',
              (auditReport?.teacherConflicts.length || 0) === 0 ? 'bg-success-bg/40 border-success/30 text-success' : 'bg-danger-bg/60 border-danger/40 text-danger'
            )}>
              <span className="text-[11px] font-bold text-text-muted">Trùng giáo viên</span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold">{auditReport?.teacherConflicts.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.teacherConflicts.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>

            <div className={cn(
              'p-3.5 rounded-sm border flex flex-col justify-between shadow-xs',
              (auditReport?.roomConflicts.length || 0) === 0 ? 'bg-success-bg/40 border-success/30 text-success' : 'bg-danger-bg/60 border-danger/40 text-danger'
            )}>
              <span className="text-[11px] font-bold text-text-muted">Trùng phòng học</span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold">{auditReport?.roomConflicts.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.roomConflicts.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>

            <div className={cn(
              'p-3.5 rounded-sm border flex flex-col justify-between shadow-xs',
              (auditReport?.ruleViolations.length || 0) === 0 ? 'bg-success-bg/40 border-success/30 text-success' : 'bg-danger-bg/60 border-danger/40 text-danger'
            )}>
              <span className="text-[11px] font-bold text-text-muted">Tiết liên tiếp</span>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-xl font-bold">{auditReport?.ruleViolations.length || 0}</span>
                <span className="text-xs font-bold">
                  {(auditReport?.ruleViolations.length || 0) === 0 ? '✓ Tốt' : '✗ Vi phạm'}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Details */}
          {auditReport?.isValid ? (
            <div className="p-6 rounded-sm bg-success-bg/50 border border-success/40 text-center space-y-2 shadow-xs">
              <CheckCircle size={36} weight="fill" className="text-success mx-auto" />
              <div className="text-sm font-bold text-success">
                Thời khóa biểu đạt chuẩn 100% không có xung đột!
              </div>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Không phát hiện trùng tiết lớp học, không trùng lịch giáo viên, không trùng phòng học và tất cả các môn đều tuân thủ định mức tiết học liên tiếp.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              <div className="text-xs font-bold text-text-primary uppercase tracking-wide">
                Chi tiết danh sách các vi phạm cần khắc phục:
              </div>

              {/* Class conflicts */}
              {auditReport?.classConflicts.map((c, idx) => (
                <div key={`cc-${idx}`} className="p-3.5 rounded-sm bg-danger-bg/60 border border-danger/40 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-danger text-white uppercase">
                      Trùng tiết cùng lớp
                    </span>
                    <span className="text-xs font-bold text-danger">{c.className}</span>
                    <span className="text-xs text-text-secondary">· {c.dayName}, {c.periodLabel}</span>
                  </div>
                  <div className="text-xs text-danger font-medium">{c.message}</div>
                </div>
              ))}

              {/* Teacher conflicts */}
              {auditReport?.teacherConflicts.map((t, idx) => (
                <div key={`tc-${idx}`} className="p-3.5 rounded-sm bg-warning-bg/60 border border-warning/40 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-warning text-white uppercase">
                      Trùng lịch giáo viên
                    </span>
                    <span className="text-xs font-bold text-warning-700">{t.teacherName}</span>
                    <span className="text-xs text-text-secondary">· {t.dayName}, {t.periodLabel}</span>
                  </div>
                  <div className="text-xs text-warning-700 font-medium">{t.message}</div>
                </div>
              ))}

              {/* Room conflicts */}
              {auditReport?.roomConflicts.map((r, idx) => (
                <div key={`rc-${idx}`} className="p-3.5 rounded-sm bg-warning-bg/60 border border-warning/40 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-warning text-white uppercase">
                      Trùng phòng học
                    </span>
                    <span className="text-xs font-bold text-warning-700">{r.room}</span>
                    <span className="text-xs text-text-secondary">· {r.dayName}, {r.periodLabel}</span>
                  </div>
                  <div className="text-xs text-warning-700 font-medium">{r.message}</div>
                </div>
              ))}

              {/* Rule violations (Consecutive periods) */}
              {auditReport?.ruleViolations.map((rv, idx) => (
                <div key={`rv-${idx}`} className="p-3.5 rounded-sm bg-danger-bg/60 border border-danger/40 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-danger text-white uppercase">
                      Quy tắc tiết liên tiếp
                    </span>
                    <span className="text-xs font-bold text-danger">{rv.className}</span>
                    <span className="text-xs text-text-secondary">· {rv.subjectName} ({rv.dayName}, {rv.periodLabels})</span>
                  </div>
                  <div className="text-xs text-danger font-medium">{rv.violation}</div>
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
              className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
                className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
                className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
              className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
              className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
            >
              <option value="">-- Chưa chỉ định (Hệ thống tự động gán) --</option>
              {modalAvailableTeachers.map((t) => (
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
            <div className="p-3 rounded-sm bg-danger-bg border border-danger/40 text-xs text-danger flex items-start gap-2">
              <WarningCircle size={16} weight="fill" className="text-danger flex-shrink-0 mt-0.5" />
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
              variant="primary"
              size="sm"
              onClick={handleSaveEntry}
              disabled={(formValidation !== null && !formValidation.valid) || (modalMode === 'edit' && !isEntryDirty)}
              className={cn(
                'cursor-pointer',
                modalMode === 'edit' && !isEntryDirty && 'opacity-50 cursor-not-allowed'
              )}
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

          <div className="p-3 bg-surface-muted rounded-sm border border-border text-xs">
            <span className="font-bold text-text-primary">Tiết nguồn:</span> Thứ {swapSourceSlot?.day}, Tiết {swapSourceSlot?.period}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">Thứ đích</label>
              <select
                value={swapTargetDay}
                onChange={(e) => setSwapTargetDay(parseInt(e.target.value, 10))}
                className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
                className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
            <Button variant="primary" size="sm" onClick={handleExecuteSwap} className="cursor-pointer">
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
        description={`Hệ thống sẽ điền lịch chuẩn THCS cho ${currentClass?.name}. Mọi xung đột lịch dạy với các lớp khác sẽ được kiểm tra nguyên tử (atomic) trước khi ghi.`}
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
              className="w-full text-xs h-9 px-3 rounded-sm border border-border bg-surface text-text-primary font-medium focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
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
            <Button variant="primary" size="sm" onClick={handleCopyTimetable} className="cursor-pointer">
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
        description={`Bạn có chắc chắn muốn xóa toàn bộ thời khóa biểu của ${currentClass?.name}? Thao tác này không thể hoàn tác.`}
        confirmText="Xác nhận xóa sạch"
        variant="danger"
      />
    </div>
  );
}
