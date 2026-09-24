'use client';

import { useState } from 'react';
import { GearSix, ArrowClockwise, Check, ShieldCheck, Database } from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [schoolName, setSchoolName] = useState('Trường THCS Nguyễn Tất Thành');
  const [currentYear, setCurrentYear] = useState('2026 - 2027');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Đã lưu cấu hình hệ thống');
  };

  const handleResetAllData = () => {
    LocalStore.resetToDefaults();
    toast.success('Đã khôi phục toàn bộ dữ liệu hệ thống về mặc định ban đầu!');
    setIsResetConfirmOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-border-strong">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Cài đặt hệ thống
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Cấu hình quy mô toàn trường và quản lý cơ sở dữ liệu mẫu
        </p>
      </div>

      {/* General School Settings */}
      <div className="bg-surface rounded-sm border border-border-strong p-6 space-y-5 shadow-[2px_2px_0px_0px_rgba(13,1,41,0.1)]">
        <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-2 border-b border-border">
          <GearSix size={18} className="text-teal" />
          <span>Thông tin đơn vị trường học</span>
        </div>

        <form onSubmit={handleSaveSystemSettings} className="space-y-4 max-w-lg">
          <div>
            <Input
              id="school"
              label="Tên đơn vị trường học"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="VD: Trường THCS Nguyễn Tất Thành"
            />
          </div>

          <div>
            <Input
              id="year"
              label="Năm học hiện hành"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              placeholder="2026 - 2027"
            />
          </div>

          <Button type="submit" variant="primary">
            <span>Lưu cấu hình</span>
          </Button>
        </form>
      </div>

      {/* System Status & Architecture */}
      <div className="bg-surface rounded-sm border border-border-strong p-6 space-y-4 shadow-[2px_2px_0px_0px_rgba(13,1,41,0.1)]">
        <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-2 border-b border-border">
          <Database size={18} className="text-teal" />
          <span>Trạng thái kiến trúc dữ liệu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-surface-muted/60 rounded-sm border border-border space-y-1">
            <span className="text-text-muted block font-medium">Chế độ lưu trữ</span>
            <span className="font-bold text-text-primary block text-sm">
              LocalStorage Repository (Prototype)
            </span>
            <span className="text-text-muted block">
              Dữ liệu được cô lập theo classId, kết nối đồng bộ với Backend Express REST API và PostgreSQL.
            </span>
          </div>

          <div className="p-3.5 bg-surface-muted/60 rounded-sm border border-border space-y-1">
            <span className="text-text-muted block font-medium">Mô hình phân quyền</span>
            <span className="font-bold text-text-primary block text-sm">
              Role-Based Access Control (RBAC)
            </span>
            <span className="text-text-muted block">
              Phân quyền chặt chẽ giữa Quản trị viên (ADMIN) và Giáo viên chủ nhiệm (TEACHER).
            </span>
          </div>
        </div>
      </div>

      {/* Reset System Data */}
      <div className="bg-surface rounded-sm border border-danger/40 p-6 space-y-4 shadow-[2px_2px_0px_0px_rgba(158,42,43,0.12)]">
        <div>
          <h2 className="text-sm font-bold text-danger">Khôi phục dữ liệu mẫu hệ thống</h2>
          <p className="text-xs text-text-muted mt-1">
            Khôi phục toàn bộ dữ liệu mẫu (1 Admin, 5 Giáo viên, 6 Lớp học cùng danh sách học sinh, sơ đồ chỗ ngồi và lịch sử điểm danh ban đầu).
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsResetConfirmOpen(true)}
          className="text-danger hover:bg-danger-bg border-danger/40"
        >
          <ArrowClockwise size={16} />
          <span>Đặt lại toàn bộ dữ liệu</span>
        </Button>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetAllData}
        title="Khôi phục dữ liệu hệ thống"
        description="Toàn bộ các thay đổi về giáo viên, lớp học, học sinh bạn đã tạo sẽ được khôi phục về trạng thái mẫu ban đầu. Bạn có chắc chắn muốn thực hiện?"
        confirmText="Đồng ý đặt lại"
        variant="danger"
      />
    </div>
  );
}
