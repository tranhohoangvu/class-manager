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
