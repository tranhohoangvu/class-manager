'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour,
  Student,
  Armchair,
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
            <span className="text-sm font-semibold tracking-tight text-text-primary block leading-tight">
              Class Manager
            </span>
            <span className="text-[11px] text-text-muted block">
              {isHomeroom ? 'Giáo viên chủ nhiệm' : 'Giáo viên bộ môn'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng điều hướng"
            className="md:hidden p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Class Switcher */}
        <div className="border-b border-border">
          <ClassSwitcher />
          {isSubjectTeacher && (
            <div className="px-3 pb-2 text-[10px] text-indigo-700 bg-indigo-50/70 mx-2 mb-2 rounded-md p-1.5 border border-indigo-100 flex items-center gap-1">
              <Eye size={12} className="flex-shrink-0" />
              <span>Chế độ Giáo viên bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-2 py-3" aria-label="Điều hướng lớp học">
          <ul className="space-y-0.5" role="list">
            {navItems.map(({ href, label, icon: Icon, badge, highlight }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => onClose?.()}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)]',
                      'text-sm transition-colors duration-150',
                      isActive
                        ? 'bg-accent-subtle text-accent font-medium'
                        : highlight
                        ? 'text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        size={16}
                        weight={isActive ? 'duotone' : 'regular'}
                        className="flex-shrink-0"
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {badge && (
                      <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-surface-muted text-text-muted">
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
            <div className="mt-5 pt-3 border-t border-border px-1">
              <Link
                href="/admin/dashboard"
                onClick={() => onClose?.()}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors group"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>Trở lại Admin Portal</span>
                </span>
                <ArrowSquareOut size={14} />
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom: Settings + User Profile + Sign Out */}
        <div className="px-3 py-3 border-t border-border space-y-2">
          {isHomeroom && (
            <Link
              href="/settings"
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]',
                'text-sm transition-colors duration-150',
                pathname === '/settings'
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              )}
            >
              <GearSix size={16} weight={pathname === '/settings' ? 'duotone' : 'regular'} />
              <span>Cài đặt lớp</span>
            </Link>
          )}

          {/* Profile */}
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-surface-muted/60">
            <div className="w-7 h-7 rounded-full bg-accent/20 text-accent font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name?.charAt(0) || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-text-primary truncate">{user?.name}</div>
              <div className="text-[10px] text-text-muted truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose?.();
              logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer"
          >
            <SignOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
