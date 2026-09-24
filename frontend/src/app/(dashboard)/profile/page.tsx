'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  IdentificationBadge,
  Phone,
  EnvelopeSimple,
  Lock,
  ChalkboardTeacher,
  BookOpen,
  CalendarCheck,
  FloppyDisk,
  Chalkboard,
  Printer,
  CalendarDots,
  Clock,
  Sparkle,
  GraduationCap,
} from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
import { LocalStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  TimetableEntryRow,
  SubjectRow,
  ClassRow,
} from '@/types';
import {
  TIMETABLE_PERIODS,
  TIMETABLE_DAYS,
  SUBJECT_COLOR_MAP,
  DEFAULT_SUBJECT_COLOR,
  isAllowedPeriodForDay,
} from '@/lib/constants';
import { PrintHeader, PrintSignatures } from '@/components/common/printable-paper';
import { cn } from '@/lib/utils';

export default function UserProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { currentClass, isHomeroom, teacherSubjects, assignedClasses } = useCurrentClass();
  const schoolSettings = LocalStore.getSchoolSettings();

  // Role Guard: Admin has dedicated /admin/profile and shouldn't view User Profile
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin/profile');
    }
  }, [user, router]);

  // Personal Info Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dirty state checks
  const isProfileDirty = useMemo(() => {
    if (!user) return false;
    return (
      name.trim() !== (user.name || '').trim() ||
      phone.trim() !== (user.phone || '').trim() ||
      email.trim() !== (user.email || '').trim()
    );
  }, [user, name, phone, email]);

  const isPasswordDirty = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      newPassword.trim().length >= 6 &&
      confirmPassword.trim().length > 0
    );
  }, [currentPassword, newPassword, confirmPassword]);

  // Timetable & Teaching Schedule State
  const [allTimetables, setAllTimetables] = useState<TimetableEntryRow[]>([]);
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  useEffect(() => {
    setAllTimetables(LocalStore.getAllTimetables());
    setAllClasses(LocalStore.getClasses());
    setSubjects(LocalStore.getSubjects());
  }, []);

  // Compute teaching slots for current teacher
  const teacherScheduleEntries = useMemo(() => {
    if (!user) return [];
    const subjectAssignments = LocalStore.getSubjectAssignments();

    // Set of "classId_subjectId" assigned to this teacher
    const assignedPairs = new Set(
      subjectAssignments
        .filter((sa) => sa.teacher_id === user.id)
        .map((sa) => `${sa.class_id}_${sa.subject_id}`)
    );

    // Homeroom classes for this teacher
    const homeroomClassIds = new Set(
      allClasses.filter((c) => c.teacher_id === user.id).map((c) => c.id)
    );

    return allTimetables.filter((t) => {
      // 1. Explicitly recorded teacher_id on entry
      if (t.teacher_id === user.id) return true;
      // 2. Teacher assigned to teach this subject in this class
      if (assignedPairs.has(`${t.class_id}_${t.subject_id}`)) return true;
      // 3. Homeroom teacher activity slot (Sinh hoạt lớp)
      if (homeroomClassIds.has(t.class_id) && t.subject_id === 'sub-shl') return true;
      return false;
    });
  }, [user, allTimetables, allClasses]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, TimetableEntryRow>();
    teacherScheduleEntries.forEach((entry) => {
      map.set(`${entry.day_of_week}_${entry.period}`, entry);
    });
    return map;
  }, [teacherScheduleEntries]);

  const subjectMap = useMemo(() => {
    return new Map<string, SubjectRow>(subjects.map((s) => [s.id, s]));
  }, [subjects]);

  const classMap = useMemo(() => {
    return new Map<string, ClassRow>(allClasses.map((c) => [c.id, c]));
  }, [allClasses]);

  // Schedule statistics
  const totalTeachingPeriods = teacherScheduleEntries.length;
  const morningPeriodsCount = teacherScheduleEntries.filter((e) => e.period <= 5).length;
  const afternoonPeriodsCount = teacherScheduleEntries.filter((e) => e.period >= 6).length;
  const taughtClassCount = useMemo(() => {
    return new Set(teacherScheduleEntries.map((e) => e.class_id)).size;
  }, [teacherScheduleEntries]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    if (user) {
      LocalStore.updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim(),
      });
      toast.success('Đã cập nhật thông tin hồ sơ cá nhân thành công!');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (user) {
      LocalStore.updateUser(user.id, {
        password: newPassword,
      });
      toast.success('Đã đổi mật khẩu tài khoản thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  if (!user || user.role === 'ADMIN') {
    return null;
  }

  const morningPeriods = TIMETABLE_PERIODS.filter((p) => p.shift === 'morning');
  const afternoonPeriods = TIMETABLE_PERIODS.filter((p) => p.shift === 'afternoon');

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 w-full max-w-[1400px] mx-auto">
      {/* ============================================================== */}
      {/* 1. SCREEN VIEW (Hidden when printing with no-print)            */}
      {/* ============================================================== */}
      <div className="no-print space-y-8">
        {/* Top Header */}
        <div className="pb-5 border-b border-border-strong flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
                HỒ SƠ CÁ NHÂN GIÁO VIÊN
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-teal-subtle text-teal rounded-xs border border-teal/30">
                {isHomeroom ? 'GV Chủ nhiệm' : 'GV Bộ môn'}
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1">
              Thông tin định danh, chuyên môn phân công và lịch dạy giảng dạy theo tuần
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSchedule}
              className="gap-2 cursor-pointer border-border-strong hover:bg-surface-muted shadow-xs font-bold text-xs"
              title="In lịch dạy cá nhân theo tuần"
            >
              <Printer size={16} weight="bold" />
              <span>In Lịch Dạy</span>
            </Button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-surface border border-border text-xs font-bold text-text-secondary">
              <Chalkboard size={15} className="text-teal" />
              <span>{schoolSettings.schoolName}</span>
            </div>
          </div>
        </div>

        {/* Profile Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Summary Card & Assignment */}
          <div className="space-y-6">
            {/* Avatar & Summary Card */}
            <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs text-center space-y-4">
              <div className="w-20 h-20 rounded-sm bg-accent text-text-primary font-black text-2xl flex items-center justify-center mx-auto border-2 border-border-strong shadow-[2px_2px_0px_#000]">
                {user?.name?.charAt(0) || 'G'}
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
                <p className="text-xs text-text-muted mt-0.5 font-mono">{user?.email}</p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 text-xs font-bold">
                  <ChalkboardTeacher size={14} weight="bold" />
                  <span>{isHomeroom ? `GVCN ${currentClass?.name}` : 'Giáo viên bộ môn'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border grid grid-cols-2 gap-2 text-left text-xs">
                <div className="p-2.5 rounded-xs bg-surface-muted border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Vai trò</span>
                  <span className="font-bold text-text-primary mt-0.5 block">
                    {isHomeroom ? 'Chủ nhiệm' : 'Bộ môn'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xs bg-surface-muted border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-bold block">Số lớp dạy</span>
                  <span className="font-bold text-teal font-mono text-sm mt-0.5 block">
                    {assignedClasses.length} lớp
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Classes Widget */}
            <div className="bg-surface rounded-sm border border-border-strong p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary pb-2 border-b border-border">
                <BookOpen size={16} className="text-teal" weight="duotone" />
                <span>Phân công chuyên môn & Lớp</span>
              </div>

              <div className="space-y-2 text-xs">
                {isHomeroom && currentClass && (
                  <div className="p-2.5 rounded-xs bg-teal-subtle/50 border border-teal/40">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal">Lớp Chủ nhiệm: {currentClass.name}</span>
                      <span className="font-mono text-[10px] font-bold text-teal bg-white px-1.5 py-0.2 rounded-xs border border-teal/30">
                        Chính
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 flex justify-between">
                      <span>Phòng: {currentClass.room_name || '101'}</span>
                      <span>Sĩ số: {currentClass.max_students || 30} HS</span>
                    </div>
                  </div>
                )}

                {teacherSubjects.length > 0 && (
                  <div className="p-2.5 rounded-xs bg-surface-muted border border-border">
                    <span className="text-[11px] text-text-muted block font-medium">Bộ môn phụ trách:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {teacherSubjects.map((sub) => (
                        <span
                          key={sub.id}
                          className="px-2 py-0.5 rounded-xs bg-white text-text-primary border border-border font-bold text-[11px]"
                        >
                          {sub.name} ({sub.code})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-xs bg-surface-muted border border-border">
                  <span className="text-[11px] text-text-muted block font-medium">Danh sách lớp giảng dạy:</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {assignedClasses.map((cls) => (
                      <span
                        key={cls.id}
                        className="px-2 py-0.5 rounded-xs bg-surface text-text-secondary border border-border font-medium text-[11px]"
                      >
                        {cls.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Update Info & Password Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info Form */}
            <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-3 border-b border-border">
                <IdentificationBadge size={18} className="text-teal" weight="duotone" />
                <span>Chỉnh sửa thông tin liên hệ</span>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="name"
                      label="Họ và tên giáo viên"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="VD: Nguyễn Văn An"
                    />
                  </div>

                  <div>
                    <Input
                      id="phone"
                      label="Số điện thoại liên hệ"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912 345 678"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      id="email"
                      label="Địa chỉ Email đăng nhập"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="teacher@school.edu.vn"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!isProfileDirty}
                    className={cn('gap-2', !isProfileDirty && 'opacity-40 cursor-not-allowed')}
                  >
                    <FloppyDisk size={16} weight="bold" />
                    <span>Cập nhật thông tin</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-3 border-b border-border">
                <Lock size={18} className="text-teal" weight="duotone" />
                <span>Đổi mật khẩu tài khoản</span>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Input
                    id="currentPassword"
                    label="Mật khẩu hiện tại"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      id="newPassword"
                      label="Mật khẩu mới (tối thiểu 6 ký tự)"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <Input
                      id="confirmPassword"
                      label="Xác nhận mật khẩu mới"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!isPasswordDirty}
                    className={cn('gap-2', !isPasswordDirty && 'opacity-40 cursor-not-allowed')}
                  >
                    <Lock size={16} />
                    <span>Lưu mật khẩu mới</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LỊCH DẠY CÁ NHÂN THEO TUẦN (TEACHING TIMETABLE SECTION)         */}
        {/* ============================================================== */}
        <div className="bg-surface rounded-sm border border-border-strong p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-teal text-white flex items-center justify-center font-bold text-sm border border-border-strong shadow-[1px_1px_0px_#000]">
                <CalendarDots size={18} weight="bold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  LỊCH DẠY CÁ NHÂN THEO TUẦN
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Thời khóa biểu giảng dạy các lớp theo từng tiết và ca học trong tuần
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-xs bg-surface-muted border border-border text-xs font-bold text-text-primary">
                Tổng: <span className="font-mono text-teal font-extrabold">{totalTeachingPeriods}</span> tiết/tuần
              </span>
              <span className="px-2.5 py-1 rounded-xs bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600">
                Sáng: {morningPeriodsCount} tiết
              </span>
              <span className="px-2.5 py-1 rounded-xs bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-600">
                Chiều: {afternoonPeriodsCount} tiết
              </span>
              <span className="px-2.5 py-1 rounded-xs bg-teal-subtle text-teal border border-teal/30 text-xs font-bold">
                {taughtClassCount || assignedClasses.length} lớp giảng dạy
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintSchedule}
                className="gap-1.5 font-bold text-xs ml-auto sm:ml-2"
              >
                <Printer size={15} />
                <span>In lịch này</span>
              </Button>
            </div>
          </div>

          {/* Interactive Timetable Grid */}
          <div className="overflow-x-auto rounded-sm border border-border-strong shadow-xs">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border-strong text-text-secondary">
                  <th className="p-2.5 text-center font-bold border-r border-border w-24">Buổi / Tiết</th>
                  <th className="p-2.5 text-center font-bold border-r border-border w-28">Khung giờ</th>
                  {TIMETABLE_DAYS.map((day) => (
                    <th key={day.day} className="p-2.5 text-center font-bold border-r last:border-r-0 border-border min-w-[130px]">
                      <span className="font-extrabold text-text-primary block text-sm">{day.name}</span>
                      <span className="text-[10px] text-text-muted font-normal">Thứ {day.day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Ca Sáng Header */}
                <tr className="bg-amber-500/10 border-b border-border-strong">
                  <td colSpan={8} className="px-3 py-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                    ☀️ Buổi Sáng (Khối 6, 9)
                  </td>
                </tr>

                {/* Ca Sáng Rows */}
                {morningPeriods.map((period) => (
                  <tr key={period.period} className="border-b border-border hover:bg-surface-muted/30 transition-colors">
                    <td className="p-2 text-center font-bold text-text-primary border-r border-border bg-surface-muted/20">
                      {period.label}
                    </td>
                    <td className="p-2 text-center font-mono text-[11px] text-text-muted border-r border-border bg-surface-muted/10">
                      {period.startTime} - {period.endTime}
                    </td>
                    {TIMETABLE_DAYS.map((day) => {
                      const isAllowed = isAllowedPeriodForDay(day.day, period.period);
                      const entry = scheduleMap.get(`${day.day}_${period.period}`);
                      const sub = entry ? subjectMap.get(entry.subject_id) : null;
                      const cls = entry ? classMap.get(entry.class_id) : null;
                      const color = sub ? SUBJECT_COLOR_MAP[sub.code] || DEFAULT_SUBJECT_COLOR : DEFAULT_SUBJECT_COLOR;

                      if (!isAllowed) {
                        return (
                          <td key={day.day} className="p-2 text-center border-r last:border-r-0 border-border bg-slate-100 text-slate-400 text-[11px] italic">
                            Nghỉ
                          </td>
                        );
                      }

                      if (!entry) {
                        return (
                          <td key={day.day} className="p-2 text-center border-r last:border-r-0 border-border text-text-muted/40 font-mono text-[11px]">
                            —
                          </td>
                        );
                      }

                      return (
                        <td key={day.day} className="p-1.5 border-r last:border-r-0 border-border align-middle">
                          <div
                            className={cn(
                              'p-2 rounded-xs border text-left space-y-1 shadow-xs transition-all',
                              color.bg,
                              color.border
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={cn('font-bold text-[12px] truncate', color.text)}>
                                {sub?.name || 'Môn học'}
                              </span>
                              <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded-xs bg-white text-text-primary border border-border shadow-xs">
                                {cls?.name || 'Lớp'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
                              <span>P. {entry.room || cls?.room_name || '101'}</span>
                              <span className="font-mono">{sub?.code}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Ca Chiều Header */}
                <tr className="bg-blue-500/10 border-b border-t border-border-strong">
                  <td colSpan={8} className="px-3 py-1.5 text-xs font-bold text-blue-800 uppercase tracking-wider">
                    🌙 Buổi Chiều (Khối 7, 8)
                  </td>
                </tr>

                {/* Ca Chiều Rows */}
                {afternoonPeriods.map((period) => (
                  <tr key={period.period} className="border-b last:border-b-0 border-border hover:bg-surface-muted/30 transition-colors">
                    <td className="p-2 text-center font-bold text-text-primary border-r border-border bg-surface-muted/20">
                      {period.label}
                    </td>
                    <td className="p-2 text-center font-mono text-[11px] text-text-muted border-r border-border bg-surface-muted/10">
                      {period.startTime} - {period.endTime}
                    </td>
                    {TIMETABLE_DAYS.map((day) => {
                      const isAllowed = isAllowedPeriodForDay(day.day, period.period);
                      const entry = scheduleMap.get(`${day.day}_${period.period}`);
                      const sub = entry ? subjectMap.get(entry.subject_id) : null;
                      const cls = entry ? classMap.get(entry.class_id) : null;
                      const color = sub ? SUBJECT_COLOR_MAP[sub.code] || DEFAULT_SUBJECT_COLOR : DEFAULT_SUBJECT_COLOR;

                      if (!isAllowed) {
                        return (
                          <td key={day.day} className="p-2 text-center border-r last:border-r-0 border-border bg-slate-100 text-slate-400 text-[11px] italic">
                            Nghỉ
                          </td>
                        );
                      }

                      if (!entry) {
                        return (
                          <td key={day.day} className="p-2 text-center border-r last:border-r-0 border-border text-text-muted/40 font-mono text-[11px]">
                            —
                          </td>
                        );
                      }

                      return (
                        <td key={day.day} className="p-1.5 border-r last:border-r-0 border-border align-middle">
                          <div
                            className={cn(
                              'p-2 rounded-xs border text-left space-y-1 shadow-xs transition-all',
                              color.bg,
                              color.border
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={cn('font-bold text-[12px] truncate', color.text)}>
                                {sub?.name || 'Môn học'}
                              </span>
                              <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded-xs bg-white text-text-primary border border-border shadow-xs">
                                {cls?.name || 'Lớp'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
                              <span>P. {entry.room || cls?.room_name || '101'}</span>
                              <span className="font-mono">{sub?.code}</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PRINT-ONLY A4 VIEW (hidden on screen, visible on print)     */}
      {/* ============================================================== */}
      <div className="hidden print:block p-4 max-w-[100%] mx-auto text-black bg-white printable-card">
        <PrintHeader
          settings={schoolSettings}
          title="LỊCH DẠY CÁ NHÂN THEO TUẦN"
          subtitle={`Họ và tên Giáo viên: ${user?.name || ''} · Chức vụ: ${isHomeroom ? `GVCN ${currentClass?.name}` : 'Giáo viên Bộ môn'}`}
          rightMeta={
            <div className="space-y-0.5">
              <div>Số tiết dạy/tuần: <strong className="font-mono">{totalTeachingPeriods} tiết</strong></div>
              <div>Số lớp phụ trách: <strong className="font-mono">{taughtClassCount || assignedClasses.length} lớp</strong></div>
            </div>
          }
        />

        <div className="my-4">
          <table className="w-full text-xs border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="p-2 text-center font-bold border border-black w-20">Buổi / Tiết</th>
                <th className="p-2 text-center font-bold border border-black w-24">Thời gian</th>
                {TIMETABLE_DAYS.map((day) => (
                  <th key={day.day} className="p-2 text-center font-bold border border-black">
                    <span className="block font-bold text-[13px]">{day.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Ca Sáng Header */}
              <tr className="bg-gray-50 border-b border-black">
                <td colSpan={8} className="p-1.5 font-bold uppercase text-[11px] tracking-wide text-left pl-3 border border-black">
                  Buổi Sáng (Khối 6, 9)
                </td>
              </tr>
              {morningPeriods.map((period) => (
                <tr key={period.period} className="border-b border-black">
                  <td className="p-1.5 text-center font-bold border border-black">{period.label}</td>
                  <td className="p-1.5 text-center font-mono text-[10px] border border-black">
                    {period.startTime} - {period.endTime}
                  </td>
                  {TIMETABLE_DAYS.map((day) => {
                    const isAllowed = isAllowedPeriodForDay(day.day, period.period);
                    const entry = scheduleMap.get(`${day.day}_${period.period}`);
                    const sub = entry ? subjectMap.get(entry.subject_id) : null;
                    const cls = entry ? classMap.get(entry.class_id) : null;

                    if (!isAllowed) {
                      return (
                        <td key={day.day} className="p-1.5 text-center border border-black text-gray-400 italic text-[10px]">
                          Nghỉ
                        </td>
                      );
                    }

                    if (!entry) {
                      return (
                        <td key={day.day} className="p-1.5 text-center border border-black text-gray-300 font-mono">
                          -
                        </td>
                      );
                    }

                    return (
                      <td key={day.day} className="p-1 text-center border border-black">
                        <div className="font-bold text-[11px] leading-tight">{sub?.name}</div>
                        <div className="text-[10px] font-bold text-gray-800 leading-tight mt-0.5">
                          {cls?.name} (P.{entry.room || cls?.room_name || '101'})
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Ca Chiều Header */}
              <tr className="bg-gray-50 border-b border-black border-t-2">
                <td colSpan={8} className="p-1.5 font-bold uppercase text-[11px] tracking-wide text-left pl-3 border border-black">
                  Buổi Chiều (Khối 7, 8)
                </td>
              </tr>
              {afternoonPeriods.map((period) => (
                <tr key={period.period} className="border-b border-black">
                  <td className="p-1.5 text-center font-bold border border-black">{period.label}</td>
                  <td className="p-1.5 text-center font-mono text-[10px] border border-black">
                    {period.startTime} - {period.endTime}
                  </td>
                  {TIMETABLE_DAYS.map((day) => {
                    const isAllowed = isAllowedPeriodForDay(day.day, period.period);
                    const entry = scheduleMap.get(`${day.day}_${period.period}`);
                    const sub = entry ? subjectMap.get(entry.subject_id) : null;
                    const cls = entry ? classMap.get(entry.class_id) : null;

                    if (!isAllowed) {
                      return (
                        <td key={day.day} className="p-1.5 text-center border border-black text-gray-400 italic text-[10px]">
                          Nghỉ
                        </td>
                      );
                    }

                    if (!entry) {
                      return (
                        <td key={day.day} className="p-1.5 text-center border border-black text-gray-300 font-mono">
                          -
                        </td>
                      );
                    }

                    return (
                      <td key={day.day} className="p-1 text-center border border-black">
                        <div className="font-bold text-[11px] leading-tight">{sub?.name}</div>
                        <div className="text-[10px] font-bold text-gray-800 leading-tight mt-0.5">
                          {cls?.name} (P.{entry.room || cls?.room_name || '101'})
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PrintSignatures
          settings={schoolSettings}
          principalTitle="Ban Giám Hiệu phê duyệt"
          homeroomTitle="Giáo viên lập biểu"
          homeroomTeacherName={user?.name}
        />
      </div>
    </div>
  );
}
