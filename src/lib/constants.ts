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
// 6 days (Mon-Sat) x 5 morning periods
// =============================================

export interface TimetablePeriodConfig {
  period: number;
  label: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  shift: 'morning';
}

export const TIMETABLE_PERIODS: TimetablePeriodConfig[] = [
  { period: 1, label: 'Tiết 1', startTime: '07:15', endTime: '08:00', shift: 'morning' },
  { period: 2, label: 'Tiết 2', startTime: '08:05', endTime: '08:50', shift: 'morning' },
  { period: 3, label: 'Tiết 3', startTime: '09:10', endTime: '09:55', shift: 'morning' },
  { period: 4, label: 'Tiết 4', startTime: '10:05', endTime: '10:50', shift: 'morning' },
  { period: 5, label: 'Tiết 5', startTime: '10:55', endTime: '11:40', shift: 'morning' },
];

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
};

export const DEFAULT_SUBJECT_COLOR: SubjectColorStyle = {
  bg: 'bg-slate-50 hover:bg-slate-100',
  text: 'text-slate-700',
  border: 'border-slate-200',
  badgeBg: 'bg-slate-100 text-slate-700',
  dot: 'bg-slate-400',
};
