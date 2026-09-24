-- =============================================
-- Migration 007: Timetable Scheduling Rules & Room Support
-- =============================================

-- 1. Subject-specific configurable max consecutive periods
-- Default is 1 for THCS subjects; Mathematics & Literature are 2. Global max is 2.
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS max_consecutive_periods INTEGER NOT NULL DEFAULT 1 CHECK (max_consecutive_periods BETWEEN 1 AND 2);

-- Set 2 consecutive periods for Mathematics and Literature, and 1 for other subjects
UPDATE subjects SET max_consecutive_periods = 2 WHERE code IN ('MAT', 'LIT');
UPDATE subjects SET max_consecutive_periods = 1 WHERE code NOT IN ('MAT', 'LIT');

-- 2. Room assignment on timetable entries
-- Nullable: if not explicitly specified, falls back to classes.room_name
ALTER TABLE timetable_entries
  ADD COLUMN IF NOT EXISTS room VARCHAR(100);

-- 3. Indexes for fast conflict and audit queries
CREATE INDEX IF NOT EXISTS idx_timetable_day_period_teacher
  ON timetable_entries(day_of_week, period, teacher_id);

CREATE INDEX IF NOT EXISTS idx_timetable_day_period_room
  ON timetable_entries(day_of_week, period, room);
