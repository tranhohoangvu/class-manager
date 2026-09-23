'use client';

import Link from 'next/link';
import { ShieldWarning, ArrowLeft, SignOut } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-muted/30">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center space-y-6 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
          <ShieldWarning size={32} weight="duotone" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Truy cập bị từ chối
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Tài khoản <strong className="text-text-secondary">{user?.email || 'hiện tại'}</strong> không có quyền truy cập vào khu vực này.
          </p>
        </div>

        <div className="p-3 bg-surface-muted rounded-xl text-xs text-text-muted text-left space-y-1">
          <div><strong>Vai trò hiện tại:</strong> {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</div>
          <div><strong>Quy tắc:</strong> Chỉ Quản trị viên mới có thể truy cập khu vực quản lý hệ thống.</div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Link href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full justify-center">
              <ArrowLeft size={16} />
              <span>Quay lại trang chủ</span>
            </Button>
          </Link>
          <Button variant="secondary" onClick={logout} className="w-full sm:w-auto justify-center">
            <SignOut size={16} />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
