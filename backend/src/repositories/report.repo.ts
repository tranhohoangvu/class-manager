import { query } from '../config/database.js';

export const ReportRepo = {
  async getSchoolSummary(dateStr?: string): Promise<{
    total_students: number;
    total_classes: number;
    total_teachers: number;
    present_today: number;
    absent_today: number;
    late_today: number;
    attendance_rate: string;
  }> {
    const today = dateStr || new Date().toISOString().split('T')[0];

    const countStudents = await query("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    const countClasses = await query("SELECT COUNT(*) as count FROM classes WHERE status = 'active'");
    const countTeachers = await query("SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER' AND status = 'active'");

    const attRes = await query<{ status: string; count: string }>(
      'SELECT status, COUNT(*) as count FROM attendance WHERE date = $1 GROUP BY status',
      [today]
    );

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const r of attRes.rows) {
      const c = parseInt(r.count, 10);
      if (r.status === 'present') present += c;
      if (r.status === 'absent') absent += c;
      if (r.status === 'late') late += c;
      if (r.status === 'excused') excused += c;
    }

    const totalMarked = present + absent + late + excused;
    const rate = totalMarked > 0 ? ((present / totalMarked) * 100).toFixed(1) + '%' : '100.0%';

    return {
      total_students: parseInt(countStudents.rows[0]?.count || '0', 10),
      total_classes: parseInt(countClasses.rows[0]?.count || '0', 10),
      total_teachers: parseInt(countTeachers.rows[0]?.count || '0', 10),
      present_today: present,
      absent_today: absent,
      late_today: late,
      attendance_rate: rate,
    };
  },

  async getGradeBreakdown(dateStr?: string): Promise<Array<{
    grade: number;
    class_count: number;
    student_count: number;
    present: number;
    absent: number;
    late: number;
    rate: string;
  }>> {
    const today = dateStr || new Date().toISOString().split('T')[0];

    const sql = `
      SELECT c.grade,
             COUNT(DISTINCT c.id) as class_count,
             COUNT(DISTINCT s.id) as student_count,
             COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
             COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
             COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late,
             COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1
      WHERE c.status = 'active'
      GROUP BY c.grade
      ORDER BY c.grade ASC
    `;

    const res = await query(sql, [today]);
    return res.rows.map((r: any) => {
      const p = parseInt(r.present, 10);
      const ab = parseInt(r.absent, 10);
      const l = parseInt(r.late, 10);
      const ex = parseInt(r.excused, 10);
      const total = p + ab + l + ex;
      const rate = total > 0 ? ((p / total) * 100).toFixed(1) + '%' : '100.0%';

      return {
        grade: parseInt(r.grade, 10),
        class_count: parseInt(r.class_count, 10),
        student_count: parseInt(r.student_count, 10),
        present: p,
        absent: ab,
        late: l,
        rate,
      };
    });
  },
};
