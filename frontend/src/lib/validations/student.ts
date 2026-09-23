import { z } from 'zod';

export const studentSchema = z.object({
  student_code: z
    .string()
    .min(1, 'Mã học sinh không được để trống')
    .max(20, 'Mã học sinh tối đa 20 ký tự')
    .regex(/^[A-Z0-9_-]+$/i, 'Mã học sinh chỉ gồm chữ, số hoặc dấu gạch nối (-/_)'),
  full_name: z
    .string()
    .min(2, 'Họ và tên tối thiểu 2 ký tự')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  gender: z.enum(['male', 'female']).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Số điện thoại tối đa 20 ký tự')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal('')),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
