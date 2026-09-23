'use client';

import React from 'react';
import Link from 'next/link';
import {
  WarningCircle,
  ShieldWarning,
  MagnifyingGlass,
  ArrowClockwise,
  ArrowLeft,
  CircleNotch,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface EmptyStateViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyStateView({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionHref,
}: EmptyStateViewProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-lg mx-auto my-8 space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-muted text-text-muted flex items-center justify-center">
        {icon || <MagnifyingGlass size={28} className="opacity-60" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-sm text-text-muted max-w-sm mx-auto">{description}</p>}
      </div>
      {(actionText && (onAction || actionHref)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary">{actionText}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ErrorStateViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorStateView({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
}: ErrorStateViewProps) {
  return (
    <div className="bg-surface rounded-2xl border border-danger/20 p-8 text-center max-w-md mx-auto my-8 space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-danger/10 text-danger flex items-center justify-center">
        <WarningCircle size={26} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="gap-2">
          <ArrowClockwise size={16} />
          <span>Thử lại</span>
        </Button>
      )}
    </div>
  );
}

interface UnauthorizedViewProps {
  title?: string;
  message?: string;
  backHref?: string;
}

export function UnauthorizedView({
  title = 'Không có quyền truy cập',
  message = 'Bạn đang đăng nhập với vai trò không có quyền thực hiện thao tác trên lớp học này.',
  backHref = '/dashboard',
}: UnauthorizedViewProps) {
  return (
    <div className="bg-surface rounded-2xl border border-amber-500/20 p-8 text-center max-w-md mx-auto my-8 space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
        <ShieldWarning size={28} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted">{message}</p>
      </div>
      <div className="pt-2">
        <Link href={backHref}>
          <Button variant="secondary" className="gap-2">
            <ArrowLeft size={16} />
            <span>Quay lại trang chính</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function LoadingStateView({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  return (
    <div className="p-12 flex flex-col items-center justify-center space-y-3">
      <CircleNotch size={28} className="animate-spin text-accent" />
      <span className="text-xs text-text-muted font-medium">{message}</span>
    </div>
  );
}
