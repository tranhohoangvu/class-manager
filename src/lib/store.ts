'use client';

import {
  UserRow,
  StudentRow,
  ClassRow,
  DeskWithSeats,
  AnnouncementRow,
  StudentNoteRow,
  AttendanceRow,
  AttendanceStatus,
  StudentFormData,
  TeacherFormData,
  ClassFormData,
  SubjectRow,
  ClassMembershipRow,
  SubjectAssignmentRow,
  ClassMembershipRole,
} from '@/types';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_CLASS,
  INITIAL_STUDENTS,
  INITIAL_DESKS_MAP,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_STUDENT_NOTES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_SUBJECTS,
  INITIAL_CLASS_MEMBERSHIPS,
  INITIAL_SUBJECT_ASSIGNMENTS,
  generateDesksForClass,
} from './mock-data';

const CURRENT_DATA_VERSION = '2026_thcs_ntt_4x5_20desks_v6';

const STORAGE_KEYS = {
  DATA_VERSION: 'cm_data_version',
  USERS: 'cm_thcs_users',
  CLASSES: 'cm_thcs_classes',
  STUDENTS: 'cm_thcs_students',
  DESKS_MAP: 'cm_thcs_desks_map',
  ANNOUNCEMENTS: 'cm_thcs_announcements',
  NOTES: 'cm_thcs_notes',
  ATTENDANCE: 'cm_thcs_attendance',
  SUBJECTS: 'cm_thcs_subjects',
  MEMBERSHIPS: 'cm_thcs_memberships',
  SUBJECT_ASSIGNMENTS: 'cm_thcs_subject_assignments',
};

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

let isInitialized = false;

function ensureInitialized(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  try {
    const version = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    if (version !== CURRENT_DATA_VERSION) {
      // Clear legacy storage keys
      const legacyKeys = [
        'cm_data_version',
        'cm_users',
        'cm_classes',
        'cm_students',
        'cm_desks_map',
        'cm_announcements',
        'cm_notes',
        'cm_attendance',
        'cm_subjects',
        'cm_memberships',
        'cm_subject_assignments',
        'cm_active_class_id',
        'cm_thcs_users',
        'cm_thcs_classes',
        'cm_thcs_students',
        'cm_thcs_desks_map',
        'cm_thcs_announcements',
        'cm_thcs_notes',
        'cm_thcs_attendance',
        'cm_thcs_subjects',
        'cm_thcs_memberships',
        'cm_thcs_subject_assignments',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));

      // Pre-seed fresh THCS datasets
      setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      setStorageItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      setStorageItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      setStorageItem(STORAGE_KEYS.DESKS_MAP, INITIAL_DESKS_MAP);
      setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
      setStorageItem(STORAGE_KEYS.NOTES, INITIAL_STUDENT_NOTES);
      setStorageItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
      setStorageItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
      setStorageItem(STORAGE_KEYS.MEMBERSHIPS, INITIAL_CLASS_MEMBERSHIPS);
      setStorageItem(STORAGE_KEYS.SUBJECT_ASSIGNMENTS, INITIAL_SUBJECT_ASSIGNMENTS);

      localStorage.setItem(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION);
    }
  } catch (e) {
    console.warn('Initialization error:', e);
  }
}

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  ensureInitialized();
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

export const LocalStore = {
  // =============================================
  // Subjects (10 Subjects)
  // =============================================

  getSubjects(): SubjectRow[] {
    return getStorageItem<SubjectRow[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  },

  getSubjectById(id: string): SubjectRow | null {
    return this.getSubjects().find((s) => s.id === id) || null;
  },

  // =============================================
  // Memberships & Subject Assignments
  // =============================================

  getClassMemberships(): ClassMembershipRow[] {
    return getStorageItem<ClassMembershipRow[]>(STORAGE_KEYS.MEMBERSHIPS, INITIAL_CLASS_MEMBERSHIPS);
  },

  getSubjectAssignments(): SubjectAssignmentRow[] {
    return getStorageItem<SubjectAssignmentRow[]>(
      STORAGE_KEYS.SUBJECT_ASSIGNMENTS,
      INITIAL_SUBJECT_ASSIGNMENTS
    );
  },

  getMembershipsForTeacher(teacherId: string): ClassMembershipRow[] {
    return this.getClassMemberships().filter((m) => m.teacher_id === teacherId);
  },

  getClassRole(teacherId: string, classId: string): ClassMembershipRole | null {
    const memberships = this.getClassMemberships();
    // Check if homeroom teacher first
    const isHomeroom = memberships.some(
      (m) => m.teacher_id === teacherId && m.class_id === classId && m.role === 'HOMEROOM_TEACHER'
    );
    if (isHomeroom) return 'HOMEROOM_TEACHER';

    const isSubjectTeacher = memberships.some(
      (m) => m.teacher_id === teacherId && m.class_id === classId && m.role === 'SUBJECT_TEACHER'
    );
    if (isSubjectTeacher) return 'SUBJECT_TEACHER';

    // Also check if assigned to teach any subject in this class
    const assignments = this.getSubjectAssignments();
    const hasSubject = assignments.some(
      (sa) => sa.teacher_id === teacherId && sa.class_id === classId
    );
    if (hasSubject) return 'SUBJECT_TEACHER';

    return null;
  },

  getSubjectAssignmentsForClass(classId: string): SubjectAssignmentRow[] {
    return this.getSubjectAssignments().filter((sa) => sa.class_id === classId);
  },

  getSubjectAssignmentsForTeacher(teacherId: string): SubjectAssignmentRow[] {
    return this.getSubjectAssignments().filter((sa) => sa.teacher_id === teacherId);
  },

  getSubjectTeachersForClass(classId: string): Array<{ subject: SubjectRow; teacher: UserRow | null }> {
    const subjects = this.getSubjects();
    const assignments = this.getSubjectAssignmentsForClass(classId);
    const users = this.getUsers();

    return subjects.map((sub) => {
      const assignment = assignments.find((a) => a.subject_id === sub.id);
      const teacher = assignment ? users.find((u) => u.id === assignment.teacher_id) || null : null;
      return {
        subject: sub,
        teacher,
      };
    });
  },

  assignHomeroomTeacher(classId: string, teacherId: string | null): boolean {
    const classes = this.getClasses();
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return false;

    const oldTeacherId = targetClass.teacher_id;
    targetClass.teacher_id = teacherId;
    targetClass.updated_at = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.CLASSES, classes);

    // Update memberships
    let memberships = this.getClassMemberships();
    // Remove old homeroom membership
    memberships = memberships.filter(
      (m) => !(m.class_id === classId && m.role === 'HOMEROOM_TEACHER')
    );

    if (teacherId) {
      memberships.push({
        id: `mem-${Date.now().toString(36)}`,
        teacher_id: teacherId,
        class_id: classId,
        role: 'HOMEROOM_TEACHER',
        created_at: new Date().toISOString(),
      });
    }
    setStorageItem(STORAGE_KEYS.MEMBERSHIPS, memberships);

    // Sync assigned_class_ids on users
    this.syncTeacherAssignedClassIds();
    return true;
  },

  assignSubjectTeacher(classId: string, subjectId: string, teacherId: string | null): boolean {
    let assignments = this.getSubjectAssignments();
    // Remove existing assignment for this class + subject
    assignments = assignments.filter(
      (sa) => !(sa.class_id === classId && sa.subject_id === subjectId)
    );

    if (teacherId) {
      assignments.push({
        id: `sa-${Date.now().toString(36)}`,
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        created_at: new Date().toISOString(),
      });
    }
    setStorageItem(STORAGE_KEYS.SUBJECT_ASSIGNMENTS, assignments);

    // Update memberships: ensure teacher is a SUBJECT_TEACHER if not already homeroom
    let memberships = this.getClassMemberships();
    if (teacherId) {
      const exists = memberships.some((m) => m.teacher_id === teacherId && m.class_id === classId);
      if (!exists) {
        memberships.push({
          id: `mem-${Date.now().toString(36)}`,
          teacher_id: teacherId,
          class_id: classId,
          role: 'SUBJECT_TEACHER',
          created_at: new Date().toISOString(),
        });
        setStorageItem(STORAGE_KEYS.MEMBERSHIPS, memberships);
      }
    }

    this.syncTeacherAssignedClassIds();
    return true;
  },

  syncTeacherAssignedClassIds(): void {
    const users = this.getUsers();
    const classes = this.getClasses();
    const assignments = this.getSubjectAssignments();

    users.forEach((u) => {
      if (u.role !== 'TEACHER') return;
      const classIdSet = new Set<string>();

      // Add homeroom classes
      classes.forEach((c) => {
        if (c.teacher_id === u.id) classIdSet.add(c.id);
      });

      // Add subject classes
      assignments.forEach((sa) => {
        if (sa.teacher_id === u.id) classIdSet.add(sa.class_id);
      });

      u.assigned_class_ids = Array.from(classIdSet);
    });

    setStorageItem(STORAGE_KEYS.USERS, users);
  },

  // =============================================
  // Users (Admin & Teachers)
  // =============================================

  getUsers(): UserRow[] {
    return getStorageItem<UserRow[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getUserById(id: string): UserRow | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  getTeachers(): UserRow[] {
    return this.getUsers().filter((u) => u.role === 'TEACHER');
  },

  getTeacherDetails(teacherId: string) {
    const teacher = this.getUserById(teacherId);
    if (!teacher) return null;

    const classes = this.getClasses();
    const subjects = this.getSubjects();
    const assignments = this.getSubjectAssignmentsForTeacher(teacherId);

    const homeroomClasses = classes.filter((c) => c.teacher_id === teacherId);
    const subjectClasses = assignments.map((sa) => {
      const cls = classes.find((c) => c.id === sa.class_id)!;
      const sub = subjects.find((s) => s.id === sa.subject_id)!;
      return { class: cls, subject: sub };
    });

    const gradeSet = new Set<number>();
    homeroomClasses.forEach((c) => gradeSet.add(c.grade));
    subjectClasses.forEach((sc) => sc.class && gradeSet.add(sc.class.grade));

    const totalClassesSet = new Set<string>();
    homeroomClasses.forEach((c) => totalClassesSet.add(c.id));
    subjectClasses.forEach((sc) => sc.class && totalClassesSet.add(sc.class.id));

    return {
      teacher,
      homeroomClasses,
      subjectClasses,
      grades: Array.from(gradeSet).sort(),
      totalClasses: totalClassesSet.size,
    };
  },

  addTeacher(data: TeacherFormData): UserRow {
    const users = this.getUsers();
    const newId = `u-teacher-${Date.now().toString(36)}`;
    const newTeacher: UserRow = {
      id: newId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      role: 'TEACHER',
      status: data.status,
      password: data.password || '123456',
      assigned_class_ids: data.assigned_class_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    users.push(newTeacher);
    setStorageItem(STORAGE_KEYS.USERS, users);

    return newTeacher;
  },

  updateTeacher(id: string, data: Partial<TeacherFormData>): UserRow | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    const current = users[idx];
    const updated: UserRow = {
      ...current,
      name: data.name !== undefined ? data.name.trim() : current.name,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : current.email,
      phone: data.phone !== undefined ? data.phone.trim() || null : current.phone,
      status: data.status !== undefined ? data.status : current.status,
      password: data.password ? data.password : current.password,
      updated_at: new Date().toISOString(),
    };

    users[idx] = updated;
    setStorageItem(STORAGE_KEYS.USERS, users);
    return updated;
  },

  toggleTeacherStatus(id: string): UserRow | null {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return null;

    target.status = target.status === 'active' ? 'disabled' : 'active';
    target.updated_at = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.USERS, users);
    return target;
  },

  resetTeacherPassword(id: string, newPassword = 'password123'): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return false;

    target.password = newPassword;
    target.updated_at = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.USERS, users);
    return true;
  },

  // =============================================
  // Classes
  // =============================================

  getClasses(): ClassRow[] {
    return getStorageItem<ClassRow[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },

  getClassById(id: string): ClassRow | null {
    const classes = this.getClasses();
    return classes.find((c) => c.id === id) || null;
  },

  getClass(classId?: string): ClassRow {
    if (classId) {
      const found = this.getClassById(classId);
      if (found) return found;
    }
    const classes = this.getClasses();
    return classes.find((c) => c.status === 'active') || INITIAL_CLASS;
  },

  addClass(data: ClassFormData): ClassRow {
    const classes = this.getClasses();
    const newId = `c-${data.grade}${data.name.replace(/\D/g, '').toLowerCase() || Date.now().toString(36)}`;
    const newClass: ClassRow = {
      id: newId,
      name: data.name.trim(),
      grade: data.grade,
      room_name: data.room_name?.trim() || null,
      school_year: data.school_year.trim(),
      teacher_id: data.teacher_id || null,
      max_students: data.max_students || 40,
      desk_count: data.desk_count || 20,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    classes.push(newClass);
    setStorageItem(STORAGE_KEYS.CLASSES, classes);

    if (newClass.teacher_id) {
      this.assignHomeroomTeacher(newId, newClass.teacher_id);
    }

    // Initialize desks
    const desksMap = getStorageItem<Record<string, DeskWithSeats[]>>(
      STORAGE_KEYS.DESKS_MAP,
      INITIAL_DESKS_MAP
    );
    desksMap[newId] = generateDesksForClass(newId, []);
    setStorageItem(STORAGE_KEYS.DESKS_MAP, desksMap);

    return newClass;
  },

  updateClass(id: string, updates: Partial<ClassRow>): ClassRow | null {
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const oldTeacherId = classes[idx].teacher_id;
    const newTeacherId = updates.teacher_id;

    const updated: ClassRow = {
      ...classes[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    classes[idx] = updated;
    setStorageItem(STORAGE_KEYS.CLASSES, classes);

    if (newTeacherId !== undefined && newTeacherId !== oldTeacherId) {
      this.assignHomeroomTeacher(id, newTeacherId);
    }

    return updated;
  },

  archiveClass(id: string): ClassRow | null {
    return this.updateClass(id, { status: 'archived', teacher_id: null });
  },

  // =============================================
  // Students (Filtered by Class ID)
  // =============================================

  getStudents(classId?: string): StudentRow[] {
    const all = getStorageItem<StudentRow[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    if (classId) {
      return all.filter((s) => s.class_id === classId);
    }
    return all;
  },

  getStudentById(id: string): StudentRow | null {
    const all = getStorageItem<StudentRow[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    return all.find((s) => s.id === id) || null;
  },

  addStudent(data: StudentFormData, classId?: string): StudentRow {
    const students = getStorageItem<StudentRow[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const effectiveClassId = classId || INITIAL_CLASS.id;
    const newStudent: StudentRow = {
      id: `stu-${effectiveClassId}-${Date.now().toString(36)}`,
      class_id: effectiveClassId,
      student_code: data.student_code.trim(),
      full_name: data.full_name.trim(),
      gender: (data.gender as 'male' | 'female') || null,
      date_of_birth: data.date_of_birth || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      avatar_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    students.push(newStudent);
    setStorageItem(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  },

  addStudentsBatch(studentsData: StudentFormData[], classId?: string): StudentRow[] {
    const students = getStorageItem<StudentRow[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const effectiveClassId = classId || INITIAL_CLASS.id;
    const now = new Date().toISOString();
    const createdList: StudentRow[] = [];

    studentsData.forEach((data, index) => {
      const newStudent: StudentRow = {
        id: `stu-${effectiveClassId}-${Date.now().toString(36)}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        class_id: effectiveClassId,
        student_code: data.student_code.trim().toUpperCase(),
        full_name: data.full_name.trim(),
        gender: (data.gender as 'male' | 'female') || null,
        date_of_birth: data.date_of_birth || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        avatar_url: null,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      students.push(newStudent);
      createdList.push(newStudent);
    });

    setStorageItem(STORAGE_KEYS.STUDENTS, students);
    return createdList;
  },

  updateStudent(id: string, data: Partial<StudentFormData>): StudentRow | null {
    const students = getStorageItem<StudentRow[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const updated: StudentRow = {
      ...students[idx],
      ...data,
      gender: (data.gender as 'male' | 'female') || students[idx].gender,
      updated_at: new Date().toISOString(),
    };

    students[idx] = updated;
    setStorageItem(STORAGE_KEYS.STUDENTS, students);
    return updated;
  },

  deleteStudent(id: string): boolean {
    const students = getStorageItem<StudentRow[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const student = students.find((s) => s.id === id);
    if (!student) return false;

    const filtered = students.filter((s) => s.id !== id);
    setStorageItem(STORAGE_KEYS.STUDENTS, filtered);

    // Also clear from seating map for this class
    const desks = this.getDesks(student.class_id);
    let modified = false;
    desks.forEach((desk) => {
      desk.seats.forEach((seat) => {
        if (seat.student_id === id) {
          seat.student_id = null;
          seat.student = null;
          modified = true;
        }
      });
    });

    if (modified) {
      this.saveDesks(student.class_id, desks);
    }
    return true;
  },

  // =============================================
  // Desks & Seating (Per Class)
  // =============================================

  getDesksMap(): Record<string, DeskWithSeats[]> {
    return getStorageItem<Record<string, DeskWithSeats[]>>(
      STORAGE_KEYS.DESKS_MAP,
      INITIAL_DESKS_MAP
    );
  },

  getDesks(classId?: string): DeskWithSeats[] {
    const targetClassId = classId || INITIAL_CLASS.id;
    const map = this.getDesksMap();
    let classDesks = map[targetClassId];

    if (!classDesks) {
      const students = this.getStudents(targetClassId);
      classDesks = generateDesksForClass(targetClassId, students);
      map[targetClassId] = classDesks;
      setStorageItem(STORAGE_KEYS.DESKS_MAP, map);
    }

    const students = this.getStudents(targetClassId);
    return classDesks.map((desk) => ({
      ...desk,
      seats: desk.seats.map((seat) => ({
        ...seat,
        student: seat.student_id ? students.find((s) => s.id === seat.student_id) || null : null,
      })),
    }));
  },

  saveDesks(classId: string | undefined, desks: DeskWithSeats[]): void {
    const targetClassId = classId || INITIAL_CLASS.id;
    const map = this.getDesksMap();
    map[targetClassId] = desks;
    setStorageItem(STORAGE_KEYS.DESKS_MAP, map);
  },

  assignSeat(seatId: string, studentId: string | null, classId?: string): void {
    const targetClassId = classId || INITIAL_CLASS.id;
    const desks = this.getDesks(targetClassId);
    const students = this.getStudents(targetClassId);
    const student = studentId ? students.find((s) => s.id === studentId) || null : null;

    if (studentId) {
      desks.forEach((d) => {
        d.seats.forEach((s) => {
          if (s.id !== seatId && s.student_id === studentId) {
            s.student_id = null;
            s.student = null;
          }
        });
      });
    }

    desks.forEach((d) => {
      d.seats.forEach((s) => {
        if (s.id === seatId) {
          s.student_id = studentId;
          s.student = student;
        }
      });
    });

    this.saveDesks(targetClassId, desks);
  },

  swapSeats(seatId1: string, seatId2: string, classId?: string): void {
    const targetClassId = classId || INITIAL_CLASS.id;
    const desks = this.getDesks(targetClassId);
    let seat1: any = null;
    let seat2: any = null;

    desks.forEach((d) => {
      d.seats.forEach((s) => {
        if (s.id === seatId1) seat1 = s;
        if (s.id === seatId2) seat2 = s;
      });
    });

    if (seat1 && seat2) {
      const tempStudentId = seat1.student_id;
      const tempStudent = seat1.student;

      seat1.student_id = seat2.student_id;
      seat1.student = seat2.student;

      seat2.student_id = tempStudentId;
      seat2.student = tempStudent;

      this.saveDesks(targetClassId, desks);
    }
  },

  randomizeSeating(classId?: string): DeskWithSeats[] {
    const targetClassId = classId || INITIAL_CLASS.id;
    const desks = this.getDesks(targetClassId);
    const students = this.getStudents(targetClassId).filter((s) => s.status === 'active');

    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let stuIdx = 0;
    desks.forEach((desk) => {
      desk.seats.forEach((seat) => {
        if (stuIdx < shuffled.length) {
          seat.student_id = shuffled[stuIdx].id;
          seat.student = shuffled[stuIdx];
          stuIdx++;
        } else {
          seat.student_id = null;
          seat.student = null;
        }
      });
    });

    this.saveDesks(targetClassId, desks);
    return desks;
  },

  // =============================================
  // Announcements (Per Class)
  // =============================================

  getAnnouncements(classId?: string): AnnouncementRow[] {
    const all = getStorageItem<AnnouncementRow[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      INITIAL_ANNOUNCEMENTS
    );
    if (classId) {
      return all.filter((a) => a.class_id === classId);
    }
    return all;
  },

  addAnnouncement(
    title: string,
    content: string,
    is_pinned: boolean,
    classId?: string
  ): AnnouncementRow {
    const all = getStorageItem<AnnouncementRow[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      INITIAL_ANNOUNCEMENTS
    );
    const effectiveClassId = classId || INITIAL_CLASS.id;
    const newItem: AnnouncementRow = {
      id: `ann-${Date.now().toString(36)}`,
      class_id: effectiveClassId,
      title: title.trim(),
      content: content.trim(),
      is_pinned,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newItem);
    setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, all);
    return newItem;
  },

  togglePinAnnouncement(id: string): void {
    const all = getStorageItem<AnnouncementRow[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      INITIAL_ANNOUNCEMENTS
    );
    const target = all.find((a) => a.id === id);
    if (target) {
      target.is_pinned = !target.is_pinned;
      target.updated_at = new Date().toISOString();
      setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, all);
    }
  },

  deleteAnnouncement(id: string): void {
    const all = getStorageItem<AnnouncementRow[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      INITIAL_ANNOUNCEMENTS
    );
    const filtered = all.filter((a) => a.id !== id);
    setStorageItem(STORAGE_KEYS.ANNOUNCEMENTS, filtered);
  },

  // =============================================
  // Student Notes
  // =============================================

  getNotesForStudent(studentId: string): StudentNoteRow[] {
    const notesMap = getStorageItem<Record<string, StudentNoteRow[]>>(
      STORAGE_KEYS.NOTES,
      INITIAL_STUDENT_NOTES
    );
    return notesMap[studentId] || [];
  },

  addNoteForStudent(studentId: string, content: string, classId?: string): StudentNoteRow {
    const notesMap = getStorageItem<Record<string, StudentNoteRow[]>>(
      STORAGE_KEYS.NOTES,
      INITIAL_STUDENT_NOTES
    );
    const newNote: StudentNoteRow = {
      id: `note-${Date.now().toString(36)}`,
      student_id: studentId,
      class_id: classId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!notesMap[studentId]) {
      notesMap[studentId] = [];
    }
    notesMap[studentId].unshift(newNote);
    setStorageItem(STORAGE_KEYS.NOTES, notesMap);
    return newNote;
  },

  deleteNote(studentId: string, noteId: string): void {
    const notesMap = getStorageItem<Record<string, StudentNoteRow[]>>(
      STORAGE_KEYS.NOTES,
      INITIAL_STUDENT_NOTES
    );
    if (notesMap[studentId]) {
      notesMap[studentId] = notesMap[studentId].filter((n) => n.id !== noteId);
      setStorageItem(STORAGE_KEYS.NOTES, notesMap);
    }
  },

  // =============================================
  // Attendance (Per Class and Subject)
  // =============================================

  getAttendanceRecords(classId?: string, subjectId?: string): AttendanceRow[] {
    const all = getStorageItem<AttendanceRow[]>(
      STORAGE_KEYS.ATTENDANCE,
      INITIAL_ATTENDANCE_RECORDS
    );
    let filtered = all;
    if (classId) {
      filtered = filtered.filter((r) => r.class_id === classId);
    }
    if (subjectId) {
      filtered = filtered.filter((r) => r.subject_id === subjectId);
    }
    return filtered;
  },

  getAttendanceForDate(dateStr: string, classId?: string, subjectId?: string): AttendanceRow[] {
    const records = this.getAttendanceRecords(classId, subjectId);
    return records.filter((r) => r.date === dateStr);
  },

  saveAttendanceBatch(
    dateStr: string,
    entries: Array<{ student_id: string; status: AttendanceStatus; note: string }>,
    classId?: string,
    subjectId?: string,
    teacherId?: string
  ): void {
    let allRecords = getStorageItem<AttendanceRow[]>(
      STORAGE_KEYS.ATTENDANCE,
      INITIAL_ATTENDANCE_RECORDS
    );
    const effectiveClassId = classId || INITIAL_CLASS.id;

    // Filter out existing records for this date, class, and subject
    allRecords = allRecords.filter(
      (r) =>
        !(
          r.date === dateStr &&
          (r.class_id ? r.class_id === effectiveClassId : true) &&
          (subjectId ? r.subject_id === subjectId : true)
        )
    );

    const newRecords: AttendanceRow[] = entries.map((entry) => ({
      id: `att-${entry.student_id}-${subjectId || 'general'}-${dateStr}`,
      student_id: entry.student_id,
      class_id: effectiveClassId,
      subject_id: subjectId || null,
      teacher_id: teacherId || null,
      date: dateStr,
      status: entry.status,
      note: entry.note || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    allRecords.push(...newRecords);
    setStorageItem(STORAGE_KEYS.ATTENDANCE, allRecords);
  },

  // =============================================
  // System Reset
  // =============================================

  resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    isInitialized = false;
    localStorage.removeItem(STORAGE_KEYS.DATA_VERSION);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('cm_active_class_id');
    ensureInitialized();
  },
};
