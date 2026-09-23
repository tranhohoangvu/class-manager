import { query, getClient } from '../config/database.js';
import { UserRow, ClassRow } from '../types/index.js';

export const TeacherRepo = {
  async getAllWithDetails(): Promise<Array<UserRow & {
    assigned_classes: ClassRow[];
    homeroom_classes: ClassRow[];
    subject_assignments: Array<{ class_id: string; class_name: string; subject_id: string; subject_name: string }>;
    grades: number[];
  }>> {
    const teachersRes = await query<UserRow>(
      "SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM users WHERE role = 'TEACHER' ORDER BY name ASC"
    );
    const teachers = teachersRes.rows;

    const result = [];
    for (const t of teachers) {
      // Find homeroom classes
      const hrRes = await query<ClassRow>(
        'SELECT id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at FROM classes WHERE teacher_id = $1',
        [t.id]
      );

      // Find subject assignments
      const saRes = await query<{ class_id: string; class_name: string; subject_id: string; subject_name: string; grade: number }>(
        `SELECT sa.class_id, c.name as class_name, sa.subject_id, s.name as subject_name, c.grade
         FROM subject_assignments sa
         JOIN classes c ON sa.class_id = c.id
         JOIN subjects s ON sa.subject_id = s.id
         WHERE sa.teacher_id = $1`,
        [t.id]
      );

      // Find all distinct classes (homeroom or subject)
      const classMap = new Map<string, ClassRow>();
      for (const c of hrRes.rows) {
        classMap.set(c.id, c);
      }
      for (const sa of saRes.rows) {
        if (!classMap.has(sa.class_id)) {
          const cRes = await query<ClassRow>(
            'SELECT id, teacher_id, name, grade, room_name, school_year, max_students, desk_count, status, created_at, updated_at FROM classes WHERE id = $1',
            [sa.class_id]
          );
          if (cRes.rows[0]) classMap.set(sa.class_id, cRes.rows[0]);
        }
      }

      // Collect distinct grades
      const gradeSet = new Set<number>();
      for (const c of classMap.values()) {
        gradeSet.add(c.grade);
      }

      result.push({
        ...t,
        assigned_classes: Array.from(classMap.values()),
        homeroom_classes: hrRes.rows,
        subject_assignments: saRes.rows,
        grades: Array.from(gradeSet).sort(),
      });
    }

    return result;
  },

  async assignHomeroom(classId: string, teacherId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update class
      await client.query('UPDATE classes SET teacher_id = $1 WHERE id = $2', [teacherId, classId]);

      // Remove existing homeroom role for this class if any
      await client.query("DELETE FROM class_memberships WHERE class_id = $1 AND role = 'HOMEROOM_TEACHER'", [classId]);

      // Insert new membership
      await client.query(
        `INSERT INTO class_memberships (id, teacher_id, class_id, role)
         VALUES (gen_random_uuid()::text, $1, $2, 'HOMEROOM_TEACHER')
         ON CONFLICT (teacher_id, class_id, role) DO NOTHING`,
        [teacherId, classId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async assignSubject(teacherId: string, classId: string, subjectId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Check pedagogical rule: max 2 grades per teacher
      const classRes = await client.query('SELECT grade FROM classes WHERE id = $1', [classId]);
      if (classRes.rows.length === 0) {
        throw new Error('Không tìm thấy lớp học.');
      }
      const targetGrade = classRes.rows[0].grade;

      // Existing grades taught by teacher
      const gradesRes = await client.query<{ grade: number }>(
        `SELECT DISTINCT c.grade
         FROM classes c
         LEFT JOIN subject_assignments sa ON c.id = sa.class_id AND sa.teacher_id = $1
         WHERE c.teacher_id = $1 OR sa.teacher_id = $1`,
        [teacherId]
      );
      const existingGrades = new Set(gradesRes.rows.map((r) => r.grade));
      existingGrades.add(targetGrade);

      if (existingGrades.size > 2) {
        throw new Error('Theo quy chuẩn sư phạm THCS, mỗi giáo viên chỉ được phân công giảng dạy tối đa 2 khối.');
      }

      // Insert assignment
      await client.query(
        `INSERT INTO subject_assignments (id, teacher_id, class_id, subject_id)
         VALUES (gen_random_uuid()::text, $1, $2, $3)
         ON CONFLICT (teacher_id, class_id, subject_id) DO NOTHING`,
        [teacherId, classId, subjectId]
      );

      // Ensure membership exists
      await client.query(
        `INSERT INTO class_memberships (id, teacher_id, class_id, role)
         VALUES (gen_random_uuid()::text, $1, $2, 'SUBJECT_TEACHER')
         ON CONFLICT (teacher_id, class_id, role) DO NOTHING`,
        [teacherId, classId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async removeSubjectAssignment(assignmentId: string): Promise<boolean> {
    const res = await query('DELETE FROM subject_assignments WHERE id = $1', [assignmentId]);
    return (res.rowCount ?? 0) > 0;
  },
};
