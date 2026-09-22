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

export default function SettingsPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, refreshClasses } = useCurrentClass();
  const [classInfo, setClassInfo] = useState<ClassRow | null>(null);
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [maxStudents, setMaxStudents] = useState('45');
  const [deskCount, setDeskCount] = useState('25');

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
      setMaxStudents(cls.max_students.toString());
      setDeskCount(cls.desk_count.toString());
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

    const res = ClassService.updateClassSettings(
      currentClassId,
      {
        name: name.trim(),
        room_name: roomName.trim() || undefined,
        school_year: schoolYear.trim(),
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="pb-5 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Cài đặt lớp học
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Tuỳ chỉnh thông số lớp học, thông tin phòng và quản trị cơ sở dữ liệu
        </p>
      </div>

      {/* Main Settings Form */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-xs">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <GraduationCap size={18} className="text-accent" />
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
              placeholder="2025 - 2026"
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
              max="60"
            />

            <Input
              id="desk_count"
              type="number"
              label="Số lượng bàn học trong phòng"
              value={deskCount}
              disabled
              hint="Cố định 25 bàn (50 chỗ ngồi) theo mô hình chuẩn 5 dãy × 5 hàng của trường"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary">
              <FloppyDisk size={16} />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Database & Cloud Sync Status */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Database size={18} className="text-accent" />
          Trạng thái kết nối dữ liệu
        </h2>

        <div className="p-4 rounded-lg bg-surface-subtle border border-border flex items-start gap-3">
          {isSupabaseConfigured ? (
            <>
              <CheckCircle size={20} className="text-success flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text-primary">
                  Đã kết nối cơ sở dữ liệu Supabase Cloud
                </p>
                <p className="text-text-secondary">
                  Dữ liệu lớp học của bạn đang được đồng bộ tự động lên đám mây bảo mật.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse mt-1 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text-primary">
                  Đang hoạt động ở Chế độ Lưu trữ Cục bộ (Local Persistence)
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Tất cả thao tác (thêm/sửa học sinh, xếp chỗ ngồi, điểm danh, tạo thông báo) đều được lưu trữ trực tiếp trên trình duyệt của bạn và bảo toàn sau khi tải lại trang.
                </p>
                <p className="text-text-muted pt-1">
                  Để đồng bộ lên Supabase Cloud: Nhập URL và Anon Key vào file <code>.env.local</code> và chạy file SQL trong thư mục <code>supabase/migrations/</code>.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-surface rounded-xl border border-danger/30 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-danger flex items-center gap-2">
            <Warning size={18} />
            Khôi phục dữ liệu mẫu
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Nếu bạn đã thay đổi dữ liệu và muốn quay lại 480 học sinh (16 lớp THCS) ban đầu cùng sơ đồ bàn ghế mẫu.
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            <ArrowsCounterClockwise size={16} />
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
