'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour,
  ChalkboardTeacher,
  Chalkboard,
  GearSix,
  SignOut,
  ArrowSquareOut,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Tổng quan hệ thống', icon: SquaresFour },
  { href: '/admin/teachers', label: 'Quản lý Giáo viên', icon: ChalkboardTeacher },
  { href: '/admin/classes', label: 'Quản lý Lớp học', icon: Chalkboard },
  { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: GearSix },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        {/* Brand */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-sm">
              <ShieldCheck size={18} weight="duotone" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-text-primary block leading-tight">
                Class Manager
              </span>
              <span className="text-[11px] font-medium text-indigo-600 block">
                Quản trị viên
              </span>
            </div>
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

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3" aria-label="Điều hướng Quản trị">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Hệ thống
        </div>
        <ul className="space-y-0.5" role="list">
          {adminNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => onClose?.()}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]',
                    'text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-accent-subtle text-accent font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    size={16}
                    weight={isActive ? 'duotone' : 'regular'}
                    className="flex-shrink-0"
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Portal Switch Link */}
        <div className="mt-6 pt-4 border-t border-border px-1">
          <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Không gian làm việc
          </div>
          <Link
            href="/dashboard"
            onClick={() => onClose?.()}
            className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-xs text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors mt-1 group"
          >
            <span>Xem giao diện Lớp học</span>
            <ArrowSquareOut size={14} className="text-text-muted group-hover:text-accent" />
          </Link>
        </div>
      </nav>

      {/* Bottom Profile & Sign Out */}
      <div className="px-3 py-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-surface-muted/60">
          <div className="w-7 h-7 rounded-full bg-accent/20 text-accent font-semibold text-xs flex items-center justify-center">
            {user?.name?.charAt(0) || 'A'}
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
