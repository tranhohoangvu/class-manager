# Database Design & Storage Architecture

## 1. Relational PostgreSQL Database

The application database is a native **PostgreSQL 16** instance deployed on Render PostgreSQL (or local PostgreSQL during development), managed by versioned SQL migration scripts located in `backend/migrations/`.

Connection pooling is handled via the `pg` package (`pg.Pool`), enforcing parameterized queries to eliminate SQL injection risks.

---

## 2. Table Specifications (PostgreSQL Schema)

### 2.1. `users`
Represents staff and system users with bcrypt hashed credentials.
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Columns:**
  - `email`: `VARCHAR(255) NOT NULL UNIQUE`
  - `password_hash`: `VARCHAR(255) NOT NULL` (bcrypt salt rounds = 10)
  - `name`: `VARCHAR(255) NOT NULL`
  - `phone`: `VARCHAR(50)`
  - `role`: `VARCHAR(20) NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('ADMIN', 'TEACHER'))`
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'))`
  - `avatar_url`: `TEXT`
  - `created_at`: `TIMESTAMPTZ DEFAULT now() NOT NULL`
  - `updated_at`: `TIMESTAMPTZ DEFAULT now() NOT NULL`
* **Triggers:** `trg_users_updated_at` (executes `update_updated_at()`)

### 2.2. `subjects`
Secondary school core curriculum subjects (11 subjects).
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Columns:**
  - `code`: `VARCHAR(20) NOT NULL UNIQUE` (`MAT`, `LIT`, `ENG`, `PHY`, `CHE`, `BIO`, `HIS`, `GEO`, `INF`, `TEC`, `SHL`)
  - `name`: `VARCHAR(100) NOT NULL`
  - `max_consecutive_periods`: `INTEGER NOT NULL DEFAULT 1 CHECK (max_consecutive_periods BETWEEN 1 AND 2)` (Mathematics: 2, Literature: 2, Others: 1)
  - `created_at`: `TIMESTAMPTZ DEFAULT now() NOT NULL`

### 2.3. `classes`
Classroom entities adhering to 20 desks / 40 seats.
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Foreign Keys:** `teacher_id` (`VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL`) - Homeroom teacher (GVCN)
* **Columns:**
  - `name`: `VARCHAR(100) NOT NULL` (e.g. `6A1`, `9A4`)
  - `grade`: `INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 9)`
  - `room_name`: `VARCHAR(100)`
  - `school_year`: `VARCHAR(50) NOT NULL DEFAULT '2026 - 2027'`
  - `max_students`: `INTEGER NOT NULL DEFAULT 40 CHECK (max_students > 0 AND max_students <= 40)`
  - `desk_count`: `INTEGER NOT NULL DEFAULT 20 CHECK (desk_count = 20)`
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))`
  - `created_at`: `TIMESTAMPTZ DEFAULT now() NOT NULL`
  - `updated_at`: `TIMESTAMPTZ DEFAULT now() NOT NULL`

### 2.4. `class_memberships`
Defines teacher affiliation to a class.
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Foreign Keys:**
  - `teacher_id`: `VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE`
  - `class_id`: `VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE`
* **Columns:**
  - `role`: `VARCHAR(50) NOT NULL CHECK (role IN ('HOMEROOM_TEACHER', 'SUBJECT_TEACHER'))`
* **Constraints:** `UNIQUE(teacher_id, class_id, role)`

### 2.5. `subject_assignments`
Maps which teacher teaches which subject in a class.
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Foreign Keys:**
  - `teacher_id`: `VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE`
  - `class_id`: `VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE`
  - `subject_id`: `VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE`
* **Constraints:** `UNIQUE(teacher_id, class_id, subject_id)`

### 2.6. `timetable_entries`
Weekly period schedule entries (28 periods/week per class).
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Foreign Keys:**
  - `class_id`: `VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE`
  - `subject_id`: `VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE`
  - `teacher_id`: `VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL`
* **Columns:**
  - `day_of_week`: `INTEGER NOT NULL CHECK (day_of_week BETWEEN 2 AND 7)`
  - `period`: `INTEGER NOT NULL CHECK (period BETWEEN 1 AND 10)`
  - `room`: `VARCHAR(100)` (Specific room assigned to slot, nullable)
* **Constraints:**
  - `UNIQUE(class_id, day_of_week, period)`
* **Indexes:**
  - `idx_timetable_room_slot`: `(room, day_of_week, period) WHERE room IS NOT NULL`

### 2.7. `students`
Student roster per class.
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Foreign Keys:** `class_id` (`VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE`)
* **Columns:**
  - `student_code`: `VARCHAR(50) NOT NULL` (e.g. `HS001`)
  - `full_name`: `VARCHAR(255) NOT NULL`
  - `gender`: `VARCHAR(10) CHECK (gender IN ('male', 'female'))`
  - `date_of_birth`: `DATE`
  - `phone`: `VARCHAR(50)`
  - `email`: `VARCHAR(255)`
  - `avatar_url`: `TEXT`
  - `status`: `VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))`
* **Constraints:** `UNIQUE(class_id, student_code)`
* **Triggers:** `trg_check_max_students` (enforces class capacity <= `max_students`)

### 2.8. `desks` & `seats`
Standardized 4×5 classroom grid (20 double desks = 40 seats).
* **`desks`**: `(id, class_id, desk_number, row_num, col_num)`
  - `UNIQUE(class_id, desk_number)`
* **`seats`**: `(id, desk_id, side, student_id)`
  - `side`: `CHECK (side IN ('left', 'right'))`
  - `UNIQUE(desk_id, side)`
  - `UNIQUE(student_id)`: Enforces 1-to-1 seat invariant.

### 2.9. `attendance`
* **Primary Key:** `id` (`VARCHAR(64) DEFAULT gen_random_uuid()::text`)
* **Columns:**
  - `student_id`: `VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE`
  - `class_id`: `VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE`
  - `teacher_id`: `VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL`
  - `subject_id`: `VARCHAR(64) REFERENCES subjects(id) ON DELETE SET NULL`
  - `date`: `DATE NOT NULL`
  - `status`: `VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused'))`
  - `note`: `TEXT`
* **Constraints:** `UNIQUE (student_id, date, subject_id)`

### 2.10. `announcements` & `student_notes`
* **`announcements`**: `(id, class_id, title, content, is_pinned, created_at, updated_at)`
* **`student_notes`**: `(id, student_id, class_id, content, created_at, updated_at)`

---

## 3. Database Migrations (`backend/migrations/`)

1. `001_initial_schema.sql`: Base tables and relational constraints.
2. `002_constraints.sql`: Uniqueness rules and business check constraints.
3. `003_indexes.sql`: Lookup indexes on foreign keys, status, dates, and codes.
4. `004_functions.sql`: `update_updated_at()`, `check_max_students()`.
5. `005_triggers.sql`: Auto-timestamps and maximum student capacity enforcement.
6. `006_seed.sql`: Complete THCS seed dataset with hashed passwords for test personas.
