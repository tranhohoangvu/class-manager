'use client';

import { List, X, ChalkboardTeacher, ShieldCheck } from '@phosphor-icons/react';
import { useOptionalCurrentClass } from '@/contexts/class-context';
import { useAuth } from '@/contexts/auth-context';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
}

export function MobileNav({ isOpen, onToggle, isAdmin = false }: MobileNavProps) {
  const classContext = useOptionalCurrentClass();
  const currentClass = classContext?.currentClass ?? null;
  const isHomeroom = classContext?.isHomeroom ?? false;
  const { user } = useAuth();

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface border-b border-border shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Đóng bảng điều hướng' : 'Mở bảng điều hướng'}
          className="p-2 -ml-1 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          {isOpen ? <X size={22} /> : <List size={22} />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold text-sm border border-accent/20">
            {isAdmin ? (
              <ShieldCheck size={16} weight="duotone" />
            ) : (
              <ChalkboardTeacher size={16} weight="duotone" />
            )}
          </div>
          <span className="text-[14px] font-bold text-text-primary tracking-tight">
            THCS Nguyễn Tất Thành
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin ? (
          <span className="px-2.5 py-1 text-[12px] font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 rounded-lg">
            Quản trị
          </span>
        ) : currentClass ? (
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 text-[12px] font-bold bg-accent/10 text-accent rounded-lg border border-accent/20">
              {currentClass.name}
            </span>
            <span
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border ${
                isHomeroom
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
                  : 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25'
              }`}
            >
              {isHomeroom ? 'GVCN' : 'GVBM'}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-text-muted">Chưa chọn lớp</span>
        )}
      </div>
    </header>
  );
}
