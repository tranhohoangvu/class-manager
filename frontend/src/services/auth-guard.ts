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
  isHomeroomTeacher(user: UserRow | null, classId: string | null | undefined): boolean {
    if (!user || user.status === 'disabled' || !classId) return false;
    if (user.role === 'ADMIN') return true;
    const role = LocalStore.getClassRole(user.id, classId);
    return role === 'HOMEROOM_TEACHER';
  },

  /**
   * Check if user teaches in the class (either homeroom or subject teacher).
   */
  hasAccessToClass(user: UserRow | null, classId: string | null | undefined): boolean {
    if (!user || user.status === 'disabled' || !classId) return false;
    if (user.role === 'ADMIN') return true;
    const role = LocalStore.getClassRole(user.id, classId);
    return role !== null;
  },

  /**
   * Check if user can view timetable of a class.
   * Business Rule:
   * - ADMIN: Can view all classes in the school.
   * - TEACHERS: Can ONLY view timetable of classes they teach (Homeroom or Subject teacher).
   */
  canViewTimetable(user: UserRow | null, classId: string | null | undefined): boolean {
    return this.hasAccessToClass(user, classId);
  },

  /**
   * Check if user can edit, create, delete, or modify timetable entries.
   * Business Rule: ONLY Admin can edit/manage timetable.
   * Teachers (including Homeroom and Subject teachers) CANNOT edit anything related to timetable.
   */
  canManageTimetable(user: UserRow | null, _classId?: string | null): boolean {
    return this.isAdmin(user);
  },

  /**
   * Check if user can add, edit, or delete students in a class.
   * Business Rule: ONLY Admin can edit/manage student information.
   * Teachers (including Homeroom GVCN and Subject Teachers GVBM) CANNOT edit student information.
   */
  canEditStudent(user: UserRow | null, _classId?: string | null): boolean {
    return this.isAdmin(user);
  },

  /**
   * Check if user can manage seating (swap, assign, randomize, clear).
   * Business Rule: Only Homeroom Teacher or Admin can alter seating.
   */
  canManageSeating(user: UserRow | null, classId: string): boolean {
    return this.isHomeroomTeacher(user, classId);
  },

  /**
   * Check if user can take attendance for a specific subject in a class.
   * Business Rule:
   * - ADMIN: Full attendance rights.
   * - TEACHERS (both Homeroom and Subject Teachers): Can ONLY take attendance
   *   for the specific subject they are assigned to teach in that class.
   * - Homeroom teacher does NOT get blanket attendance rights for other teachers' subjects.
   * - Attendance without a subjectId is not allowed for teachers.
   */
  canManageAttendance(
    user: UserRow | null,
    classId: string | null | undefined,
    subjectId?: string | null
  ): boolean {
    if (!user || user.status === 'disabled' || !classId) return false;
    if (user.role === 'ADMIN') return true;

    // Both GVCN and GVBM MUST have a specific subject assigned to them in this class
    if (!subjectId) return false;

    const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
    return assignments.some(
      (a) => a.teacher_id === user.id && a.subject_id === subjectId
    );
  },

  /**
   * Check if user can VIEW attendance data for a specific class and subject.
   * Business Rules:
   * - ADMIN: Full access to view attendance for all classes and subjects.
   * - HOMEROOM TEACHER (GVCN): Full VIEW scope for all subjects in their homeroom class
   *   (including subjects taught by other teachers, read-only).
   * - SUBJECT TEACHER (GVBM): Can ONLY view attendance of their own assigned subjects.
   *   (Denied view access to other teachers' subjects).
   */
  canViewAttendance(
    user: UserRow | null,
    classId: string | null | undefined,
    subjectId?: string | null
  ): boolean {
    if (!user || user.status === 'disabled' || !classId) return false;
    if (user.role === 'ADMIN') return true;

    // GVCN has full VIEW scope for all subjects in their homeroom class
    if (this.isHomeroomTeacher(user, classId)) return true;

    // Pure GVBM can ONLY view their own assigned subjects
    if (!subjectId) return false;

    const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
    return assignments.some(
      (a) => a.teacher_id === user.id && a.subject_id === subjectId
    );
  },

  /**
   * Check if a teacher can take attendance for a specific timetable period.
   * CanAttend(classId, periodId, teacherId)
   */
  canAttendPeriod(
    user: UserRow | null,
    classId: string | null | undefined,
    dayOfWeek: number,
    period: number
  ): boolean {
    if (!user || user.status === 'disabled' || !classId) return false;
    if (user.role === 'ADMIN') return true;

    const entry = LocalStore.getTimetableEntry(classId, dayOfWeek, period);
    if (!entry || !entry.subject_id) return false;

    // Direct match on entry teacher_id
    if (entry.teacher_id === user.id) return true;

    // Match on assigned subject in this class
    const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
    return assignments.some(
      (a) => a.teacher_id === user.id && a.subject_id === entry.subject_id
    );
  },

  /**
   * Get list of subjects assigned to this teacher in the given class.
   */
  getTeacherAssignedSubjectsInClass(user: UserRow | null, classId: string | null | undefined) {
    if (!user || user.status === 'disabled' || !classId) return [];
    if (user.role === 'ADMIN') return LocalStore.getSubjects();

    const assignments = LocalStore.getSubjectAssignmentsForClass(classId);
    const userAssignments = assignments.filter((a) => a.teacher_id === user.id);
    const assignedSubjectIds = new Set(userAssignments.map((a) => a.subject_id));
    return LocalStore.getSubjects().filter((s) => assignedSubjectIds.has(s.id));
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
