import { query } from '../config/database.js';
import { SubjectRow, SubjectAssignmentRow } from '../types/index.js';

export const SubjectRepo = {
  async getAll(): Promise<SubjectRow[]> {
    const res = await query<SubjectRow>('SELECT id, code, name, created_at FROM subjects ORDER BY code ASC');
    return res.rows;
  },

  async getById(id: string): Promise<SubjectRow | null> {
    const res = await query<SubjectRow>('SELECT id, code, name, created_at FROM subjects WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async getAssignmentsForClass(classId: string): Promise<SubjectAssignmentRow[]> {
    const res = await query<SubjectAssignmentRow>(
      'SELECT id, teacher_id, class_id, subject_id, created_at FROM subject_assignments WHERE class_id = $1',
      [classId]
    );
    return res.rows;
  },

  async getAssignmentsForTeacher(teacherId: string): Promise<SubjectAssignmentRow[]> {
    const res = await query<SubjectAssignmentRow>(
      'SELECT id, teacher_id, class_id, subject_id, created_at FROM subject_assignments WHERE teacher_id = $1',
      [teacherId]
    );
    return res.rows;
  },
};
