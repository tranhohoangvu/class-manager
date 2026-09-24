'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour,
  Student,
  Armchair,
  CalendarDots,
  ClipboardText,
  ClockCounterClockwise,
  Megaphone,
  SignOut,
  ArrowSquareOut,
  ShieldCheck,
  Eye,
  X,
  User,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
import { LocalStore } from '@/lib/store';
import { ClassSwitcher } from './class-switcher';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();

  const navItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: SquaresFour },
    {
      href: '/students',
      label: 'Học sinh',
      icon: Student,
      badge: isSubjectTeacher ? 'Xem' : undefined,
    },
    {
      href: '/seating',
      label: 'Chỗ ngồi',
      icon: Armchair,
      badge: isSubjectTeacher ? 'Xem' : undefined,
    },
    {
      href: '/timetable',
      label: 'Thời khóa biểu',
      icon: CalendarDots,
      badge: isSubjectTeacher ? 'Xem' : undefined,
    },
    {
      href: '/attendance',
      label: isSubjectTeacher
        ? `Điểm danh (${teacherSubjects[0]?.name || 'Bộ môn'})`
        : 'Điểm danh',
      icon: ClipboardText,
      highlight: isSubjectTeacher,
    },
    { href: '/history', label: 'Lịch sử', icon: ClockCounterClockwise },
    {
      href: '/announcements',
      label: 'Thông báo',
      icon: Megaphone,
      badge: isSubjectTeacher ? 'Xem' : undefined,
    },
  ];

  const schoolSettings = LocalStore.getSchoolSettings();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn('app-sidebar', isOpen && 'drawer-open')}>
        {/* Brand & Mobile Close Button */}
        <div className="px-5 py-4 border-b border-border-strong flex items-center justify-between bg-surface-muted/30">
          <div>
            <span className="text-[14px] font-bold tracking-tight text-text-primary block leading-tight">
              {schoolSettings.schoolName || 'THCS Nguyễn Tất Thành'}
            </span>
            <span className="text-[11px] text-teal block mt-0.5 font-bold">
              Năm học {schoolSettings.schoolYear} · {isHomeroom ? 'GV Chủ nhiệm' : 'GV Bộ môn'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng điều hướng"
            className="md:hidden p-1.5 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Class Switcher */}
        <div className="border-b border-border p-3">
          <ClassSwitcher />
          {isSubjectTeacher && (
            <div className="mt-2 text-[11px] font-bold text-teal bg-teal-subtle rounded-sm p-2 border border-teal/25 flex items-center gap-1.5">
              <Eye size={14} className="flex-shrink-0" />
              <span>Chế độ GVBM ({teacherSubjects.map((s) => s.name).join(', ')})</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4" aria-label="Điều hướng lớp học">
          <ul className="space-y-1.5" role="list">
            {navItems.map(({ href, label, icon: Icon, badge, highlight }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => onClose?.()}
                    className={cn(
                      'flex items-center justify-between h-9.5 px-3 rounded-sm transition-all duration-100 group relative',
                      'text-xs font-bold',
                      isActive
                        ? 'bg-accent text-text-primary border border-border-strong shadow-[1px_1px_0px_#000]'
                        : highlight
                        ? 'text-teal bg-teal-subtle/80 hover:bg-teal-subtle border border-teal/25'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={17}
                        weight={isActive ? 'bold' : 'regular'}
                        className={cn(
                          'flex-shrink-0 transition-transform',
                          isActive ? 'text-text-primary' : highlight ? 'text-teal' : 'text-text-muted group-hover:text-text-primary'
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-surface-muted text-text-muted border border-border',
                          isActive && 'border-border-strong text-text-primary'
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Back to Admin Portal for Admins */}
          {user?.role === 'ADMIN' && (
            <div className="mt-6 pt-4 border-t border-border px-1">
              <Link
                href="/admin/dashboard"
                onClick={() => onClose?.()}
                className="flex items-center justify-between h-9 px-3 rounded-sm text-xs font-bold text-teal bg-teal-subtle border border-teal/30 hover:bg-teal-subtle/80 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} weight="bold" />
                  <span>Trở lại Admin Portal</span>
                </span>
                <ArrowSquareOut size={14} />
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom: Hồ sơ cá nhân (chỉ hiển thị cho Giáo viên) + User Info + Sign Out */}
        <div className="px-3 py-3 border-t border-border space-y-2">
          {/* Hồ sơ cá nhân (Chỉ dành cho GVCN / GVBM, Admin quản lý qua Hồ sơ quản trị) */}
          {user?.role !== 'ADMIN' && (
            <Link
              href="/profile"
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-2.5 h-9 px-3 rounded-sm text-xs font-bold transition-colors group relative',
                pathname === '/profile'
                  ? 'bg-accent text-text-primary border border-border-strong shadow-[1px_1px_0px_#000]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border'
              )}
            >
              <User size={16} weight={pathname === '/profile' ? 'bold' : 'regular'} />
              <span>Hồ sơ cá nhân</span>
            </Link>
          )}

          {/* User Account Info */}
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm bg-surface-muted/60 border border-border">
            <div className="w-8 h-8 rounded-sm bg-accent text-text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-border-strong shadow-[1px_1px_0px_0px_rgba(13,1,41,0.2)]">
              {user?.name?.charAt(0) || (user?.role === 'ADMIN' ? 'A' : 'G')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-text-primary truncate">
                {user?.name}
              </div>
              <div className="text-[10px] text-text-muted truncate">
                {user?.role === 'ADMIN' ? 'Quản trị viên' : isHomeroom ? 'GV Chủ nhiệm' : 'GV Bộ môn'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose?.();
              logout();
            }}
            className="w-full flex items-center gap-2 h-8.5 px-3 rounded-sm text-xs font-semibold text-text-muted hover:text-danger hover:bg-danger-bg border border-transparent hover:border-danger/30 transition-colors text-left cursor-pointer"
          >
            <SignOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
