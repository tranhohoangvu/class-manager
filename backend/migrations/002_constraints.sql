-- =============================================
-- Migration 002: Constraints & Uniqueness Rules
-- =============================================

-- Class memberships: một giáo viên chỉ giữ 1 vai trò (GVCN hoặc GVBM) trong cùng 1 lớp
ALTER TABLE class_memberships
  DROP CONSTRAINT IF EXISTS uq_class_memberships_teacher_class_role;
ALTER TABLE class_memberships
  ADD CONSTRAINT uq_class_memberships_teacher_class_role UNIQUE (teacher_id, class_id, role);

-- Subject assignments: 1 giáo viên chỉ phụ trách 1 môn trong 1 lớp
ALTER TABLE subject_assignments
  DROP CONSTRAINT IF EXISTS uq_subject_assignments_teacher_class_subject;
ALTER TABLE subject_assignments
  ADD CONSTRAINT uq_subject_assignments_teacher_class_subject UNIQUE (teacher_id, class_id, subject_id);

-- Timetable: mỗi tiết học của 1 lớp chỉ có tối đa 1 mục
ALTER TABLE timetable_entries
  DROP CONSTRAINT IF EXISTS uq_timetable_class_day_period;
ALTER TABLE timetable_entries
  ADD CONSTRAINT uq_timetable_class_day_period UNIQUE (class_id, day_of_week, period);

-- Students: mã học sinh là duy nhất trong cùng một lớp
ALTER TABLE students
  DROP CONSTRAINT IF EXISTS uq_students_class_student_code;
ALTER TABLE students
  ADD CONSTRAINT uq_students_class_student_code UNIQUE (class_id, student_code);

-- Desks: mỗi số bàn là duy nhất trong cùng 1 lớp
ALTER TABLE desks
  DROP CONSTRAINT IF EXISTS uq_desks_class_desk_number;
ALTER TABLE desks
  ADD CONSTRAINT uq_desks_class_desk_number UNIQUE (class_id, desk_number);

-- Seats: mỗi bàn chỉ có 1 vị trí bên trái và 1 vị trí bên phải
ALTER TABLE seats
  DROP CONSTRAINT IF EXISTS uq_seats_desk_side;
ALTER TABLE seats
  ADD CONSTRAINT uq_seats_desk_side UNIQUE (desk_id, side);

-- Seats: mỗi học sinh chỉ ngồi tối đa 1 chỗ trong lớp
ALTER TABLE seats
  DROP CONSTRAINT IF EXISTS uq_seats_student_id;
ALTER TABLE seats
  ADD CONSTRAINT uq_seats_student_id UNIQUE (student_id);

-- Attendance: điểm danh học sinh theo ngày & môn (hoặc hàng ngày nếu subject_id null)
ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS uq_attendance_student_date_subject;
ALTER TABLE attendance
  ADD CONSTRAINT uq_attendance_student_date_subject UNIQUE NULLS NOT DISTINCT (student_id, date, subject_id);
