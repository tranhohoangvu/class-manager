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
        'inline-flex items-center gap-1 font-medium rounded-md',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        status === 'present' && 'badge-present',
        status === 'absent' && 'badge-absent',
        status === 'late' && 'badge-late',
        status === 'excused' && 'badge-excused'
      )}
    >
      {showIcon && (
        <>
          {status === 'present' && <Check size={12} weight="bold" />}
          {status === 'absent' && <X size={12} weight="bold" />}
          {status === 'late' && <Clock size={12} weight="bold" />}
          {status === 'excused' && <ClipboardText size={12} weight="bold" />}
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
  if (!status) return <span className="block w-5 h-5 rounded-md bg-border/80" title="Chưa điểm danh" />;
  return (
    <span
      title={title ?? ATTENDANCE_STATUS_LABELS[status]}
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold',
        status === 'present' && 'bg-success text-white shadow-2xs',
        status === 'absent' && 'bg-danger text-white shadow-2xs',
        status === 'late' && 'bg-warning text-white shadow-2xs',
        status === 'excused' && 'bg-zinc-600 text-white shadow-2xs'
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
        'inline-flex items-center gap-1 font-medium rounded-md px-2 py-0.5 text-xs',
        status === 'active' && 'bg-success-bg text-success border border-success/20',
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
        'inline-flex items-center gap-1 font-medium rounded-md border',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        role === 'HOMEROOM' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
        role === 'SUBJECT' && 'bg-indigo-50 text-indigo-700 border-indigo-200',
        role === 'ADMIN' && 'bg-indigo-50 text-indigo-700 border-indigo-200',
        role === 'DISABLED' && 'bg-rose-50 text-rose-700 border-rose-200'
      )}
    >
      {role === 'HOMEROOM' && <ChalkboardTeacher size={12} weight="duotone" />}
      {role === 'SUBJECT' && <Eye size={12} weight="duotone" />}
      {role === 'ADMIN' && <ShieldCheck size={12} weight="duotone" />}
      {role === 'DISABLED' && <Lock size={12} weight="duotone" />}
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
        'inline-flex items-center font-medium rounded-md px-2 py-0.5 text-xs',
        variant === 'default' && 'bg-surface-muted text-text-secondary border border-border',
        variant === 'accent' && 'bg-accent-subtle text-accent border border-accent/20',
        variant === 'muted' && 'text-text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}
