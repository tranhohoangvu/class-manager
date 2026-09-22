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
            <span className="px-3 py-1 text-xs font-semibold bg-accent-subtle text-accent rounded-full border border-accent/20">
              {announcements.length} thông báo
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1.5">
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
        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-center justify-between text-sm text-indigo-900 shadow-2xs">
          <span className="leading-relaxed">
            Bạn đang xem bảng thông báo lớp <strong className="font-semibold">{currentClass?.name}</strong> với vai trò <strong className="font-semibold">Giáo viên Bộ môn ({teacherSubjects.map((s) => s.name).join(', ')})</strong>. Chế độ chỉ xem thông báo từ GVCN.
          </span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-100 font-semibold text-xs text-indigo-800 ml-4 flex-shrink-0">Chỉ xem</span>
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
              className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                ann.is_pinned
                  ? 'bg-surface border-accent/40 shadow-xs ring-1 ring-accent/15'
                  : 'bg-surface border-border shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {ann.is_pinned && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-subtle text-accent border border-accent/20">
                        <PushPin size={13} weight="fill" />
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

                  <div className="flex items-center gap-2 text-xs text-text-muted pt-3 border-t border-border/60 mt-3">
                    <Calendar size={15} />
                    <span>Đăng ngày {formatDateVietnamese(ann.created_at)}</span>
                  </div>
                </div>

                {isHomeroom && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(ann.id, ann.is_pinned)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        ann.is_pinned
                          ? 'text-accent bg-accent-subtle hover:bg-accent/20'
                          : 'text-text-muted hover:text-text-primary hover:bg-surface-muted'
                      }`}
                      title={ann.is_pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                    >
                      <PushPin size={18} weight={ann.is_pinned ? 'fill' : 'regular'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnouncementToDelete(ann)}
                      className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors cursor-pointer"
                      title="Xoá thông báo"
                    >
                      <Trash size={18} />
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
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Nội dung thông báo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung chi tiết thông báo..."
              className="w-full text-sm p-3.5 bg-surface rounded-xl border border-border focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
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
