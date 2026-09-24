'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  IdentificationBadge,
  Phone,
  EnvelopeSimple,
  Lock,
  Buildings,
  Chalkboard,
  Users,
  Student,
  FloppyDisk,
  Check,
  GearSix,
  CheckCircle,
} from '@phosphor-icons/react';
import { useAuth } from '@/contexts/auth-context';
import { LocalStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminProfilePage() {
  const { user } = useAuth();
  const schoolSettings = LocalStore.getSchoolSettings();

  const totalClasses = LocalStore.getClasses().length;
  const totalStudents = LocalStore.getStudents().length;
  const totalTeachers = LocalStore.getTeachers().length;

  // Personal Info Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form dirty checks
  const isProfileDirty = useMemo(() => {
    if (!user) return false;
    return (
      name.trim() !== (user.name || '').trim() ||
      phone.trim() !== (user.phone || '').trim() ||
      email.trim() !== (user.email || '').trim()
    );
  }, [user, name, phone, email]);

  const isPasswordDirty = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      newPassword.trim().length >= 6 &&
      confirmPassword.trim().length > 0
    );
  }, [currentPassword, newPassword, confirmPassword]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    if (user) {
      LocalStore.updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim(),
      });
      toast.success('Đã cập nhật thông tin Quản trị viên thành công!');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu quản trị hiện tại');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (user) {
      LocalStore.updateUser(user.id, {
        password: newPassword,
      });
      toast.success('Đã cập nhật mật khẩu quản trị thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* Top Header */}
      <div className="pb-5 border-b border-border-strong flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              HỒ SƠ QUẢN TRỊ VIÊN
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-teal-subtle text-teal rounded-xs border border-teal/30">
              System Admin
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Thông tin định danh quản trị, phạm vi đặc quyền hệ thống và quản lý mật khẩu bảo mật
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-surface border border-border text-xs font-bold text-text-secondary">
          <Buildings size={15} className="text-teal" />
          <span>{schoolSettings.schoolName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Profile Card & System Scope */}
        <div className="space-y-6">
          {/* Avatar & Summary Card */}
          <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs text-center space-y-4">
            <div className="w-20 h-20 rounded-sm bg-teal text-white font-black text-2xl flex items-center justify-center mx-auto border-2 border-border-strong shadow-[2px_2px_0px_#000]">
              <ShieldCheck size={36} weight="bold" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
              <p className="text-xs text-text-muted mt-0.5 font-mono">{user?.email}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 text-xs font-bold">
                <ShieldCheck size={14} weight="bold" />
                <span>Toàn quyền Quản trị (Super Admin)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-left text-xs">
              <div className="p-2 rounded-xs bg-surface-muted border border-border text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold block">Lớp học</span>
                <span className="font-bold text-teal font-mono text-sm mt-0.5 block">
                  {totalClasses}
                </span>
              </div>
              <div className="p-2 rounded-xs bg-surface-muted border border-border text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold block">Học sinh</span>
                <span className="font-bold text-teal font-mono text-sm mt-0.5 block">
                  {totalStudents}
                </span>
              </div>
              <div className="p-2 rounded-xs bg-surface-muted border border-border text-center">
                <span className="text-[10px] text-text-muted uppercase font-bold block">Giáo viên</span>
                <span className="font-bold text-teal font-mono text-sm mt-0.5 block">
                  {totalTeachers}
                </span>
              </div>
            </div>
          </div>

          {/* RBAC Privileges Box */}
          <div className="bg-surface rounded-sm border border-border-strong p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary pb-2 border-b border-border">
              <ShieldCheck size={16} className="text-teal" weight="duotone" />
              <span>Đặc quyền Quản trị cấp cao</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-text-secondary">
                <CheckCircle size={15} className="text-teal flex-shrink-0 mt-0.5" weight="fill" />
                <span>Quản trị cơ sở dữ liệu học sinh 16 lớp THCS (Thêm, Sửa, Chuyển lớp, Xóa)</span>
              </div>
              <div className="flex items-start gap-2 text-text-secondary">
                <CheckCircle size={15} className="text-teal flex-shrink-0 mt-0.5" weight="fill" />
                <span>Điều phối và hoán đổi sơ đồ chỗ ngồi thông minh toàn trường</span>
              </div>
              <div className="flex items-start gap-2 text-text-secondary">
                <CheckCircle size={15} className="text-teal flex-shrink-0 mt-0.5" weight="fill" />
                <span>Xếp Thời khóa biểu tự động, chống trùng tiết & tối ưu giảng dạy</span>
              </div>
              <div className="flex items-start gap-2 text-text-secondary">
                <CheckCircle size={15} className="text-teal flex-shrink-0 mt-0.5" weight="fill" />
                <span>Phát thông báo toàn trường & cấu hình thông tin thụ động đơn vị</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Update Info & Password Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Form */}
          <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-3 border-b border-border">
              <IdentificationBadge size={18} className="text-teal" weight="duotone" />
              <span>Chỉnh sửa thông tin Quản trị viên</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="name"
                    label="Họ và tên Quản trị viên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="VD: Quản trị viên Hệ thống"
                  />
                </div>

                <div>
                  <Input
                    id="phone"
                    label="Số điện thoại liên hệ"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0987 654 321"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    id="email"
                    label="Địa chỉ Email đăng nhập Quản trị"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@school.edu.vn"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isProfileDirty}
                  className={cn('gap-2', !isProfileDirty && 'opacity-40 cursor-not-allowed')}
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>Cập nhật thông tin</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-surface rounded-sm border border-border-strong p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-3 border-b border-border">
              <Lock size={18} className="text-teal" weight="duotone" />
              <span>Đổi mật khẩu Quản trị</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Input
                  id="currentPassword"
                  label="Mật khẩu quản trị hiện tại"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="newPassword"
                    label="Mật khẩu mới (tối thiểu 6 ký tự)"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <Input
                    id="confirmPassword"
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!isPasswordDirty}
                  className={cn('gap-2', !isPasswordDirty && 'opacity-40 cursor-not-allowed')}
                >
                  <Lock size={16} />
                  <span>Lưu mật khẩu mới</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
