import { DeskWithSeats, UserRow, SeatWithStudent } from '@/types';
import { LocalStore } from '@/lib/store';
import { AuthGuard } from './auth-guard';
import { OperationResult, success, failure } from './types';
import { shuffleArray } from '@/lib/utils';

export const SeatingService = {
  getDesks(classId?: string): DeskWithSeats[] {
    return LocalStore.getDesks(classId);
  },

  assignSeat(
    seatId: string,
    studentId: string | null,
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<DeskWithSeats[]> {
    // 1. Authorization check
    if (!AuthGuard.canManageSeating(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền sắp xếp chỗ ngồi.');
    }

    // 2. Data Integrity: Student must belong to class
    if (studentId) {
      const student = LocalStore.getStudentById(studentId);
      if (!student) {
        return failure('Học sinh không tồn tại trong hệ thống.');
      }
      if (student.class_id !== classId) {
        return failure('Học sinh không thuộc lớp học này.');
      }
    }

    // 3. Perform assignment in LocalStore
    LocalStore.assignSeat(seatId, studentId, classId);
    const updatedDesks = LocalStore.getDesks(classId);

    return success(updatedDesks);
  },

  swapSeats(
    seatId1: string,
    seatId2: string,
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<DeskWithSeats[]> {
    // 1. Authorization check
    if (!AuthGuard.canManageSeating(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền hoán đổi chỗ ngồi.');
    }

    if (seatId1 === seatId2) {
      return failure('Không thể hoán đổi cùng một vị trí.');
    }

    LocalStore.swapSeats(seatId1, seatId2, classId);
    const updatedDesks = LocalStore.getDesks(classId);

    return success(updatedDesks);
  },

  randomizeSeating(
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<DeskWithSeats[]> {
    // 1. Authorization check
    if (!AuthGuard.canManageSeating(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền xáo trộn chỗ ngồi.');
    }

    const updatedDesks = LocalStore.randomizeSeating(classId);
    return success(updatedDesks);
  },

  clearAllSeats(
    classId: string,
    currentUser: UserRow | null
  ): OperationResult<DeskWithSeats[]> {
    // 1. Authorization check
    if (!AuthGuard.canManageSeating(currentUser, classId)) {
      return failure('Chỉ Giáo viên Chủ nhiệm hoặc Quản trị viên mới có quyền xoá sơ đồ chỗ ngồi.');
    }

    const desks = LocalStore.getDesks(classId);
    const cleared = desks.map((d) => ({
      ...d,
      seats: d.seats.map((s) => ({ ...s, student_id: null, student: null })),
    }));

    LocalStore.saveDesks(classId, cleared);
    return success(cleared);
  },
};
