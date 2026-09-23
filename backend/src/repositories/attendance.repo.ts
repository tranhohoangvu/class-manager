import { query, getClient } from '../config/database.js';
import { AttendanceRow, AttendanceStatus } from '../types/index.js';

export const AttendanceRepo = {
  async getDaily(classId: string, date: string, subjectId?: string | null): Promise<Array<{
    student_id: string;
    student_code: string;
    full_name: string;
    status: AttendanceStatus | null;
    note: string | null;
    attendance_id: string | null;
  }>> {
    let sql = `
      SELECT s.id as student_id, s.student_code, s.full_name,
             a.id as attendance_id, a.status, a.note
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $2
    `;
    const params: any[] = [classId, date];

    if (subjectId) {
      sql += ' AND a.subject_id = $3';
      params.push(subjectId);
    } else {
      sql += ' AND a.subject_id IS NULL';
    }

    sql += " WHERE s.class_id = $1 AND s.status = 'active' ORDER BY s.student_code ASC";

    const res = await query(sql, params);
    return res.rows;
  },

  async saveBatch(
    classId: string,
    date: string,
    subjectId: string | null,
    teacherId: string | null,
    entries: Array<{ student_id: string; status: AttendanceStatus; note?: string | null }>
  ): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      for (const entry of entries) {
        if (subjectId) {
          await client.query(
            `INSERT INTO attendance (id, student_id, class_id, teacher_id, subject_id, date, status, note)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (student_id, date, subject_id) DO UPDATE SET
               status = EXCLUDED.status,
               note = EXCLUDED.note,
               teacher_id = EXCLUDED.teacher_id,
               updated_at = now()`,
            [
              entry.student_id,
              classId,
              teacherId,
              subjectId,
              date,
              entry.status,
              entry.note?.trim() || null,
            ]
          );
        } else {
          // General daily attendance
          await client.query(
            `INSERT INTO attendance (id, student_id, class_id, teacher_id, subject_id, date, status, note)
             VALUES (gen_random_uuid()::text, $1, $2, $3, NULL, $4, $5, $6)
             ON CONFLICT (student_id, date, subject_id) DO UPDATE SET
               status = EXCLUDED.status,
               note = EXCLUDED.note,
               teacher_id = EXCLUDED.teacher_id,
               updated_at = now()`,
            [
              entry.student_id,
              classId,
              teacherId,
              date,
              entry.status,
              entry.note?.trim() || null,
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getHistory(classId: string, startDate?: string, endDate?: string): Promise<AttendanceRow[]> {
    let sql = 'SELECT id, student_id, class_id, teacher_id, subject_id, date, status, note, created_at, updated_at FROM attendance WHERE class_id = $1';
    const params: any[] = [classId];
    let idx = 2;

    if (startDate) {
      sql += ` AND date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND date <= $${idx++}`;
      params.push(endDate);
    }

    sql += ' ORDER BY date DESC, student_id ASC';

    const res = await query<AttendanceRow>(sql, params);
    return res.rows;
  },

  async getAttendanceRecords(classId: string): Promise<AttendanceRow[]> {
    const res = await query<AttendanceRow>(
      'SELECT id, student_id, class_id, teacher_id, subject_id, date, status, note, created_at, updated_at FROM attendance WHERE class_id = $1 ORDER BY date DESC',
      [classId]
    );
    return res.rows;
  },
};
