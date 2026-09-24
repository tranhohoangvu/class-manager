'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  FloppyDisk,
  Check,
  X,
  ClipboardText,
  Calendar,
  WarningCircle,
  ChatText,
  BookOpen,
  Copy,
  MagnifyingGlass,
  Lightning,
  CalendarDots,
  Info,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { AttendanceService, StudentService, TimetableService, AuthGuard, CurrentSessionInfo, CurrentPeriodInfo } from '@/services';
import { StudentRow, AttendanceStatus, SubjectRow, TimetableEntryRow } from '@/types';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/badge';
import { formatDateVietnamese, getTodayISO, cn } from '@/lib/utils';
import { TIMETABLE_PERIODS, TIMETABLE_DAYS, SUBJECT_COLOR_MAP, DEFAULT_SUBJECT_COLOR } from '@/lib/constants';
import { EmptyStateView } from '@/components/ui/state-views';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';

interface StudentAttendanceState {
  student_id: string;
  student_code: string;
  full_name: string;
  status: AttendanceStatus;
  note: string;
}

export default function AttendancePage() {
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState<SubjectRow[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceState>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_present' | 'present' | 'absent' | 'late' | 'excused'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSession, setCurrentSession] = useState<CurrentSessionInfo | null>(null);
  const [periodInfo, setPeriodInfo] = useState<CurrentPeriodInfo | null>(null);
  const [classTimetable, setClassTimetable] = useState<TimetableEntryRow[]>([]);

  useEffect(() => {
    setAllSubjects(LocalStore.getSubjects());
  }, []);

  // Compute teacher's assigned subjects in this class
  const myAssignedSubjects = useMemo(() => {
    return AuthGuard.getTeacherAssignedSubjectsInClass(user, currentClassId);
  }, [user, currentClassId]);

  // Compute if teacher can record attendance for current subject selection
  const canTakeAttendance = useMemo(() => {
    return AuthGuard.canManageAttendance(user, currentClassId, selectedSubjectId);
  }, [user, currentClassId, selectedSubjectId]);

  // Compute if user has permission to VIEW attendance for current subject selection
  const canViewCurrentSubject = useMemo(() => {
    return AuthGuard.canViewAttendance(user, currentClassId, selectedSubjectId);
  }, [user, currentClassId, selectedSubjectId]);

  // Compute if current realtime session is taught by this teacher
  const isCurrentSessionMySubject = useMemo(() => {
    if (!currentSession?.subject) return false;
    return AuthGuard.canManageAttendance(user, currentClassId, currentSession.subject.id);
  }, [user, currentClassId, currentSession]);

  // Check URL query parameters and load timetable session
  useEffect(() => {
    if (!currentClassId) return;

    const session = TimetableService.getCurrentSession(currentClassId);
    const pInfo = TimetableService.getCurrentPeriodInfo();
    const tt = TimetableService.getTimetableForClass(currentClassId);
    const mySubjects = AuthGuard.getTeacherAssignedSubjectsInClass(user, currentClassId);

    setCurrentSession(session);
    setPeriodInfo(pInfo);
    setClassTimetable(tt);

    // If URL has ?subjectId=..., apply it
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSubjectId = params.get('subjectId');
      if (urlSubjectId) {
        setSelectedSubjectId(urlSubjectId);
        return;
      }
    }

    // Smart default selection:
    // If ongoing session is a subject taught by current teacher, select it:
    if (session.isOngoing && session.subject && mySubjects.some((s) => s.id === session.subject!.id)) {
      setSelectedSubjectId(session.subject.id);
    } else if (mySubjects.length > 0) {
      // Default to teacher's first assigned subject in this class
      setSelectedSubjectId(mySubjects[0].id);
    } else if (user?.role === 'ADMIN') {
      setSelectedSubjectId('');
    } else {
      setSelectedSubjectId('');
    }
  }, [currentClassId, user]);

  // Load students & existing attendance for selected date and subject
  const loadData = () => {
    if (!currentClassId) return;
    const stus = StudentService.getStudents(currentClassId).filter((s) => s.status === 'active');
    setStudents(stus);

    // If user lacks permission to VIEW attendance of this subject, do not populate attendance data
    if (!AuthGuard.canViewAttendance(user, currentClassId, selectedSubjectId)) {
      setAttendanceData({});
      setIsLoaded(true);
      return;
    }

    const existingRecords = AttendanceService.getAttendanceForDate(
      selectedDate,
      currentClassId,
      selectedSubjectId || undefined,
      user
    );
    const existingMap = new Map(existingRecords.map((r) => [r.student_id, r]));

    const stateMap: Record<string, StudentAttendanceState> = {};
    stus.forEach((s) => {
      const existing = existingMap.get(s.id);
      stateMap[s.id] = {
        student_id: s.id,
        student_code: s.student_code,
        full_name: s.full_name,
        status: (existing?.status as AttendanceStatus) || 'present',
        note: existing?.note || '',
      };
    });

    setAttendanceData(stateMap);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, currentClassId, selectedSubjectId]);

  // Set status for one student
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Set note for one student
  const handleSetNote = (studentId: string, note: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  // Mark all present button (Teacher super power)
  const handleMarkAllPresent = () => {
    setAttendanceData((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status: 'present' };
      });
      return updated;
    });
    toast.success('Đã đánh dấu toàn bộ học sinh có mặt');
  };

  // Save attendance batch
  const handleSave = () => {
    const entries = Object.values(attendanceData).map((item) => ({
      student_id: item.student_id,
      status: item.status,
      note: item.note,
    }));

    const res = AttendanceService.saveAttendanceBatch(
      selectedDate,
      entries,
      currentClassId || '',
      selectedSubjectId || undefined,
      user
    );

    if (!res.success) {
      toast.error(res.error || 'Lưu điểm danh thất bại');
      return;
    }

    const subName = allSubjects.find((s) => s.id === selectedSubjectId)?.name;
    const scopeLabel = subName ? `tiết môn ${subName}` : 'buổi học';
    toast.success(`Đã lưu điểm danh ${scopeLabel} ngày ${formatDateVietnamese(selectedDate)}`);
  };

  // Metrics
  const list = Object.values(attendanceData);
  const total = list.length;
  const presentCount = list.filter((i) => i.status === 'present').length;
  const absentCount = list.filter((i) => i.status === 'absent').length;
  const lateCount = list.filter((i) => i.status === 'late').length;
  const excusedCount = list.filter((i) => i.status === 'excused').length;
  const notPresentCount = total - presentCount;
  const presentRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Filtered student list for quick review
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      let matchStatus = true;
      if (statusFilter === 'not_present') {
        matchStatus = item.status !== 'present';
      } else if (statusFilter !== 'all') {
        matchStatus = item.status === statusFilter;
      }

      const matchSearch =
        searchQuery.trim() === '' ||
        item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student_code.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [list, statusFilter, searchQuery]);

  const handleCopyReport = () => {
    const absents = list.filter((i) => i.status === 'absent');
    const lates = list.filter((i) => i.status === 'late');
    const excuseds = list.filter((i) => i.status === 'excused');

    const absentListStr = absents.length > 0
      ? absents.map((i) => `${i.full_name}${i.note ? ` (${i.note})` : ''}`).join(', ')
      : 'Không có';

    const excusedListStr = excuseds.length > 0
      ? excuseds.map((i) => `${i.full_name}${i.note ? ` (${i.note})` : ''}`).join(', ')
      : 'Không có';

    const lateListStr = lates.length > 0
      ? lates.map((i) => `${i.full_name}${i.note ? ` (${i.note})` : ''}`).join(', ')
      : 'Không có';

    const reportText = `[BÁO CÁO CHUYÊN CẦN ${selectedSubjectId ? `MÔN ${currentSubjectObj?.name?.toUpperCase()}` : 'ĐẦU GIỜ'}]
Trường THCS Nguyễn Tất Thành
Lớp: ${currentClass?.name || '---'} · Ngày: ${formatDateVietnamese(selectedDate)}
Sĩ số: ${total} học sinh
- Có mặt: ${presentCount}/${total} (${presentRate}%)
- Vắng không phép (${absents.length}): ${absentListStr}
- Vắng có phép (${excuseds.length}): ${excusedListStr}
- Đi muộn (${lates.length}): ${lateListStr}
Người báo cáo: ${user?.name || 'GVCN'}`;

    navigator.clipboard.writeText(reportText);
    toast.success('Đã sao chép báo cáo chuyên cần gửi BGH vào clipboard!');
  };

  if (!isLoaded) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-80 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const currentSubjectObj = allSubjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              ĐIỂM DANH {currentSubjectObj ? `TIẾT ${currentSubjectObj.name}` : 'BUỔI HỌC'}
            </h1>
            {isSubjectTeacher ? (
              <RoleBadge
                role="SUBJECT"
                label={`GVBM: ${teacherSubjects.map((s) => s.name).join(', ')}`}
                size="md"
              />
            ) : (
              <RoleBadge role="HOMEROOM" label="GVCN" size="md" />
            )}
          </div>
          <p className="text-[15px] text-text-secondary mt-2 font-medium">
            Ghi nhận chuyên cần học sinh {currentClass?.name || 'lớp học'} {currentSubjectObj ? `cho tiết học môn ${currentSubjectObj.name}` : 'toàn buổi học'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subject Selector */}
          <div className="flex items-center gap-2 bg-surface border border-border px-3.5 py-2 rounded-sm text-[14px] shadow-xs">
            <BookOpen size={18} className="text-teal flex-shrink-0" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none text-[14px] font-semibold cursor-pointer max-w-[280px] truncate"
            >
              {user?.role === 'ADMIN' && (
                <option value="">Điểm danh chung (Quản trị viên)</option>
              )}
              {myAssignedSubjects.length > 0 && (
                <optgroup label={isHomeroom ? "Môn bạn được phân công (Có quyền điểm danh)" : "Môn bạn phụ trách giảng dạy"}>
                  {myAssignedSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      ✓ Môn {sub.name} ({sub.code})
                    </option>
                  ))}
                </optgroup>
              )}
              {/* Only GVCN and Admin can view other subjects in this class */}
              {(isHomeroom || user?.role === 'ADMIN') && (
                <optgroup label="Các môn khác trong lớp chủ nhiệm (Chế độ chỉ xem)">
                  {allSubjects
                    .filter((s) => !myAssignedSubjects.some((m) => m.id === s.id))
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        👁 Môn {sub.name} ({sub.code}) — Chỉ xem
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2.5 bg-surface border border-border px-3.5 py-2 rounded-sm text-sm shadow-xs">
            <Calendar size={18} className="text-text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-text-primary focus:outline-none text-[14px] font-mono font-semibold cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={handleMarkAllPresent}
            disabled={!canTakeAttendance}
            className={cn('cursor-pointer', !canTakeAttendance && 'opacity-40 cursor-not-allowed')}
          >
            <CheckCircle size={18} weight="bold" />
            <span>Tất cả có mặt</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!canTakeAttendance}
            className={cn('cursor-pointer', !canTakeAttendance && 'opacity-40 cursor-not-allowed')}
          >
            <FloppyDisk size={18} weight="bold" />
            <span>{canTakeAttendance ? 'Lưu điểm danh' : 'Chỉ xem chuyên cần'}</span>
          </Button>
        </div>
      </div>

      {/* Access Denied Banner when pure GVBM tries to view unassigned subject */}
      {!canViewCurrentSubject && (
        <div className="p-4 rounded-sm bg-danger-bg/70 border border-danger/40 text-danger text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-danger-bg text-danger border border-danger/30 flex items-center justify-center font-bold flex-shrink-0">
              <X size={16} />
            </div>
            <div>
              <span className="font-bold text-danger block text-sm">
                Không có quyền xem chuyên cần: {currentSubjectObj ? `Môn ${currentSubjectObj.name}` : 'Buổi học'}
              </span>
              <span className="text-text-secondary text-xs mt-0.5 block font-medium">
                Giáo viên bộ môn chỉ được xem dữ liệu chuyên cần của các tiết/môn mà mình được phân công phụ trách.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm bg-danger text-white self-start sm:self-auto flex-shrink-0 shadow-2xs">
            Từ chối truy cập
          </span>
        </div>
      )}

      {/* Read-Only Mode Banner when teacher (e.g. GVCN) has view permission but not edit permission */}
      {canViewCurrentSubject && !canTakeAttendance && (
        <div className="p-4 rounded-sm bg-warning-bg/70 border border-warning/40 text-warning-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-warning-bg text-warning-700 border border-warning/30 flex items-center justify-center font-bold flex-shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <span className="font-bold text-warning-700 block text-sm">
                Chế độ chỉ xem chuyên cần: {currentSubjectObj ? `Môn ${currentSubjectObj.name}` : 'Buổi học'}
              </span>
              <span className="text-text-secondary text-xs mt-0.5 block font-medium">
                {isHomeroom
                  ? `Bạn là GVCN lớp ${currentClass?.name}. Bạn có toàn quyền theo dõi chuyên cần toàn lớp nhưng không có quyền ghi nhận hay sửa điểm danh thay giáo viên bộ môn phụ trách.`
                  : user?.role === 'ADMIN'
                  ? 'Vui lòng chọn một môn học cụ thể để điểm danh.'
                  : `Bạn không được phân công giảng dạy môn ${currentSubjectObj?.name || 'này'} tại lớp ${currentClass?.name}.`}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm bg-surface text-warning-700 border border-warning/40 self-start sm:self-auto flex-shrink-0 shadow-2xs">
            Chỉ xem (Read-only)
          </span>
        </div>
      )}

      {/* Smart Contextual Timetable Attendance Banner */}
      {currentSession && currentSession.periodInfo && currentSession.subject && (
        <div className={cn(
          'p-4 rounded-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs',
          isCurrentSessionMySubject
            ? (selectedSubjectId === currentSession.subject.id
                ? 'bg-teal-subtle/80 border-teal/30 text-teal'
                : 'bg-accent-subtle/60 border-border-strong text-accent-text')
            : 'bg-surface-muted border-border text-text-secondary'
        )}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              'w-10 h-10 rounded-sm flex items-center justify-center font-bold border shadow-2xs flex-shrink-0',
              isCurrentSessionMySubject
                ? (selectedSubjectId === currentSession.subject.id ? 'bg-teal text-white border-teal' : 'bg-accent text-accent-text border-border animate-pulse')
                : 'bg-surface text-text-muted border-border'
            )}>
              <Clock size={20} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {currentSession.isOngoing
                    ? `Đang trong giờ học: ${currentSession.periodInfo.label} (${currentSession.periodInfo.startTime} - ${currentSession.periodInfo.endTime})`
                    : `Giờ giải lao: Tiết tiếp theo ${currentSession.periodInfo.label}`}
                </span>
                {isCurrentSessionMySubject ? (
                  selectedSubjectId === currentSession.subject.id ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-teal-subtle text-teal border border-teal/30">
                      ✓ Đang điểm danh đúng môn của bạn
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-accent text-accent-text border border-border">
                      Tiết do bạn phụ trách — Bấm để chọn
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-surface-muted text-text-muted border border-border">
                    Giáo viên khác phụ trách (Chỉ xem)
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 font-medium text-text-secondary">
                Môn <strong className="text-text-primary">{currentSession.subject.name} ({currentSession.subject.code})</strong>
                {currentSession.teacher && (
                  <span> · Phụ trách: <strong className="text-text-primary">{currentSession.teacher.name}</strong></span>
                )}
              </p>
            </div>
          </div>

          {isCurrentSessionMySubject && selectedSubjectId !== currentSession.subject.id && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedSubjectId(currentSession.subject!.id)}
              className="cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Lightning size={16} weight="fill" />
              <span>Chuyển sang môn {currentSession.subject.name}</span>
            </Button>
          )}
        </div>
      )}

      {/* Quick Period Picker Bar for Today's Timetable */}
      {periodInfo && periodInfo.dayOfWeek >= 2 && periodInfo.dayOfWeek <= 7 && (
        <div className="bg-surface border border-border rounded-sm p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDots size={16} className="text-teal" />
              <span>Các tiết học hôm nay ({TIMETABLE_DAYS.find((d) => d.day === periodInfo.dayOfWeek)?.name})</span>
            </span>
            <span className="text-[11px] text-text-muted">
              Chỉ các tiết bạn được phân công mới khả dụng điểm danh
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setSelectedSubjectId('')}
                className={cn(
                  'px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border',
                  selectedSubjectId === ''
                    ? 'bg-accent text-accent-text border-border-strong font-bold shadow-xs'
                    : 'bg-surface-muted/60 text-text-secondary hover:text-text-primary hover:bg-surface-muted border-border'
                )}
              >
                Toàn buổi (Admin)
              </button>
            )}

            {TIMETABLE_PERIODS.map((p) => {
              const entry = classTimetable.find(
                (t) => t.day_of_week === periodInfo.dayOfWeek && t.period === p.period
              );
              const subj = entry ? allSubjects.find((s) => s.id === entry.subject_id) : null;
              if (!subj) return null;

              const isSelected = selectedSubjectId === subj.id;
              const isCurrent = periodInfo.period === p.period;
              const canAttendThisPeriod = AuthGuard.canAttendPeriod(
                user,
                currentClassId,
                periodInfo.dayOfWeek,
                p.period
              );
              const canViewThisPeriod = AuthGuard.canViewAttendance(
                user,
                currentClassId,
                subj.id
              );

              return (
                <button
                  key={p.period}
                  type="button"
                  onClick={() => setSelectedSubjectId(subj.id)}
                  disabled={!canViewThisPeriod}
                  title={
                    canAttendThisPeriod
                      ? `Điểm danh ${p.label}: ${subj.name}`
                      : canViewThisPeriod
                      ? `Xem chuyên cần ${p.label}: ${subj.name} (Chế độ chỉ xem)`
                      : `Tiết ${p.period} do GV khác phụ trách (Không có quyền xem)`
                  }
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5',
                    !canViewThisPeriod
                      ? 'opacity-40 bg-surface-muted/40 text-text-muted border-dashed border-border cursor-not-allowed'
                      : isSelected
                      ? 'bg-accent text-accent-text border-border-strong font-bold shadow-xs cursor-pointer'
                      : isCurrent
                      ? 'bg-teal-subtle text-teal border-teal/30 font-bold cursor-pointer'
                      : !canAttendThisPeriod
                      ? 'bg-warning-bg/40 text-warning-700 border-warning/30 hover:bg-warning-bg/60 cursor-pointer'
                      : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-muted border-border cursor-pointer'
                  )}
                >
                  <span>{p.label}: {subj.name}</span>
                  {!canAttendThisPeriod && canViewThisPeriod && (
                    <span className="text-[10px] px-1 py-0.5 rounded-sm bg-warning-bg text-warning-700 font-bold border border-warning/30">Chỉ xem</span>
                  )}
                  {!canViewThisPeriod && (
                    <span className="text-[10px] text-text-muted">(GV khác)</span>
                  )}
                  {isCurrent && canAttendThisPeriod && (
                    <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-accent-text' : 'bg-teal animate-ping')} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Tổng sĩ số</span>
          <div className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 font-mono tabular-nums">{total}</div>
        </div>

        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-success uppercase tracking-wider">Có mặt</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm bg-success-bg text-success border border-success/30 font-mono tabular-nums">{presentRate}%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-success mt-1 font-mono tabular-nums">{presentCount}</div>
        </div>

        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs">
          <span className="text-[11px] font-bold text-danger uppercase tracking-wider">Vắng mặt</span>
          <div className="text-2xl sm:text-3xl font-bold text-danger mt-1 font-mono tabular-nums">{absentCount}</div>
        </div>

        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs">
          <span className="text-[11px] font-bold text-warning uppercase tracking-wider">Đi muộn</span>
          <div className="text-2xl sm:text-3xl font-bold text-warning mt-1 font-mono tabular-nums">{lateCount}</div>
        </div>

        <div className="bg-surface rounded-sm border border-border p-4 shadow-xs">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Có phép</span>
          <div className="text-2xl sm:text-3xl font-bold text-text-primary mt-1 font-mono tabular-nums">{excusedCount}</div>
        </div>
      </div>

      {/* Quick Filter Tabs & Search & Copy Report Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-accent text-accent-text font-bold shadow-xs border border-border-strong'
                : 'bg-surface hover:bg-surface-muted text-text-secondary border border-border'
            }`}
          >
            Tất cả ({total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('not_present')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'not_present'
                ? 'bg-danger text-white shadow-xs font-bold border border-danger'
                : notPresentCount > 0
                ? 'bg-danger-bg text-danger border border-danger/30 hover:bg-danger-bg/80'
                : 'bg-surface hover:bg-surface-muted text-text-secondary border border-border'
            }`}
            title="Lọc nhanh các học sinh vắng hoặc đi muộn"
          >
            <span>Chưa có mặt</span>
            <span
              className={`px-1.5 py-0.5 rounded-sm text-[11px] font-bold ${
                statusFilter === 'not_present'
                  ? 'bg-white/20 text-white'
                  : notPresentCount > 0
                  ? 'bg-danger text-white'
                  : 'bg-surface-muted text-text-muted'
              }`}
            >
              {notPresentCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('present')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'present'
                ? 'bg-success text-white shadow-xs font-bold border border-success'
                : 'bg-surface hover:bg-surface-muted text-text-secondary border border-border'
            }`}
          >
            Có mặt ({presentCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'absent'
                ? 'bg-danger text-white shadow-xs font-bold border border-danger'
                : 'bg-surface hover:bg-surface-muted text-text-secondary border border-border'
            }`}
          >
            Vắng ({absentCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('late')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'late'
                ? 'bg-warning text-white shadow-xs font-bold border border-warning'
                : 'bg-surface hover:bg-surface-muted text-text-secondary border border-border'
            }`}
          >
            Muộn ({lateCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('excused')}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'excused'
                ? 'bg-accent text-accent-text font-bold shadow-xs border border-border-strong'
                : 'bg-surface hover:bg-surface-muted text-text-secondary border border-border'
            }`}
          >
            Có phép ({excusedCount})
          </button>
        </div>

        {/* Right Search & Copy Report Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Tìm học sinh, mã HS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-[38px] text-xs bg-surface rounded-sm border border-border focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent shadow-xs placeholder:text-text-muted"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="gap-1.5 text-xs whitespace-nowrap flex-shrink-0 cursor-pointer"
            title="Sao chép báo cáo chuyên cần gửi Ban Giám hiệu"
          >
            <Copy size={15} weight="bold" className="text-teal" />
            <span>Sao chép báo cáo BGH</span>
          </Button>
        </div>
      </div>

      {/* Attendance Student List Table */}
      <div className="bg-surface rounded-sm border border-border-strong overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted/90 text-xs font-bold text-text-muted uppercase border-b border-border-strong tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-14 text-center">STT</th>
                <th className="px-5 py-3.5 w-28">Mã HS</th>
                <th className="px-5 py-3.5 min-w-[220px]">Họ và tên học sinh</th>
                <th className="px-5 py-3.5 w-[380px] text-center">Trạng thái điểm danh</th>
                <th className="px-5 py-3.5">Ghi chú / Lý do vắng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {!canViewCurrentSubject ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-text-muted text-sm">
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="font-bold text-danger text-sm">Không có quyền truy cập chuyên cần môn học này</p>
                      <p className="text-xs text-text-muted">
                        Giáo viên bộ môn chỉ được xem dữ liệu điểm danh của các tiết/môn mà mình được phân công giảng dạy.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted text-sm">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                <tr
                  key={item.student_id}
                  className={cn(
                    'hover:bg-accent-subtle/30 transition-colors',
                    item.status === 'absent' && 'bg-danger-bg/40',
                    item.status === 'late' && 'bg-warning-bg/40'
                  )}
                >
                  <td className="px-5 py-3.5 text-center text-text-muted font-mono text-[13px] font-semibold">
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[13px] text-text-secondary font-medium">
                    {item.student_code}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-accent text-accent-text font-bold text-xs flex items-center justify-center flex-shrink-0 border border-border shadow-2xs">
                        {item.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-text-primary text-[14px]">
                        {item.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-center whitespace-nowrap">
                    <div className={cn(
                      "inline-flex items-center gap-1 p-1 bg-surface-muted rounded-sm border border-border shadow-2xs",
                      !canTakeAttendance && "opacity-60 pointer-events-none"
                    )}>
                      {/* Present Button */}
                      <button
                        type="button"
                        disabled={!canTakeAttendance}
                        onClick={() => handleSetStatus(item.student_id, 'present')}
                        title={!canTakeAttendance ? 'Bạn chỉ có quyền xem chuyên cần môn này' : 'Điểm danh: Có mặt'}
                        className={cn(
                          'h-7 px-2.5 rounded-sm text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all',
                          !canTakeAttendance ? 'cursor-not-allowed' : 'cursor-pointer',
                          item.status === 'present'
                            ? 'bg-success-bg text-success border border-success/40 shadow-xs font-bold'
                            : 'text-success hover:bg-success-bg/50'
                        )}
                      >
                        <Check size={13} weight="bold" />
                        <span>Có mặt</span>
                      </button>

                      {/* Absent Button */}
                      <button
                        type="button"
                        disabled={!canTakeAttendance}
                        onClick={() => handleSetStatus(item.student_id, 'absent')}
                        title={!canTakeAttendance ? 'Bạn chỉ có quyền xem chuyên cần môn này' : 'Điểm danh: Vắng'}
                        className={cn(
                          'h-7 px-2.5 rounded-sm text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all',
                          !canTakeAttendance ? 'cursor-not-allowed' : 'cursor-pointer',
                          item.status === 'absent'
                            ? 'bg-danger-bg text-danger border border-danger/40 shadow-xs font-bold'
                            : 'text-danger hover:bg-danger-bg/50'
                        )}
                      >
                        <X size={13} weight="bold" />
                        <span>Vắng</span>
                      </button>

                      {/* Late Button */}
                      <button
                        type="button"
                        disabled={!canTakeAttendance}
                        onClick={() => handleSetStatus(item.student_id, 'late')}
                        title={!canTakeAttendance ? 'Bạn chỉ có quyền xem chuyên cần môn này' : 'Điểm danh: Muộn'}
                        className={cn(
                          'h-7 px-2.5 rounded-sm text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all',
                          !canTakeAttendance ? 'cursor-not-allowed' : 'cursor-pointer',
                          item.status === 'late'
                            ? 'bg-warning-bg text-warning-700 border border-warning/40 shadow-xs font-bold'
                            : 'text-warning-700 hover:bg-warning-bg/50'
                        )}
                      >
                        <Clock size={13} weight="bold" />
                        <span>Muộn</span>
                      </button>

                      {/* Excused Button */}
                      <button
                        type="button"
                        disabled={!canTakeAttendance}
                        onClick={() => handleSetStatus(item.student_id, 'excused')}
                        title={!canTakeAttendance ? 'Bạn chỉ có quyền xem chuyên cần môn này' : 'Điểm danh: Phép'}
                        className={cn(
                          'h-7 px-2.5 rounded-sm text-xs font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all',
                          !canTakeAttendance ? 'cursor-not-allowed' : 'cursor-pointer',
                          item.status === 'excused'
                            ? 'bg-surface text-text-primary border border-border-strong shadow-xs font-bold'
                            : 'text-text-secondary hover:bg-surface-muted'
                        )}
                      >
                        <ClipboardText size={13} weight="bold" />
                        <span>Phép</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      disabled={!canTakeAttendance}
                      value={item.note}
                      onChange={(e) => handleSetNote(item.student_id, e.target.value)}
                      placeholder={
                        !canTakeAttendance
                          ? 'Chế độ chỉ xem'
                          : item.status === 'absent'
                          ? 'Nhập lý do nghỉ học...'
                          : item.status === 'late'
                          ? 'Số phút đi muộn, lý do...'
                          : 'Ghi chú thêm...'
                      }
                      className={cn(
                        "w-full h-9 text-[13px] px-3 bg-surface rounded-sm border border-border focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted shadow-2xs font-normal",
                        !canTakeAttendance && "opacity-60 bg-surface-muted/40 cursor-not-allowed"
                      )}
                    />
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Footer save bar */}
        <div className="px-6 py-4 bg-surface-muted/80 border-t border-border-strong flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-text-secondary font-medium font-mono tabular-nums">
            <span>Sĩ số: <strong className="text-text-primary font-bold">{total}</strong> học sinh</span>
            <span>·</span>
            <span className="text-success font-bold">{presentCount} có mặt</span>
            <span>·</span>
            <span className="text-danger font-bold">{absentCount} vắng</span>
            <span>·</span>
            <span className="text-warning-700 font-bold">{lateCount} muộn</span>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={!canTakeAttendance}
            className={cn('cursor-pointer', !canTakeAttendance && 'opacity-40 cursor-not-allowed')}
          >
            <FloppyDisk size={18} weight="bold" />
            <span>{canTakeAttendance ? 'Lưu kết quả điểm danh' : 'Chỉ xem chuyên cần'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
