import { query, getClient } from '../config/database.js';
import { ClassRow } from '../types/index.js';

export const ClassRepo = {
  async getAll(): Promise<ClassRow[]> {
    const res = await query<ClassRow>(
      'SELECT id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at FROM classes ORDER BY grade ASC, name ASC'
    );
    return res.rows;
  },

  async getById(id: string): Promise<ClassRow | null> {
    const res = await query<ClassRow>(
      'SELECT id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at FROM classes WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async getAssignedClassesForTeacher(teacherId: string): Promise<ClassRow[]> {
    const sql = `
      SELECT DISTINCT c.id, c.teacher_id, c.name, c.grade, c.room_name, c.school_year, c.max_students, c.desk_count, c.status, c.created_at, c.updated_at
      FROM classes c
      LEFT JOIN class_memberships cm ON c.id = cm.class_id AND cm.teacher_id = $1
      LEFT JOIN subject_assignments sa ON c.id = sa.class_id AND sa.teacher_id = $1
      WHERE c.status = 'active' AND (c.teacher_id = $1 OR cm.teacher_id = $1 OR sa.teacher_id = $1)
      ORDER BY c.grade ASC, c.name ASC
    `;
    const res = await query<ClassRow>(sql, [teacherId]);
    return res.rows;
  },

  async create(data: {
    id?: string;
    name: string;
    grade: number;
    room_name?: string | null;
    school_year?: string;
    teacher_id?: string | null;
    max_students?: number;
    desk_count?: number;
  }): Promise<ClassRow> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const classId = data.id || `c-${data.grade}a-${Date.now().toString().slice(-4)}`;
      const res = await client.query<ClassRow>(
        `INSERT INTO classes (id, name, grade, room_name, school_year, teacher_id, max_students, desk_count, status)
         VALUES ($1, $2, $3, $4, COALESCE($5, '2026 - 2027'), $6, COALESCE($7, 40), COALESCE($8, 20), 'active')
         RETURNING id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at`,
        [
          classId,
          data.name.trim(),
          data.grade,
          data.room_name?.trim() || null,
          data.school_year || '2026 - 2027',
          data.teacher_id || null,
          data.max_students || 40,
          data.desk_count || 20,
        ]
      );
      const newClass = res.rows[0];

      // Auto-create 20 standard desks (4 columns x 5 rows) and 40 seats
      for (let r = 1; r <= 5; r++) {
        for (let c = 1; c <= 4; c++) {
          const dNum = (r - 1) * 4 + c;
          const deskId = `${classId}-desk-${dNum}`;
          await client.query(
            `INSERT INTO desks (id, class_id, desk_number, row_num, col_num)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (class_id, desk_number) DO NOTHING`,
            [deskId, classId, dNum, r, c]
          );

          await client.query(
            `INSERT INTO seats (id, desk_id, side, student_id)
             VALUES ($1, $2, 'left', NULL), ($3, $2, 'right', NULL)
             ON CONFLICT (desk_id, side) DO NOTHING`,
            [`${deskId}-left`, deskId, `${deskId}-right`]
          );
        }
      }

      // If homeroom teacher provided, add to class_memberships
      if (data.teacher_id) {
        await client.query(
          `INSERT INTO class_memberships (id, teacher_id, class_id, role)
           VALUES ($1, $2, $3, 'HOMEROOM_TEACHER')
           ON CONFLICT (teacher_id, class_id, role) DO NOTHING`,
          [`cm-${classId}-${data.teacher_id}`, data.teacher_id, classId]
        );
      }

      await client.query('COMMIT');
      return newClass;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id: string, updates: Partial<{ name: string; room_name: string | null; school_year: string; max_students: number }>): Promise<ClassRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name.trim());
    }
    if (updates.room_name !== undefined) {
      fields.push(`room_name = $${idx++}`);
      values.push(updates.room_name?.trim() || null);
    }
    if (updates.school_year !== undefined) {
      fields.push(`school_year = $${idx++}`);
      values.push(updates.school_year.trim());
    }
    if (updates.max_students !== undefined) {
      fields.push(`max_students = $${idx++}`);
      values.push(updates.max_students);
    }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    const res = await query<ClassRow>(
      `UPDATE classes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at`,
      values
    );
    return res.rows[0] || null;
  },

  async archive(id: string): Promise<ClassRow | null> {
    const res = await query<ClassRow>(
      "UPDATE classes SET status = 'archived' WHERE id = $1 RETURNING id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at",
      [id]
    );
    return res.rows[0] || null;
  },
};
