-- =============================================
-- Class Manager — Initial Schema (Production / Supabase)
-- Migration 001
-- Quy chuẩn lớp học: 20 bàn học, 40 chỗ ngồi (4 dãy × 5 hàng), sĩ số tối đa 40 HS.
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES (Users synced from auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  role        text NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('ADMIN', 'TEACHER')),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  avatar_url  text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- SUBJECTS (Môn học THCS)
-- =============================================
CREATE TABLE IF NOT EXISTS subjects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE, -- MAT, LIT, ENG, PHY, CHE, BIO, HIS, GEO, INF, TEC...
  name        text NOT NULL,        -- Toán, Ngữ văn, Tiếng Anh...
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- CLASSES (Lớp học: Quy chuẩn 20 bàn, max 40 học sinh)
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- GVCN (Homeroom Teacher)
  name         text NOT NULL,
  grade        integer NOT NULL CHECK (grade BETWEEN 6 AND 9),
  room_name    text,
  school_year  text NOT NULL DEFAULT '2026 - 2027',
  max_students integer NOT NULL DEFAULT 40 CHECK (max_students > 0 AND max_students <= 40),
  desk_count   integer NOT NULL DEFAULT 20 CHECK (desk_count = 20),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- CLASS MEMBERSHIPS (Phân công GVCN & GVBM)
-- =============================================
CREATE TABLE IF NOT EXISTS class_memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  role        text NOT NULL CHECK (role IN ('HOMEROOM_TEACHER', 'SUBJECT_TEACHER')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(teacher_id, class_id, role)
);

-- =============================================
-- SUBJECT ASSIGNMENTS (Phân công giảng dạy bộ môn theo lớp)
-- =============================================
CREATE TABLE IF NOT EXISTS subject_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id  uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(teacher_id, class_id, subject_id)
);

-- =============================================
-- TIMETABLE ENTRIES (Thời khóa biểu lớp học)
-- 6 ngày (Thứ 2 -> Thứ 7) × 5 tiết sáng (Tiết 1 -> Tiết 5)
-- =============================================
CREATE TABLE IF NOT EXISTS timetable_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 2 AND 7), -- 2: Thứ Hai ... 7: Thứ Bảy
  period      integer NOT NULL CHECK (period BETWEEN 1 AND 5),       -- 1..5: Tiết 1 đến Tiết 5
  subject_id  uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(class_id, day_of_week, period)
);

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_code  text NOT NULL,
  full_name     text NOT NULL,
  gender        text CHECK (gender IN ('male', 'female')),
  date_of_birth date,
  phone         text,
  email         text,
  avatar_url    text,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE(class_id, student_code)
);

-- Enforce max 40 active students per class (hoặc theo max_students của lớp)
CREATE OR REPLACE FUNCTION check_max_students()
RETURNS TRIGGER AS $$
DECLARE
  active_count integer;
  max_allowed  integer;
BEGIN
  -- Chỉ kiểm tra khi INSERT hoặc UPDATE trạng thái thành 'active'
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
    SELECT COUNT(*) INTO active_count
    FROM students
    WHERE class_id = NEW.class_id AND status = 'active' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    SELECT COALESCE(max_students, 40) INTO max_allowed
    FROM classes
    WHERE id = NEW.class_id;

    IF active_count >= max_allowed THEN
      RAISE EXCEPTION 'Lớp học đã đạt sĩ số tối đa (% học sinh theo quy chuẩn 20 bàn). Không thể thêm học sinh mới.', max_allowed;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_max_students ON students;
CREATE TRIGGER trg_check_max_students
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION check_max_students();

-- =============================================
-- DESKS (Cố định 20 bàn học: 4 dãy x 5 hàng)
-- =============================================
CREATE TABLE IF NOT EXISTS desks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  desk_number integer NOT NULL CHECK (desk_number BETWEEN 1 AND 20),
  row_num     integer NOT NULL CHECK (row_num BETWEEN 1 AND 5),
  col_num     integer NOT NULL CHECK (col_num BETWEEN 1 AND 4),
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(class_id, desk_number)
);

-- =============================================
-- SEATS (40 chỗ ngồi: 2 chỗ / bàn - left & right)
-- =============================================
CREATE TABLE IF NOT EXISTS seats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_id    uuid REFERENCES desks(id) ON DELETE CASCADE NOT NULL,
  side       text NOT NULL CHECK (side IN ('left', 'right')),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  UNIQUE(desk_id, side),
  UNIQUE(student_id) -- Mỗi học sinh chỉ ngồi 1 ghế trong lớp
);

-- =============================================
-- ATTENDANCE (Hỗ trợ điểm danh theo ngày & môn học)
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id   uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  date       date NOT NULL,
  status     text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note       text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(student_id, date) -- Điểm danh hàng ngày mặc định theo học sinh
);

-- =============================================
-- ANNOUNCEMENTS (Thông báo bảng tin lớp)
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  content    text,
  is_pinned  boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- STUDENT NOTES (Ghi chú / sổ theo dõi học sinh)
-- =============================================
CREATE TABLE IF NOT EXISTS student_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id   uuid REFERENCES classes(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON classes;
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_timetable_updated_at ON timetable_entries;
CREATE TRIGGER trg_timetable_updated_at
  BEFORE UPDATE ON timetable_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_student_notes_updated_at ON student_notes;
CREATE TRIGGER trg_student_notes_updated_at
  BEFORE UPDATE ON student_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade);
CREATE INDEX IF NOT EXISTS idx_class_memberships_teacher ON class_memberships(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class ON class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_subject_assignments_teacher ON subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_assignments_class ON subject_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_entries(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day_period ON timetable_entries(day_of_week, period);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_desks_class_id ON desks(class_id);
CREATE INDEX IF NOT EXISTS idx_seats_desk_id ON seats(desk_id);
CREATE INDEX IF NOT EXISTS idx_seats_student_id ON seats(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE desks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes       ENABLE ROW LEVEL SECURITY;

-- Helper: Check if current user is ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if current user has access to class (as Admin, GVCN or GVBM)
CREATE OR REPLACE FUNCTION has_class_access(p_class_id uuid)
RETURNS boolean AS $$
BEGIN
  IF is_admin() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM classes WHERE id = p_class_id AND teacher_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM class_memberships WHERE class_id = p_class_id AND teacher_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: User reads own profile, admin manages all
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());
CREATE POLICY "Admin can manage all profiles" ON profiles
  FOR ALL USING (is_admin());

-- Subjects: Everyone can read subjects, admin manages
CREATE POLICY "Anyone authenticated can view subjects" ON subjects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage subjects" ON subjects
  FOR ALL USING (is_admin());

-- Classes: Admin all, teachers access assigned classes
CREATE POLICY "Teachers can view assigned classes" ON classes
  FOR SELECT USING (has_class_access(id));
CREATE POLICY "Homeroom teacher or Admin can update class" ON classes
  FOR UPDATE USING (teacher_id = auth.uid() OR is_admin());
CREATE POLICY "Admin can manage classes" ON classes
  FOR ALL USING (is_admin());

-- Class memberships & Subject assignments:
CREATE POLICY "Teachers can view class memberships" ON class_memberships
  FOR SELECT USING (has_class_access(class_id));
CREATE POLICY "Admin can manage class memberships" ON class_memberships
  FOR ALL USING (is_admin());

CREATE POLICY "Teachers can view subject assignments" ON subject_assignments
  FOR SELECT USING (has_class_access(class_id));
CREATE POLICY "Admin can manage subject assignments" ON subject_assignments
  FOR ALL USING (is_admin());

-- Timetable entries:
CREATE POLICY "Teachers can view timetable" ON timetable_entries
  FOR SELECT USING (has_class_access(class_id));
CREATE POLICY "Homeroom teacher or Admin can manage timetable" ON timetable_entries
  FOR ALL USING (
    is_admin() OR EXISTS (SELECT 1 FROM classes WHERE id = timetable_entries.class_id AND teacher_id = auth.uid())
  );

-- Students:
CREATE POLICY "Teachers can view students in their classes" ON students
  FOR SELECT USING (has_class_access(class_id));
CREATE POLICY "Homeroom teacher or Admin can manage students" ON students
  FOR ALL USING (
    is_admin() OR EXISTS (SELECT 1 FROM classes WHERE id = students.class_id AND teacher_id = auth.uid())
  );

-- Desks & Seats:
CREATE POLICY "Teachers can view desks" ON desks
  FOR SELECT USING (has_class_access(class_id));
CREATE POLICY "Homeroom teacher or Admin can manage desks" ON desks
  FOR ALL USING (
    is_admin() OR EXISTS (SELECT 1 FROM classes WHERE id = desks.class_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can view seats" ON seats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM desks d
      WHERE d.id = seats.desk_id AND has_class_access(d.class_id)
    )
  );
CREATE POLICY "Homeroom teacher or Admin can manage seats" ON seats
  FOR ALL USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM desks d
      JOIN classes c ON d.class_id = c.id
      WHERE d.id = seats.desk_id AND c.teacher_id = auth.uid()
    )
  );

-- Attendance:
CREATE POLICY "Teachers can view and record attendance" ON attendance
  FOR ALL USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = attendance.student_id AND has_class_access(s.class_id)
    )
  );

-- Announcements:
CREATE POLICY "Teachers can view announcements" ON announcements
  FOR SELECT USING (has_class_access(class_id));
CREATE POLICY "Homeroom teacher or Admin can manage announcements" ON announcements
  FOR ALL USING (
    is_admin() OR EXISTS (SELECT 1 FROM classes WHERE id = announcements.class_id AND teacher_id = auth.uid())
  );

-- Student Notes:
CREATE POLICY "Homeroom teacher or Admin can view and manage notes" ON student_notes
  FOR ALL USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = student_notes.student_id AND c.teacher_id = auth.uid()
    )
  );
