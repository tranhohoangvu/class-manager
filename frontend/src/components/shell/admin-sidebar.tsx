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
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-700 border border-indigo-500/25 flex items-center justify-center font-bold text-sm">
              <ShieldCheck size={20} weight="duotone" />
            </div>
            <div>
              <span className="text-[15px] font-bold tracking-tight text-text-primary block leading-tight">
                THCS Nguyễn Tất Thành
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 block mt-0.5">
                Admin Portal · 2026 - 2027
              </span>
            </div>
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
                      'flex items-center gap-3.5 h-11 px-3.5 rounded-xl text-[14px] font-medium transition-all group relative',
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-900 font-semibold shadow-2xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                    )}
                  >
                    <Icon
                      size={20}
                      weight={isActive ? 'duotone' : 'regular'}
                      className={cn(
                        'transition-transform group-hover:scale-110 flex-shrink-0',
                        isActive ? 'text-indigo-600' : 'text-text-muted group-hover:text-text-primary'
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {isActive && (
                      <span className="absolute right-3 w-1.5 h-5 rounded-full bg-indigo-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Portal Switch Link */}
          <div className="mt-6 pt-4 border-t border-border px-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Không gian làm việc
            </div>
            <Link
              href="/dashboard"
              onClick={() => onClose?.()}
              className="flex items-center justify-between h-10 px-3.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 to-blue-50/90 border border-indigo-200/90 text-indigo-900 hover:from-indigo-100 hover:to-blue-100 shadow-2xs hover:shadow-xs transition-all mt-1.5 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Chalkboard size={17} weight="duotone" className="text-indigo-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                <span className="truncate">Xem giao diện Lớp học</span>
              </div>
              <ArrowSquareOut size={15} className="text-indigo-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-1" />
            </Link>
          </div>
        </nav>

      {/* Bottom Profile & Sign Out */}
      <div className="px-3 py-3 border-t border-border space-y-2.5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-muted/70 border border-border/60">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
            {user?.name?.charAt(0) || 'A'}
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
