'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  ChalkboardTeacher,
  WarningCircle,
  Eye,
  EyeSlash,
  Key,
  CaretDown,
  ArrowRight,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    badge: 'Quản trị viên',
    badgeColor: 'bg-teal-subtle text-teal border-teal/20',
    name: 'Admin Hệ thống',
    email: 'admin@classmanager.local',
    password: 'admin',
    desc: 'Quản lý 16 lớp THCS (480 HS), 24 giáo viên & 10 môn học',
  },
  {
    role: 'TEACHER',
    badge: 'GVCN & GVBM',
    badgeColor: 'bg-success-bg text-success border-success/30',
    name: 'Thầy Nguyễn Văn An',
    email: 'an.nguyen@classmanager.local',
    password: 'teacher1',
    desc: 'GVCN 6A1 (Toán) + GVBM 6A2, 7A1, 7A2 (Test đổi quyền khi chuyển lớp)',
  },
  {
    role: 'TEACHER',
    badge: 'Chỉ GVBM',
    badgeColor: 'bg-warning-bg text-warning-700 border-warning/30',
    name: 'Thầy Hoàng Văn Cường',
    email: 'cuong.hoang@classmanager.local',
    password: 'teacher23',
    desc: 'Dạy Công nghệ nhiều lớp. Quyền chỉ đọc + điểm danh môn',
  },
  {
    role: 'TEACHER',
    badge: 'Chỉ GVCN',
    badgeColor: 'bg-accent text-accent-text border-border',
    name: 'Cô Nguyễn Thị Hương',
    email: 'huong.nguyen@classmanager.local',
    password: 'teacher16',
    desc: 'GVCN lớp 6A4 (không dạy bộ môn lớp khác). Toàn quyền quản lý 6A4',
  },
  {
    role: 'TEACHER',
    badge: 'Chưa có lớp',
    badgeColor: 'bg-surface-muted text-text-muted border-border',
    name: 'Thầy Đỗ Văn Tân',
    email: 'unassigned@classmanager.local',
    password: 'unassigned',
    desc: 'Giáo viên mới chưa được gán lớp hay bộ môn (Test Empty State)',
  },
  {
    role: 'TEACHER',
    badge: 'Đã khóa',
    badgeColor: 'bg-danger-bg text-danger border-danger/30',
    name: 'Thầy Vũ Đình Trọng',
    email: 'disabled@classmanager.local',
    password: 'disabled',
    desc: 'Tài khoản bị vô hiệu hóa (Test Account Disabled)',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('an.nguyen@classmanager.local');
  const [password, setPassword] = useState('teacher1');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect accordingly
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      toast.error(res.error || 'Đăng nhập thất bại');
      setLoading(false);
    } else {
      toast.success('Đăng nhập thành công!');
    }
  };

  const handleQuickSelect = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg('');

    setLoading(true);
    setTimeout(() => {
      const res = login(acc.email, acc.password);
      if (!res.success) {
        setErrorMsg(res.error || 'Đăng nhập không thành công');
        toast.error(res.error || 'Đăng nhập thất bại');
        setLoading(false);
      } else {
        toast.success(`Đăng nhập với vai trò: ${acc.name}`);
      }
    }, 150);
  };

  return (
    <div className="w-full space-y-4 py-4">
      {/* Login Card */}
      <div className="bg-surface rounded-sm border border-border p-6 sm:p-7 shadow-xs">
        {/* Class Manager Branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-sm bg-teal-subtle text-teal border border-teal/20 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ChalkboardTeacher size={22} weight="duotone" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-text-primary tracking-tight block leading-tight">
              Class Manager
            </span>
            <span className="text-[12px] text-text-muted block mt-0.5 font-medium">
              THCS Nguyễn Tất Thành
            </span>
          </div>
        </div>

        {/* Welcome Heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Chào mừng trở lại
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Đăng nhập để quản lý lớp học, nề nếp và thời khóa biểu.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-bold text-text-primary block"
            >
              Email nhà trường
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@school.edu.vn"
              className={cn(
                'input-base',
                errorMsg && 'border-danger focus:border-danger'
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-bold text-text-primary block"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  'input-base pr-11',
                  errorMsg && 'border-danger focus:border-danger'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-accent"
              >
                {showPassword ? (
                  <EyeSlash size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Authentication Error State */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3 text-xs rounded-sm bg-danger-bg text-danger border border-danger/40 flex items-start gap-2.5 leading-relaxed"
            >
              <WarningCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center text-sm font-bold h-11 cursor-pointer mt-2"
            isLoading={loading}
          >
            Đăng nhập
          </Button>

          {/* Account Creation Messaging */}
          <p className="text-xs text-center text-text-muted pt-2 font-medium">
            Tài khoản được cấp và quản lý bởi Quản trị viên nhà trường.
          </p>
        </form>
      </div>

      {/* Demo Accounts Quick-Select for Prototype - Collapsible Show/Hide */}
      <div className="bg-surface rounded-sm border border-border p-4 shadow-xs transition-all">
        <button
          type="button"
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="w-full flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer select-none"
          aria-expanded={showDemoAccounts}
        >
          <div className="flex items-center gap-2">
            <Key size={15} className="text-teal" />
            <span>Tài khoản thử nghiệm (1-Click Login)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-normal">
            <span>{showDemoAccounts ? 'Thu gọn' : 'Hiển thị'}</span>
            <CaretDown
              size={14}
              className={cn(
                'transition-transform duration-200',
                showDemoAccounts && 'rotate-180'
              )}
            />
          </div>
        </button>

        {showDemoAccounts && (
          <div className="mt-3.5 pt-3 border-t border-border space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickSelect(acc)}
                className="w-full p-2.5 rounded-sm border border-border hover:border-border-strong bg-surface-muted/30 hover:bg-surface-muted/70 transition-all text-left group flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary group-hover:text-teal transition-colors">
                      {acc.name}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-sm font-bold border',
                        acc.badgeColor
                      )}
                    >
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 truncate">{acc.desc}</p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-text-muted group-hover:text-teal group-hover:translate-x-0.5 transition-all flex-shrink-0"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
