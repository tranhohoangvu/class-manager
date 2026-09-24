import { query, getClient } from '../config/database.js';
import { TimetableEntryRow } from '../types/index.js';

export interface TimetableEntryDetail extends TimetableEntryRow {
  class_name: string;
  grade: number;
  class_room_name: string | null;
  effective_room: string | null;
  subject_code: string;
  subject_name: string;
  max_consecutive_periods: number;
  teacher_name: string | null;
}

export const TimetableRepo = {
  async getByClassId(classId: string): Promise<TimetableEntryRow[]> {
    const res = await query<TimetableEntryRow>(
      'SELECT id, class_id, day_of_week, period, subject_id, teacher_id, room, created_at, updated_at FROM timetable_entries WHERE class_id = $1 ORDER BY day_of_week ASC, period ASC',
      [classId]
    );
    return res.rows;
  },

  async getById(id: string): Promise<TimetableEntryRow | null> {
    const res = await query<TimetableEntryRow>(
      'SELECT id, class_id, day_of_week, period, subject_id, teacher_id, room, created_at, updated_at FROM timetable_entries WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async getAll(filter?: {
    classId?: string;
    teacherId?: string;
    subjectId?: string;
    room?: string;
    dayOfWeek?: number;
  }): Promise<TimetableEntryDetail[]> {
    let sql = `
      SELECT
        te.id,
        te.class_id,
        te.day_of_week,
        te.period,
        te.subject_id,
        te.teacher_id,
        te.room,
        te.created_at,
        te.updated_at,
        c.name AS class_name,
        c.grade,
        c.room_name AS class_room_name,
        COALESCE(te.room, c.room_name) AS effective_room,
        s.code AS subject_code,
        s.name AS subject_name,
        s.max_consecutive_periods,
        u.name AS teacher_name
      FROM timetable_entries te
      JOIN classes c ON te.class_id = c.id
      JOIN subjects s ON te.subject_id = s.id
      LEFT JOIN users u ON te.teacher_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.classId) {
      params.push(filter.classId);
      sql += ` AND te.class_id = $${params.length}`;
    }
    if (filter?.teacherId) {
      params.push(filter.teacherId);
      sql += ` AND te.teacher_id = $${params.length}`;
    }
    if (filter?.subjectId) {
      params.push(filter.subjectId);
      sql += ` AND te.subject_id = $${params.length}`;
    }
    if (filter?.dayOfWeek) {
      params.push(filter.dayOfWeek);
      sql += ` AND te.day_of_week = $${params.length}`;
    }
    if (filter?.room) {
      params.push(`%${filter.room.trim()}%`);
      sql += ` AND COALESCE(te.room, c.room_name) ILIKE $${params.length}`;
    }

    sql += ' ORDER BY te.day_of_week ASC, te.period ASC, c.name ASC';

    const res = await query<TimetableEntryDetail>(sql, params);
    return res.rows;
  },

  async findTeacherConflict(
    teacherId: string,
    dayOfWeek: number,
    period: number,
    excludeClassId?: string,
    excludeEntryId?: string
  ): Promise<{ class_name: string } | null> {
    let sql = `
      SELECT c.name as class_name
      FROM timetable_entries te
      JOIN classes c ON te.class_id = c.id
      WHERE te.teacher_id = $1 AND te.day_of_week = $2 AND te.period = $3
    `;
    const params: any[] = [teacherId, dayOfWeek, period];

    if (excludeClassId) {
      params.push(excludeClassId);
      sql += ` AND te.class_id != $${params.length}`;
    }
    if (excludeEntryId) {
      params.push(excludeEntryId);
      sql += ` AND te.id != $${params.length}`;
    }

    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async findRoomConflict(
    effectiveRoom: string,
    dayOfWeek: number,
    period: number,
    excludeClassId?: string,
    excludeEntryId?: string
  ): Promise<{ class_name: string; room_name: string } | null> {
    if (!effectiveRoom || !effectiveRoom.trim()) return null;

    let sql = `
      SELECT c.name as class_name, COALESCE(te.room, c.room_name) as room_name
      FROM timetable_entries te
      JOIN classes c ON te.class_id = c.id
      WHERE te.day_of_week = $1
        AND te.period = $2
        AND LOWER(TRIM(COALESCE(te.room, c.room_name))) = LOWER(TRIM($3))
    `;
    const params: any[] = [dayOfWeek, period, effectiveRoom.trim()];

    if (excludeClassId) {
      params.push(excludeClassId);
      sql += ` AND te.class_id != $${params.length}`;
    }
    if (excludeEntryId) {
      params.push(excludeEntryId);
      sql += ` AND te.id != $${params.length}`;
    }

    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async saveEntry(data: {
    class_id: string;
    day_of_week: number;
    period: number;
    subject_id: string;
    teacher_id?: string | null;
    room?: string | null;
  }): Promise<TimetableEntryRow> {
    const res = await query<TimetableEntryRow>(
      `INSERT INTO timetable_entries (id, class_id, day_of_week, period, subject_id, teacher_id, room)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)
       ON CONFLICT (class_id, day_of_week, period) DO UPDATE SET
         subject_id = EXCLUDED.subject_id,
         teacher_id = EXCLUDED.teacher_id,
         room = EXCLUDED.room,
         updated_at = now()
       RETURNING id, class_id, day_of_week, period, subject_id, teacher_id, room, created_at, updated_at`,
      [
        data.class_id,
        data.day_of_week,
        data.period,
        data.subject_id,
        data.teacher_id || null,
        data.room || null,
      ]
    );
    return res.rows[0];
  },

  async deleteEntry(id: string): Promise<boolean> {
    const res = await query('DELETE FROM timetable_entries WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async clearTimetable(classId: string): Promise<void> {
    await query('DELETE FROM timetable_entries WHERE class_id = $1', [classId]);
  },

  async copyFromClass(sourceClassId: string, targetClassId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const sourceEntries = await client.query<TimetableEntryRow>(
        'SELECT day_of_week, period, subject_id, teacher_id, room FROM timetable_entries WHERE class_id = $1',
        [sourceClassId]
      );

      // Get target class homeroom teacher to remap SHL (Sinh hoạt lớp)
      const targetClassRes = await client.query('SELECT teacher_id FROM classes WHERE id = $1', [targetClassId]);
      const targetHomeroomTeacherId = targetClassRes.rows[0]?.teacher_id || null;

      // Clear target class timetable
      await client.query('DELETE FROM timetable_entries WHERE class_id = $1', [targetClassId]);

      // Copy entries
      for (const e of sourceEntries.rows) {
        let assignedTeacher = e.teacher_id;
        // If subject is SHL, assign target class homeroom teacher
        if (e.subject_id === 'sub-shl' || e.subject_id === 'SHL') {
          assignedTeacher = targetHomeroomTeacherId;
        }

        await client.query(
          `INSERT INTO timetable_entries (id, class_id, day_of_week, period, subject_id, teacher_id, room)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)`,
          [targetClassId, e.day_of_week, e.period, e.subject_id, assignedTeacher, e.room || null]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
