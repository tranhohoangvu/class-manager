'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChalkboardTeacher,
  ArrowRight,
  ShieldCheck,
  User,
  WarningCircle,
  Key,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    badge: 'Quản trị viên',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    name: 'Admin Hệ thống',
    email: 'admin@classmanager.local',
    password: 'admin',
    desc: 'Quản lý 16 lớp THCS (480 HS), 24 giáo viên & 10 môn học',
  },
  {
    role: 'TEACHER',
    badge: 'GVCN & GVBM',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    name: 'Thầy Nguyễn Văn An',
    email: 'an.nguyen@classmanager.local',
    password: 'teacher1',
    desc: 'GVCN 6A1 (Toán) + GVBM 6A2, 7A1, 7A2 (Test đổi quyền khi chuyển lớp)',
  },
  {
    role: 'TEACHER',
    badge: 'Chỉ GVBM',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    name: 'Thầy Hoàng Văn Cường',
    email: 'cuong.hoang@classmanager.local',
    password: 'teacher23',
    desc: 'Dạy Công nghệ nhiều lớp. Quyền chỉ đọc + điểm danh môn',
  },
  {
    role: 'TEACHER',
    badge: 'Chỉ GVCN',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    name: 'Cô Nguyễn Thị Hương',
    email: 'huong.nguyen@classmanager.local',
    password: 'teacher16',
    desc: 'GVCN lớp 6A4 (không dạy bộ môn lớp khác). Toàn quyền quản lý 6A4',
  },
  {
    role: 'TEACHER',
    badge: 'Chưa có lớp',
    badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    name: 'Thầy Đỗ Văn Tân',
    email: 'unassigned@classmanager.local',
    password: 'unassigned',
    desc: 'Giáo viên mới chưa được gán lớp hay bộ môn (Test Empty State)',
  },
  {
    role: 'TEACHER',
    badge: 'Đã khóa',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
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
      setErrorMsg(res.error || 'Đăng nhập không thành công');
      toast.error(res.error || 'Đăng nhập thất bại');
      setLoading(false);
    } else {
      toast.success('Đăng nhập thành công!');
    }
  };

  const handleQuickSelect = (acc: typeof DEMO_ACCOUNTS[0]) => {
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
    <div className="w-full max-w-md mx-auto space-y-5 py-4">
      {/* Login Card */}
      <div className="bg-surface rounded-2xl border border-border p-7 shadow-xs">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center text-accent mb-3">
            <ChalkboardTeacher size={28} weight="duotone" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            Class Manager
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-xs">
            Hệ thống quản lý lớp học dành cho Ban Giám hiệu & Giáo viên chủ nhiệm
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="email"
              type="email"
              label="Email đăng nhập"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ten@school.edu.vn"
            />
          </div>

          <div>
            <Input
              id="password"
              type="password"
              label="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-danger/10 text-danger border border-danger/20 flex items-start gap-2">
              <WarningCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2 py-2.5"
            isLoading={loading}
          >
            <span>Đăng nhập</span>
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>
      </div>

      {/* Demo Accounts Quick-Select for Prototype */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <Key size={14} className="text-accent" />
            <span>Tài khoản thử nghiệm (1-Click Login)</span>
          </div>
          <span className="text-[11px] text-text-muted">Prototype</span>
        </div>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleQuickSelect(acc)}
              className="w-full p-2.5 rounded-xl border border-border/80 hover:border-accent/40 bg-surface-muted/40 hover:bg-surface-muted transition-all text-left group flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {acc.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${acc.badgeColor}`}
                  >
                    {acc.badge}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 truncate">{acc.desc}</p>
              </div>
              <ArrowRight
                size={14}
                className="text-text-muted/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
