'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChalkboardTeacher,
  Chalkboard,
  Student,
  CheckCircle,
  Plus,
  ArrowRight,
  UserCheck,
  ShieldCheck,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { UserRow, ClassRow, StudentRow } from '@/types';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTeachers(LocalStore.getTeachers());
    setClasses(LocalStore.getClasses());
    setStudents(LocalStore.getStudents());
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
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
  const assignedClassesCount = classes.filter((c) => c.status === 'active' && c.teacher_id).length;
  const assignmentRate = activeClasses > 0 ? Math.round((assignedClassesCount / activeClasses) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} weight="bold" />
              Trường THCS Nguyễn Tất Thành
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-surface-muted text-text-secondary border border-border rounded-lg">
              Năm học: 2026 - 2027
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Học kỳ 1
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mt-2">
            Tổng quan Điều hành Hệ thống
          </h1>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Báo cáo tổng hợp giáo viên, lớp học và quy mô học sinh toàn trường THCS Nguyễn Tất Thành
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/admin/teachers">
            <Button variant="secondary" size="sm">
              <Plus size={16} />
              <span>Thêm Giáo viên</span>
            </Button>
          </Link>
          <Link href="/admin/classes">
            <Button variant="primary" size="sm">
              <Plus size={16} />
              <span>Tạo Lớp học mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Teachers */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Tổng giáo viên</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
              <ChalkboardTeacher size={22} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary">{teachers.length}</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {activeTeachers} hoạt động
            </span>
          </div>
          <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
            <UserCheck size={14} className="text-indigo-500" />
            <span>100% giáo viên đủ chuẩn GDPT</span>
          </div>
        </div>

        {/* Card 2: Classes */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Tổng số lớp học</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <Chalkboard size={22} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary">{activeClasses}</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              4 khối (6 - 9)
            </span>
          </div>
          <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
            <span>Năm học: 2026 - 2027</span>
          </div>
        </div>

        {/* Card 3: Students */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Tổng số học sinh</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Student size={22} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary">{students.length}</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              em toàn trường
            </span>
          </div>
          <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
            <span>Định mức 30 học sinh / lớp</span>
          </div>
        </div>

        {/* Card 4: Assignment */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs relative overflow-hidden group hover:border-violet-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Tỷ lệ phân công</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 group-hover:scale-105 transition-transform">
              <CheckCircle size={22} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary">{assignmentRate}%</span>
            <span className="text-xs text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              {assignedClassesCount}/{activeClasses} lớp có GVCN
            </span>
          </div>
          <div className="mt-2 w-full bg-surface-muted h-1.5 rounded-full overflow-hidden">
            <div className="bg-violet-600 h-full rounded-full transition-all" style={{ width: `${assignmentRate}%` }} />
          </div>
        </div>
      </div>

      {/* Grade & Subject Distribution */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-text-primary">Quy mô các khối lớp & Bộ môn GDPT 2018</h2>
            <p className="text-xs text-text-muted mt-0.5">Trường THCS Nguyễn Tất Thành · 16 lớp học chuẩn hóa</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
            10 môn học theo chuẩn Bộ GD&ĐT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { grade: 6, color: 'indigo', label: 'Khối 6' },
            { grade: 7, color: 'emerald', label: 'Khối 7' },
            { grade: 8, color: 'amber', label: 'Khối 8' },
            { grade: 9, color: 'violet', label: 'Khối 9' },
          ].map((item) => {
            const gClasses = classes.filter((c) => c.grade === item.grade && c.status === 'active');
            const gStudents = students.filter((s) => gClasses.some((c) => c.id === s.class_id));
            return (
              <div
                key={item.grade}
                className="p-4 bg-surface-muted/40 rounded-xl border border-border/80 space-y-2 hover:bg-surface-muted/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="text-sm font-bold text-text-primary">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface text-text-primary border border-border">
                    {gClasses.length} lớp
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-text-muted">Tổng học sinh</span>
                  <span className="text-sm font-bold text-text-primary">{gStudents.length} học sinh</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {gClasses.map((c) => (
                    <span
                      key={c.id}
                      className="text-[11px] font-medium px-2 py-0.5 bg-surface rounded-md border border-border text-text-secondary"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Recent Teachers & Recent Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Overview */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">Đội ngũ Giáo viên</h2>
              <p className="text-xs text-text-muted mt-0.5">Giáo viên chủ nhiệm và phân công phụ trách</p>
            </div>
            <Link
              href="/admin/teachers"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/20 transition-colors"
            >
              <span>Xem tất cả ({teachers.length})</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {teachers.slice(0, 5).map((t) => {
              const assigned = classes.filter((c) => c.teacher_id === t.id);
              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200/70 flex-shrink-0">
                      {t.name.charAt(t.name.lastIndexOf(' ') + 1) || t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate flex items-center gap-2">
                        <span>{t.name}</span>
                        {t.status === 'disabled' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                            Đã khóa
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">{t.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {assigned.length > 0 ? (
                      assigned.map((c) => (
                        <span
                          key={c.id}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic bg-surface-muted px-2 py-0.5 rounded-md">
                        Chưa làm GVCN
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classes Overview */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">Lớp học Niên khóa 2026 - 2027</h2>
              <p className="text-xs text-text-muted mt-0.5">Sĩ số và phòng học các lớp đang hoạt động</p>
            </div>
            <Link
              href="/admin/classes"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/20 transition-colors"
            >
              <span>Xem tất cả ({classes.length})</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {classes
              .filter((c) => c.status === 'active')
              .slice(0, 5)
              .map((c) => {
                const teacher = teachers.find((t) => t.id === c.teacher_id);
                const classStudents = students.filter((s) => s.class_id === c.id);
                return (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className="text-[11px] text-text-muted font-normal">
                          {c.room_name || 'Chưa xếp phòng'}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        GVCN:{' '}
                        {teacher ? (
                          <span className="text-text-secondary font-semibold">{teacher.name}</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Chưa phân công</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-text-primary">
                        {classStudents.length}
                      </span>
                      <span className="text-xs text-text-muted">/{c.max_students} HS</span>
                      <div className="w-16 bg-surface-muted h-1 rounded-full mt-1 overflow-hidden ml-auto">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((classStudents.length / c.max_students) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
