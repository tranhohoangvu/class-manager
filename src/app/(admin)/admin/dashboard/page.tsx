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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Tổng quan hệ thống
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Báo cáo tổng hợp giáo viên, lớp học và quy mô học sinh toàn trường
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/teachers">
            <Button variant="secondary">
              <Plus size={16} />
              <span>Thêm Giáo viên</span>
            </Button>
          </Link>
          <Link href="/admin/classes">
            <Button variant="primary">
              <Plus size={16} />
              <span>Tạo Lớp học mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng giáo viên</span>
            <ChalkboardTeacher size={20} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-text-primary">{teachers.length}</span>
            <span className="text-xs text-text-muted font-normal">
              ({activeTeachers} đang hoạt động)
            </span>
          </div>
        </div>

        <div className="metric-card space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng số lớp học</span>
            <Chalkboard size={20} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-text-primary">{activeClasses}</span>
            <span className="text-xs text-text-muted font-normal">
              lớp niên khóa 2025-2026
            </span>
          </div>
        </div>

        <div className="metric-card space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng số học sinh</span>
            <Student size={20} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-text-primary">{students.length}</span>
            <span className="text-xs text-text-muted font-normal">em toàn trường</span>
          </div>
        </div>

        <div className="metric-card space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Tỷ lệ phân công</span>
            <CheckCircle size={20} className="text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-text-primary">{assignmentRate}%</span>
            <span className="text-xs text-text-muted font-normal">
              ({assignedClassesCount}/{activeClasses} lớp đã có GVCN)
            </span>
          </div>
        </div>
      </div>

      {/* Grade & Subject Distribution Bar */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Quy mô các khối & Bộ môn trường THCS</h2>
          <span className="text-xs text-text-muted">10 môn học theo chuẩn GDPT</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[6, 7, 8, 9].map((g) => {
            const gClasses = classes.filter((c) => c.grade === g && c.status === 'active');
            const gStudents = students.filter((s) => gClasses.some((c) => c.id === s.class_id));
            return (
              <div key={g} className="p-3 bg-surface-muted/40 rounded-lg border border-border/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">Khối {g}</span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-accent-subtle text-accent font-medium">
                    {gClasses.length} lớp
                  </span>
                </div>
                <div className="text-sm font-medium text-text-secondary">
                  {gStudents.length} học sinh
                </div>
                <div className="text-[11px] text-text-muted">
                  {gClasses.map((c) => c.name).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Recent Teachers & Recent Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Overview */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Danh sách Giáo viên</h2>
              <p className="text-xs text-text-muted">Giáo viên chủ nhiệm và phân công phụ trách</p>
            </div>
            <Link
              href="/admin/teachers"
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {teachers.slice(0, 5).map((t) => {
              const assigned = classes.filter((c) => c.teacher_id === t.id);
              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-surface-muted text-text-secondary flex items-center justify-center font-medium text-xs flex-shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary truncate flex items-center gap-2">
                        <span>{t.name}</span>
                        {t.status === 'disabled' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
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
                          className="px-2 py-0.5 text-[11px] font-medium bg-accent-subtle text-accent rounded"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-text-muted italic">Chưa có lớp</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classes Overview */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Danh sách Lớp học</h2>
              <p className="text-xs text-text-muted">Các lớp đang hoạt động trong năm học</p>
            </div>
            <Link
              href="/admin/classes"
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={12} />
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
                    <div>
                      <div className="text-xs font-semibold text-text-primary flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className="text-[10px] text-text-muted font-normal">
                          {c.room_name || 'Chưa xếp phòng'}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        GVCN:{' '}
                        {teacher ? (
                          <span className="text-text-secondary font-medium">{teacher.name}</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Chưa phân công</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-text-primary">
                        {classStudents.length}
                      </span>
                      <span className="text-[11px] text-text-muted">/{c.max_students} HS</span>
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
