import { z } from 'zod';

export const announcementSchema = z.object({
  title: z
    .string()
    .min(1, 'Tiêu đề không được để trống')
    .max(200, 'Tiêu đề tối đa 200 ký tự'),
  content: z
    .string()
    .max(2000, 'Nội dung tối đa 2000 ký tự')
    .optional()
    .or(z.literal('')),
  is_pinned: z.boolean().default(false),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const studentNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Nội dung ghi chú không được để trống')
    .max(1000, 'Ghi chú tối đa 1000 ký tự'),
});

export type StudentNoteFormValues = z.infer<typeof studentNoteSchema>;

export const classSettingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên lớp không được để trống')
    .max(50, 'Tên lớp tối đa 50 ký tự'),
  room_name: z
    .string()
    .max(50, 'Tên phòng tối đa 50 ký tự')
    .optional()
    .or(z.literal('')),
  school_year: z
    .string()
    .max(20, 'Năm học tối đa 20 ký tự')
    .optional()
    .or(z.literal('')),
  max_students: z.coerce
    .number()
    .min(1, 'Sĩ số tối thiểu là 1 học sinh')
    .max(40, 'Sĩ số tối đa là 40 học sinh theo quy chuẩn 20 bàn học')
    .optional(),
});

export type ClassSettingsFormValues = z.infer<typeof classSettingsSchema>;
