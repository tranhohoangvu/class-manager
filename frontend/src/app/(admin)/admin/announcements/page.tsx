'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  PushPin,
  Trash,
  CheckCircle,
  Calendar,
  ShieldCheck,
  Funnel,
  PencilSimple,
  Sparkle,
  Chalkboard,
} from '@phosphor-icons/react';
import { AnnouncementService } from '@/services';
import { AnnouncementRow, ClassRow } from '@/types';
import { LocalStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatDateVietnamese, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

const formatClassName = (name?: string | null) => {
  if (!name) return '---';
  const clean = name.replace(/^lớp\s+/i, '').trim();
  return `Lớp ${clean}`;
};

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter
  const [targetScopeFilter, setTargetScopeFilter] = useState<string>('all');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementRow | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetClassId, setTargetClassId] = useState('all');
  const [isPinned, setIsPinned] = useState(false);

  const loadData = () => {
    const c = LocalStore.getClasses().filter((cls) => cls.status === 'active');
    setClasses(c);
    // AnnouncementService.getAnnouncements() without classId returns all announcements in LocalStore
    const all = AnnouncementService.getAnnouncements();
    setAnnouncements(all);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo');
      return;
    }
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo');
      return;
    }

    const res = AnnouncementService.createAnnouncement(
      title.trim(),
      content.trim(),
      isPinned,
      targetClassId,
      user
    );

    if (!res.success) {
      toast.error(res.error || 'Tạo thông báo thất bại');
      return;
    }

    const scopeLabel = targetClassId === 'all'
      ? 'toàn trường'
      : formatClassName(classes.find((c) => c.id === targetClassId)?.name);

    toast.success(`Đã đăng thông báo cho ${scopeLabel}!`);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setTargetClassId('all');
    setIsAddModalOpen(false);
    loadData();
  };

  const handleTogglePin = (id: string, classId: string, currentlyPinned: boolean) => {
    const res = AnnouncementService.togglePin(id, classId || 'all', user);
    if (!res.success) {
      toast.error(res.error || 'Thao tác ghim thất bại');
      return;
    }
    toast.success(currentlyPinned ? 'Đã bỏ ghim thông báo' : 'Đã ghim thông báo lên đầu bảng tin');
    loadData();
  };

  const handleConfirmDelete = () => {
    if (announcementToDelete) {
      const res = AnnouncementService.deleteAnnouncement(
        announcementToDelete.id,
        announcementToDelete.class_id || 'all',
        user
      );
      if (!res.success) {
        toast.error(res.error || 'Xoá thông báo thất bại');
        return;
      }
      toast.success('Đã xoá thông báo thành công');
      setAnnouncementToDelete(null);
      loadData();
    }
  };

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    if (targetScopeFilter === 'all') return announcements;
    return announcements.filter((a) => a.class_id === targetScopeFilter);
  }, [announcements, targetScopeFilter]);

  if (!isLoaded) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
        <div className="h-8 w-64 bg-surface-muted rounded animate-pulse" />
        <div className="h-64 bg-surface-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 w-full mx-auto">
      {/* =============================================
          1. HEADER & ACTION BAR
          ============================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-text-primary">
              QUẢN LÝ THÔNG BÁO TOÀN TRƯỜNG
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-teal-subtle text-teal border border-teal/30 font-bold text-xs whitespace-nowrap flex-shrink-0">
              <Megaphone size={14} weight="bold" />
              Bảng tin Nhà trường
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-surface-muted text-text-secondary border border-border font-bold text-xs whitespace-nowrap flex-shrink-0">
              <ShieldCheck size={14} weight="bold" className="text-teal" />
              Ban Giám hiệu phát hành
            </span>
          </div>
          <p className="text-xs md:text-sm text-text-muted mt-1 font-medium">
            Phát hành chỉ đạo chuyên môn, thông báo toàn trường, lịch thi cử, sự kiện và bảng tin điều hành đến 16 lớp THCS.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold border border-teal-strong shadow-xs gap-1.5 whitespace-nowrap flex-shrink-0 h-8 px-3"
            title="Đăng thông báo mới"
          >
            <Plus size={15} weight="bold" />
            <span>Tạo thông báo mới</span>
          </Button>
        </div>
      </div>

      {/* =============================================
          2. FILTER BY SCOPE
          ============================================= */}
      <div className="bg-surface rounded-sm border border-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Funnel size={16} className="text-teal" weight="bold" />
          <span className="text-xs font-bold uppercase text-text-primary tracking-wide">
            Phạm vi thông báo:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={targetScopeFilter}
            onChange={(e) => setTargetScopeFilter(e.target.value)}
            className="h-8 bg-surface border border-border rounded-xs px-3 text-xs text-text-primary font-medium cursor-pointer focus:outline-none focus:border-teal whitespace-nowrap"
          >
            <option value="all">⚡ Tất cả thông báo ({announcements.length})</option>
            <optgroup label="16 Lớp học">
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {formatClassName(cls.name)} (Khối {cls.grade})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* =============================================
          3. ANNOUNCEMENTS LIST
          ============================================= */}
      <div className="space-y-3.5">
        {filteredAnnouncements.map((ann) => {
          const targetClass = classes.find((c) => c.id === ann.class_id);
          const isAllSchool = !ann.class_id || ann.class_id === 'all';

          return (
            <div
              key={ann.id}
              className={cn(
                'bg-surface rounded-sm border p-4 sm:p-5 shadow-xs transition-all relative space-y-3',
                ann.is_pinned
                  ? 'border-amber-300 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-border hover:border-border-strong'
              )}
            >
              {/* Top Meta Line */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                      <PushPin size={12} weight="fill" />
                      Đã ghim
                    </span>
                  )}
                  <span className={cn(
                    'px-2 py-0.5 rounded-xs font-bold text-[11px] border whitespace-nowrap',
                    isAllSchool
                      ? 'bg-teal-subtle text-teal border-teal/30'
                      : 'bg-surface-muted text-text-secondary border-border'
                  )}>
                    {isAllSchool ? '⚡ Toàn trường (16 Lớp · 480 HS)' : formatClassName(targetClass?.name)}
                  </span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Calendar size={13} />
                    {formatDateVietnamese(ann.created_at)}
                  </span>
                </div>

                {/* Pin / Delete Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(ann.id, ann.class_id, ann.is_pinned)}
                    className={cn(
                      'p-1.5 rounded-xs text-xs font-semibold cursor-pointer transition-colors border',
                      ann.is_pinned
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        : 'bg-surface text-text-muted border-border hover:text-text-primary'
                    )}
                    title={ann.is_pinned ? 'Bỏ ghim thông báo' : 'Ghim thông báo lên đầu'}
                  >
                    <PushPin size={14} weight={ann.is_pinned ? 'fill' : 'regular'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnnouncementToDelete(ann)}
                    className="p-1.5 rounded-xs text-xs font-semibold cursor-pointer transition-colors border border-transparent text-text-muted hover:text-danger hover:bg-danger-bg hover:border-danger/30"
                    title="Xóa thông báo"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>

              {/* Title & Content */}
              <div>
                <h2 className="text-base font-bold text-text-primary leading-snug">
                  {ann.title}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="py-12 text-center rounded-sm border border-border bg-surface text-text-muted space-y-2">
            <Megaphone size={32} className="mx-auto text-text-muted/60" />
            <div className="text-sm font-bold text-text-primary">Chưa có thông báo nào</div>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Nhấn &quot;Tạo thông báo mới&quot; để phát hành chỉ đạo, kế hoạch thi cử hoặc bảng tin cho toàn trường.
            </p>
          </div>
        )}
      </div>

      {/* =============================================
          MODAL: CREATE ANNOUNCEMENT
          ============================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo Thông báo Toàn trường"
        description="Phát hành bảng tin, chỉ đạo điều hành từ Ban Giám hiệu tới các khối lớp và giáo viên."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateAnnouncement}
              className="cursor-pointer bg-teal hover:bg-teal-hover text-white font-bold"
            >
              Phát hành Thông báo
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 py-1 text-xs">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Phạm vi gửi thông báo <span className="text-danger">*</span>
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-medium focus:outline-none focus:border-teal cursor-pointer"
            >
              <option value="all">⚡ Toàn trường (Tất cả 16 Lớp · 480 Học sinh · 24 Giáo viên)</option>
              <optgroup label="Từng lớp cụ thể">
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {formatClassName(cls.name)} (Khối {cls.grade})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Tiêu đề thông báo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Kế hoạch Kiểm tra Giữa kỳ II năm học 2026 - 2027"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-border rounded-xs px-3 py-2 text-xs text-text-primary font-bold focus:outline-none focus:border-teal"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              Nội dung thông báo chi tiết <span className="text-danger">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Nhập đầy đủ nội dung thông báo, thời gian, địa điểm, yêu cầu chuẩn bị đối với giáo viên và học sinh..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-surface border border-border rounded-xs p-3 text-xs text-text-primary focus:outline-none focus:border-teal leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pin-announcement"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded-xs border-border text-teal focus:ring-teal cursor-pointer"
            />
            <label htmlFor="pin-announcement" className="text-xs font-semibold text-text-primary cursor-pointer">
              Ghim thông báo này lên đầu bảng tin
            </label>
          </div>
        </form>
      </Modal>

      {/* =============================================
          MODAL: DELETE CONFIRMATION
          ============================================= */}
      <Modal
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        title="Xóa Thông báo"
        description="Bạn có chắc chắn muốn xóa thông báo này khỏi bảng tin không?"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnnouncementToDelete(null)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              className="cursor-pointer bg-danger hover:bg-danger-hover text-white font-bold"
            >
              Xác nhận Xóa
            </Button>
          </div>
        }
      >
        <p className="text-xs text-text-secondary">
          Thông báo &quot;<strong>{announcementToDelete?.title}</strong>&quot; sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống.
        </p>
      </Modal>
    </div>
  );
}
