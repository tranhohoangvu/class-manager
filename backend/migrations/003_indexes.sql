-- =============================================
-- Migration 003: Indexes for Query Optimization
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

CREATE INDEX IF NOT EXISTS idx_class_memberships_teacher ON class_memberships(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class ON class_memberships(class_id);

CREATE INDEX IF NOT EXISTS idx_subject_assignments_teacher ON subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_assignments_class ON subject_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_subject_assignments_subject ON subject_assignments(subject_id);

CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_entries(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day_period ON timetable_entries(day_of_week, period);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);

CREATE INDEX IF NOT EXISTS idx_desks_class_id ON desks(class_id);
CREATE INDEX IF NOT EXISTS idx_seats_desk_id ON seats(desk_id);
CREATE INDEX IF NOT EXISTS idx_seats_student_id ON seats(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON attendance(subject_id);

CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_class_id ON student_notes(class_id);
