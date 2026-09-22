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
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { ClassRow, StudentRow, DeskWithSeats, AnnouncementRow, AttendanceRow } from '@/types';
import { formatDateVietnamese } from '@/lib/utils';
import { AttendanceBadge, RoleBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useCurrentClass } from '@/contexts/class-context';

export default function DashboardPage() {
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [desks, setDesks] = useState<DeskWithSeats[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentClassId) return;
    const cls = currentClass || LocalStore.getClass(currentClassId);
    const stus = LocalStore.getStudents(currentClassId);
    const dsks = LocalStore.getDesks(currentClassId);
    const anns = LocalStore.getAnnouncements(currentClassId);
    const atts = LocalStore.getAttendanceForDate(todayStr, currentClassId);

    setClassInfo(cls);
    setStudents(stus);
    setDesks(dsks);
    setAnnouncements(anns);
    setTodayAttendance(atts);
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {classInfo.name}
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-surface-muted text-text-secondary rounded-md border border-border">
              {classInfo.room_name || 'Chưa xếp phòng'}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-accent-subtle text-accent rounded-md border border-accent/20">
              Niên khoá {classInfo.school_year || '2025 - 2026'}
            </span>
            {isHomeroom ? (
              <RoleBadge role="HOMEROOM" label="GVCN" />
            ) : (
              <RoleBadge
                role="SUBJECT"
                label={`GVBM: ${teacherSubjects.map((s) => s.name).join(', ')}`}
              />
            )}
          </div>
          <p className="text-xs text-text-muted mt-1.5 capitalize">
            {formatDateVietnamese(todayStr)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/attendance">
            <Button variant="primary">
              <ClipboardText size={16} />
              <span>{isAttendanceDone ? 'Xem điểm danh hôm nay' : 'Điểm danh ngay'}</span>
            </Button>
          </Link>
          <Link href="/seating">
            <Button variant="secondary">
              <Armchair size={16} />
              <span>Sơ đồ chỗ ngồi</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
              GVBM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-text-primary">
                  Giáo viên Bộ môn: {teacherSubjects.map((s) => s.name).join(', ')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium">
                  Chế độ chỉ đọc hồ sơ & Điểm danh tiết
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Bạn có thể điểm danh tiết học của mình, tra cứu danh sách và xem vị trí chỗ ngồi học sinh lớp {classInfo.name}.
              </p>
            </div>
          </div>
          <Link href="/attendance">
            <Button variant="secondary" size="sm" className="whitespace-nowrap">
              Điểm danh tiết học →
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Sĩ số học sinh
            </span>
            <span className="p-1.5 rounded-md bg-surface-muted text-text-secondary">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-text-primary">
              {totalStudents}
            </span>
            <span className="text-xs text-text-muted">học sinh</span>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            {students.filter((s) => s.gender === 'male').length} Nam · {students.filter((s) => s.gender === 'female').length} Nữ
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Chuyên cần hôm nay
            </span>
            <span className="p-1.5 rounded-md bg-success-subtle text-success">
              <CheckCircle size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-text-primary">
              {isAttendanceDone ? `${presentCount}/${totalStudents}` : 'Chưa điểm danh'}
            </span>
            {isAttendanceDone && (
              <span className="text-xs font-medium text-success">
                {Math.round((presentCount / (totalStudents || 1)) * 100)}%
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-text-secondary flex gap-3">
            {isAttendanceDone ? (
              <>
                <span className="text-danger font-medium">{absentCount} vắng</span>
                <span className="text-warning font-medium">{lateCount} muộn</span>
                <span className="text-text-muted">{excusedCount} có phép</span>
              </>
            ) : (
              <span>Chưa có dữ liệu buổi học hôm nay</span>
            )}
          </div>
        </div>

        {/* Card 3: Seating Arrangement */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Chỗ ngồi lớp học
            </span>
            <span className="p-1.5 rounded-md bg-accent-subtle text-accent">
              <Armchair size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-text-primary">
              {seatedCount}/{totalSeats}
            </span>
            <span className="text-xs text-text-muted">ghế đã xếp</span>
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            {desks.length} bàn học · {totalSeats - seatedCount} chỗ trống
          </div>
        </div>

        {/* Card 4: Announcements */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Thông báo lớp
            </span>
            <span className="p-1.5 rounded-md bg-surface-muted text-text-secondary">
              <Megaphone size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-text-primary">
              {announcements.length}
            </span>
            <span className="text-xs text-text-muted">tin tức</span>
          </div>
          <div className="mt-2 text-xs text-text-secondary truncate">
            {announcements.filter((a) => a.is_pinned).length} tin được ghim ưu tiên
          </div>
        </div>
      </div>

      {/* Main Grid: Left side (Attendance & Quick actions), Right side (Announcements & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Attendance summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Tình hình chuyên cần hôm nay
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Danh sách học sinh nghỉ học, đi muộn hoặc có phép trong ngày
                </p>
              </div>
              <Link href="/attendance">
                <Button variant="ghost" size="sm" className="text-xs text-accent">
                  Chi tiết <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="p-5">
              {!isAttendanceDone ? (
                <div className="py-8 text-center">
                  <ClipboardText size={32} className="mx-auto text-text-muted mb-2 opacity-50" />
                  <p className="text-sm font-medium text-text-secondary">
                    Chưa thực hiện điểm danh hôm nay
                  </p>
                  <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                    Giáo viên có thể điểm danh toàn bộ lớp chỉ với 1 cú click chuột.
                  </p>
                  <Link href="/attendance" className="inline-block mt-4">
                    <Button variant="primary" size="sm">
                      Bắt đầu điểm danh
                    </Button>
                  </Link>
                </div>
              ) : nonPresentEntries.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-success-subtle text-success flex items-center justify-center mx-auto mb-2">
                    <CheckCircle size={22} weight="duotone" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    100% học sinh có mặt đầy đủ!
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Không có học sinh nào vắng mặt hay đi muộn trong buổi học hôm nay.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {nonPresentEntries.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <AttendanceBadge status={item.status} />
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {item.studentName}
                          </p>
                          <p className="text-xs text-text-muted">
                            Mã: {item.studentCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-text-secondary italic">
                          {item.note || 'Không có ghi chú'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Classroom Layout preview */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Sơ đồ lớp học nhanh
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Mô hình 25 bàn bố trí theo 5 dãy, mỗi bàn 2 học sinh
                </p>
              </div>
              <Link href="/seating">
                <Button variant="secondary" size="sm" className="text-xs">
                  Chỉnh sửa chỗ ngồi <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            {/* Blackboard indicator */}
            <div className="w-full py-1.5 mb-4 text-center bg-slate-700 text-slate-100 rounded-md text-[11px] font-semibold tracking-wider uppercase shadow-inner">
              Bục giảng & Bảng viết (Hướng nhìn của giáo viên)
            </div>

            {/* Mini desk grid */}
            <div className="grid grid-cols-5 gap-2">
              {desks.slice(0, 10).map((desk) => {
                const leftStu = desk.seats[0]?.student;
                const rightStu = desk.seats[1]?.student;
                return (
                  <div
                    key={desk.id}
                    className="border border-border rounded-lg p-2 bg-surface text-center text-xs shadow-2xs hover:border-accent/40 transition-colors"
                  >
                    <div className="text-text-muted font-mono text-[10px] mb-1">Bàn {desk.desk_number}</div>
                    <div className="truncate font-medium text-text-primary text-[11px]">
                      {leftStu ? leftStu.full_name.split(' ').slice(-1)[0] : '—'}
                    </div>
                    <div className="truncate font-medium text-text-primary text-[11px]">
                      {rightStu ? rightStu.full_name.split(' ').slice(-1)[0] : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <Link href="/seating" className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1">
                <span>Xem toàn bộ 25 bàn và xếp chỗ</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Pinned Announcements & Quick Links */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PushPin size={16} className="text-accent" weight="duotone" />
                <h2 className="text-base font-semibold text-text-primary">
                  Thông báo nổi bật
                </h2>
              </div>
              <Link href="/announcements">
                <Button variant="ghost" size="sm" className="text-xs text-accent">
                  Tất cả <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="p-5 space-y-4">
              {pinnedAnnouncement ? (
                <div className="p-4 rounded-lg bg-surface-subtle border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-text-primary leading-snug">
                      {pinnedAnnouncement.title}
                    </h3>
                    {pinnedAnnouncement.is_pinned && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-subtle text-accent flex-shrink-0">
                        Ghim
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-3">
                    {pinnedAnnouncement.content}
                  </p>
                  <span className="text-[11px] text-text-muted mt-3 block">
                    Đăng ngày {formatDateVietnamese(pinnedAnnouncement.created_at)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-text-muted">Chưa có thông báo nào.</p>
              )}

              {/* Other announcements */}
              <div className="space-y-2 pt-2">
                {announcements
                  .filter((a) => a.id !== pinnedAnnouncement?.id)
                  .slice(0, 2)
                  .map((item) => (
                    <div key={item.id} className="text-xs py-1.5 border-b border-border/50 last:border-0">
                      <Link
                        href="/announcements"
                        className="font-medium text-text-primary hover:text-accent transition-colors line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-text-muted">
                        {formatDateVietnamese(item.created_at)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Teacher quick actions */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              Thao tác nhanh
            </h2>
            <div className="space-y-2">
              <Link href="/students" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs h-9">
                  <Plus size={14} />
                  <span>Thêm học sinh mới</span>
                </Button>
              </Link>
              <Link href="/seating" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs h-9">
                  <Armchair size={14} />
                  <span>Xáo trộn ngẫu nhiên chỗ ngồi</span>
                </Button>
              </Link>
              <Link href="/announcements" className="block">
                <Button variant="secondary" className="w-full justify-start text-xs h-9">
                  <Megaphone size={14} />
                  <span>Tạo thông báo lớp mới</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
