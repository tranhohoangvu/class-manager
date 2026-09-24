'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  PushPin,
  Trash,
  CheckCircle,
  Calendar,
} from '@phosphor-icons/react';
import { AnnouncementService } from '@/services';
import { AnnouncementRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyStateView } from '@/components/ui/state-views';
import { formatDateVietnamese } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentClass } from '@/contexts/class-context';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { currentClassId, currentClass, isHomeroom, isSubjectTeacher, teacherSubjects } = useCurrentClass();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementRow | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const loadData = () => {
    if (!currentClassId) return;
    setAnnouncements(AnnouncementService.getAnnouncements(currentClassId));
  };

  useEffect(() => {
    loadData();
  }, [currentClassId]);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề thông báo');
      return;
    }

    const res = AnnouncementService.createAnnouncement(
      title.trim(),
      content.trim(),
      isPinned,
      currentClassId || '',
      user
    );

    if (!res.success) {
      toast.error(res.error || 'Tạo thông báo thất bại');
      return;
    }

    toast.success('Đã tạo thông báo mới');
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsAddOpen(false);
    loadData();
  };

  const handleTogglePin = (id: string, currentlyPinned: boolean) => {
    const res = AnnouncementService.togglePin(id, currentClassId || '', user);
    if (!res.success) {
      toast.error(res.error || 'Thao tác ghim thất bại');
      return;
    }
    toast.success(currentlyPinned ? 'Đã bỏ ghim thông báo' : 'Đã ghim thông báo lên đầu');
    loadData();
  };

  const handleConfirmDelete = () => {
    if (announcementToDelete) {
      const res = AnnouncementService.deleteAnnouncement(announcementToDelete.id, currentClassId || '', user);
      if (!res.success) {
        toast.error(res.error || 'Xoá thông báo thất bại');
        return;
      }
      toast.success('Đã xoá thông báo');
      setAnnouncementToDelete(null);
      loadData();
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Bảng thông báo lớp học
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-teal-subtle text-teal rounded-xs border border-teal/30">
              {announcements.length} thông báo
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5 font-medium">
            Gửi dặn dò, lịch thi cử, phân công và các sự kiện quan trọng tới học sinh và phụ huynh <strong className="font-semibold text-text-primary">{currentClass?.name || 'lớp'}</strong>
          </p>
        </div>

        {isHomeroom && (
          <Button variant="primary" onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus size={18} weight="bold" />
            <span>Tạo thông báo mới</span>
          </Button>
        )}
      </div>

      {/* Role Banner for Subject Teachers */}
      {isSubjectTeacher && (
        <div className="p-3.5 bg-teal-subtle border border-teal/30 rounded-sm flex items-center justify-between text-sm text-text-primary shadow-xs">
          <span className="leading-relaxed">
            Bạn đang xem bảng thông báo lớp <strong className="font-bold">{currentClass?.name}</strong> với vai trò <strong className="font-bold">Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>. Chế độ chỉ xem thông báo từ GVCN.
          </span>
          <span className="px-2 py-0.5 rounded-xs bg-surface border border-teal/30 font-bold text-xs text-teal ml-4 flex-shrink-0">Chỉ xem</span>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <EmptyStateView
            icon={<Megaphone size={36} className="opacity-60" />}
            title="Chưa có thông báo nào"
            description={`Lớp ${currentClass?.name || ''} chưa có tin thông báo nào được đăng.`}
            actionText={isHomeroom ? "Tạo thông báo mới" : undefined}
            onAction={isHomeroom ? () => setIsAddOpen(true) : undefined}
          />
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 sm:p-7 rounded-sm border transition-all ${
                ann.is_pinned
                  ? 'bg-accent/10 border-2 border-accent shadow-xs'
                  : 'bg-surface border border-border-strong shadow-xs hover:border-accent'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {ann.is_pinned && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[10px] font-bold font-mono uppercase bg-accent text-accent-text border border-border-strong shadow-xs">
                        <PushPin size={12} weight="fill" />
                        Ghim ưu tiên
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-text-primary tracking-tight">
                      {ann.title}
                    </h2>
                  </div>

                  <p className="text-sm sm:text-base text-text-secondary leading-relaxed pt-1 whitespace-pre-wrap">
                    {ann.content}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-text-muted pt-3 border-t border-border mt-3 font-mono">
                    <Calendar size={14} />
                    <span>Đăng ngày {formatDateVietnamese(ann.created_at)}</span>
                  </div>
                </div>

                {isHomeroom && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(ann.id, ann.is_pinned)}
                      className={`p-1.5 rounded-xs border transition-colors cursor-pointer ${
                        ann.is_pinned
                          ? 'text-accent-text bg-accent border-border-strong shadow-xs'
                          : 'text-text-muted border-transparent hover:text-text-primary hover:bg-surface-muted hover:border-border'
                      }`}
                      title={ann.is_pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                    >
                      <PushPin size={17} weight={ann.is_pinned ? 'fill' : 'regular'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnouncementToDelete(ann)}
                      className="p-1.5 rounded-xs border border-transparent text-text-muted hover:text-danger hover:bg-danger-bg hover:border-danger/30 transition-colors cursor-pointer"
                      title="Xoá thông báo"
                    >
                      <Trash size={17} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tạo thông báo lớp mới"
        description="Thông báo sẽ được hiển thị ngay trên bảng tin và trang tổng quan"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input
            id="ann_title"
            label="Tiêu đề thông báo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Ví dụ: Lịch thi giữa kỳ II môn Toán"
          />

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 font-mono">
              Nội dung thông báo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung chi tiết thông báo..."
              className="w-full text-sm p-3.5 bg-surface rounded-xs border border-border-strong focus:outline-none focus:border-accent text-text-primary placeholder:text-text-muted transition-all shadow-xs"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded-xs border-border-strong text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            <span className="text-sm font-medium text-text-primary">
              Ghim thông báo này lên đầu trang
            </span>
          </label>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddOpen(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" variant="primary">
              Đăng thông báo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Xoá thông báo"
        description={`Bạn có chắc chắn muốn xoá thông báo "${announcementToDelete?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xoá thông báo"
        variant="danger"
      />
    </div>
  );
}
