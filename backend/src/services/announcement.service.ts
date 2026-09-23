import { AnnouncementRepo } from '../repositories/announcement.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { AuthUser, AnnouncementRow } from '../types/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export const AnnouncementService = {
  async getAnnouncements(classId: string): Promise<AnnouncementRow[]> {
    return AnnouncementRepo.getByClassId(classId);
  },

  async createAnnouncement(
    classId: string,
    data: { title: string; content?: string | null; is_pinned?: boolean },
    currentUser: AuthUser
  ): Promise<AnnouncementRow> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền đăng thông báo lớp.');
    }

    return AnnouncementRepo.create({
      class_id: classId,
      title: data.title,
      content: data.content,
      is_pinned: data.is_pinned,
    });
  },

  async togglePin(id: string, classId: string, currentUser: AuthUser): Promise<AnnouncementRow> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền ghim thông báo.');
    }

    const updated = await AnnouncementRepo.togglePin(id);
    if (!updated) {
      throw new NotFoundError('Không tìm thấy thông báo.');
    }
    return updated;
  },

  async deleteAnnouncement(id: string, classId: string, currentUser: AuthUser): Promise<void> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền xóa thông báo.');
    }

    const deleted = await AnnouncementRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Không tìm thấy thông báo để xóa.');
    }
  },
};
