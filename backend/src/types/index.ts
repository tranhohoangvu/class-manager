export type UserRole = 'ADMIN' | 'TEACHER';
export type UserStatus = 'active' | 'disabled';
export type StudentStatus = 'active' | 'inactive';
export type ClassStatus = 'active' | 'archived';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type SeatSide = 'left' | 'right';
export type Gender = 'male' | 'female';
export type ClassMembershipRole = 'HOMEROOM_TEACHER' | 'SUBJECT_TEACHER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubjectRow {
  id: string;
  code: string;
  name: string;
  max_consecutive_periods: number;
  created_at: string;
}

export interface ClassRow {
  id: string;
  teacher_id: string | null;
  name: string;
  grade: number;
  room_name: string | null;
  school_year: string;
  max_students: number;
  desk_count: number;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
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
  day_of_week: number;
  period: number;
  subject_id: string;
  teacher_id: string | null;
  room?: string | null;
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

export interface SeatWithStudent extends SeatRow {
  student: StudentRow | null;
}

export interface DeskWithSeats extends DeskRow {
  seats: SeatWithStudent[];
}

export interface AttendanceRow {
  id: string;
  student_id: string;
  class_id: string | null;
  teacher_id: string | null;
  subject_id: string | null;
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
  class_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}
