import { SeatingRepo } from '../repositories/seating.repo.js';
import { ClassRepo } from '../repositories/class.repo.js';
import { AuthUser, DeskWithSeats } from '../types/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export const SeatingService = {
  async getDesksWithSeats(classId: string): Promise<DeskWithSeats[]> {
    return SeatingRepo.getDesksWithSeats(classId);
  },

  async assignSeat(
    classId: string,
    seatId: string,
    studentId: string | null,
    currentUser: AuthUser
  ): Promise<void> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền xếp chỗ ngồi.');
    }

    await SeatingRepo.assignSeat(seatId, studentId);
  },

  async swapSeats(
    classId: string,
    seatId1: string,
    seatId2: string,
    currentUser: AuthUser
  ): Promise<void> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền hoán đổi chỗ ngồi.');
    }

    await SeatingRepo.swapSeats(seatId1, seatId2);
  },

  async clearAllSeats(classId: string, currentUser: AuthUser): Promise<void> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền xóa toàn bộ sơ đồ chỗ ngồi.');
    }

    await SeatingRepo.clearAllSeats(classId);
  },

  async randomizeSeating(classId: string, currentUser: AuthUser): Promise<void> {
    const cls = await ClassRepo.getById(classId);
    if (!cls) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (currentUser.role !== 'ADMIN' && cls.teacher_id !== currentUser.id) {
      throw new ForbiddenError('Chỉ GVCN hoặc Quản trị viên mới có quyền trộn chỗ ngồi ngẫu nhiên.');
    }

    await SeatingRepo.randomizeSeating(classId);
  },
};
