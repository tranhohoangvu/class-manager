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
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border shadow-2xs">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Đóng bảng điều hướng' : 'Mở bảng điều hướng'}
          className="p-1.5 -ml-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
        >
          {isOpen ? <X size={20} /> : <List size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent-subtle text-accent flex items-center justify-center font-bold text-xs">
            {isAdmin ? (
              <ShieldCheck size={14} weight="duotone" />
            ) : (
              <ChalkboardTeacher size={14} weight="duotone" />
            )}
          </div>
          <span className="text-xs font-bold text-text-primary tracking-tight">
            Class Manager
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {isAdmin ? (
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
            Quản trị
          </span>
        ) : currentClass ? (
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-accent-subtle text-accent rounded-md border border-accent/20">
              {currentClass.name}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                isHomeroom
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
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
