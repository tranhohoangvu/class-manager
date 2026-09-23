-- =============================================
-- Migration 001: Initial Schema (Standard PostgreSQL)
-- Target: Render PostgreSQL & Local PostgreSQL
-- =============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS (Primary user credentials & profiles for Express + PostgreSQL)
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(50),
  role          VARCHAR(20) NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('ADMIN', 'TEACHER')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- SUBJECTS (Môn học THCS)
CREATE TABLE IF NOT EXISTS subjects (
  id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code        VARCHAR(20) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- CLASSES (Quy chuẩn 20 bàn, tối đa 40 học sinh)
CREATE TABLE IF NOT EXISTS classes (
  id           VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id   VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL, -- Homeroom Teacher (GVCN)
  name         VARCHAR(100) NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 9),
  room_name    VARCHAR(100),
  school_year  VARCHAR(50) NOT NULL DEFAULT '2026 - 2027',
  max_students INTEGER NOT NULL DEFAULT 40 CHECK (max_students > 0 AND max_students <= 40),
  desk_count   INTEGER NOT NULL DEFAULT 20 CHECK (desk_count = 20),
  status       VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- CLASS MEMBERSHIPS (Phân công GVCN & GVBM)
CREATE TABLE IF NOT EXISTS class_memberships (
  id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id  VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  class_id    VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  role        VARCHAR(50) NOT NULL CHECK (role IN ('HOMEROOM_TEACHER', 'SUBJECT_TEACHER')),
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- SUBJECT ASSIGNMENTS (Phân công giảng dạy bộ môn theo lớp)
CREATE TABLE IF NOT EXISTS subject_assignments (
  id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id  VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  class_id    VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  subject_id  VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- TIMETABLE ENTRIES (Thời khóa biểu lớp học)
-- 6 ngày (Thứ 2 -> Thứ 7), Tiết 1 -> Tiết 10 (Sáng 1-5, Chiều 6-10)
CREATE TABLE IF NOT EXISTS timetable_entries (
  id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id    VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 2 AND 7),
  period      INTEGER NOT NULL CHECK (period BETWEEN 1 AND 10),
  subject_id  VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id  VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id            VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id      VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_code  VARCHAR(50) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  gender        VARCHAR(10) CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  avatar_url    TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- DESKS (Cố định 20 bàn: 4 dãy x 5 hàng)
CREATE TABLE IF NOT EXISTS desks (
  id          VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id    VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  desk_number INTEGER NOT NULL CHECK (desk_number BETWEEN 1 AND 20),
  row_num     INTEGER NOT NULL CHECK (row_num BETWEEN 1 AND 5),
  col_num     INTEGER NOT NULL CHECK (col_num BETWEEN 1 AND 4),
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- SEATS (40 chỗ ngồi: 2 chỗ / bàn - left & right)
CREATE TABLE IF NOT EXISTS seats (
  id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  desk_id    VARCHAR(64) REFERENCES desks(id) ON DELETE CASCADE NOT NULL,
  side       VARCHAR(10) NOT NULL CHECK (side IN ('left', 'right')),
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE SET NULL
);

-- ATTENDANCE (Điểm danh học sinh)
CREATE TABLE IF NOT EXISTS attendance (
  id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id   VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE SET NULL,
  date       DATE NOT NULL,
  status     VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ANNOUNCEMENTS (Thông báo bảng tin lớp)
CREATE TABLE IF NOT EXISTS announcements (
  id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_id   VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    TEXT,
  is_pinned  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- STUDENT NOTES (Ghi chú / sổ theo dõi học sinh)
CREATE TABLE IF NOT EXISTS student_notes (
  id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_id   VARCHAR(64) REFERENCES classes(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
