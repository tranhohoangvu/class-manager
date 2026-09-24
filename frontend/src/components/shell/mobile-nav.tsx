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
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border-strong shadow-[0_1px_2px_0_rgba(13,1,41,0.08)]">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Đóng bảng điều hướng' : 'Mở bảng điều hướng'}
          className="p-1.5 -ml-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border transition-colors cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <List size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-teal text-white flex items-center justify-center font-bold text-xs border border-border-strong shadow-[1px_1px_0px_#000]">
            {isAdmin ? (
              <ShieldCheck size={16} weight="bold" />
            ) : (
              <ChalkboardTeacher size={16} weight="bold" />
            )}
          </div>
          <span className="text-[13px] font-bold text-text-primary tracking-tight">
            THCS Nguyễn Tất Thành
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {isAdmin ? (
          <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-subtle text-teal border border-teal/30 rounded-sm">
            Quản trị
          </span>
        ) : currentClass ? (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-[11px] font-bold bg-accent text-text-primary rounded-sm border border-border-strong shadow-[1px_1px_0px_#000]">
              {currentClass.name}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm border ${
                isHomeroom
                  ? 'bg-success-bg text-success border-success/35'
                  : 'bg-teal-subtle text-teal border-teal/35'
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
