-- =============================================
-- Class Manager — Seed Data
-- Run AFTER 001_initial_schema.sql
-- NOTE: Replace 'YOUR_TEACHER_USER_ID' with the actual auth.users UUID
-- after creating a teacher account via Supabase Auth.
-- =============================================

-- This seed file uses a placeholder. When running manually:
-- 1. Create a user via Supabase Auth dashboard or sign-up
-- 2. Get the user's UUID from auth.users
-- 3. Replace 'YOUR_TEACHER_USER_ID' below with that UUID

DO $$
DECLARE
  v_teacher_id uuid;
  v_class_id   uuid;
  v_desk_ids   uuid[];
  v_seat_ids   uuid[];
  v_student_ids uuid[];
  i integer;
  j integer;
  v_desk_id uuid;
  v_seat_id uuid;
  v_student_id uuid;
  
  -- 40 Vietnamese student names
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
  student_codes text[];
  student_genders text[] := ARRAY[
    'male', 'female', 'male', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male',
    'female', 'male', 'female', 'male'
  ];
  
  v_date date;
  v_statuses text[] := ARRAY['present', 'present', 'present', 'present', 'present', 'present', 'present', 'absent', 'late', 'present'];
  v_attendance_status text;
  
BEGIN
  -- Get teacher (first user in auth.users) for demo purposes
  SELECT id INTO v_teacher_id FROM auth.users LIMIT 1;
  
  IF v_teacher_id IS NULL THEN
    RAISE NOTICE 'No users found. Create a user first via Supabase Auth, then re-run seed.';
    RETURN;
  END IF;

  -- Build student codes
  student_codes := ARRAY[]::text[];
  FOR i IN 1..40 LOOP
    student_codes := array_append(student_codes, 'HS' || LPAD(i::text, 3, '0'));
  END LOOP;

  -- ===========================
  -- INSERT CLASS
  -- ===========================
  INSERT INTO classes (id, teacher_id, name, room_name, school_year, max_students, desk_count)
  VALUES (gen_random_uuid(), v_teacher_id, '9A1', 'A101', '2026-2027', 50, 25)
  RETURNING id INTO v_class_id;

  -- ===========================
  -- INSERT 25 DESKS (5 rows × 5 cols)
  -- ===========================
  v_desk_ids := ARRAY[]::uuid[];
  FOR r IN 1..5 LOOP
    FOR c IN 1..5 LOOP
      DECLARE v_did uuid;
      BEGIN
        INSERT INTO desks (id, class_id, desk_number, row_num, col_num)
        VALUES (gen_random_uuid(), v_class_id, ((r-1)*5 + c), r, c)
        RETURNING id INTO v_did;
        v_desk_ids := array_append(v_desk_ids, v_did);
      END;
    END LOOP;
  END LOOP;

  -- ===========================
  -- INSERT 50 SEATS (2 per desk)
  -- ===========================
  v_seat_ids := ARRAY[]::uuid[];
  FOR i IN 1..25 LOOP
    DECLARE
      v_sid_left  uuid;
      v_sid_right uuid;
    BEGIN
      INSERT INTO seats (id, desk_id, side, student_id)
      VALUES (gen_random_uuid(), v_desk_ids[i], 'left', NULL)
      RETURNING id INTO v_sid_left;

      INSERT INTO seats (id, desk_id, side, student_id)
      VALUES (gen_random_uuid(), v_desk_ids[i], 'right', NULL)
      RETURNING id INTO v_sid_right;

      v_seat_ids := array_append(v_seat_ids, v_sid_left);
      v_seat_ids := array_append(v_seat_ids, v_sid_right);
    END;
  END LOOP;

  -- ===========================
  -- INSERT 40 STUDENTS
  -- ===========================
  v_student_ids := ARRAY[]::uuid[];
  FOR i IN 1..40 LOOP
    DECLARE v_stid uuid;
    BEGIN
      INSERT INTO students (id, class_id, student_code, full_name, gender, status)
      VALUES (gen_random_uuid(), v_class_id, student_codes[i], student_names[i], student_genders[i], 'active')
      RETURNING id INTO v_stid;
      v_student_ids := array_append(v_student_ids, v_stid);
    END;
  END LOOP;

  -- ===========================
  -- ASSIGN STUDENTS TO SEATS (40 of 50 seats)
  -- ===========================
  FOR i IN 1..40 LOOP
    UPDATE seats SET student_id = v_student_ids[i] WHERE id = v_seat_ids[i];
  END LOOP;

  -- ===========================
  -- INSERT ATTENDANCE HISTORY (last 30 school days)
  -- ===========================
  FOR day_offset IN 0..29 LOOP
    v_date := CURRENT_DATE - (day_offset || ' days')::interval;
    
    -- Skip weekends
    IF EXTRACT(DOW FROM v_date) IN (0, 6) THEN
      CONTINUE;
    END IF;
    
    FOR i IN 1..40 LOOP
      -- 85% present, 8% late, 5% absent, 2% excused
      DECLARE
        v_rand float := random();
      BEGIN
        IF v_rand < 0.85 THEN
          v_attendance_status := 'present';
        ELSIF v_rand < 0.93 THEN
          v_attendance_status := 'late';
        ELSIF v_rand < 0.98 THEN
          v_attendance_status := 'absent';
        ELSE
          v_attendance_status := 'excused';
        END IF;
        
        INSERT INTO attendance (student_id, date, status)
        VALUES (v_student_ids[i], v_date, v_attendance_status)
        ON CONFLICT (student_id, date) DO NOTHING;
      END;
    END LOOP;
  END LOOP;

  -- ===========================
  -- INSERT SAMPLE ANNOUNCEMENTS
  -- ===========================
  INSERT INTO announcements (class_id, title, content, is_pinned, created_at) VALUES
  (v_class_id, 'Kiểm tra Toán chương 2', 'Các em chuẩn bị kiểm tra 45 phút môn Toán chương 2 vào thứ Sáu tuần này. Ôn tập từ bài 5 đến bài 12.', true, now() - interval '1 day'),
  (v_class_id, 'Họp phụ huynh học kỳ I', 'Cuộc họp phụ huynh học kỳ I sẽ diễn ra vào 18:00, thứ Bảy ngày 27/09/2026 tại phòng A101.', true, now() - interval '3 days'),
  (v_class_id, 'Nộp học phí tháng 9', 'Nhắc nhở các em nộp học phí tháng 9 trước ngày 25/09/2026. Liên hệ phòng kế toán để được hỗ trợ.', false, now() - interval '5 days'),
  (v_class_id, 'Lịch thi học kỳ I', 'Lịch thi học kỳ I dự kiến từ ngày 15/12 đến 22/12/2026. Chi tiết lịch thi sẽ được thông báo thêm.', false, now() - interval '10 days');

  -- ===========================
  -- INSERT SAMPLE STUDENT NOTES
  -- ===========================
  INSERT INTO student_notes (student_id, content, created_at) VALUES
  (v_student_ids[1], 'Tham gia tích cực trong các buổi thảo luận nhóm. Cần cải thiện bài làm viết.', now() - interval '2 days'),
  (v_student_ids[1], 'Kết quả kiểm tra giữa kỳ đạt 8.5/10. Tiến bộ rõ rệt so với đầu năm.', now() - interval '15 days'),
  (v_student_ids[2], 'Học sinh xuất sắc, luôn hoàn thành bài tập đúng hạn. Cần chú ý hơn môn Lý.', now() - interval '7 days'),
  (v_student_ids[3], 'Hay nói chuyện trong giờ học. Đã nhắc nhở, cần theo dõi thêm.', now() - interval '3 days'),
  (v_student_ids[5], 'Vắng học không phép 2 buổi liên tiếp. Đã liên hệ phụ huynh.', now() - interval '1 day');

  RAISE NOTICE 'Seed data inserted successfully for class 9A1 with 40 students, 25 desks, 50 seats.';
END;
$$;
