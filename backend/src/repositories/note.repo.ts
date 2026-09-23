import { query } from '../config/database.js';
import { StudentNoteRow } from '../types/index.js';

export const NoteRepo = {
  async getByStudentId(studentId: string): Promise<StudentNoteRow[]> {
    const res = await query<StudentNoteRow>(
      'SELECT id, student_id, class_id, content, created_at, updated_at FROM student_notes WHERE student_id = $1 ORDER BY created_at DESC',
      [studentId]
    );
    return res.rows;
  },

  async create(data: { student_id: string; class_id?: string | null; content: string }): Promise<StudentNoteRow> {
    const res = await query<StudentNoteRow>(
      `INSERT INTO student_notes (id, student_id, class_id, content)
       VALUES (gen_random_uuid()::text, $1, $2, $3)
       RETURNING id, student_id, class_id, content, created_at, updated_at`,
      [data.student_id, data.class_id || null, data.content.trim()]
    );
    return res.rows[0];
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM student_notes WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
