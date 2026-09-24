// =============================================
// Class Manager — TypeScript Type Definitions
// =============================================

export type UserRole = 'ADMIN' | 'TEACHER';
export type UserStatus = 'active' | 'disabled';

export type StudentStatus = 'active' | 'inactive';
export type ClassStatus = 'active' | 'archived';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type SeatSide = 'left' | 'right';
export type Gender = 'male' | 'female';

// Class-level Teacher Roles
export type ClassMembershipRole = 'HOMEROOM_TEACHER' | 'SUBJECT_TEACHER';

// =============================================
// User & Auth Types
// =============================================

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  password?: string; // Prototype mock password
  avatar_url?: string | null;
  assigned_class_ids?: string[]; // IDs of classes assigned to this teacher
  subject_id?: string | null; // Teacher's specialized subject ID if any
  created_at: string;
  updated_at: string;
}

export type Permission =
  | 'manage_teachers'
  | 'manage_classes'
  | 'manage_system_settings'
  | 'view_all_classes'
  | 'view_own_classes'
  | 'manage_students'
  | 'manage_seating'
  | 'manage_attendance'
  | 'manage_announcements'
  | 'manage_student_notes';

// =============================================
// Subject & Assignment Types
// =============================================

export interface SubjectRow {
  id: string;
  code: string; // MAT, LIT, ENG, PHY, CHE, BIO, HIS, GEO, INF, TEC
  name: string; // Toán, Ngữ văn, Tiếng Anh,...
  max_consecutive_periods?: number; // Configurable max consecutive periods (default: 1, MAT/LIT: 2)
}

export interface ClassMembershipRow {
  id: string;
  teacher_id: string;
  class_id: string;
  role: ClassMembershipRole;
  created_at: string;
}

export interface SubjectAssignmentRow {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  created_at: string;
}

export interface TimetableEntryRow {
  id: string;
  class_id: string;
  day_of_week: number; // 2 = Thứ Hai, ..., 7 = Thứ Bảy
  period: number;      // 1..10 (Tiết 1 đến Tiết 10)
  subject_id: string;
  teacher_id: string | null;
  room?: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Database Row Types
// =============================================

export interface ClassRow {
  id: string;
  teacher_id: string | null; // Homeroom teacher ID (GVCN)
  name: string;
  grade: number; // 6, 7, 8, 9
  room_name: string | null;
  school_year: string;
  max_students: number;
  desk_count: number;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentRow {
  id: string;
  class_id: string;
  student_code: string;
  full_name: string;
  gender: Gender | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  parent_name?: string | null;
  address?: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface DeskRow {
  id: string;
  class_id: string;
  desk_number: number;
  row_num: number;
  col_num: number;
  created_at: string;
}

export interface SeatRow {
  id: string;
  desk_id: string;
  side: SeatSide;
  student_id: string | null;
}

export interface AttendanceRow {
  id: string;
  student_id: string;
  class_id?: string;
  teacher_id?: string | null;
  subject_id?: string | null;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRow {
  id: string;
  class_id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentNoteRow {
  id: string;
  student_id: string;
  class_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Extended / Joined Types
// =============================================

export interface ClassWithTeacher extends ClassRow {
  teacher?: UserRow | null; // GVCN
  student_count?: number;
  subject_teachers?: Array<{
    subject: SubjectRow;
    teacher: UserRow | null;
  }>;
}

export interface TeacherClassRoleInfo {
  class_id: string;
  class_name: string;
  grade: number;
  room_name: string | null;
  student_count: number;
  is_homeroom: boolean;
  subject_names: string[]; // subjects taught by teacher in this class
}

export interface TeacherWithClasses extends UserRow {
  assigned_classes?: ClassRow[];
  homeroom_classes?: ClassRow[];
  subject_assignments?: Array<{
    class: ClassRow;
    subject: SubjectRow;
  }>;
  grades?: number[];
}

export interface StudentWithSeat extends StudentRow {
  seat?: {
    id: string;
    side: SeatSide;
    desk: {
      id: string;
      desk_number: number;
      row_num: number;
      col_num: number;
    };
  } | null;
}

export interface SeatWithStudent extends SeatRow {
  student: StudentRow | null;
}

export interface DeskWithSeats extends DeskRow {
  seats: SeatWithStudent[];
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: string;
}

export interface DailyAttendanceEntry {
  student_id: string;
  student_code: string;
  full_name: string;
  status: AttendanceStatus | null;
  note: string | null;
  attendance_id: string | null;
}

export interface AttendanceHistoryEntry {
  student: StudentRow;
  records: Record<string, AttendanceStatus | null>; // date → status
  summary: AttendanceSummary;
}

// =============================================
// Form Input Types
// =============================================

export interface StudentFormData {
  student_code: string;
  full_name: string;
  gender: Gender | '';
  date_of_birth?: string;
  phone?: string;
  email?: string;
  parent_name?: string;
  address?: string;
}

export interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  status: UserStatus;
  assigned_class_ids?: string[];
}

export interface ClassFormData {
  name: string;
  grade: number;
  room_name: string;
  school_year: string;
  teacher_id: string | null;
  max_students: number;
  desk_count: number;
}

export interface AttendanceFormData {
  entries: Array<{
    student_id: string;
    status: AttendanceStatus;
    note: string;
  }>;
  date: string;
  subject_id?: string | null;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  is_pinned: boolean;
}

export interface ClassSettingsFormData {
  name: string;
  room_name: string;
  school_year: string;
  max_students?: number;
}

// =============================================
// Service Response Types
// =============================================

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface SeatingRandomizeResult {
  assignments: Array<{
    seat_id: string;
    student_id: string | null;
  }>;
}
