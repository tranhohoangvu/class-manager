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
    <div className="bg-surface rounded-sm border border-border-strong shadow-[2px_2px_0px_0px_rgba(13,1,41,0.15)] p-10 text-center max-w-lg mx-auto my-8 space-y-4">
      <div className="w-12 h-12 mx-auto rounded-sm bg-surface-muted text-text-muted border border-border flex items-center justify-center">
        {icon || <MagnifyingGlass size={26} className="opacity-70" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        {description && <p className="text-xs text-text-muted max-w-sm mx-auto">{description}</p>}
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
    <div className="bg-surface rounded-sm border border-danger shadow-[2px_2px_0px_0px_rgba(158,42,43,0.2)] p-8 text-center max-w-md mx-auto my-8 space-y-4">
      <div className="w-12 h-12 mx-auto rounded-sm bg-danger/10 text-danger border border-danger/30 flex items-center justify-center">
        <WarningCircle size={26} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
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
    <div className="bg-surface rounded-sm border border-warning shadow-[2px_2px_0px_0px_rgba(183,121,31,0.2)] p-8 text-center max-w-md mx-auto my-8 space-y-4">
      <div className="w-12 h-12 mx-auto rounded-sm bg-warning/10 text-warning border border-warning/30 flex items-center justify-center">
        <ShieldWarning size={26} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
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
