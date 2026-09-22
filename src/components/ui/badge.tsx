import { cn } from '@/lib/utils';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import type { AttendanceStatus, StudentStatus } from '@/types';

// =============================================
// Attendance Status Badge
// =============================================
interface AttendanceBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md';
}

export function AttendanceBadge({ status, size = 'md' }: AttendanceBadgeProps) {
  const label = ATTENDANCE_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[var(--radius)]',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        status === 'present' && 'badge-present',
        status === 'absent' && 'badge-absent',
        status === 'late' && 'badge-late',
        status === 'excused' && 'badge-excused'
      )}
    >
      {label}
    </span>
  );
}

// =============================================
// Attendance Status Dot (for grid)
// =============================================
interface AttendanceDotProps {
  status: AttendanceStatus | null;
  title?: string;
}

export function AttendanceDot({ status, title }: AttendanceDotProps) {
  if (!status) return <span className="block w-5 h-5 rounded-sm bg-border" title="Chưa điểm danh" />;
  return (
    <span
      title={title ?? ATTENDANCE_STATUS_LABELS[status]}
      className={cn(
        'block w-5 h-5 rounded-sm',
        status === 'present' && 'bg-success',
        status === 'absent' && 'bg-danger',
        status === 'late' && 'bg-warning',
        status === 'excused' && 'bg-neutral'
      )}
    />
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
        'inline-flex items-center font-medium rounded-[var(--radius)] px-2 py-0.5 text-xs',
        status === 'active' && 'bg-success-bg text-success border border-[oklch(0.52_0.140_148/0.2)]',
        status === 'inactive' && 'bg-neutral-bg text-neutral border border-[oklch(0.56_0.008_240/0.2)]'
      )}
    >
      {status === 'active' ? 'Đang học' : 'Nghỉ học'}
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
        'inline-flex items-center font-medium rounded-[var(--radius)] px-2 py-0.5 text-xs',
        variant === 'default' && 'bg-surface-muted text-text-secondary border border-border',
        variant === 'accent' && 'bg-accent-subtle text-accent border border-[oklch(0.50_0.110_220/0.2)]',
        variant === 'muted' && 'text-text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}
