import { cn } from '@/lib/utils';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import type { AttendanceStatus, StudentStatus } from '@/types';
import {
  Check,
  X,
  Clock,
  ClipboardText,
  ShieldCheck,
  ChalkboardTeacher,
  Eye,
  Lock,
} from '@phosphor-icons/react';

// =============================================
// Attendance Status Badge (Accessible: Icon + Color + Text)
// =============================================
interface AttendanceBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function AttendanceBadge({ status, size = 'md', showIcon = true }: AttendanceBadgeProps) {
  const label = ATTENDANCE_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-sm transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        status === 'present' && 'badge-present',
        status === 'absent' && 'badge-absent',
        status === 'late' && 'badge-late',
        status === 'excused' && 'badge-excused'
      )}
    >
      {showIcon && (
        <>
          {status === 'present' && <Check size={13} weight="bold" />}
          {status === 'absent' && <X size={13} weight="bold" />}
          {status === 'late' && <Clock size={13} weight="bold" />}
          {status === 'excused' && <ClipboardText size={13} weight="bold" />}
        </>
      )}
      <span>{label}</span>
    </span>
  );
}

// =============================================
// Attendance Status Dot (for grid & matrix)
// =============================================
interface AttendanceDotProps {
  status: AttendanceStatus | null;
  title?: string;
}

export function AttendanceDot({ status, title }: AttendanceDotProps) {
  if (!status) return <span className="block w-6 h-6 rounded-sm bg-border/40 border border-border" title="Chưa điểm danh" />;
  return (
    <span
      title={title ?? ATTENDANCE_STATUS_LABELS[status]}
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-sm text-[11px] font-bold border',
        status === 'present' && 'bg-success text-white border-success/40',
        status === 'absent' && 'bg-danger text-white border-danger/40',
        status === 'late' && 'bg-warning text-white border-warning/40',
        status === 'excused' && 'bg-neutral text-white border-neutral/40'
      )}
    >
      {status === 'present' && '✓'}
      {status === 'absent' && 'V'}
      {status === 'late' && 'M'}
      {status === 'excused' && 'P'}
    </span>
  );
}

// =============================================
// Student Status Badge
// =============================================
interface StudentStatusBadgeProps {
  status: StudentStatus;
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-sm px-2.5 py-1 text-xs',
        status === 'active' && 'bg-success-bg text-success border border-success/30',
        status === 'inactive' && 'bg-surface-muted text-text-muted border border-border'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'active' ? 'bg-success' : 'bg-text-muted'
        )}
      />
      <span>{status === 'active' ? 'Đang học' : 'Nghỉ học'}</span>
    </span>
  );
}

// =============================================
// Role Badge (Standardized across all views)
// =============================================
interface RoleBadgeProps {
  role: 'HOMEROOM' | 'SUBJECT' | 'ADMIN' | 'DISABLED';
  label?: string;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, label, size = 'sm' }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-sm border',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        role === 'HOMEROOM' && 'bg-success-bg text-success border-success/35',
        role === 'SUBJECT' && 'bg-teal-subtle text-teal border-teal/35',
        role === 'ADMIN' && 'bg-accent-subtle text-text-primary border-border-strong',
        role === 'DISABLED' && 'bg-danger-bg text-danger border-danger/35'
      )}
    >
      {role === 'HOMEROOM' && <ChalkboardTeacher size={14} weight="bold" />}
      {role === 'SUBJECT' && <Eye size={14} weight="bold" />}
      {role === 'ADMIN' && <ShieldCheck size={14} weight="bold" />}
      {role === 'DISABLED' && <Lock size={14} weight="bold" />}
      <span>
        {label ||
          (role === 'HOMEROOM'
            ? 'GVCN'
            : role === 'SUBJECT'
            ? 'GVBM'
            : role === 'ADMIN'
            ? 'Admin'
            : 'Đã khóa')}
      </span>
    </span>
  );
}

// =============================================
// Generic Badge
// =============================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'muted';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-sm px-2 py-0.5 text-[11px]',
        variant === 'default' && 'bg-surface-muted text-text-secondary border border-border',
        variant === 'accent' && 'bg-accent-subtle text-text-primary border border-border-strong',
        variant === 'muted' && 'text-text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}
