import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Tên lớp không được để trống'),
  grade: z.number().int().min(6).max(9),
  room_name: z.string().optional(),
  school_year: z.string().default('2026 - 2027'),
  teacher_id: z.string().nullable().optional(),
  max_students: z.number().int().min(1).max(40).default(40),
  desk_count: z.number().int().default(20),
});

export const updateClassSettingsSchema = z.object({
  name: z.string().min(1, 'Tên lớp không được để trống'),
  room_name: z.string().optional(),
  school_year: z.string().optional(),
  max_students: z.number().int().min(1).max(40).optional(),
});

export const createStudentSchema = z.object({
  student_code: z.string().min(1, 'Mã học sinh không được để trống'),
  full_name: z.string().min(1, 'Họ tên học sinh không được để trống'),
  gender: z.enum(['male', 'female']).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
});

export const updateStudentSchema = z.object({
  student_code: z.string().optional(),
  full_name: z.string().min(1, 'Họ tên học sinh không được để trống').optional(),
  gender: z.enum(['male', 'female']).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
});

export const importStudentsSchema = z.object({
  students: z.array(
    z.object({
      student_code: z.string().min(1),
      full_name: z.string().min(1),
      gender: z.enum(['male', 'female']).optional().nullable(),
      date_of_birth: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
    })
  ),
});

export const assignSeatSchema = z.object({
  seat_id: z.string().min(1, 'Thiếu mã chỗ ngồi'),
  student_id: z.string().nullable(),
});

export const swapSeatsSchema = z.object({
  seat_id_1: z.string().min(1),
  seat_id_2: z.string().min(1),
});

export const saveAttendanceBatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày không đúng (YYYY-MM-DD)'),
  subject_id: z.string().nullable().optional(),
  entries: z.array(
    z.object({
      student_id: z.string().min(1),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      note: z.string().optional().nullable(),
    })
  ),
});

export const saveTimetableEntrySchema = z.object({
  id: z.string().optional(),
  day_of_week: z.number().int().min(2).max(7),
  period: z.number().int().min(1).max(10),
  subject_id: z.string().min(1, 'Môn học không được để trống'),
  teacher_id: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
});

export const updateTimetableEntrySchema = z.object({
  class_id: z.string().optional(),
  day_of_week: z.number().int().min(2).max(7).optional(),
  period: z.number().int().min(1).max(10).optional(),
  subject_id: z.string().min(1).optional(),
  teacher_id: z.string().nullable().optional(),
  room: z.string().nullable().optional(),
});

export const copyTimetableSchema = z.object({
  source_class_id: z.string().min(1, 'Thiếu mã lớp nguồn'),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  content: z.string().optional().nullable(),
  is_pinned: z.boolean().default(false),
});

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Nội dung ghi chú không được để trống'),
});

export const createTeacherSchema = z.object({
  name: z.string().min(1, 'Tên giáo viên không được để trống'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().optional().nullable(),
  password: z.string().min(4, 'Mật khẩu tối thiểu 4 ký tự').default('teacher123'),
  role: z.enum(['ADMIN', 'TEACHER']).default('TEACHER'),
  status: z.enum(['active', 'disabled']).default('active'),
  assigned_class_ids: z.array(z.string()).optional(),
});

export const updateTeacherSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(['active', 'disabled']).optional(),
  assigned_class_ids: z.array(z.string()).optional(),
});

export const assignHomeroomSchema = z.object({
  class_id: z.string().min(1),
  teacher_id: z.string().min(1),
});

export const assignSubjectSchema = z.object({
  class_id: z.string().min(1),
  teacher_id: z.string().min(1),
  subject_id: z.string().min(1),
});
