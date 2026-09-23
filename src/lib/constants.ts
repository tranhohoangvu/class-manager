// =============================================
// Class Manager — Application Constants
// Central place for all business rules.
// Never scatter magic numbers in components.
// =============================================

export const CLASS_CONSTANTS = {
  MAX_STUDENTS: 40,
  DESK_COUNT: 20,
  SEATS_PER_DESK: 2,
  MAX_SEATS: 40, // 20 * 2
  ROWS: 5,
  COLS: 4,
} as const;

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const;

export const SEAT_SIDE = {
  LEFT: 'left',
  RIGHT: 'right',
} as const;

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Có mặt',
  absent: 'Vắng mặt',
  late: 'Đi muộn',
  excused: 'Nghỉ phép',
};

export const ATTENDANCE_STATUS_SHORT: Record<string, string> = {
  present: 'CM',
  absent: 'VM',
  late: 'MH',
  excused: 'NP',
};

export const GENDER_LABELS: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  active: 'Đang học',
  inactive: 'Nghỉ học',
};

export const SIDE_LABELS: Record<string, string> = {
  left: 'Trái',
  right: 'Phải',
};

// Default school year
export const DEFAULT_SCHOOL_YEAR = '2026-2027';

// =============================================
// Timetable Constants (Secondary School Standard)
// 2 sessions: Morning (P1-P5) & Afternoon (P6-P10)
// Saturday: Morning (P1-P3) & Afternoon (P6-P8)
// =============================================

export interface TimetablePeriodConfig {
  period: number;
  label: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  shift: 'morning' | 'afternoon';
  durationMinutes: number;
}

export const TIMETABLE_PERIODS: TimetablePeriodConfig[] = [
  // Buổi sáng: 5 tiết (Thứ Hai - Thứ Sáu), 3 tiết (Thứ Bảy: P1-P3)
  { period: 1, label: 'Tiết 1', startTime: '07:15', endTime: '08:00', shift: 'morning', durationMinutes: 45 },
  { period: 2, label: 'Tiết 2', startTime: '08:00', endTime: '08:45', shift: 'morning', durationMinutes: 45 },
  { period: 3, label: 'Tiết 3', startTime: '08:55', endTime: '09:40', shift: 'morning', durationMinutes: 45 },
  { period: 4, label: 'Tiết 4', startTime: '09:40', endTime: '10:25', shift: 'morning', durationMinutes: 45 },
  { period: 5, label: 'Tiết 5', startTime: '10:30', endTime: '11:15', shift: 'morning', durationMinutes: 45 },
  // Buổi chiều: 5 tiết (Thứ Hai - Thứ Sáu), 3 tiết (Thứ Bảy: P6-P8)
  { period: 6, label: 'Tiết 6', startTime: '13:00', endTime: '13:45', shift: 'afternoon', durationMinutes: 45 },
  { period: 7, label: 'Tiết 7', startTime: '13:45', endTime: '14:30', shift: 'afternoon', durationMinutes: 45 },
  { period: 8, label: 'Tiết 8', startTime: '14:40', endTime: '15:25', shift: 'afternoon', durationMinutes: 45 },
  { period: 9, label: 'Tiết 9', startTime: '15:25', endTime: '16:10', shift: 'afternoon', durationMinutes: 45 },
  { period: 10, label: 'Tiết 10', startTime: '16:15', endTime: '17:00', shift: 'afternoon', durationMinutes: 45 },
];

export interface SpecialSlotConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  shift: 'morning' | 'afternoon';
  durationMinutes: number;
}

const MORNING_ASSEMBLY: SpecialSlotConfig = {
  id: 'morning_assembly',
  name: 'Sinh hoạt đầu giờ',
  startTime: '07:00',
  endTime: '07:15',
  shift: 'morning',
  durationMinutes: 15,
};

const AFTERNOON_ASSEMBLY: SpecialSlotConfig = {
  id: 'afternoon_assembly',
  name: 'Sinh hoạt đầu giờ',
  startTime: '12:45',
  endTime: '13:00',
  shift: 'afternoon',
  durationMinutes: 15,
};

export const TIMETABLE_SPECIAL_SLOTS: SpecialSlotConfig[] & {
  morningAssembly: SpecialSlotConfig;
  afternoonAssembly: SpecialSlotConfig;
} = Object.assign([MORNING_ASSEMBLY, AFTERNOON_ASSEMBLY], {
  morningAssembly: MORNING_ASSEMBLY,
  afternoonAssembly: AFTERNOON_ASSEMBLY,
});

// Danh sách các tiết học được phép theo từng ngày trong tuần (2 = Thứ Hai ... 7 = Thứ Bảy)
export const DAY_ALLOWED_PERIODS: Record<number, number[]> = {
  2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Thứ Hai: 10 tiết
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Thứ Ba: 10 tiết (bình thường)
  4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Thứ Tư: 10 tiết
  5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Thứ Năm: 10 tiết
  6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Thứ Sáu: 10 tiết
  7: [1, 2, 3, 6, 7, 8],             // Thứ Bảy: 6 tiết (Sáng P1-P3, Chiều P6-P8)
};

export function isAllowedPeriodForDay(day: number, period: number): boolean {
  const allowed = DAY_ALLOWED_PERIODS[day];
  return allowed ? allowed.includes(period) : false;
}

export interface TimetableDayConfig {
  day: number; // 2 = Thứ Hai, 7 = Thứ Bảy
  name: string;
  shortName: string;
}

export const TIMETABLE_DAYS: TimetableDayConfig[] = [
  { day: 2, name: 'Thứ Hai', shortName: 'Thứ 2' },
  { day: 3, name: 'Thứ Ba', shortName: 'Thứ 3' },
  { day: 4, name: 'Thứ Tư', shortName: 'Thứ 4' },
  { day: 5, name: 'Thứ Năm', shortName: 'Thứ 5' },
  { day: 6, name: 'Thứ Sáu', shortName: 'Thứ 6' },
  { day: 7, name: 'Thứ Bảy', shortName: 'Thứ 7' },
];

export interface SubjectColorStyle {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  dot: string;
}

export const SUBJECT_COLOR_MAP: Record<string, SubjectColorStyle> = {
  MAT: { // Toán - Xanh dương
    bg: 'bg-blue-50/80 hover:bg-blue-100/80',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-600',
  },
  LIT: { // Ngữ văn - Xanh lá
    bg: 'bg-emerald-50/80 hover:bg-emerald-100/80',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-600',
  },
  ENG: { // Tiếng Anh - Tím
    bg: 'bg-purple-50/80 hover:bg-purple-100/80',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badgeBg: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-600',
  },
  PHY: { // Vật lý - Cyan
    bg: 'bg-cyan-50/80 hover:bg-cyan-100/80',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-100 text-cyan-800',
    dot: 'bg-cyan-600',
  },
  CHE: { // Hóa học - Vàng hổ phách
    bg: 'bg-amber-50/80 hover:bg-amber-100/80',
    text: 'text-amber-800',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-600',
  },
  BIO: { // Sinh học - Xanh cốm
    bg: 'bg-lime-50/80 hover:bg-lime-100/80',
    text: 'text-lime-800',
    border: 'border-lime-200',
    badgeBg: 'bg-lime-100 text-lime-800',
    dot: 'bg-lime-600',
  },
  HIS: { // Lịch sử - Đỏ hồng
    bg: 'bg-rose-50/80 hover:bg-rose-100/80',
    text: 'text-rose-800',
    border: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-600',
  },
  GEO: { // Địa lý - Xanh mòng két Teal
    bg: 'bg-teal-50/80 hover:bg-teal-100/80',
    text: 'text-teal-800',
    border: 'border-teal-200',
    badgeBg: 'bg-teal-100 text-teal-800',
    dot: 'bg-teal-600',
  },
  INF: { // Tin học - Indigo
    bg: 'bg-indigo-50/80 hover:bg-indigo-100/80',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    dot: 'bg-indigo-600',
  },
  TEC: { // Công nghệ - Stone xám ấm
    bg: 'bg-stone-50/80 hover:bg-stone-100/80',
    text: 'text-stone-800',
    border: 'border-stone-200',
    badgeBg: 'bg-stone-100 text-stone-800',
    dot: 'bg-stone-600',
  },
  SHL: { // Sinh hoạt lớp - Violet hoàng gia sang trọng
    bg: 'bg-violet-50/90 hover:bg-violet-100/90',
    text: 'text-violet-800 font-semibold',
    border: 'border-violet-300',
    badgeBg: 'bg-violet-100 text-violet-800 font-bold',
    dot: 'bg-violet-600',
  },
};

export const DEFAULT_SUBJECT_COLOR: SubjectColorStyle = {
  bg: 'bg-slate-50 hover:bg-slate-100',
  text: 'text-slate-700',
  border: 'border-slate-200',
  badgeBg: 'bg-slate-100 text-slate-700',
  dot: 'bg-slate-400',
};
