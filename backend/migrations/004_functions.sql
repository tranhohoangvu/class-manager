-- =============================================
-- Migration 004: Functions
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enforce max 40 active students per class
CREATE OR REPLACE FUNCTION check_max_students()
RETURNS TRIGGER AS $$
DECLARE
  active_count integer;
  max_allowed  integer;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
    SELECT COUNT(*) INTO active_count
    FROM students
    WHERE class_id = NEW.class_id AND status = 'active' AND id != COALESCE(NEW.id, '');

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
