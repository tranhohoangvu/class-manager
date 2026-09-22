'use client';

import { useState, useRef, useEffect } from 'react';
import { CaretUpDown, Check, ChalkboardTeacher, BookOpen } from '@phosphor-icons/react';
import { useCurrentClass } from '@/contexts/class-context';
import { cn } from '@/lib/utils';

export function ClassSwitcher() {
  const {
    currentClassId,
    currentClass,
    assignedClassesWithRoles,
    isHomeroom,
    teacherSubjects,
    switchClass,
  } = useCurrentClass();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (assignedClassesWithRoles.length === 0) {
    return (
      <div className="px-3 py-2 mx-2 my-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
        <span className="font-semibold block">Chưa có lớp</span>
        <span className="text-[11px] text-amber-700 block mt-0.5">
          Liên hệ Admin để phân công
        </span>
      </div>
    );
  }

  // Find currently active item
  const currentItem = assignedClassesWithRoles.find(
    (item) => item.classInfo.id === currentClassId
  );

  return (
    <div className="relative px-2 py-2" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-all text-left group',
          isOpen && 'border-accent/50 ring-1 ring-accent/20 bg-surface-muted'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0',
              isHomeroom
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            )}
          >
            {currentClass ? currentClass.grade : 'L'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-text-primary block truncate leading-tight">
                {currentClass ? currentClass.name : 'Chọn lớp'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  'text-[10px] px-1 py-0.2 rounded font-medium truncate',
                  isHomeroom
                    ? 'bg-emerald-100/70 text-emerald-800'
                    : 'bg-indigo-100/70 text-indigo-800'
                )}
              >
                {currentItem?.roleLabel || 'Giáo viên'}
              </span>
            </div>
          </div>
        </div>

        {assignedClassesWithRoles.length > 1 && (
          <CaretUpDown
            size={14}
            className="text-text-muted group-hover:text-text-primary flex-shrink-0"
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && assignedClassesWithRoles.length > 1 && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 max-h-72 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Các lớp bạn phụ trách ({assignedClassesWithRoles.length})
          </div>

          {assignedClassesWithRoles.map((item) => {
            const isSelected = item.classInfo.id === currentClassId;
            return (
              <button
                key={item.classInfo.id}
                type="button"
                onClick={() => {
                  switchClass(item.classInfo.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left group',
                  isSelected
                    ? 'bg-accent-subtle text-accent font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold block truncate">{item.classInfo.name}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded font-medium flex-shrink-0',
                        item.isHomeroom
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      )}
                    >
                      {item.roleLabel}
                    </span>
                  </div>
                  <span className="block text-[10px] text-text-muted font-normal mt-0.5">
                    {item.classInfo.room_name} · 30 học sinh
                  </span>
                </div>

                {isSelected && <Check size={14} weight="bold" className="flex-shrink-0 ml-2 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
