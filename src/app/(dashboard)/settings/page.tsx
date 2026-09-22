'use client';

import { useState, useEffect } from 'react';
import {
  GearSix,
  FloppyDisk,
  ArrowsCounterClockwise,
  Database,
  CheckCircle,
  Warning,
  Building,
  GraduationCap,
  Users,
  Armchair,
  ChartPieSlice,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { ClassService } from '@/services';
import { ClassRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, refreshClasses } = useCurrentClass();
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [maxStudents, setMaxStudents] = useState('40');
  const [deskCount, setDeskCount] = useState('20');

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    if (!currentClassId) return;
    const cls = currentClass || ClassService.getClassById(currentClassId);
    if (cls) {
      setClassInfo(cls);
      setName(cls.name);
      setRoomName(cls.room_name || '');
      setSchoolYear(cls.school_year || '');
      setMaxStudents((cls.max_students || 40).toString());
      setDeskCount((cls.desk_count || 20).toString());
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setIsSupabaseConfigured(
      !!(url && url.startsWith('http') && key && key !== 'your_supabase_anon_key')
    );
  }, [currentClassId, currentClass]);

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên lớp');
      return;
    }
    if (!currentClassId) return;

    const parsedMaxStudents = parseInt(maxStudents, 10);
    if (isNaN(parsedMaxStudents) || parsedMaxStudents < 1 || parsedMaxStudents > 40) {
      toast.error('Sĩ số học sinh tối đa phải từ 1 đến 40 (theo quy chuẩn 20 bàn học)');
      return;
    }

    const res = ClassService.updateClassSettings(
      currentClassId,
      {
        name: name.trim(),
        room_name: roomName.trim() || undefined,
        school_year: schoolYear.trim(),
        max_students: parsedMaxStudents,
      },
      user
    );

    if (!res.success) {
      toast.error(res.error || 'Cập nhật cài đặt thất bại');
      return;
    }

    if (res.data) {
      setClassInfo(res.data);
      refreshClasses();
      toast.success('Đã lưu thông tin cài đặt lớp học');
    }
  };

  const handleResetData = () => {
    LocalStore.resetToDefaults();
    toast.success('Đã khôi phục toàn bộ dữ liệu mẫu trường THCS (16 lớp, 480 học sinh)');
    setIsResetConfirmOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  if (!classInfo) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-surface-muted rounded animate-pulse" />
        <div className="h-80 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const activeStudents = currentClassId
    ? LocalStore.getStudents(currentClassId).filter((s) => s.status === 'active')
    : [];
  const currentEnrolledCount = activeStudents.length;
  const currentMaxStudents = classInfo.max_students || 40;
  const vacantSeats = Math.max(0, currentMaxStudents - currentEnrolledCount);
  const occupancyPercentage =
    currentMaxStudents > 0 ? Math.round((currentEnrolledCount / currentMaxStudents) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Cài đặt lớp học
        </h1>
        <p className="text-sm text-text-secondary mt-1.5">
          Tuỳ chỉnh thông số lớp học, thông tin phòng và quản trị cơ sở dữ liệu
        </p>
      </div>

      {/* Class Capacity & Occupancy Overview Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Sĩ số hiện tại
            </span>
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Users size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {currentEnrolledCount}
            </span>
            <span className="text-sm font-medium text-text-muted">/ {currentMaxStudents} học sinh</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">Đang theo học tại lớp</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Số chỗ còn trống
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Armchair size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight">
              {vacantSeats}
            </span>
            <span className="text-sm font-medium text-text-muted">chỗ ngồi</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">Khả dụng để tiếp nhận thêm</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Tỷ lệ lấp đầy
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <ChartPieSlice size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {occupancyPercentage}%
            </span>
            <span className="text-xs text-text-muted font-medium">công suất phòng (20 bàn)</span>
          </div>
          <div className="w-full bg-surface-muted rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                occupancyPercentage >= 100
                  ? 'bg-amber-500'
                  : occupancyPercentage >= 80
                  ? 'bg-accent'
                  : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2.5 pb-2 border-b border-border">
          <GraduationCap size={20} className="text-accent" weight="duotone" />
          Thông số lớp học
        </h2>

        <form onSubmit={handleSaveClass} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="class_name"
              label="Tên lớp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ví dụ: Lớp 9A1"
            />

            <Input
              id="school_year"
              label="Niên khoá"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              placeholder="2026 - 2027"
            />
          </div>

          <Input
            id="room_name"
            label="Phòng học"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Phòng 204 — Nhà A"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="max_students"
              type="number"
              label="Sĩ số học sinh tối đa"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              min="1"
              max="40"
              hint="Quy chuẩn phòng học 20 bàn: tối đa 40 học sinh"
            />

            <Input
              id="desk_count"
              type="number"
              label="Số lượng bàn học trong phòng"
              value={deskCount}
              disabled
              hint="Cố định 20 bàn học (40 chỗ ngồi) theo mô hình chuẩn 4 dãy × 5 hàng của trường"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" className="gap-2">
              <FloppyDisk size={18} />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Database & Cloud Sync Status */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2.5">
          <Database size={20} className="text-accent" weight="duotone" />
          Trạng thái kết nối dữ liệu
        </h2>

        <div className="p-5 rounded-xl bg-surface-subtle border border-border flex items-start gap-4">
          {isSupabaseConfigured ? (
            <>
              <CheckCircle size={24} className="text-success flex-shrink-0 mt-0.5" weight="fill" />
              <div className="text-sm space-y-1">
                <p className="font-bold text-text-primary">
                  Đã kết nối cơ sở dữ liệu Supabase Cloud
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Dữ liệu lớp học của bạn đang được đồng bộ tự động lên đám mây bảo mật.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mt-1.5 flex-shrink-0" />
              <div className="text-sm space-y-1.5">
                <p className="font-bold text-text-primary">
                  Đang hoạt động ở Chế độ Lưu trữ Cục bộ (Local Persistence)
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Tất cả thao tác (thêm/sửa học sinh, xếp chỗ ngồi, điểm danh, tạo thông báo) đều được lưu trữ trực tiếp trên trình duyệt của bạn và bảo toàn sau khi tải lại trang.
                </p>
                <p className="text-xs text-text-muted pt-1">
                  Để đồng bộ lên Supabase Cloud: Nhập URL và Anon Key vào file <code className="px-1.5 py-0.5 rounded bg-surface-muted border border-border font-mono">.env.local</code> và chạy file SQL trong thư mục <code className="px-1.5 py-0.5 rounded bg-surface-muted border border-border font-mono">supabase/migrations/</code>.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-surface rounded-2xl border border-rose-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-danger flex items-center gap-2.5">
            <Warning size={20} weight="duotone" />
            Khôi phục dữ liệu mẫu
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Nếu bạn đã thay đổi dữ liệu và muốn quay lại 480 học sinh (16 lớp THCS) ban đầu cùng sơ đồ bàn ghế mẫu.
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setIsResetConfirmOpen(true)}
            className="gap-2"
          >
            <ArrowsCounterClockwise size={18} />
            <span>Đặt lại toàn bộ dữ liệu mẫu</span>
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Đặt lại dữ liệu mẫu"
        description="Toàn bộ học sinh, chỗ ngồi, điểm danh và thông báo tự tạo sẽ được khôi phục về trạng thái 16 lớp THCS (480 học sinh) ban đầu. Bạn có muốn tiếp tục?"
        confirmText="Xác nhận đặt lại"
        variant="danger"
      />
    </div>
  );
}
