'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour,
  ChalkboardTeacher,
  Chalkboard,
  CalendarDots,
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
  { href: '/admin/timetable', label: 'Quản lý Thời khóa biểu', icon: CalendarDots },
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
        <div className="px-5 py-4.5 border-b border-border-strong flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-teal text-white border border-border-strong shadow-[1px_1px_0px_#000] flex items-center justify-center font-bold text-sm">
              <ShieldCheck size={20} weight="bold" />
            </div>
            <div>
              <span className="text-[14px] font-bold tracking-tight text-text-primary block leading-tight">
                THCS Nguyễn Tất Thành
              </span>
              <span className="text-[11px] font-bold text-teal block mt-0.5">
                Admin Portal · 2026 - 2027
              </span>
            </div>
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

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4" aria-label="Điều hướng quản trị">
          <ul className="space-y-1.5" role="list">
            {adminNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => onClose?.()}
                    className={cn(
                      'flex items-center gap-3 h-9.5 px-3 rounded-sm text-xs font-bold transition-all group relative',
                      isActive
                        ? 'bg-accent text-text-primary border border-border-strong shadow-[1px_1px_0px_0px_#000]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border'
                    )}
                  >
                    <Icon
                      size={17}
                      weight={isActive ? 'bold' : 'regular'}
                      className={cn(
                        'transition-transform flex-shrink-0',
                        isActive ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Portal Switch Link */}
          <div className="mt-6 pt-4 border-t border-border px-1">
            <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Không gian làm việc
            </div>
            <Link
              href="/dashboard"
              onClick={() => onClose?.()}
              className="flex items-center justify-between h-9 px-3 rounded-sm text-xs font-bold bg-surface-muted hover:bg-surface border border-border hover:border-border-strong text-text-primary transition-all mt-1 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Chalkboard size={15} weight="bold" className="text-text-muted group-hover:text-text-primary flex-shrink-0" />
                <span className="truncate">Xem giao diện Lớp học</span>
              </div>
              <ArrowSquareOut size={13} className="text-text-muted group-hover:text-text-primary transition-transform flex-shrink-0 ml-1" />
            </Link>
          </div>
        </nav>

      {/* Bottom Profile & Sign Out */}
      <div className="px-3 py-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm bg-surface-muted/60 border border-border">
          <div className="w-8 h-8 rounded-sm bg-accent text-text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 border border-border-strong shadow-[1px_1px_0px_0px_rgba(13,1,41,0.2)]">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-text-primary truncate">{user?.name}</div>
            <div className="text-[10px] text-text-muted truncate">{user?.email}</div>
          </div>
        </div>

        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="w-full flex items-center gap-2.5 h-8.5 px-3 rounded-sm text-xs font-semibold text-text-muted hover:text-danger hover:bg-danger-bg border border-transparent hover:border-danger/30 transition-colors text-left cursor-pointer"
        >
          <SignOut size={15} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
    </>
  );
}
