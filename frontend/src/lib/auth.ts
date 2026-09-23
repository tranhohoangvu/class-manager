import { UserRow, UserRole, Permission, ClassRow, ClassMembershipRole, SubjectRow } from '@/types';
import { LocalStore } from './store';

const SESSION_STORAGE_KEY = 'cm_auth_session';

export interface AuthSession {
  user: UserRow;
  token: string;
  loginAt: string;
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'manage_teachers',
    'manage_classes',
    'manage_system_settings',
    'view_all_classes',
  ],
  TEACHER: [
    'view_own_classes',
    'manage_students',
    'manage_seating',
    'manage_attendance',
    'manage_announcements',
    'manage_student_notes',
  ],
};

export const AuthService = {
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  getCurrentUser(): UserRow | null {
    const session = this.getSession();
    if (!session) return null;
    const user = LocalStore.getUserById(session.user.id);
    if (!user || user.status === 'disabled') {
      this.logout();
      return null;
    }
    return user;
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },

  login(email: string, password?: string): { success: boolean; user?: UserRow; error?: string } {
    const users = LocalStore.getUsers();
    const user = users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return { success: false, error: 'Email không tồn tại trong hệ thống.' };
    }

    if (user.status === 'disabled') {
      return { success: false, error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Mật khẩu không chính xác.' };
    }

    const session: AuthSession = {
      user,
      token: `mock-token-${user.id}-${Date.now()}`,
      loginAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    return { success: true, user };
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('cm_active_class_id');
    }
  },

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  },

  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(permission);
  },

  getClassRole(user: UserRow | null, classId: string): ClassMembershipRole | 'ADMIN' | null {
    if (!user) return null;
    if (user.role === 'ADMIN') return 'ADMIN';
    return LocalStore.getClassRole(user.id, classId);
  },

  hasHomeroomPermission(user: UserRow | null, classId: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return LocalStore.getClassRole(user.id, classId) === 'HOMEROOM_TEACHER';
  },

  getTeacherClassInfo(user: UserRow | null, classId: string): {
    role: ClassMembershipRole | 'ADMIN' | null;
    isHomeroom: boolean;
    subjects: SubjectRow[];
  } {
    if (!user) return { role: null, isHomeroom: false, subjects: [] };
    if (user.role === 'ADMIN') {
      return { role: 'ADMIN', isHomeroom: true, subjects: LocalStore.getSubjects() };
    }

    const role = LocalStore.getClassRole(user.id, classId);
    const isHomeroom = role === 'HOMEROOM_TEACHER';

    // Find subjects taught in this class
    const assignments = LocalStore.getSubjectAssignmentsForClass(classId).filter(
      (sa) => sa.teacher_id === user.id
    );
    const subjects = assignments
      .map((sa) => LocalStore.getSubjectById(sa.subject_id))
      .filter((s): s is SubjectRow => s !== null);

    return { role, isHomeroom, subjects };
  },

  getAssignedClassesForUser(user?: UserRow | null): ClassRow[] {
    const targetUser = user || this.getCurrentUser();
    if (!targetUser) return [];

    const allClasses = LocalStore.getClasses();

    if (targetUser.role === 'ADMIN') {
      return allClasses.filter((c) => c.status === 'active');
    }

    // Teacher accesses classes where they are homeroom teacher OR have subject assignment or membership
    const memberships = LocalStore.getMembershipsForTeacher(targetUser.id);
    const memberClassIds = new Set(memberships.map((m) => m.class_id));

    const assignments = LocalStore.getSubjectAssignmentsForTeacher(targetUser.id);
    assignments.forEach((sa) => memberClassIds.add(sa.class_id));

    if (targetUser.assigned_class_ids) {
      targetUser.assigned_class_ids.forEach((cid) => memberClassIds.add(cid));
    }

    return allClasses.filter(
      (c) =>
        c.status === 'active' &&
        (c.teacher_id === targetUser.id || memberClassIds.has(c.id))
    );
  },
};
