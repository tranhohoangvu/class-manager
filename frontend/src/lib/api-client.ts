// =============================================
// SchoolOps — Centralized REST API Client
// Connects Next.js Frontend to Express Backend
// =============================================

import {
  UserRow,
  ClassRow,
  StudentRow,
  DeskWithSeats,
  AttendanceRow,
  TimetableEntryRow,
  AnnouncementRow,
  StudentNoteRow,
  StudentFormData,
  TeacherFormData,
  ClassFormData,
  AttendanceFormData,
  AnnouncementFormData,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '' : 'http://localhost:4000');

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiError extends Error {
  code: string;
  constructor(message: string, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // If a token exists in localStorage, send as Bearer fallback
  if (typeof window !== 'undefined') {
    try {
      const sessionStr = localStorage.getItem('cm_auth_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${session.token}`);
        }
      }
    } catch {
      // Ignore storage read error
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send and receive HTTP-only cookies
  });

  const json: ApiResponse<T> = await res.json().catch(() => ({}));

  if (!res.ok || json.error) {
    const errorMsg = json.error?.message || `Lỗi máy chủ (${res.status})`;
    const errorCode = json.error?.code || 'SERVER_ERROR';
    throw new ApiError(errorMsg, errorCode);
  }

  return json.data as T;
}

export const api = {
  // Health
  health: {
    check: () => request<{ status: string; database: string }>('/health'),
  },

  // Auth
  auth: {
    login: (email: string, password?: string) =>
      request<{ user: UserRow; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      }),
    me: () => request<{ user: UserRow }>('/api/auth/me'),
  },

  // Classes
  classes: {
    getAll: () => request<ClassRow[]>('/api/classes'),
    getById: (id: string) => request<ClassRow>(`/api/classes/${id}`),
    create: (data: Partial<ClassFormData>) =>
      request<ClassRow>('/api/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateSettings: (id: string, data: { name?: string; room_name?: string; school_year?: string; max_students?: number }) =>
      request<ClassRow>(`/api/classes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    archive: (id: string) =>
      request<ClassRow>(`/api/classes/${id}/archive`, {
        method: 'POST',
      }),
  },

  // Students
  students: {
    getByClass: (classId: string) => request<StudentRow[]>(`/api/classes/${classId}/students`),
    getById: (id: string) => request<StudentRow>(`/api/students/${id}`),
    create: (classId: string, data: StudentFormData) =>
      request<StudentRow>(`/api/classes/${classId}/students`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<StudentFormData & { status: 'active' | 'inactive' }>) =>
      request<StudentRow>(`/api/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/students/${id}`, {
        method: 'DELETE',
      }),
    import: (classId: string, students: StudentFormData[]) =>
      request<StudentRow[]>(`/api/classes/${classId}/students/import`, {
        method: 'POST',
        body: JSON.stringify({ students }),
      }),
  },

  // Seating
  seating: {
    getDesksWithSeats: (classId: string) => request<DeskWithSeats[]>(`/api/classes/${classId}/seating`),
    assign: (classId: string, seatId: string, studentId: string | null) =>
      request<{ message: string }>(`/api/classes/${classId}/seating/assign`, {
        method: 'POST',
        body: JSON.stringify({ seat_id: seatId, student_id: studentId }),
      }),
    swap: (classId: string, seatId1: string, seatId2: string) =>
      request<{ message: string }>(`/api/classes/${classId}/seating/swap`, {
        method: 'POST',
        body: JSON.stringify({ seat_id_1: seatId1, seat_id_2: seatId2 }),
      }),
    clear: (classId: string) =>
      request<{ message: string }>(`/api/classes/${classId}/seating/clear`, {
        method: 'POST',
      }),
    randomize: (classId: string) =>
      request<{ message: string }>(`/api/classes/${classId}/seating/randomize`, {
        method: 'POST',
      }),
  },

  // Attendance
  attendance: {
    getDaily: (classId: string, date: string, subjectId?: string | null) => {
      let query = `?date=${encodeURIComponent(date)}`;
      if (subjectId) query += `&subject_id=${encodeURIComponent(subjectId)}`;
      return request<Array<{
        student_id: string;
        student_code: string;
        full_name: string;
        status: any;
        note: string | null;
        attendance_id: string | null;
      }>>(`/api/classes/${classId}/attendance${query}`);
    },
    saveBatch: (classId: string, data: AttendanceFormData) =>
      request<{ message: string }>(`/api/classes/${classId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getHistory: (classId: string, startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const q = params.toString() ? `?${params.toString()}` : '';
      return request<AttendanceRow[]>(`/api/classes/${classId}/attendance/history${q}`);
    },
    getRecords: (classId: string) =>
      request<AttendanceRow[]>(`/api/classes/${classId}/attendance/records`),
  },

  // Timetable
  timetable: {
    getByClass: (classId: string) => request<TimetableEntryRow[]>(`/api/classes/${classId}/timetable`),
    saveEntry: (classId: string, entry: { day_of_week: number; period: number; subject_id: string; teacher_id?: string | null }) =>
      request<TimetableEntryRow>(`/api/classes/${classId}/timetable/entries`, {
        method: 'POST',
        body: JSON.stringify(entry),
      }),
    deleteEntry: (id: string) =>
      request<{ message: string }>(`/api/classes/timetable/entries/${id}`, {
        method: 'DELETE',
      }),
    copy: (classId: string, sourceClassId: string) =>
      request<{ message: string }>(`/api/classes/${classId}/timetable/copy`, {
        method: 'POST',
        body: JSON.stringify({ source_class_id: sourceClassId }),
      }),
    clear: (classId: string) =>
      request<{ message: string }>(`/api/classes/${classId}/timetable/clear`, {
        method: 'POST',
      }),
  },

  // Announcements
  announcements: {
    getByClass: (classId: string) => request<AnnouncementRow[]>(`/api/classes/${classId}/announcements`),
    create: (classId: string, data: AnnouncementFormData) =>
      request<AnnouncementRow>(`/api/classes/${classId}/announcements`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    togglePin: (classId: string, id: string) =>
      request<AnnouncementRow>(`/api/classes/${classId}/announcements/${id}/pin`, {
        method: 'PATCH',
      }),
    delete: (classId: string, id: string) =>
      request<{ message: string }>(`/api/classes/${classId}/announcements/${id}`, {
        method: 'DELETE',
      }),
  },

  // Notes
  notes: {
    getByStudent: (studentId: string) => request<StudentNoteRow[]>(`/api/notes/student/${studentId}`),
    create: (studentId: string, content: string) =>
      request<StudentNoteRow>(`/api/notes/student/${studentId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    delete: (studentId: string, id: string) =>
      request<{ message: string }>(`/api/notes/${id}/student/${studentId}`, {
        method: 'DELETE',
      }),
  },

  // Teachers (Admin)
  teachers: {
    getAll: () => request<any[]>('/api/teachers'),
    getById: (id: string) => request<UserRow>(`/api/teachers/${id}`),
    create: (data: TeacherFormData) =>
      request<UserRow>('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<TeacherFormData>) =>
      request<UserRow>(`/api/teachers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    toggleStatus: (id: string) =>
      request<UserRow>(`/api/teachers/${id}/toggle-status`, {
        method: 'POST',
      }),
    assignHomeroom: (classId: string, teacherId: string) =>
      request<{ message: string }>('/api/teachers/assign-homeroom', {
        method: 'POST',
        body: JSON.stringify({ class_id: classId, teacher_id: teacherId }),
      }),
    assignSubject: (teacherId: string, classId: string, subjectId: string) =>
      request<{ message: string }>('/api/teachers/assign-subject', {
        method: 'POST',
        body: JSON.stringify({ teacher_id: teacherId, class_id: classId, subject_id: subjectId }),
      }),
    removeSubjectAssignment: (id: string) =>
      request<{ message: string }>(`/api/teachers/subject-assignments/${id}`, {
        method: 'DELETE',
      }),
  },

  // Reports (Admin)
  reports: {
    getSchoolSummary: (date?: string) => {
      const q = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<any>(`/api/reports/school-summary${q}`);
    },
    getGradeBreakdown: (date?: string) => {
      const q = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<any[]>(`/api/reports/grade-attendance${q}`);
    },
  },
};
