'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  GearSix,
  ArrowClockwise,
  Check,
  ShieldCheck,
  Database,
  Buildings,
  GraduationCap,
  IdentificationBadge,
  Phone,
  MapPin,
  CalendarBlank,
  UserGear,
  FloppyDisk,
  Eye,
} from '@phosphor-icons/react';
import { LocalStore } from '@/lib/store';
import { SchoolSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings>({
    departmentName: '',
    divisionName: '',
    schoolName: '',
    province: '',
    address: '',
    phone: '',
    schoolYear: '',
    semester: '',
    principalName: '',
  });
  const [savedSettings, setSavedSettings] = useState<SchoolSettings | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const current = LocalStore.getSchoolSettings();
    setSettings(current);
    setSavedSettings(current);
  }, []);

  const isDirty = useMemo(() => {
    if (!savedSettings) return false;
    return (Object.keys(settings) as Array<keyof SchoolSettings>).some(
      (k) => (settings[k] || '') !== (savedSettings[k] || '')
    );
  }, [settings, savedSettings]);

  const handleChange = (key: keyof SchoolSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    if (!settings.schoolName.trim()) {
      toast.error('Vui lòng nhập tên trường');
      return;
    }
    LocalStore.updateSchoolSettings(settings);
    setSavedSettings(settings);
    setIsSaved(true);
    toast.success('Đã lưu cấu hình trường học & hệ thống thành công!');
    setTimeout(() => setIsSaved(false), 3000);
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
    <div className="p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* Header */}
      <div className="pb-5 border-b border-border-strong flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-text-primary">
            CẤU HÌNH & CÀI ĐẶT HỆ THỐNG
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản trị thông tin cơ sở giáo dục thụ động (Sở, Phòng, Trường, Năm học, Ký duyệt) dùng đồng bộ cho toàn bộ bản in và báo cáo
          </p>
        </div>

        {isSaved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold">
            <Check size={16} weight="bold" />
            <span>Cấu hình đã lưu & có hiệu lực</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSystemSettings} className="space-y-6">
        {/* Unit & Administrative Information */}
        <div className="bg-surface rounded-sm border border-border-strong p-6 space-y-5 shadow-[2px_2px_0px_0px_rgba(13,1,41,0.1)]">
          <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-3 border-b border-border">
            <Buildings size={18} className="text-teal" weight="duotone" />
            <span>Thông tin đơn vị quản lý & Cơ sở trường học</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="departmentName"
                label="Cơ quan cấp trên / Sở GD&ĐT"
                value={settings.departmentName}
                onChange={(e) => handleChange('departmentName', e.target.value)}
                placeholder="VD: SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI"
                required
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Hiển thị dòng 1 góc trái trên tất cả biểu mẫu in (TKB, Sơ đồ lớp, Danh sách HS, Điểm danh)
              </span>
            </div>

            <div>
              <Input
                id="divisionName"
                label="Phòng GD&ĐT / Đơn vị trực thuộc"
                value={settings.divisionName}
                onChange={(e) => handleChange('divisionName', e.target.value)}
                placeholder="VD: PHÒNG GIÁO DỤC VÀ ĐÀO TẠO CẦU GIẤY"
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Phòng GD&ĐT phụ trách địa bàn (áp dụng trường THCS/Tiểu học)
              </span>
            </div>

            <div>
              <Input
                id="schoolName"
                label="Tên trường học"
                value={settings.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
                placeholder="VD: TRƯỜNG THCS NGUYỄN TẤT THÀNH"
                required
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Tên chính thức in hoa trên thanh tiêu đề và văn bản in ấn
              </span>
            </div>

            <div>
              <Input
                id="province"
                label="Tỉnh / Thành phố ban hành"
                value={settings.province}
                onChange={(e) => handleChange('province', e.target.value)}
                placeholder="VD: Hà Nội"
                required
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Dùng tự động trong câu ban hành: &quot;[Tỉnh/TP], ngày ... tháng ... năm ...&quot;
              </span>
            </div>

            <div>
              <Input
                id="address"
                label="Địa chỉ trụ sở trường"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="VD: Số 136 Xuân Thủy, Cầu Giấy, Hà Nội"
              />
            </div>

            <div>
              <Input
                id="phone"
                label="Hotline / Số điện thoại liên hệ"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="VD: (024) 3833 4455"
              />
            </div>
          </div>
        </div>

        {/* Academic Year & Semester Configuration */}
        <div className="bg-surface rounded-sm border border-border-strong p-6 space-y-5 shadow-[2px_2px_0px_0px_rgba(13,1,41,0.1)]">
          <div className="flex items-center gap-2 text-sm font-bold text-text-primary pb-3 border-b border-border">
            <CalendarBlank size={18} className="text-teal" weight="duotone" />
            <span>Niên khóa, Học kỳ & Phê duyệt ký biểu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                id="schoolYear"
                label="Năm học hiện hành"
                value={settings.schoolYear}
                onChange={(e) => handleChange('schoolYear', e.target.value)}
                placeholder="VD: 2026 - 2027"
                required
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-xs font-bold text-text-primary mb-1.5">
                Học kỳ áp dụng
              </label>
              <select
                id="semester"
                value={settings.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xs border border-border-strong bg-surface focus:outline-none focus:border-teal font-medium"
              >
                <option value="Học kỳ I">Học kỳ I</option>
                <option value="Học kỳ II">Học kỳ II</option>
                <option value="Cả năm học">Cả năm học</option>
              </select>
            </div>

            <div>
              <Input
                id="principalName"
                label="Hiệu trưởng / Đại diện BGH phê duyệt"
                value={settings.principalName}
                onChange={(e) => handleChange('principalName', e.target.value)}
                placeholder="VD: TS. Lê Thị Quỳnh Mai"
                required
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Ký và đóng dấu phần BAN GIÁM HIỆU PHÊ DUYỆT
              </span>
            </div>
          </div>
        </div>

        {/* Live Preview Box of Formal Print Header */}
        <div className="bg-surface rounded-sm border border-border-strong p-6 space-y-3 shadow-[2px_2px_0px_0px_rgba(13,1,41,0.1)]">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <Eye size={18} className="text-teal" weight="duotone" />
              <span>Xem trước mẫu văn bản in ấn (Formal Header Preview)</span>
            </div>
            <span className="text-[11px] text-text-muted font-mono font-medium">Chuẩn A4 Header</span>
          </div>

          <div className="p-4 bg-white text-black border-2 border-black rounded-xs shadow-inner space-y-3">
            <div className="flex justify-between items-start border-b-2 border-black pb-2">
              <div>
                <p className="text-[9pt] font-semibold uppercase tracking-wider text-black">
                  {settings.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}
                </p>
                <p className="text-[10pt] font-black uppercase tracking-tight text-black">
                  {settings.schoolName || 'TÊN ĐƠN VỊ TRƯỜNG HỌC'}
                </p>
                <p className="text-[8pt] italic text-gray-700">
                  Địa chỉ: {settings.address || '...'} · Hotline: {settings.phone || '...'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11pt] font-black tracking-tight uppercase text-black">
                  VĂN BẢN MẪU / THỜI KHÓA BIỂU
                </p>
                <p className="text-[8.5pt] font-medium text-gray-800">
                  Năm học {settings.schoolYear || '2026 - 2027'} · {settings.semester || 'Học kỳ I'}
                </p>
              </div>
            </div>

            <div className="flex justify-between text-center text-[8.5pt] pt-2">
              <div>
                <p className="font-bold uppercase">BAN GIÁM HIỆU PHÊ DUYỆT</p>
                <p className="italic text-[7.5pt] text-gray-600">(Ký và đóng dấu)</p>
                <div className="h-8" />
                <p className="font-bold uppercase">{settings.principalName || 'TS. Lê Thị Quỳnh Mai'}</p>
              </div>
              <div>
                <p className="italic text-[8pt] text-gray-700 mb-0.5">
                  {settings.province || 'Hà Nội'}, ngày ... tháng ... năm ...
                </p>
                <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
                <p className="italic text-[7.5pt] text-gray-600">(Ký và ghi rõ họ tên)</p>
                <div className="h-8" />
                <p className="font-bold uppercase">NGUYỄN VĂN AN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty}
            className={cn('gap-2', !isDirty && 'opacity-50 cursor-not-allowed')}
          >
            <FloppyDisk size={18} weight="bold" />
            <span>Lưu cấu hình toàn trường</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty}
            className={cn(!isDirty && 'opacity-50 cursor-not-allowed')}
            onClick={() => {
              if (savedSettings) {
                setSettings(savedSettings);
                toast.info('Đã hoàn tác thay đổi chưa lưu');
              }
            }}
          >
            <span>Hủy thay đổi</span>
          </Button>
        </div>
      </form>

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
              LocalStorage Repository (Active)
            </span>
            <span className="text-text-muted block">
              Dữ liệu cấu hình trường học được lưu trữ tập trung, tự động phát sự kiện cập nhật thời gian thực cho toàn bộ các giao diện người dùng.
            </span>
          </div>

          <div className="p-3.5 bg-surface-muted/60 rounded-sm border border-border space-y-1">
            <span className="text-text-muted block font-medium">Mô hình phân quyền</span>
            <span className="font-bold text-text-primary block text-sm">
              Role-Based Access Control (RBAC)
            </span>
            <span className="text-text-muted block">
              Chỉ Quản trị viên (ADMIN) có quyền điều chỉnh thông tin trường học và niên khóa.
            </span>
          </div>
        </div>
      </div>

      {/* Reset System Data */}
      <div className="bg-surface rounded-sm border border-danger/40 p-6 space-y-4 shadow-[2px_2px_0px_0px_rgba(158,42,43,0.12)]">
        <div>
          <h2 className="text-sm font-bold text-danger">Khôi phục dữ liệu mẫu hệ thống</h2>
          <p className="text-xs text-text-muted mt-1">
            Khôi phục toàn bộ dữ liệu mẫu (16 Lớp học, 480 học sinh, giáo viên, thời khóa biểu và thông tin trường ban đầu).
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
