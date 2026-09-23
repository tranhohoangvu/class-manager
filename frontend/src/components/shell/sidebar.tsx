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
  GearSix,
  SignOut,
  ArrowSquareOut,
  ShieldCheck,
  Eye,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
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
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-[15px] font-bold tracking-tight text-text-primary block leading-tight">
              THCS Nguyễn Tất Thành
            </span>
            <span className="text-[11px] text-text-muted block mt-0.5 font-medium">
              Năm học 2026 - 2027 · {isHomeroom ? 'GV Chủ nhiệm' : 'GV Bộ môn'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng điều hướng"
            className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Class Switcher */}
        <div className="border-b border-border p-3">
          <ClassSwitcher />
          {isSubjectTeacher && (
            <div className="mt-2.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 rounded-lg p-2 border border-indigo-100 flex items-center gap-1.5">
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
                      'flex items-center justify-between h-11 px-3.5 rounded-xl transition-all duration-150 group relative',
                      'text-[15px] font-medium',
                      isActive
                        ? 'bg-accent/10 text-accent font-semibold shadow-2xs'
                        : highlight
                        ? 'text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50/90 font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={20}
                        weight={isActive ? 'duotone' : 'regular'}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {badge && (
                      <span
                        className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-text-muted border border-border/70',
                          isActive && 'mr-3.5'
                        )}
                      >
                        {badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute right-3 w-1.5 h-5 rounded-full bg-accent" />
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
                className="flex items-center justify-between h-11 px-3.5 rounded-xl text-[13px] font-semibold text-indigo-700 bg-indigo-50/90 border border-indigo-200 hover:bg-indigo-100 transition-colors group shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} weight="duotone" />
                  <span>Trở lại Admin Portal</span>
                </span>
                <ArrowSquareOut size={16} />
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom: Settings + User Profile + Sign Out */}
        <div className="px-3 py-3 border-t border-border space-y-2.5">
          {isHomeroom && (
            <Link
              href="/settings"
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-3 h-10 px-3.5 rounded-xl text-[14px] transition-colors group relative',
                pathname === '/settings'
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-medium'
              )}
            >
              <GearSix size={18} weight={pathname === '/settings' ? 'duotone' : 'regular'} />
              <span>Cài đặt lớp</span>
              {pathname === '/settings' && (
                <span className="absolute right-3 w-1.5 h-5 rounded-full bg-accent" />
              )}
            </Link>
          )}

          {/* Profile */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-muted/70 border border-border/60">
            <div className="w-9 h-9 rounded-full bg-accent/15 text-accent font-bold text-sm flex items-center justify-center flex-shrink-0 border border-accent/20">
              {user?.name?.charAt(0) || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-text-primary truncate">{user?.name}</div>
              <div className="text-[11px] text-text-muted truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose?.();
              logout();
            }}
            className="w-full flex items-center gap-2.5 h-9 px-3.5 rounded-xl text-[13px] font-medium text-text-muted hover:text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer"
          >
            <SignOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
