import { UserRow } from '@/types';
import { AuthService } from '@/lib/auth';
import { LocalStore } from '@/lib/store';

export class UnauthorizedError extends Error {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export const AuthGuard = {
  /**
   * Check if user is an active administrator.
   */
  isAdmin(user: UserRow | null): boolean {
    return !!user && user.role === 'ADMIN' && user.status === 'active';
  },

  /**
   * Check if user is the homeroom teacher of the specified class (or Admin).
   */
  isHomeroomTeacher(user: UserRow | null, classId: string): boolean {
    if (!user || user.status === 'disabled') return false;
    if (user.role === 'ADMIN') return true;
    const role = LocalStore.getClassRole(user.id, classId);
    return role === 'HOMEROOM_TEACHER';
  },

  /**
   * Check if user teaches in the class (either homeroom or subject teacher).
   */
  hasAccessToClass(user: UserRow | null, classId: string): boolean {
    if (!user || user.status === 'disabled') return false;
    if (user.role === 'ADMIN') return true;
    const role = LocalStore.getClassRole(user.id, classId);
    return role !== null;
  },

  /**
   * Check if user can add, edit, or delete students in a class.
   * Business Rule: Only Homeroom Teacher or Admin can manage students.
   */
  canEditStudent(user: UserRow | null, classId: string): boolean {
    return this.isHomeroomTeacher(user, classId);
  },

  /**
   * Check if user can manage seating (swap, assign, randomize, clear).
   * Business Rule: Only Homeroom Teacher or Admin can alter seating.
   */
  canManageSeating(user: UserRow | null, classId: string): boolean {
    return this.isHomeroomTeacher(user, classId);
  },

  /**
   * Check if user can take attendance.
   * Business Rule:
   * - Homeroom teacher can take general attendance or any subject in their class.
   * - Subject teacher can ONLY take attendance for the subject they are assigned to teach in that class.
   */
  canManageAttendance(
    user: UserRow | null,
    classId: string,
    subjectId?: string | null
  ): boolean {
    if (!user || user.status === 'disabled') return false;
    if (user.role === 'ADMIN') return true;

    const role = LocalStore.getClassRole(user.id, classId);
    if (!role) return false;

    // Homeroom teacher can manage attendance for their class
    if (role === 'HOMEROOM_TEACHER') return true;

    // If subject teacher, they MUST be assigned to this specific subject in this class
    if (role === 'SUBJECT_TEACHER') {
      if (!subjectId) return false; // GVBM cannot mark general class attendance
      const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
      return assignments.some(
        (a) => a.teacher_id === user.id && a.subject_id === subjectId
      );
    }

    return false;
  },

  /**
   * Check if user can create or manage announcements.
   * Business Rule: Only Homeroom Teacher or Admin.
   */
  canManageAnnouncement(user: UserRow | null, classId: string): boolean {
    return this.isHomeroomTeacher(user, classId);
  },

  /**
   * Check if user can edit class settings (name, room, etc.).
   * Business Rule: Homeroom Teacher or Admin.
   */
  canEditClassSettings(user: UserRow | null, classId: string): boolean {
    return this.isHomeroomTeacher(user, classId);
  },

  /**
   * Check if user can manage teachers (assign, lock, create).
   * Business Rule: Admin only.
   */
  canManageTeacherAssignment(user: UserRow | null): boolean {
    return this.isAdmin(user);
  },

  /**
   * Check if user can manage student notes.
   * Business Rule: Homeroom Teacher or Admin.
   */
  canManageStudentNote(user: UserRow | null, classId: string): boolean {
    return this.isHomeroomTeacher(user, classId);
  },

  /**
   * Enforce permission or throw UnauthorizedError.
   */
  assert(condition: boolean, message = 'Bạn không có quyền thực hiện thao tác này.') {
    if (!condition) {
      throw new UnauthorizedError(message);
    }
  },
};
