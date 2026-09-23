import { query, getClient } from '../config/database.js';
import { TimetableEntryRow } from '../types/index.js';

export const TimetableRepo = {
  async getByClassId(classId: string): Promise<TimetableEntryRow[]> {
    const res = await query<TimetableEntryRow>(
      'SELECT id, class_id, day_of_week, period, subject_id, teacher_id, created_at, updated_at FROM timetable_entries WHERE class_id = $1 ORDER BY day_of_week ASC, period ASC',
      [classId]
    );
    return res.rows;
  },

  async findTeacherConflict(
    teacherId: string,
    dayOfWeek: number,
    period: number,
    excludeClassId?: string
  ): Promise<{ class_name: string } | null> {
    let sql = `
      SELECT c.name as class_name
      FROM timetable_entries te
      JOIN classes c ON te.class_id = c.id
      WHERE te.teacher_id = $1 AND te.day_of_week = $2 AND te.period = $3
    `;
    const params: any[] = [teacherId, dayOfWeek, period];

    if (excludeClassId) {
      sql += ' AND te.class_id != $4';
      params.push(excludeClassId);
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
  }): Promise<TimetableEntryRow> {
    const res = await query<TimetableEntryRow>(
      `INSERT INTO timetable_entries (id, class_id, day_of_week, period, subject_id, teacher_id)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
       ON CONFLICT (class_id, day_of_week, period) DO UPDATE SET
         subject_id = EXCLUDED.subject_id,
         teacher_id = EXCLUDED.teacher_id,
         updated_at = now()
       RETURNING id, class_id, day_of_week, period, subject_id, teacher_id, created_at, updated_at`,
      [
        data.class_id,
        data.day_of_week,
        data.period,
        data.subject_id,
        data.teacher_id || null,
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
        'SELECT day_of_week, period, subject_id, teacher_id FROM timetable_entries WHERE class_id = $1',
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
          `INSERT INTO timetable_entries (id, class_id, day_of_week, period, subject_id, teacher_id)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
          [targetClassId, e.day_of_week, e.period, e.subject_id, assignedTeacher]
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
