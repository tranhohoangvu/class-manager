import { AnnouncementRow, UserRow } from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';
import { announcementSchema } from '@/lib/validations/forms';

export const AnnouncementService = {
  getAnnouncements(classId?: string): AnnouncementRow[] {
    const list = LocalStore.getAnnouncements(classId);
    return list.sort((a, b) => {
      if (a.is_pinned === b.is_pinned) {
        return b.created_at.localeCompare(a.created_at);
      }
      return a.is_pinned ? -1 : 1;
    });
  },

  createAnnouncement(
    title: string,
    content: string,
    is_pinned: boolean,
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<AnnouncementRow> {
    if (!AuthGuard.canManageAnnouncement(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền đăng thông báo lớp.');
    }

    const validation = announcementSchema.safeParse({ title, content, is_pinned });
    if (!validation.success) {
      return failure(validation.error.errors[0]?.message || 'Nội dung thông báo không hợp lệ');
    }

    const item = LocalStore.addAnnouncement(title, content, is_pinned, classId);
    return success(item);
  },

  togglePin(
    id: string,
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<void> {
    if (!AuthGuard.canManageAnnouncement(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền ghim thông báo.');
    }

    LocalStore.togglePinAnnouncement(id);
    return success();
  },

  deleteAnnouncement(
    id: string,
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<void> {
    if (!AuthGuard.canManageAnnouncement(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền xoá thông báo.');
    }

    LocalStore.deleteAnnouncement(id);
    return success();
  },
};
