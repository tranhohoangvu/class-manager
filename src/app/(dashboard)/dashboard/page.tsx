'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  WarningCircle,
  Armchair,
  Megaphone,
  Plus,
  ClipboardText,
  ArrowRight,
  PushPin,
  CalendarDots,
  ChalkboardTeacher,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import {
  ClassRow,
  StudentRow,
  DeskWithSeats,
  AnnouncementRow,
  AttendanceRow,
  TimetableEntryRow,
  SubjectRow,
  UserRow,
} from '@/types';
import { formatDateVietnamese, cn } from '@/lib/utils';
import { AttendanceBadge, RoleBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
import { TimetableService, CurrentPeriodInfo, AuthGuard } from '@/services';
import {
  TIMETABLE_PERIODS,
  TIMETABLE_DAYS,
  SUBJECT_COLOR_MAP,
  DEFAULT_SUBJECT_COLOR,
} from '@/lib/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntryRow[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Map<string, SubjectRow>>(new Map());
  const [teachersMap, setTeachersMap] = useState<Map<string, UserRow>>(new Map());
  const [periodInfo, setPeriodInfo] = useState<CurrentPeriodInfo | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentClassId) return;
    const cls = currentClass || LocalStore.getClass(currentClassId);
    const stus = LocalStore.getStudents(currentClassId);
    const dsks = LocalStore.getDesks(currentClassId);
    const anns = LocalStore.getAnnouncements(currentClassId);
    const atts = LocalStore.getAttendanceForDate(todayStr, currentClassId);
    const tts = TimetableService.getTimetableForClass(currentClassId);

    const subjs = LocalStore.getSubjects();
    const sm = new Map<string, SubjectRow>();
    subjs.forEach((s) => sm.set(s.id, s));

    const usrs = LocalStore.getUsers();
    const tm = new Map<string, UserRow>();
    usrs.forEach((u) => tm.set(u.id, u));

    setClassInfo(cls);
    setStudents(stus);
    setDesks(dsks);
    setAnnouncements(anns);
    setTodayAttendance(atts);
    setTimetable(tts);
    setSubjectsMap(sm);
    setTeachersMap(tm);
    setPeriodInfo(TimetableService.getCurrentPeriodInfo());
    setIsLoaded(true);
  }, [currentClassId, currentClass, todayStr]);

  if (!isLoaded || !classInfo) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Attendance statistics
  const totalStudents = students.length;
  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'absent').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;
  const excusedCount = todayAttendance.filter((a) => a.status === 'excused').length;
  const isAttendanceDone = todayAttendance.length > 0;

  // Seating statistics
  let seatedCount = 0;
  let totalSeats = 0;
  desks.forEach((d) => {
    totalSeats += d.seats.length;
    d.seats.forEach((s) => {
      if (s.student_id) seatedCount++;
    });
  });

  // Notable attendance today (absent or late)
  const nonPresentEntries = todayAttendance
    .filter((a) => a.status !== 'present')
    .map((entry) => {
      const student = students.find((s) => s.id === entry.student_id);
      return {
        ...entry,
        studentName: student ? student.full_name : 'Học sinh',
        studentCode: student ? student.student_code : '',
      };
    });

  const pinnedAnnouncement = announcements.find((a) => a.is_pinned) || announcements[0];
  const presentRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  // Today's Timetable Schedule Calculation
  const currentDayOfWeek = periodInfo?.dayOfWeek ?? (new Date().getDay() === 0 ? 8 : new Date().getDay() + 1);
  const isWeekend = currentDayOfWeek === 8;
  const todayDayConfig = TIMETABLE_DAYS.find((d) => d.day === (isWeekend ? 2 : currentDayOfWeek));

  const todaySchedule = TIMETABLE_PERIODS.map((period) => {
    const targetDay = isWeekend ? 2 : currentDayOfWeek;
    const entry = timetable.find(
      (t) => t.day_of_week === targetDay && t.period === period.period
    );
    const subj = entry ? subjectsMap.get(entry.subject_id) : null;
    const teacher = entry && entry.teacher_id ? teachersMap.get(entry.teacher_id) : null;

    let status: 'completed' | 'ongoing' | 'upcoming' = 'upcoming';
    if (!isWeekend && periodInfo) {
      if (periodInfo.status === 'after_school') {
        status = 'completed';
      } else if (periodInfo.status === 'in_period' && periodInfo.period !== null) {
        if (period.period < periodInfo.period) status = 'completed';
        else if (period.period === periodInfo.period) status = 'ongoing';
        else status = 'upcoming';
      } else if (periodInfo.status === 'break' && periodInfo.nextPeriod) {
        if (period.period < periodInfo.nextPeriod.period) status = 'completed';
        else status = 'upcoming';
      }
    }

    return {
      period,
      entry,
      subject: subj,
      teacher,
      status,
    };
  });

  const completedPeriodCount = todaySchedule.filter((s) => s.status === 'completed').length;
  const periodProgressPercent = Math.round((completedPeriodCount / 5) * 100);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Editorial Greeting & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Chào buổi sáng, {user?.role === 'ADMIN' || user?.name?.includes('Admin') ? 'Quản trị viên' : (user?.name || 'Thầy/Cô')} 👋
            </h1>
            {isHomeroom ? (
              <RoleBadge role="HOMEROOM" label={`Chủ nhiệm ${classInfo.name}`} size="md" />
            ) : (
              <RoleBadge
                role="SUBJECT"
                label={`GVBM: ${teacherSubjects.map((s) => s.name).join(', ')}`}
                size="md"
              />
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1.5 flex items-center gap-2 flex-wrap font-medium">
            <span className="font-semibold text-text-primary">{classInfo.name}</span>
            <span className="text-text-muted">·</span>
            <span>{classInfo.room_name || 'Chưa xếp phòng'}</span>
            <span className="text-text-muted">·</span>
            <span>Năm học: {classInfo.school_year || '2026 - 2027'}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted capitalize">{formatDateVietnamese(todayStr)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/attendance">
            <Button variant="primary" size="md">
              <ClipboardText size={18} weight="bold" />
              <span>{isAttendanceDone ? 'Xem điểm danh hôm nay' : 'Điểm danh buổi học'}</span>
            </Button>
          </Link>
          <Link href="/seating">
            <Button variant="secondary" size="md">
              <Armchair size={18} weight="bold" />
              <span>Sơ đồ chỗ ngồi</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role Notice for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-5 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-indigo-500/30">
              GVBM
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[14px] text-text-primary">
                  Phân công Bộ môn: {teacherSubjects.map((s) => s.name).join(', ')}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 font-semibold">
                  Điểm danh tiết học & Xem sơ đồ
                </span>
              </div>
              <p className="text-[13px] text-text-muted mt-0.5">
                Bạn có thể ghi nhận chuyên cần cho tiết môn mình phụ trách và tra cứu vị trí ngồi của học sinh {classInfo.name}.
              </p>
            </div>
          </div>
          <Link href="/attendance">
            <Button variant="secondary" size="sm" className="whitespace-nowrap">
              <span>Vào điểm danh tiết</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}

      {/* Classroom Focal Status Card (Centerpiece) */}
      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Center stats: Live Attendance Gauge & Breakdown */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-bold text-text-muted uppercase tracking-wider">
                  Tình trạng chuyên cần ngày hôm nay
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
                    {isAttendanceDone ? `${presentRate}% Có mặt` : 'Chưa điểm danh buổi học'}
                  </span>
                  {isAttendanceDone && (
                    <span className="text-[15px] font-semibold text-text-secondary">
                      ({presentCount}/{totalStudents} học sinh)
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden sm:block">
                <span
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border',
                    isAttendanceDone
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/25'
                  )}
                >
                  {isAttendanceDone ? 'Đã hoàn thành' : 'Đang chờ ghi nhận'}
                </span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-3.5 w-full bg-surface-muted rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-border">
              {isAttendanceDone ? (
                <>
                  <div
                    style={{ width: `${(presentCount / (totalStudents || 1)) * 100}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    title={`Có mặt: ${presentCount}`}
                  />
                  <div
                    style={{ width: `${(lateCount / (totalStudents || 1)) * 100}%` }}
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    title={`Đi muộn: ${lateCount}`}
                  />
                  <div
                    style={{ width: `${(excusedCount / (totalStudents || 1)) * 100}%` }}
                    className="bg-slate-400 h-full rounded-full transition-all duration-500"
                    title={`Có phép: ${excusedCount}`}
                  />
                  <div
                    style={{ width: `${(absentCount / (totalStudents || 1)) * 100}%` }}
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    title={`Vắng: ${absentCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-surface-muted h-full rounded-full animate-pulse" />
              )}
            </div>

            {/* Attendance Detail Badges */}
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-text-secondary">Có mặt:</span>
                <strong className="text-text-primary font-bold">{presentCount}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-text-secondary">Vắng mặt:</span>
                <strong className="text-rose-600 font-bold">{absentCount}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-text-secondary">Đi muộn:</span>
                <strong className="text-amber-600 font-bold">{lateCount}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-text-secondary">Có phép:</span>
                <strong className="text-text-secondary font-bold">{excusedCount}</strong>
              </div>
            </div>
          </div>

          {/* Right side: Quick Specs & Primary Trigger */}
          <div className="lg:col-span-4 lg:border-l lg:border-border lg:pl-8 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-surface-muted/60 border border-border/60">
                <div className="text-xl font-bold text-text-primary">{totalStudents}</div>
                <div className="text-[12px] text-text-muted mt-0.5">Sĩ số lớp</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted/60 border border-border/60">
                <div className="text-xl font-bold text-text-primary">{desks.length}</div>
                <div className="text-[12px] text-text-muted mt-0.5">Bàn học</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-muted/60 border border-border/60">
                <div className="text-xl font-bold text-text-primary">{announcements.length}</div>
                <div className="text-[12px] text-text-muted mt-0.5">Tin thông báo</div>
              </div>
            </div>

            <Link href="/attendance" className="block w-full">
              <Button variant="primary" size="lg" className="w-full justify-center shadow-sm">
                <ClipboardText size={20} weight="bold" />
                <span>{isAttendanceDone ? 'Cập nhật điểm danh' : 'Bắt đầu điểm danh ngay'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Link href="/attendance">
          <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-accent hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardText size={20} weight="duotone" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-primary group-hover:text-accent transition-colors">
                Điểm danh lớp
              </div>
              <div className="text-[11px] text-text-muted">Chuyên cần hôm nay</div>
            </div>
          </div>
        </Link>

        <Link href="/timetable">
          <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-accent hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CalendarDots size={20} weight="duotone" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-primary group-hover:text-accent transition-colors">
                Thời khóa biểu
              </div>
              <div className="text-[11px] text-text-muted">Lịch học 6 ngày</div>
            </div>
          </div>
        </Link>

        <Link href="/seating">
          <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-accent hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Armchair size={20} weight="duotone" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-primary group-hover:text-accent transition-colors">
                Sắp xếp chỗ ngồi
              </div>
              <div className="text-[11px] text-text-muted">Sơ đồ 20 bàn</div>
            </div>
          </div>
        </Link>

        <Link href="/students">
          <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-accent hover:shadow-sm transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Users size={20} weight="duotone" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-primary group-hover:text-accent transition-colors">
                Danh sách học sinh
              </div>
              <div className="text-[11px] text-text-muted">Hồ sơ 40 học sinh</div>
            </div>
          </div>
        </Link>

        <Link href="/announcements">
          <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3 hover:border-accent hover:shadow-sm transition-all cursor-pointer group col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Megaphone size={20} weight="duotone" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-primary group-hover:text-accent transition-colors">
                Bảng thông báo
              </div>
              <div className="text-[11px] text-text-muted">Tin tức lớp học</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Operational Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Today's Timetable, Notable Attendance & Classroom Seating Preview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Widget 1: Lịch học hôm nay (Today's Timetable Widget) */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <CalendarDots size={20} weight="duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-text-primary">
                      Lịch học hôm nay — {isWeekend ? 'Xem trước Thứ Hai' : todayDayConfig?.name}
                    </h2>
                    {isWeekend ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Chủ Nhật (Nghỉ)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Buổi sáng (5 tiết)
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    {isWeekend
                      ? 'Học sinh nghỉ cuối tuần · Hiển thị lịch ngày học kế tiếp'
                      : `Tiến độ: ${completedPeriodCount}/5 tiết hoàn thành (${periodProgressPercent}%)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link href="/timetable">
                  <Button variant="ghost" size="sm" className="text-accent cursor-pointer">
                    <span>Xem TKB tuần</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress bar on active school days */}
            {!isWeekend && (
              <div className="w-full bg-surface-muted h-1 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{ width: `${periodProgressPercent}%` }}
                />
              </div>
            )}

            <div className="p-5 space-y-2.5">
              {todaySchedule.map(({ period, entry, subject, teacher, status }) => {
                const colorStyle = (subject && SUBJECT_COLOR_MAP[subject.code]) || DEFAULT_SUBJECT_COLOR;
                const isOngoing = status === 'ongoing';
                const isCompleted = status === 'completed';
                const targetDay = isWeekend ? 2 : currentDayOfWeek;
                const canAttend = AuthGuard.canAttendPeriod(user, currentClassId, targetDay, period.period);

                return (
                  <div
                    key={period.period}
                    className={cn(
                      'p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all',
                      isOngoing
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400 shadow-2xs'
                        : isCompleted
                        ? 'bg-surface-muted/40 border-border/70 opacity-80'
                        : 'bg-surface border-border hover:border-accent/40'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Period Time Badge */}
                      <div className="text-center w-20 flex-shrink-0">
                        <span className={cn(
                          'text-xs font-bold block',
                          isOngoing ? 'text-blue-700' : 'text-text-primary'
                        )}>
                          {period.label}
                        </span>
                        <span className="text-[11px] text-text-muted block mt-0.5 font-medium">
                          {period.startTime}
                        </span>
                      </div>

                      <div className="h-7 w-[1px] bg-border flex-shrink-0" />

                      {/* Subject & Teacher Info */}
                      {subject ? (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('text-xs font-extrabold px-1.5 py-0.2 rounded border', colorStyle.badgeBg, colorStyle.border)}>
                              {subject.code}
                            </span>
                            <span className="text-sm font-bold text-text-primary">
                              {subject.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5 truncate">
                            <ChalkboardTeacher size={14} className="flex-shrink-0" />
                            <span className="truncate">{teacher?.name || 'Chưa gán GV'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted italic">
                          Tiết tự học / Chưa phân công môn
                        </div>
                      )}
                    </div>

                    {/* Status Badge & Action */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      {isOngoing && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white flex items-center gap-1.5 shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          <span>Đang học</span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                          <CheckCircle size={13} weight="fill" className="text-slate-500" />
                          <span>Đã xong</span>
                        </span>
                      )}

                      {status === 'upcoming' && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border">
                          {period.startTime}
                        </span>
                      )}

                      {subject && (isOngoing || status === 'upcoming') && (
                        canAttend ? (
                          <Link href={`/attendance?subjectId=${subject.id}`}>
                            <Button variant="secondary" size="sm" className="cursor-pointer text-[12px] h-8 px-2.5">
                              <ClipboardText size={14} />
                              <span>Điểm danh</span>
                            </Button>
                          </Link>
                        ) : (
                          <Link
                            href={`/attendance?subjectId=${subject.id}`}
                            title={`Bạn không được phân công dạy môn ${subject.name} (tiết ${period.period}). Bấm để xem chuyên cần ở chế độ chỉ đọc.`}
                          >
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 text-[12px] h-8 px-2.5 rounded-lg bg-surface-muted/80 text-text-muted hover:bg-surface-muted border border-border/80 transition-colors cursor-pointer"
                            >
                              <ClipboardText size={14} className="opacity-50" />
                              <span>Không khả dụng</span>
                            </button>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Notable Attendance List */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Tình hình học sinh cần lưu ý hôm nay
                </h2>
                <p className="text-[13px] text-text-muted mt-0.5">
                  Các trường hợp nghỉ học, đi muộn hoặc xin phép trong buổi
                </p>
              </div>
              <Link href="/attendance">
                <Button variant="ghost" size="sm" className="text-accent">
                  <span>Toàn bộ lớp</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            <div className="p-6">
              {!isAttendanceDone ? (
                <div className="py-10 text-center">
                  <ClipboardText size={36} className="mx-auto text-text-muted mb-2.5 opacity-50" />
                  <p className="text-[15px] font-semibold text-text-secondary">
                    Chưa thực hiện điểm danh hôm nay
                  </p>
                  <p className="text-[13px] text-text-muted mt-1 max-w-sm mx-auto">
                    Bấm &quot;Bắt đầu điểm danh ngay&quot; để ghi nhận nhanh sĩ số và ghi chú cho học sinh.
                  </p>
                  <Link href="/attendance" className="inline-block mt-4">
                    <Button variant="primary" size="md">
                      Bắt đầu điểm danh
                    </Button>
                  </Link>
                </div>
              ) : nonPresentEntries.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={26} weight="duotone" />
                  </div>
                  <p className="text-[16px] font-bold text-text-primary">
                    100% học sinh có mặt đầy đủ!
                  </p>
                  <p className="text-[13px] text-text-muted mt-1">
                    Không có học sinh nào vắng mặt hay đi muộn trong buổi học hôm nay.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {nonPresentEntries.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                      <div className="flex items-center gap-3.5">
                        <AttendanceBadge status={item.status} size="md" />
                        <div>
                          <p className="text-[15px] font-bold text-text-primary">
                            {item.studentName}
                          </p>
                          <p className="text-[12px] text-text-muted">
                            Mã số: {item.studentCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[13px] text-text-secondary italic">
                          {item.note || 'Không có ghi chú'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Spatial Classroom Seating Preview */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Sơ đồ chỗ ngồi lớp học
                </h2>
                <p className="text-[13px] text-text-muted mt-0.5">
                  Bố cục 4 dãy × 5 hàng (20 bàn đôi · sức chứa 40 học sinh)
                </p>
              </div>
              <Link href="/seating">
                <Button variant="secondary" size="sm">
                  <span>Chỉnh sửa chỗ ngồi</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            {/* Blackboard & Teacher's Podium Marker (at top matching View A - Nhìn từ dưới lên) */}
            <div className="w-full py-2.5 mb-3 text-center bg-slate-800 text-slate-100 rounded-xl text-[12px] font-bold tracking-wider uppercase shadow-inner border border-slate-700">
              ↑ Phía trước lớp: Bàn giáo viên · Bảng viết phấn · Cửa ra vào
            </div>

            {/* 8 Desks Mini Preview (4 columns × 2 front rows: Row 1 then Row 2, ordered D1 to D4) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2].flatMap((rNum) => {
                const rDesks = desks.filter((d) => d.row_num === rNum);
                return [1, 2, 3, 4].map((cNum) => rDesks.find((d) => d.col_num === cNum)).filter(Boolean);
              }).map((desk) => {
                if (!desk) return null;
                const leftStu = desk.seats[0]?.student;
                const rightStu = desk.seats[1]?.student;
                return (
                  <div
                    key={desk.id}
                    className="border border-border rounded-xl p-2.5 bg-surface-muted/50 text-center hover:border-accent hover:bg-surface transition-all shadow-2xs"
                  >
                    <div className="text-text-muted font-mono text-[11px] font-semibold mb-1.5 flex items-center justify-between px-0.5">
                      <span>Bàn {desk.desk_number.toString().padStart(2, '0')}</span>
                      <span className="text-[10px]">Dãy {desk.col_num}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[12px]">
                      <div
                        className={cn(
                          'truncate py-1 px-1 rounded-md font-semibold',
                          leftStu ? 'bg-surface text-text-primary shadow-2xs' : 'text-text-muted border border-dashed border-border'
                        )}
                        title={leftStu?.full_name || 'Trống'}
                      >
                        {leftStu ? leftStu.full_name.split(' ').slice(-1)[0] : '—'}
                      </div>
                      <div
                        className={cn(
                          'truncate py-1 px-1 rounded-md font-semibold',
                          rightStu ? 'bg-surface text-text-primary shadow-2xs' : 'text-text-muted border border-dashed border-border'
                        )}
                        title={rightStu?.full_name || 'Trống'}
                      >
                        {rightStu ? rightStu.full_name.split(' ').slice(-1)[0] : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-4 pt-3 border-t border-border/60">
              <Link
                href="/seating"
                className="text-[14px] font-semibold text-accent hover:underline inline-flex items-center gap-1.5"
              >
                <span>Xem toàn bộ sơ đồ chỗ ngồi lớp học</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Pinned Announcements & Classroom Information */}
        <div className="space-y-8">
          {/* Pinned Announcements */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PushPin size={18} className="text-accent" weight="duotone" />
                <h2 className="text-lg font-bold text-text-primary">
                  Thông báo lớp
                </h2>
              </div>
              <Link href="/announcements">
                <Button variant="ghost" size="sm" className="text-accent">
                  <span>Tất cả</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>

            <div className="p-6 space-y-4">
              {pinnedAnnouncement ? (
                <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-text-primary leading-snug">
                      {pinnedAnnouncement.title}
                    </h3>
                    {pinnedAnnouncement.is_pinned && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-accent text-white flex-shrink-0 shadow-2xs">
                        Ghim
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-text-secondary mt-2.5 leading-relaxed line-clamp-3">
                    {pinnedAnnouncement.content}
                  </p>
                  <span className="text-[12px] text-text-muted mt-3.5 block font-medium">
                    Đăng ngày {formatDateVietnamese(pinnedAnnouncement.created_at)}
                  </span>
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">Chưa có thông báo nào.</p>
              )}

              {/* Other announcements */}
              <div className="space-y-2 pt-2">
                {announcements
                  .filter((a) => a.id !== pinnedAnnouncement?.id)
                  .slice(0, 2)
                  .map((item) => (
                    <div key={item.id} className="py-2 border-b border-border/50 last:border-0">
                      <Link
                        href="/announcements"
                        className="text-[14px] font-semibold text-text-primary hover:text-accent transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <span className="text-[11px] text-text-muted">
                        {formatDateVietnamese(item.created_at)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Classroom Specifications Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-text-primary">
              Thông tin tổ chức lớp
            </h2>
            <div className="space-y-3 text-[14px]">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-text-muted">Quy mô khối:</span>
                <span className="font-semibold text-text-primary">Khối {classInfo.grade} (THCS)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-text-muted">Sĩ số chuẩn hóa:</span>
                <span className="font-semibold text-text-primary">30 học sinh / lớp</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-text-muted">Quy chuẩn chỗ ngồi:</span>
                <span className="font-semibold text-text-primary">50 chỗ ngồi chuẩn</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-muted">Chương trình:</span>
                <span className="font-semibold text-accent">10 môn học GDPT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
