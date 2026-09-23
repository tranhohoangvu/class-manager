# Business Rules Catalog

This document catalogues all auditable business rules, constraints, and invariants implemented across the codebase.

---

## 1. Class & Facility Capacity Invariants

### BR-001: Classroom Geometry & Desk Standardization
* **Rule:** Every classroom is fixed at exactly **20 double desks** arranged in a **4 columns × 5 rows** grid, providing a total capacity of **40 seats** (2 seats per desk: Left & Right).
* **Enforced By:**
  - `src/lib/constants.ts` (`CLASS_CONSTANTS.DESK_COUNT = 20`, `MAX_SEATS = 40`, `COLS = 4`, `ROWS = 5`)
  - `backend/migrations/001_initial_schema.sql` (`desk_count integer NOT NULL DEFAULT 20 CHECK (desk_count = 20)`)
  - `src/services/class.service.ts`

### BR-002: Maximum Active Student Invariant
* **Rule:** The number of active students (`status = 'active'`) in a class cannot exceed `class.max_students` (capped at 40). Any addition (single create or bulk import) that exceeds this ceiling is rejected.
* **Enforced By:**
  - `src/services/student.service.ts` (`createStudent` & `importStudents`)
  - `backend/migrations/001_initial_schema.sql` (`check_max_students()` trigger)
  - `src/lib/validations/forms.ts` (`max_students: z.coerce.number().min(1).max(40)`)

### BR-003: Student Code Uniqueness Scoped to Class
* **Rule:** A `student_code` (e.g., `HS01`, `6A1-01`) must be unique within its class. It cannot be duplicated across active students in the same class.
* **Enforced By:**
  - `src/services/student.service.ts`
  - `backend/migrations/001_initial_schema.sql` (`UNIQUE(class_id, student_code)`)

### BR-004: Single Seat Invariant per Student
* **Rule:** A student may occupy at most one seat across the classroom at any time. When assigned to a new seat, any previous seat occupied by that student must be cleared.
* **Enforced By:**
  - `src/services/seating.service.ts` (`assignSeat`)
  - `src/lib/store.ts` (`assignSeat`)
  - `backend/migrations/001_initial_schema.sql` (`seats: UNIQUE(student_id)`)

### BR-005: Seat Occupant Class Ownership
* **Rule:** A student can only be assigned to a desk/seat belonging to their own enrolled class (`student.class_id === desk.class_id`).
* **Enforced By:**
  - `src/services/seating.service.ts` (`assignSeat`)

---

## 2. Pedagogical Staff & Faculty Invariants

### BR-006: Maximum Two Grades per Teacher (THCS Rule)
* **Rule:** In accordance with secondary school pedagogical regulations, a teacher can be assigned to teach classes in at most **two distinct grades** across the entire school (e.g., Khối 6 and Khối 7). Assigning a teacher to a 3rd grade is prohibited.
* **Enforced By:**
  - `src/services/teacher.service.ts` (`checkGradeLimit`)
  - `tests/teacher-validation.test.ts`

### BR-007: Single Homeroom Teacher per Class
* **Rule:** Each class can have at most one designated Homeroom Teacher (GVCN) at any given time.
* **Enforced By:**
  - `src/lib/store.ts` (`assignHomeroomTeacher`)
  - `src/services/teacher.service.ts`
  - `backend/migrations/001_initial_schema.sql` (`classes.teacher_id`)

### BR-008: Single Subject Teacher per Class & Subject
* **Rule:** For any given class and subject, only one teacher can be assigned as the primary subject teacher.
* **Enforced By:**
  - `src/lib/store.ts` (`assignSubjectTeacher`)
  - `backend/migrations/001_initial_schema.sql` (`subject_assignments: UNIQUE(teacher_id, class_id, subject_id)`)

### BR-009: Inactive Staff Roadblock
* **Rule:** Accounts marked with `status = 'disabled'` are barred from authenticating or performing any mutations across all services.
* **Enforced By:**
  - `src/lib/auth.ts` (`login`, `getCurrentUser`)
  - `src/services/auth-guard.ts` (all methods check `user.status !== 'disabled'`)

---

## 3. Timetable & Schedule Invariants

### BR-010: Two-Shift Secondary Schedule by Grade
* **Rule:** School shifts are partitioned strictly by grade:
  - **Morning Shift (Buổi Sáng):** Khối 6 and Khối 9 attend Periods 1–5 (Monday–Friday) and Periods 1–3 (Saturday).
  - **Afternoon Shift (Buổi Chiều):** Khối 7 and Khối 8 attend Periods 6–10 (Monday–Friday) and Periods 6–8 (Saturday).
* **Enforced By:**
  - `src/lib/constants.ts` (`GRADE_SHIFTS`, `getClassAllowedPeriods`)
  - `src/services/timetable.service.ts` (`validateTimetableEntry`)

### BR-011: Mandatory Saturday Homeroom Slot (Sinh Hoạt Lớp)
* **Rule:** The final period of Saturday is strictly reserved for "Sinh hoạt lớp" (Môn SHL) and must be instructed by the class's Homeroom Teacher (GVCN):
  - Khối 6 & Khối 9: **Thứ Bảy, Tiết 3**.
  - Khối 7 & Khối 8: **Thứ Bảy, Tiết 8**.
  - No other subject may be scheduled in these slots. SHL cannot be scheduled on any other day or period.
* **Enforced By:**
  - `src/lib/constants.ts` (`getClassHomeroomSlot`)
  - `src/services/timetable.service.ts` (`validateTimetableEntry`)

### BR-012: No Period 4/5 or 9/10 on Saturday
* **Rule:** Secondary schools operate only 3 periods on Saturday morning (Periods 1–3) and 3 periods on Saturday afternoon (Periods 6–8). Scheduling Periods 4, 5, 9, or 10 on Saturday is strictly prohibited.
* **Enforced By:**
  - `src/lib/constants.ts` (`DAY_ALLOWED_PERIODS`)
  - `src/services/timetable.service.ts` (`validateTimetableEntry`)

### BR-013: School-Wide Cross-Class Teacher Conflict Prevention
* **Rule:** A teacher cannot be scheduled to teach two different classes at the same day of the week and same period anywhere across the school.
* **Enforced By:**
  - `src/services/timetable.service.ts` (`checkTeacherConflict`)
  - `backend/migrations/001_initial_schema.sql` (`timetable_entries: UNIQUE(teacher_id, day_of_week, period)`)

### BR-014: Single Subject Slot per Class
* **Rule:** A class can have at most one subject scheduled per day and period slot.
* **Enforced By:**
  - `src/services/timetable.service.ts` (`checkClassConflict`)
  - `backend/migrations/001_initial_schema.sql` (`timetable_entries: UNIQUE(class_id, day_of_week, period)`)

### BR-015: Centralized Timetable Governance
* **Rule:** Teachers (both Homeroom and Subject teachers) have read-only access to timetables. Only `ADMIN` can create, modify, copy, or delete timetable entries.
* **Enforced By:**
  - `src/services/auth-guard.ts` (`canManageTimetable`)
  - `src/services/timetable.service.ts` (`saveEntry`, `deleteEntry`, `copyTimetable`)

---

## 4. Attendance & Evaluation Rules

### BR-016: Scoped Subject Attendance Authorization
* **Rule:** Teachers may only record attendance for the specific subject and class they are assigned to teach. A Homeroom Teacher does not have write access to record attendance for other teachers' subjects.
* **Enforced By:**
  - `src/services/auth-guard.ts` (`canManageAttendance`)
  - `src/services/attendance.service.ts` (`saveAttendanceBatch`)

### BR-017: Homeroom Read-Only Monitoring Scope
* **Rule:** A Homeroom Teacher (GVCN) is permitted to **view** all attendance records for their homeroom class across all subjects, but modification controls remain locked to read-only.
* **Enforced By:**
  - `src/services/auth-guard.ts` (`canViewAttendance`)
  - `src/app/(dashboard)/attendance/page.tsx`

### BR-018: Valid Attendance Status Domain
* **Rule:** Attendance records can only take one of four validated values:
  - `'present'`: Có mặt
  - `'absent'`: Vắng không phép
  - `'late'`: Đi muộn
  - `'excused'`: Vắng có phép
* **Enforced By:**
  - `src/types/index.ts` (`AttendanceStatus`)
  - `src/services/attendance.service.ts` (`VALID_STATUSES`)
  - `backend/migrations/001_initial_schema.sql` (`status text CHECK (status IN ('present', 'absent', 'late', 'excused'))`)

### BR-019: Unique Daily Attendance per Student & Period
* **Rule:** In a single day, an individual student can have only one attendance status record per subject (or date session).
* **Enforced By:**
  - `src/lib/store.ts` (`saveAttendanceBatch`)
  - `backend/migrations/001_initial_schema.sql` (`attendance: UNIQUE(student_id, date)`)
