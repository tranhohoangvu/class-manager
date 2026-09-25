-- =============================================
-- Migration 006: Initial Seed Data
-- =============================================

-- 1. SUBJECTS (11 THCS subjects)
INSERT INTO subjects (id, code, name) VALUES
  ('sub-mat', 'MAT', 'Toán'),
  ('sub-lit', 'LIT', 'Ngữ văn'),
  ('sub-eng', 'ENG', 'Tiếng Anh'),
  ('sub-phy', 'PHY', 'Vật lý'),
  ('sub-che', 'CHE', 'Hóa học'),
  ('sub-bio', 'BIO', 'Sinh học'),
  ('sub-his', 'HIS', 'Lịch sử'),
  ('sub-geo', 'GEO', 'Địa lý'),
  ('sub-inf', 'INF', 'Tin học'),
  ('sub-tec', 'TEC', 'Công nghệ'),
  ('sub-shl', 'SHL', 'Sinh hoạt lớp')
ON CONFLICT (code) DO NOTHING;

-- 2. USERS (Admin + Key Demo Teachers with bcrypt hashed passwords)
INSERT INTO users (id, name, email, phone, role, status, password_hash) VALUES
  ('u-admin', 'Quản trị viên Hệ thống', 'admin@schoolops.local', '0901234567', 'ADMIN', 'active', '$2b$10$dzn3wISgnU.Tdne2FzEaju8hsVRGHmi/ipSRGqikf4VajFP3dA6m2'),
  ('u-tea-01', 'Thầy Nguyễn Văn An', 'an.nguyen@schoolops.local', '0912345601', 'TEACHER', 'active', '$2b$10$ED4fXuXObqn7p7tDV603S.j8bGtF6xw7M/9cuWKU3sV6J77aFB6NS'),
  ('u-tea-02', 'Cô Trần Thị Bình', 'binh.tran@schoolops.local', '0912345602', 'TEACHER', 'active', '$2b$10$b6zIxkXblKoKZx0XTZ0hkei8D0xBTYnawJV8.DJJyEZ0d7YAWOsdu'),
  ('u-tea-03', 'Thầy Lê Hoàng Cường', 'cuong.le@schoolops.local', '0912345603', 'TEACHER', 'active', '$2b$10$M7U8NyBQKsIbOBJ21m53JeSDRcb4OfBKfKsXvJqIGUNUQFoULwh0.'),
  ('u-tea-16', 'Cô Nguyễn Thị Hương', 'huong.nguyen@schoolops.local', '0912345616', 'TEACHER', 'active', '$2b$10$X7NuhIt3lmD3I.KSDKehQ.5VesP.P3EjD6gtxsG.75tdch8yXlMLq'),
  ('u-tea-23', 'Thầy Vũ Đình Trọng', 'disabled@schoolops.local', '0912345623', 'TEACHER', 'disabled', '$2b$10$vSi8TRKWD5rPx6DBtOrEYOe0Ug6xTooaVb1AgkTRW6oPwFTOzl.Oe'),
  ('u-tea-24', 'Thầy Hoàng Văn Cường', 'cuong.hoang@schoolops.local', '0912345624', 'TEACHER', 'active', '$2b$10$owHiYO0sXv6lFIkd/zK4hubbfTFXAhT3J/DoixL.Bq/OATh7UlmS2'),
  ('u-tea-unassigned', 'Thầy Đỗ Văn Tân', 'unassigned@schoolops.local', '0912345699', 'TEACHER', 'active', '$2b$10$veQB4fMFub4vywOR4suokeFU3Z7RDghTqKO..0Jpz2Bv7iuIKAf3m')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 3. CLASSES (16 classes: Khối 6, 7, 8, 9)
INSERT INTO classes (id, name, grade, room_name, school_year, teacher_id, max_students, desk_count, status) VALUES
  ('c-6a1', 'Lớp 6A1', 6, 'Phòng 101 — Nhà A', '2026 - 2027', 'u-tea-01', 40, 20, 'active'),
  ('c-6a2', 'Lớp 6A2', 6, 'Phòng 102 — Nhà A', '2026 - 2027', 'u-tea-02', 40, 20, 'active'),
  ('c-6a3', 'Lớp 6A3', 6, 'Phòng 103 — Nhà A', '2026 - 2027', 'u-tea-03', 40, 20, 'active'),
  ('c-6a4', 'Lớp 6A4', 6, 'Phòng 104 — Nhà A', '2026 - 2027', 'u-tea-16', 40, 20, 'active'),
  ('c-7a1', 'Lớp 7A1', 7, 'Phòng 201 — Nhà A', '2026 - 2027', 'u-tea-01', 40, 20, 'active'),
  ('c-7a2', 'Lớp 7A2', 7, 'Phòng 202 — Nhà A', '2026 - 2027', 'u-tea-02', 40, 20, 'active'),
  ('c-7a3', 'Lớp 7A3', 7, 'Phòng 203 — Nhà A', '2026 - 2027', 'u-tea-03', 40, 20, 'active'),
  ('c-7a4', 'Lớp 7A4', 7, 'Phòng 204 — Nhà A', '2026 - 2027', 'u-tea-16', 40, 20, 'active'),
  ('c-8a1', 'Lớp 8A1', 8, 'Phòng 101 — Nhà B', '2026 - 2027', 'u-tea-01', 40, 20, 'active'),
  ('c-8a2', 'Lớp 8A2', 8, 'Phòng 102 — Nhà B', '2026 - 2027', 'u-tea-02', 40, 20, 'active'),
  ('c-8a3', 'Lớp 8A3', 8, 'Phòng 103 — Nhà B', '2026 - 2027', 'u-tea-03', 40, 20, 'active'),
  ('c-8a4', 'Lớp 8A4', 8, 'Phòng 104 — Nhà B', '2026 - 2027', 'u-tea-16', 40, 20, 'active'),
  ('c-9a1', 'Lớp 9A1', 9, 'Phòng 201 — Nhà B', '2026 - 2027', 'u-tea-01', 40, 20, 'active'),
  ('c-9a2', 'Lớp 9A2', 9, 'Phòng 202 — Nhà B', '2026 - 2027', 'u-tea-02', 40, 20, 'active'),
  ('c-9a3', 'Lớp 9A3', 9, 'Phòng 203 — Nhà B', '2026 - 2027', 'u-tea-03', 40, 20, 'active'),
  ('c-9a4', 'Lớp 9A4', 9, 'Phòng 204 — Nhà B', '2026 - 2027', 'u-tea-16', 40, 20, 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  room_name = EXCLUDED.room_name,
  teacher_id = EXCLUDED.teacher_id;

-- 4. CLASS MEMBERSHIPS (GVCN & GVBM)
INSERT INTO class_memberships (id, teacher_id, class_id, role) VALUES
  ('cm-6a1-tea01', 'u-tea-01', 'c-6a1', 'HOMEROOM_TEACHER'),
  ('cm-6a2-tea01', 'u-tea-01', 'c-6a2', 'SUBJECT_TEACHER'),
  ('cm-7a1-tea01', 'u-tea-01', 'c-7a1', 'SUBJECT_TEACHER'),
  ('cm-7a2-tea01', 'u-tea-01', 'c-7a2', 'SUBJECT_TEACHER'),
  ('cm-6a4-tea16', 'u-tea-16', 'c-6a4', 'HOMEROOM_TEACHER'),
  ('cm-6a1-tea24', 'u-tea-24', 'c-6a1', 'SUBJECT_TEACHER'),
  ('cm-6a2-tea24', 'u-tea-24', 'c-6a2', 'SUBJECT_TEACHER')
ON CONFLICT (teacher_id, class_id, role) DO NOTHING;

-- 5. SUBJECT ASSIGNMENTS
INSERT INTO subject_assignments (id, teacher_id, class_id, subject_id) VALUES
  ('sa-6a1-mat-tea01', 'u-tea-01', 'c-6a1', 'sub-mat'),
  ('sa-6a2-mat-tea01', 'u-tea-01', 'c-6a2', 'sub-mat'),
  ('sa-7a1-mat-tea01', 'u-tea-01', 'c-7a1', 'sub-mat'),
  ('sa-7a2-mat-tea01', 'u-tea-01', 'c-7a2', 'sub-mat'),
  ('sa-6a1-tec-tea24', 'u-tea-24', 'c-6a1', 'sub-tec'),
  ('sa-6a2-tec-tea24', 'u-tea-24', 'c-6a2', 'sub-tec')
ON CONFLICT (teacher_id, class_id, subject_id) DO NOTHING;

-- 6. DESKS & SEATS GENERATION FOR ALL CLASSES (20 desks: 4 cols x 5 rows = 40 seats)
DO $$
DECLARE
  cls RECORD;
  r INTEGER;
  c INTEGER;
  d_num INTEGER;
  d_id VARCHAR(64);
  s_id_left VARCHAR(64);
  s_id_right VARCHAR(64);
BEGIN
  FOR cls IN SELECT id FROM classes LOOP
    FOR r IN 1..5 LOOP
      FOR c IN 1..4 LOOP
        d_num := (r - 1) * 4 + c;
        d_id := cls.id || '-desk-' || d_num;
        s_id_left := d_id || '-left';
        s_id_right := d_id || '-right';

        INSERT INTO desks (id, class_id, desk_number, row_num, col_num)
        VALUES (d_id, cls.id, d_num, r, c)
        ON CONFLICT (class_id, desk_number) DO NOTHING;

        INSERT INTO seats (id, desk_id, side, student_id)
        VALUES (s_id_left, d_id, 'left', NULL)
        ON CONFLICT (desk_id, side) DO NOTHING;

        INSERT INTO seats (id, desk_id, side, student_id)
        VALUES (s_id_right, d_id, 'right', NULL)
        ON CONFLICT (desk_id, side) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- 7. SEED 40 STUDENTS IN CLASS 6A1 & SEAT ASSIGNMENT
DO $$
DECLARE
  student_names text[] := ARRAY[
    'Nguyễn Văn An', 'Trần Minh Anh', 'Lê Hoàng Nam', 'Phạm Gia Huy',
    'Hoàng Thị Lan', 'Vũ Đức Thành', 'Đặng Thị Mai', 'Bùi Quang Minh',
    'Đỗ Thị Hoa', 'Ngô Văn Đức', 'Trịnh Thị Ngọc', 'Đinh Văn Khoa',
    'Lý Thị Thu', 'Dương Minh Tuấn', 'Trương Thị Linh', 'Phan Văn Tài',
    'Hồ Thị Phương', 'Mai Văn Long', 'Cao Thị Hương', 'Lưu Văn Bình',
    'Tạ Thị Trang', 'Ninh Văn Sơn', 'Vương Thị Yến', 'Kiều Văn Quân',
    'Lã Thị Kim', 'Từ Văn Tú', 'Âu Thị Diễm', 'Châu Văn Lực',
    'Tiêu Thị Hiền', 'Ứng Văn Phú', 'Nông Thị Cúc', 'Mạc Văn Dũng',
    'Quách Thị Xuân', 'Đoàn Văn Hùng', 'Chu Thị Thảo', 'Hứa Văn Vinh',
    'Giáp Thị Nhung', 'Thái Văn Khánh', 'Tống Thị Bích', 'Lâm Văn Đạt'
  ];
  genders text[] := ARRAY[
    'male', 'female', 'male', 'male', 'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male'
  ];
  i INTEGER;
  stu_id VARCHAR(64);
  seat_id VARCHAR(64);
  d_num INTEGER;
  side_str VARCHAR(10);
BEGIN
  FOR i IN 1..40 LOOP
    stu_id := 'c-6a1-stu-' || LPAD(i::text, 2, '0');
    
    INSERT INTO students (id, class_id, student_code, full_name, gender, status)
    VALUES (stu_id, 'c-6a1', 'HS' || LPAD(i::text, 3, '0'), student_names[i], genders[i], 'active')
    ON CONFLICT (class_id, student_code) DO NOTHING;

    -- Assign to seat
    d_num := ((i - 1) / 2) + 1;
    IF (i % 2) = 1 THEN
      side_str := 'left';
    ELSE
      side_str := 'right';
    END IF;
    seat_id := 'c-6a1-desk-' || d_num || '-' || side_str;

    UPDATE seats SET student_id = stu_id WHERE id = seat_id;
  END LOOP;
END;
$$;

-- 8. TIMETABLE ENTRIES (Standard Class 6A1 Schedule)
INSERT INTO timetable_entries (id, class_id, day_of_week, period, subject_id, teacher_id) VALUES
  ('tt-6a1-2-1', 'c-6a1', 2, 1, 'sub-shl', 'u-tea-01'),
  ('tt-6a1-2-2', 'c-6a1', 2, 2, 'sub-mat', 'u-tea-01'),
  ('tt-6a1-2-3', 'c-6a1', 2, 3, 'sub-mat', 'u-tea-01'),
  ('tt-6a1-2-4', 'c-6a1', 2, 4, 'sub-lit', 'u-tea-02'),
  ('tt-6a1-2-5', 'c-6a1', 2, 5, 'sub-lit', 'u-tea-02'),
  ('tt-6a1-3-1', 'c-6a1', 3, 1, 'sub-eng', 'u-tea-03'),
  ('tt-6a1-3-2', 'c-6a1', 3, 2, 'sub-eng', 'u-tea-03'),
  ('tt-6a1-3-3', 'c-6a1', 3, 3, 'sub-tec', 'u-tea-24'),
  ('tt-6a1-3-4', 'c-6a1', 3, 4, 'sub-mat', 'u-tea-01'),
  ('tt-6a1-7-3', 'c-6a1', 7, 3, 'sub-shl', 'u-tea-01')
ON CONFLICT (class_id, day_of_week, period) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  teacher_id = EXCLUDED.teacher_id;

-- 9. SAMPLE ANNOUNCEMENTS
INSERT INTO announcements (id, class_id, title, content, is_pinned, created_at) VALUES
  ('ann-1', 'c-6a1', 'Kiểm tra Toán 15 phút', 'Các em chuẩn bị kiểm tra 15 phút bài Số nguyên vào thứ Sáu.', true, now() - interval '1 day'),
  ('ann-2', 'c-6a1', 'Họp phụ huynh đầu năm', 'Cuộc họp phụ huynh học kỳ I diễn ra vào 08:00 sáng Chủ Nhật.', true, now() - interval '2 days'),
  ('ann-3', 'c-6a1', 'Kế hoạch hội thao trường', 'Các bạn đăng ký thi đấu cầu lông và cờ vua gửi danh sách cho lớp trưởng.', false, now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- 10. SAMPLE NOTES
INSERT INTO student_notes (id, student_id, class_id, content, created_at) VALUES
  ('sn-1', 'c-6a1-stu-01', 'c-6a1', 'Học sinh tiếp thu bài tốt, hăng hái phát biểu xây dựng bài.', now() - interval '2 days'),
  ('sn-2', 'c-6a1-stu-02', 'c-6a1', 'Cần chú ý làm bài tập về nhà đầy đủ hơn.', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;
