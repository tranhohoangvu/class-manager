import { query, getClient } from '../config/database.js';
import { StudentRow } from '../types/index.js';

export const StudentRepo = {
  async getByClassId(classId: string): Promise<StudentRow[]> {
    const res = await query<StudentRow>(
      'SELECT id, class_id, student_code, full_name, gender, date_of_birth, phone, email, avatar_url, status, created_at, updated_at FROM students WHERE class_id = $1 ORDER BY student_code ASC',
      [classId]
    );
    return res.rows;
  },

  async getById(id: string): Promise<StudentRow | null> {
    const res = await query<StudentRow>(
      'SELECT id, class_id, student_code, full_name, gender, date_of_birth, phone, email, avatar_url, status, created_at, updated_at FROM students WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data: {
    class_id: string;
    student_code: string;
    full_name: string;
    gender?: 'male' | 'female' | null;
    date_of_birth?: string | null;
    phone?: string | null;
    email?: string | null;
  }): Promise<StudentRow> {
    const res = await query<StudentRow>(
      `INSERT INTO students (id, class_id, student_code, full_name, gender, date_of_birth, phone, email, status)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, class_id, student_code, full_name, gender, date_of_birth, phone, email, avatar_url, status, created_at, updated_at`,
      [
        data.class_id,
        data.student_code.trim().toUpperCase(),
        data.full_name.trim(),
        data.gender || null,
        data.date_of_birth || null,
        data.phone?.trim() || null,
        data.email?.trim() || null,
      ]
    );
    return res.rows[0];
  },

  async update(id: string, updates: Partial<{
    student_code: string;
    full_name: string;
    gender: 'male' | 'female' | null;
    date_of_birth: string | null;
    phone: string | null;
    email: string | null;
    status: 'active' | 'inactive';
  }>): Promise<StudentRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.student_code !== undefined) {
      fields.push(`student_code = $${idx++}`);
      values.push(updates.student_code.trim().toUpperCase());
    }
    if (updates.full_name !== undefined) {
      fields.push(`full_name = $${idx++}`);
      values.push(updates.full_name.trim());
    }
    if (updates.gender !== undefined) {
      fields.push(`gender = $${idx++}`);
      values.push(updates.gender);
    }
    if (updates.date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${idx++}`);
      values.push(updates.date_of_birth);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(updates.phone?.trim() || null);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(updates.email?.trim() || null);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    const res = await query<StudentRow>(
      `UPDATE students SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, class_id, student_code, full_name, gender, date_of_birth, phone, email, avatar_url, status, created_at, updated_at`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // Clear seat reference first
      await client.query('UPDATE seats SET student_id = NULL WHERE student_id = $1', [id]);
      const res = await client.query('DELETE FROM students WHERE id = $1', [id]);
      await client.query('COMMIT');
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async bulkImport(classId: string, students: Array<{
    student_code: string;
    full_name: string;
    gender?: 'male' | 'female' | null;
    date_of_birth?: string | null;
    phone?: string | null;
    email?: string | null;
  }>): Promise<StudentRow[]> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const inserted: StudentRow[] = [];

      for (const s of students) {
        const res = await client.query<StudentRow>(
          `INSERT INTO students (id, class_id, student_code, full_name, gender, date_of_birth, phone, email, status)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, 'active')
           ON CONFLICT (class_id, student_code) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             gender = EXCLUDED.gender,
             date_of_birth = EXCLUDED.date_of_birth,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email
           RETURNING id, class_id, student_code, full_name, gender, date_of_birth, phone, email, avatar_url, status, created_at, updated_at`,
          [
            classId,
            s.student_code.trim().toUpperCase(),
            s.full_name.trim(),
            s.gender || null,
            s.date_of_birth || null,
            s.phone?.trim() || null,
            s.email?.trim() || null,
          ]
        );
        inserted.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return inserted;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
