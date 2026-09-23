# Application Service Layer (API) Reference

## 1. Network / HTTP API Status

> [!IMPORTANT]
> **HTTP REST Endpoints & Server Actions:** `None (Not found in codebase)`
> 
> The codebase currently does not expose external HTTP API routes (`/api/*` or `route.ts`) or Next.js Server Actions (`'use server'`).
> All business workflows and data queries are orchestrated through an in-memory/client-side **Application Service Layer** located in `src/services/`.
> 
> When migrating to Supabase or a backend API, these Service methods serve as the exact functional specification for remote RPC / REST endpoints.

---

## 2. Common Types & Return Contract

All mutating methods return an `OperationResult<T>` discriminated union:

```typescript
export type OperationResult<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };
```

---

## 3. Service Reference

### 3.1. `StudentService` (`src/services/student.service.ts`)

#### `getStudents(classId?: string): StudentRow[]`
* **Purpose:** Retrieves all students enrolled in a class (or all students in the school if `classId` is omitted).
* **Authorization:** Public query.

#### `getStudentById(id: string): StudentRow | null`
* **Purpose:** Retrieves a single student by unique ID.

#### `createStudent(data: StudentFormData, classId: string, currentUser: UserRow | null): OperationResult<StudentRow>`
* **Purpose:** Adds a new student to a class.
* **Authorization:** `AuthGuard.canEditStudent` (Requires `HOMEROOM_TEACHER` in `classId` or `ADMIN`).
* **Validation & Invariants:**
  - Validates `data` with `studentSchema` (Zod).
  - Checks if `classId` exists.
  - Verifies `data.student_code` is unique within `classId`.
  - Enforces `activeCount < class.max_students` (max 40).

#### `importStudents(classId: string, studentsData: StudentFormData[], currentUser: UserRow | null): OperationResult<{ count: number; imported: StudentRow[] }>`
* **Purpose:** Batch imports multiple student records from an uploaded file.
* **Authorization:** `AuthGuard.canEditStudent` (Requires `HOMEROOM_TEACHER` or `ADMIN`).
* **Validation & Invariants:**
  - Verifies non-empty array.
  - Verifies non-empty `student_code` and `full_name` on each row.
  - Checks code uniqueness within uploaded file.
  - Checks code uniqueness against existing class roster.
  - Enforces `activeCount + studentsData.length <= class.max_students`.

#### `updateStudent(id: string, data: Partial<StudentFormData>, currentUser: UserRow | null): OperationResult<StudentRow>`
* **Purpose:** Updates personal details of an existing student.
* **Authorization:** `AuthGuard.canEditStudent`.
* **Validation:** If `student_code` is changed, verifies uniqueness within the student's class.

#### `deleteStudent(id: string, currentUser: UserRow | null): OperationResult<boolean>`
* **Purpose:** Deletes a student from the class and frees their seat if occupied.
* **Authorization:** `AuthGuard.canEditStudent`.

---

### 3.2. `SeatingService` (`src/services/seating.service.ts`)

#### `getDesks(classId?: string): DeskWithSeats[]`
* **Purpose:** Retrieves the 20-desk classroom layout with seated student details.

#### `assignSeat(seatId: string, studentId: string | null, classId: string, currentUser: UserRow | null): OperationResult<DeskWithSeats[]>`
* **Purpose:** Assigns a student to a specific seat, or vacates a seat if `studentId` is `null`.
* **Authorization:** `AuthGuard.canManageSeating` (Requires `HOMEROOM_TEACHER` or `ADMIN`).
* **Validation:** Verifies `studentId` belongs to `classId`. Automatically clears previous seat if the student was already seated.

#### `swapSeats(seatId1: string, seatId2: string, classId: string, currentUser: UserRow | null): OperationResult<DeskWithSeats[]>`
* **Purpose:** Atomically exchanges occupants between two seats.
* **Authorization:** `AuthGuard.canManageSeating`.
* **Validation:** Rejects if `seatId1 === seatId2`.

#### `randomizeSeating(classId: string, currentUser: UserRow | null): OperationResult<DeskWithSeats[]>`
* **Purpose:** Uniformly shuffles student seat assignments across all 40 seats using the Fisher-Yates algorithm.
* **Authorization:** `AuthGuard.canManageSeating`.

#### `clearAllSeats(classId: string, currentUser: UserRow | null): OperationResult<DeskWithSeats[]>`
* **Purpose:** Resets the seating layout by unassigning all students.
* **Authorization:** `AuthGuard.canManageSeating`.

---

### 3.3. `AttendanceService` (`src/services/attendance.service.ts`)

#### `getAttendanceRecords(classId?: string, subjectId?: string, currentUser?: UserRow | null): AttendanceRow[]`
* **Purpose:** Retrieves attendance records filtered by class and subject.
* **Authorization:** Checked via `AuthGuard.canViewAttendance`. GVCN can view all subjects; pure GVBM can only view their own assigned subject.

#### `getAttendanceForDate(dateStr: string, classId?: string, subjectId?: string, currentUser?: UserRow | null): AttendanceRow[]`
* **Purpose:** Retrieves attendance records for a specific date (`YYYY-MM-DD`).

#### `saveAttendanceBatch(dateStr: string, entries: Array<{ student_id: string; status: AttendanceStatus; note: string }>, classId: string, subjectId: string | undefined, currentUser: UserRow | null): OperationResult<void>`
* **Purpose:** Saves a batch of attendance statuses for students in a class.
* **Authorization:** `AuthGuard.canManageAttendance`. Rejects unless `currentUser` is assigned to teach `subjectId` in `classId` (or is `ADMIN`).
* **Validation:** Date regex `YYYY-MM-DD`, valid statuses (`present`, `absent`, `late`, `excused`), student ID validation.

#### `getAttendanceHistory(classId: string): { dates: string[]; studentStats: any[]; needAttention: any[]; totalDatesRecorded: number }`
* **Purpose:** Aggregates multi-date attendance matrix and student compliance rates.

---

### 3.4. `TimetableService` (`src/services/timetable.service.ts`)

#### `getTimetableForClass(classId: string, currentUser?: UserRow | null): TimetableEntryRow[]`
* **Purpose:** Retrieves weekly schedule for a class.
* **Authorization:** `AuthGuard.canViewTimetable` (Requires user to be assigned to the class or `ADMIN`).

#### `getCurrentPeriodInfo(now?: Date): CurrentPeriodInfo`
* **Purpose:** Evaluates current clock time against official secondary school schedule (Periods 1–10, assemblies, breaks).

#### `getCurrentSession(classId: string, now?: Date): CurrentSessionInfo`
* **Purpose:** Identifies ongoing subject and instructor for the active class in real time.

#### `checkTeacherConflict(teacherId: string | null | undefined, dayOfWeek: number, period: number, excludeEntryId?: string, targetClassId?: string): TimetableConflict | null`
* **Purpose:** Scans all 16 classes to ensure teacher is not double-booked at the given day/period.

#### `checkClassConflict(classId: string, dayOfWeek: number, period: number, excludeEntryId?: string): TimetableConflict | null`
* **Purpose:** Ensures a class does not have two subjects scheduled at the same day/period.

#### `validateTimetableEntry(entry: TimetableEntryInput, excludeEntryId?: string): TimetableValidationResult`
* **Purpose:** Validates shift constraints, Saturday rules, Homeroom period rules, and teacher/class conflicts.

#### `saveEntry(classId: string, dayOfWeek: number, period: number, subjectId: string, teacherId: string | null, currentUser: UserRow | null): OperationResult<TimetableEntryRow>`
* **Purpose:** Creates or updates a timetable slot.
* **Authorization:** `ADMIN` only (`AuthGuard.canManageTimetable`).

#### `deleteEntry(entryId: string, currentUser: UserRow | null): OperationResult<void>`
* **Purpose:** Clears a scheduled slot.
* **Authorization:** `ADMIN` only.

#### `copyTimetable(sourceClassId: string, targetClassId: string, currentUser: UserRow | null): OperationResult<{ copiedCount: number }>`
* **Purpose:** Duplicates an entire 28-period schedule from one class to another, re-mapping GVCN for Saturday Homeroom and rolling back on any teacher conflict.
* **Authorization:** `ADMIN` only.

#### `applyStandardTemplate(targetClassId: string, currentUser: UserRow | null): OperationResult<{ count: number }>`
* **Purpose:** Populates class with the 28-period Ministry curriculum template.
* **Authorization:** `ADMIN` only.

---

### 3.5. `TeacherService` (`src/services/teacher.service.ts`)

#### `checkGradeLimit(teacherId: string, targetClassId: string): { allowed: boolean; error?: string }`
* **Purpose:** Enforces that a teacher cannot instruct across more than **two distinct grades** school-wide.

#### `assignHomeroomTeacher(classId: string, teacherId: string | null, currentUser: UserRow | null): OperationResult<void>`
* **Purpose:** Assigns the primary GVCN for a class.
* **Authorization:** `ADMIN` only (`AuthGuard.canManageTeacherAssignment`).

#### `assignSubjectTeacher(classId: string, subjectId: string, teacherId: string | null, currentUser: UserRow | null): OperationResult<void>`
* **Purpose:** Assigns a subject teacher to a class subject.
* **Authorization:** `ADMIN` only. Enforces the 2-grade limit.

---

### 3.6. `ClassService` (`src/services/class.service.ts`)

#### `updateClassSettings(classId: string, data: ClassSettingsFormData, currentUser: UserRow | null): OperationResult<ClassRow>`
* **Purpose:** Updates classroom room name, school year, and capacity.
* **Authorization:** `HOMEROOM_TEACHER` or `ADMIN`.
* **Validation:** Prevents reducing `max_students` below the current active enrollment count.

---

### 3.7. `AdminReportService` (`src/services/admin-report.service.ts`)

#### `getSchoolAttendanceOverview(): SchoolAttendanceOverview`
* **Purpose:** Rollup metrics of today's attendance across all 16 classes and 480 students.

#### `getGradeAttendanceStats(): GradeAttendanceStat[]`
* **Purpose:** Compliance breakdown by grade (Khối 6, 7, 8, 9).

#### `getClassAttendanceStats(): ClassAttendanceStat[]`
* **Purpose:** Detailed compliance stats for every individual class.

#### `generateSchoolReportWorkbookData(): SchoolReportWorkbookData`
* **Purpose:** Prepares structured tabular data for the 4-sheet master Excel workbook export.
