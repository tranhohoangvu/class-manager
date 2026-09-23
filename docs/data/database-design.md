# Database Design & Storage Architecture

## 1. Dual-Storage Reality

The Class Manager codebase currently features two complementary data layers:

1. **Active Client Persistence (`LocalStore`):**
   - Implemented as an in-memory cached Data Access Object in `src/lib/store.ts`.
   - Synchronized to browser `localStorage` under isolated keys prefixed with `cm_thcs_*`.
   - Managed with automatic versioning: `CURRENT_DATA_VERSION = '2026_thcs_ntt_4x5_20desks_v8'`.
2. **Target Relational Schema (PostgreSQL / Supabase):**
   - Implemented as ready-to-run Data Definition Language (DDL) in `supabase/migrations/001_initial_schema.sql` and `supabase/seed.sql`.
   - Fully normalized with UUID primary keys, check constraints, foreign keys, triggers, and Row Level Security (RLS) policies.

---

## 2. Table Specifications (Target PostgreSQL Schema)

### 2.1. `profiles`
Represents staff and system users, synced with Supabase `auth.users`.
* **Primary Key:** `id` (`uuid REFERENCES auth.users(id) ON DELETE CASCADE`)
* **Columns:**
  - `name`: `text NOT NULL`
  - `email`: `text NOT NULL`
  - `phone`: `text`
  - `role`: `text NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('ADMIN', 'TEACHER'))`
  - `status`: `text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'))`
  - `avatar_url`: `text`
  - `created_at`: `timestamptz DEFAULT now() NOT NULL`
  - `updated_at`: `timestamptz DEFAULT now() NOT NULL`
* **Triggers:** `trg_profiles_updated_at` (executes `update_updated_at()`)

### 2.2. `subjects`
Secondary school official core curriculum subjects (10 subjects).
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Columns:**
  - `code`: `text NOT NULL UNIQUE` (e.g. `MAT`, `LIT`, `ENG`, `PHY`, `CHE`, `BIO`, `HIS`, `GEO`, `INF`, `TEC`)
  - `name`: `text NOT NULL` (Toán, Ngữ văn, Tiếng Anh, ...)
  - `created_at`: `timestamptz DEFAULT now() NOT NULL`

### 2.3. `classes`
Classroom entities adhering to 20 desks / 40 seats.
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Foreign Keys:** `teacher_id` (`uuid REFERENCES auth.users(id) ON DELETE SET NULL`) - Homeroom teacher (GVCN)
* **Columns:**
  - `name`: `text NOT NULL` (e.g. `6A1`, `9A4`)
  - `grade`: `integer NOT NULL CHECK (grade BETWEEN 6 AND 9)`
  - `room_name`: `text` (e.g. `Phòng 101 - Nhà A`)
  - `school_year`: `text NOT NULL DEFAULT '2026 - 2027'`
  - `max_students`: `integer NOT NULL DEFAULT 40 CHECK (max_students > 0 AND max_students <= 40)`
  - `desk_count`: `integer NOT NULL DEFAULT 20 CHECK (desk_count = 20)`
  - `status`: `text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))`
  - `created_at`: `timestamptz DEFAULT now() NOT NULL`
  - `updated_at`: `timestamptz DEFAULT now() NOT NULL`

### 2.4. `class_memberships`
Defines teacher affiliation to a class.
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Foreign Keys:**
  - `teacher_id`: `uuid REFERENCES auth.users(id) ON DELETE CASCADE`
  - `class_id`: `uuid REFERENCES classes(id) ON DELETE CASCADE`
* **Columns:**
  - `role`: `text NOT NULL CHECK (role IN ('HOMEROOM_TEACHER', 'SUBJECT_TEACHER'))`
  - `created_at`: `timestamptz DEFAULT now() NOT NULL`
* **Constraints:** `UNIQUE(teacher_id, class_id, role)`

### 2.5. `subject_assignments`
Maps which teacher teaches which subject in each class.
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Foreign Keys:**
  - `teacher_id`: `uuid REFERENCES auth.users(id) ON DELETE CASCADE`
  - `class_id`: `uuid REFERENCES classes(id) ON DELETE CASCADE`
  - `subject_id`: `uuid REFERENCES subjects(id) ON DELETE CASCADE`
* **Constraints:** `UNIQUE(teacher_id, class_id, subject_id)`

### 2.6. `timetable_entries`
Scheduled periods in the weekly timetable.
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Foreign Keys:**
  - `class_id`: `uuid REFERENCES classes(id) ON DELETE CASCADE`
  - `subject_id`: `uuid REFERENCES subjects(id) ON DELETE CASCADE`
  - `teacher_id`: `uuid REFERENCES auth.users(id) ON DELETE SET NULL`
* **Columns:**
  - `day_of_week`: `integer NOT NULL CHECK (day_of_week BETWEEN 2 AND 7)`
  - `period`: `integer NOT NULL CHECK (period BETWEEN 1 AND 5)`
  - `created_at`, `updated_at`: `timestamptz DEFAULT now() NOT NULL`
* **Constraints:**
  - `UNIQUE(class_id, day_of_week, period)`: Only 1 subject per slot per class.

### 2.7. `students`
Student profiles enrolled in classes.
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Foreign Keys:** `class_id` (`uuid REFERENCES classes(id) ON DELETE CASCADE`)
* **Columns:**
  - `student_code`: `text NOT NULL` (e.g. `6A1-01`, `HS01`)
  - `full_name`: `text NOT NULL`
  - `gender`: `text CHECK (gender IN ('male', 'female'))`
  - `date_of_birth`: `date`
  - `phone`, `email`, `avatar_url`: `text`
  - `status`: `text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))`
  - `created_at`, `updated_at`: `timestamptz DEFAULT now() NOT NULL`
* **Constraints:** `UNIQUE(class_id, student_code)`
* **Triggers:** `trg_check_max_students` enforces `active_count < max_students` before insert.

### 2.8. `desks` & `seats`
Physical classroom furniture layout.
* **`desks`:**
  - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `class_id`: `uuid REFERENCES classes(id) ON DELETE CASCADE`
  - `desk_number`: `integer NOT NULL CHECK (desk_number BETWEEN 1 AND 20)`
  - `row_num`: `integer NOT NULL CHECK (row_num BETWEEN 1 AND 5)`
  - `col_num`: `integer NOT NULL CHECK (col_num BETWEEN 1 AND 4)`
  - `UNIQUE(class_id, desk_number)`
* **`seats`:**
  - `id`: `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `desk_id`: `uuid REFERENCES desks(id) ON DELETE CASCADE`
  - `side`: `text NOT NULL CHECK (side IN ('left', 'right'))`
  - `student_id`: `uuid REFERENCES students(id) ON DELETE SET NULL`
  - `UNIQUE(desk_id, side)`
  - `UNIQUE(student_id)` (1 seat per student invariant)

### 2.9. `attendance`
Session attendance records.
* **Primary Key:** `id` (`uuid DEFAULT gen_random_uuid()`)
* **Foreign Keys:**
  - `student_id`: `uuid REFERENCES students(id) ON DELETE CASCADE`
  - `class_id`: `uuid REFERENCES classes(id) ON DELETE CASCADE`
  - `teacher_id`: `uuid REFERENCES auth.users(id) ON DELETE SET NULL`
  - `subject_id`: `uuid REFERENCES subjects(id) ON DELETE SET NULL`
* **Columns:**
  - `date`: `date NOT NULL`
  - `status`: `text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused'))`
  - `note`: `text`
  - `created_at`, `updated_at`: `timestamptz DEFAULT now() NOT NULL`
* **Constraints:** `UNIQUE(student_id, date)`

### 2.10. `announcements` & `student_notes`
* **`announcements`:** `id`, `class_id` (FK), `title`, `content`, `is_pinned` (boolean), `created_at`, `updated_at`.
* **`student_notes`:** `id`, `student_id` (FK), `class_id` (FK), `content`, `created_at`, `updated_at`.

---

## 3. LocalStorage Key Mapping

When running in client mode, `LocalStore` persists entities into `localStorage` using the following keys:

| Storage Key | TypeScript Type | Seed Constant | Version Key |
| :--- | :--- | :--- | :--- |
| `cm_data_version` | `string` | `'2026_thcs_ntt_4x5_20desks_v8'` | Master Version Key |
| `cm_thcs_users` | `UserRow[]` | `INITIAL_USERS` (25 users) | Users / Teachers |
| `cm_thcs_classes` | `ClassRow[]` | `INITIAL_CLASSES` (16 classes) | Classes (6A1–9A4) |
| `cm_thcs_students`| `StudentRow[]`| `INITIAL_STUDENTS` (480 students) | 30 students × 16 classes |
| `cm_thcs_desks_map` | `Record<string, DeskWithSeats[]>` | `INITIAL_DESKS_MAP` | 20 desks / 40 seats per class |
| `cm_thcs_subjects`| `SubjectRow[]`| `INITIAL_SUBJECTS` (10 subjects) | MAT, LIT, ENG, etc. |
| `cm_thcs_memberships` | `ClassMembershipRow[]` | `INITIAL_CLASS_MEMBERSHIPS` | GVCN & GVBM roles |
| `cm_thcs_subject_assignments` | `SubjectAssignmentRow[]` | `INITIAL_SUBJECT_ASSIGNMENTS` | Class × Subject assignment |
| `cm_thcs_timetable` | `TimetableEntryRow[]` | `INITIAL_TIMETABLE` (448 slots) | 28 slots × 16 classes |
| `cm_thcs_attendance`| `AttendanceRow[]` | `INITIAL_ATTENDANCE_RECORDS` | Historical dates |
| `cm_thcs_announcements` | `AnnouncementRow[]` | `INITIAL_ANNOUNCEMENTS` | Bulletin board |
| `cm_thcs_notes` | `StudentNoteRow[]` | `INITIAL_STUDENT_NOTES` | Pedagogical remarks |
