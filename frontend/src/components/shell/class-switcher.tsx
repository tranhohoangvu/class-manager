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
          'w-full flex items-center justify-between p-2 rounded-sm border border-border-strong bg-surface hover:bg-surface-muted transition-all text-left group shadow-[1px_1px_0px_0px_rgba(13,1,41,0.15)]',
          isOpen && 'border-border-strong ring-2 ring-accent bg-surface-muted'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'w-7.5 h-7.5 rounded-sm flex items-center justify-center font-bold text-xs flex-shrink-0 border',
              isHomeroom
                ? 'bg-success-bg text-success border-success/35'
                : 'bg-teal-subtle text-teal border-teal/35'
            )}
          >
            {currentClass ? currentClass.grade : 'L'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary block truncate leading-tight">
                {currentClass ? currentClass.name : 'Chọn lớp'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  'text-[10px] px-1 py-0.2 rounded-sm font-bold truncate',
                  isHomeroom
                    ? 'bg-success-bg text-success'
                    : 'bg-teal-subtle text-teal'
                )}
              >
                {currentItem?.roleLabel || 'Giáo viên'}
              </span>
            </div>
          </div>
        </div>

        {assignedClassesWithRoles.length > 1 && (
          <CaretUpDown
            size={13}
            className="text-text-muted group-hover:text-text-primary flex-shrink-0"
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && assignedClassesWithRoles.length > 1 && (
        <div className="absolute left-2 right-2 top-full mt-1.5 z-50 bg-surface border border-border-strong rounded-sm shadow-[3px_3px_0px_0px_rgba(13,1,41,0.2)] p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-100 max-h-72 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
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
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-sm text-xs transition-colors text-left group',
                  isSelected
                    ? 'bg-accent text-text-primary font-bold border border-border-strong shadow-[1px_1px_0px_#000]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-transparent hover:border-border'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold block truncate">{item.classInfo.name}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-sm font-bold flex-shrink-0',
                        item.isHomeroom
                          ? 'bg-success-bg text-success border border-success/30'
                          : 'bg-teal-subtle text-teal border border-teal/30'
                      )}
                    >
                      {item.roleLabel}
                    </span>
                  </div>
                  <span className="block text-[10px] text-text-muted font-medium mt-0.5">
                    {item.classInfo.room_name} · 30 học sinh
                  </span>
                </div>

                {isSelected && <Check size={14} weight="bold" className="flex-shrink-0 ml-2 text-text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
