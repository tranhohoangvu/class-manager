-- =============================================
-- Class Manager — Initial Schema
-- Migration 001
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CLASSES
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  room_name   text,
  school_year text,
  max_students integer NOT NULL DEFAULT 50 CHECK (max_students > 0 AND max_students <= 50),
  desk_count   integer NOT NULL DEFAULT 25 CHECK (desk_count > 0 AND desk_count <= 25),
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_code text NOT NULL,
  full_name    text NOT NULL,
  gender       text CHECK (gender IN ('male', 'female')),
  date_of_birth date,
  phone        text,
  email        text,
  avatar_url   text,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE(class_id, student_code)
);

-- Enforce max 50 active students per class
CREATE OR REPLACE FUNCTION check_max_students()
RETURNS TRIGGER AS $$
DECLARE
  active_count integer;
  max_allowed  integer;
BEGIN
  -- Only check when inserting or when status changes to 'active'
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
    SELECT COUNT(*) INTO active_count
    FROM students
    WHERE class_id = NEW.class_id AND status = 'active' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    SELECT max_students INTO max_allowed
    FROM classes
    WHERE id = NEW.class_id;

    IF active_count >= max_allowed THEN
      RAISE EXCEPTION 'Lớp học đã đạt số học sinh tối đa (%). Không thể thêm học sinh mới.', max_allowed;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_students
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION check_max_students();

-- =============================================
-- DESKS
-- =============================================
CREATE TABLE IF NOT EXISTS desks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  desk_number integer NOT NULL,
  row_num     integer NOT NULL,
  col_num     integer NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(class_id, desk_number)
);

-- =============================================
-- SEATS
-- =============================================
CREATE TABLE IF NOT EXISTS seats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_id    uuid REFERENCES desks(id) ON DELETE CASCADE NOT NULL,
  side       text NOT NULL CHECK (side IN ('left', 'right')),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  UNIQUE(desk_id, side),
  UNIQUE(student_id)   -- one student can only occupy one seat
);

-- =============================================
-- ATTENDANCE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  date       date NOT NULL,
  status     text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note       text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)  -- one record per student per day
);

-- =============================================
-- ANNOUNCEMENTS
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
-- STUDENT NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS student_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- =============================================
-- AUTO-UPDATE updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_student_notes_updated_at
  BEFORE UPDATE ON student_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_desks_class_id ON desks(class_id);
CREATE INDEX idx_seats_desk_id ON seats(desk_id);
CREATE INDEX idx_seats_student_id ON seats(student_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_announcements_class_id ON announcements(class_id);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned, created_at DESC);
CREATE INDEX idx_student_notes_student_id ON student_notes(student_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE classes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE desks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Classes: teacher can only see/edit their own class
CREATE POLICY "Teacher owns class" ON classes
  FOR ALL USING (teacher_id = auth.uid());

-- Students: teacher can access students in their class
CREATE POLICY "Teacher accesses own class students" ON students
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Desks: teacher can access desks in their class
CREATE POLICY "Teacher accesses own class desks" ON desks
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Seats: teacher can access seats for their class desks
CREATE POLICY "Teacher accesses own class seats" ON seats
  FOR ALL USING (
    desk_id IN (
      SELECT d.id FROM desks d
      JOIN classes c ON d.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Attendance: teacher can access attendance for their class students
CREATE POLICY "Teacher accesses own class attendance" ON attendance
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Announcements: teacher owns announcements in their class
CREATE POLICY "Teacher owns announcements" ON announcements
  FOR ALL USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
  );

-- Student notes: teacher can access notes for their class students
CREATE POLICY "Teacher accesses own class notes" ON student_notes
  FOR ALL USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );
