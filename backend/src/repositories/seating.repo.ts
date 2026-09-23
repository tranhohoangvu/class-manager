import { query, getClient } from '../config/database.js';
import { DeskWithSeats, SeatWithStudent, StudentRow } from '../types/index.js';

export const SeatingRepo = {
  async getDesksWithSeats(classId: string): Promise<DeskWithSeats[]> {
    const desksRes = await query<{
      id: string;
      class_id: string;
      desk_number: number;
      row_num: number;
      col_num: number;
      created_at: string;
    }>(
      'SELECT id, class_id, desk_number, row_num, col_num, created_at FROM desks WHERE class_id = $1 ORDER BY desk_number ASC',
      [classId]
    );

    const seatsRes = await query<{
      id: string;
      desk_id: string;
      side: 'left' | 'right';
      student_id: string | null;
      stu_id: string | null;
      class_id: string | null;
      student_code: string | null;
      full_name: string | null;
      gender: 'male' | 'female' | null;
      date_of_birth: string | null;
      phone: string | null;
      email: string | null;
      avatar_url: string | null;
      status: 'active' | 'inactive' | null;
      created_at: string | null;
      updated_at: string | null;
    }>(
      `SELECT s.id, s.desk_id, s.side, s.student_id,
              st.id as stu_id, st.class_id, st.student_code, st.full_name,
              st.gender, st.date_of_birth, st.phone, st.email,
              st.avatar_url, st.status, st.created_at, st.updated_at
       FROM seats s
       JOIN desks d ON s.desk_id = d.id
       LEFT JOIN students st ON s.student_id = st.id
       WHERE d.class_id = $1
       ORDER BY s.desk_id ASC, s.side ASC`,
      [classId]
    );

    const deskMap = new Map<string, DeskWithSeats>();
    for (const d of desksRes.rows) {
      deskMap.set(d.id, {
        ...d,
        seats: [],
      });
    }

    for (const s of seatsRes.rows) {
      const desk = deskMap.get(s.desk_id);
      if (desk) {
        const student: StudentRow | null = s.stu_id
          ? {
              id: s.stu_id,
              class_id: s.class_id!,
              student_code: s.student_code!,
              full_name: s.full_name!,
              gender: s.gender,
              date_of_birth: s.date_of_birth,
              phone: s.phone,
              email: s.email,
              avatar_url: s.avatar_url,
              status: s.status!,
              created_at: s.created_at!,
              updated_at: s.updated_at!,
            }
          : null;

        desk.seats.push({
          id: s.id,
          desk_id: s.desk_id,
          side: s.side,
          student_id: s.student_id,
          student,
        });
      }
    }

    return Array.from(deskMap.values());
  },

  async assignSeat(seatId: string, studentId: string | null): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      if (studentId) {
        // Clear any previous seat occupied by this student
        await client.query('UPDATE seats SET student_id = NULL WHERE student_id = $1', [studentId]);
      }

      await client.query('UPDATE seats SET student_id = $1 WHERE id = $2', [studentId, seatId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async swapSeats(seatId1: string, seatId2: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const s1 = await client.query('SELECT student_id FROM seats WHERE id = $1 FOR UPDATE', [seatId1]);
      const s2 = await client.query('SELECT student_id FROM seats WHERE id = $2 FOR UPDATE', [seatId2]);

      if (s1.rows.length === 0 || s2.rows.length === 0) {
        throw new Error('Chỗ ngồi không tồn tại.');
      }

      const stu1 = s1.rows[0].student_id;
      const stu2 = s2.rows[0].student_id;

      // Temporarily set s1 to NULL to avoid unique constraint conflict
      await client.query('UPDATE seats SET student_id = NULL WHERE id = $1', [seatId1]);
      await client.query('UPDATE seats SET student_id = $1 WHERE id = $2', [stu1, seatId2]);
      await client.query('UPDATE seats SET student_id = $1 WHERE id = $2', [stu2, seatId1]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async clearAllSeats(classId: string): Promise<void> {
    await query(
      `UPDATE seats
       SET student_id = NULL
       WHERE desk_id IN (SELECT id FROM desks WHERE class_id = $1)`,
      [classId]
    );
  },

  async randomizeSeating(classId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Fetch active students
      const stuRes = await client.query<{ id: string }>(
        "SELECT id FROM students WHERE class_id = $1 AND status = 'active' ORDER BY student_code ASC",
        [classId]
      );
      const studentIds = stuRes.rows.map((r) => r.id);

      // 2. Fetch all seats for this class
      const seatsRes = await client.query<{ id: string }>(
        `SELECT s.id FROM seats s
         JOIN desks d ON s.desk_id = d.id
         WHERE d.class_id = $1
         ORDER BY d.desk_number ASC, s.side ASC`,
        [classId]
      );
      const seatIds = seatsRes.rows.map((r) => r.id);

      // 3. Clear all seats first
      await client.query(
        `UPDATE seats SET student_id = NULL WHERE desk_id IN (SELECT id FROM desks WHERE class_id = $1)`,
        [classId]
      );

      // 4. Fisher-Yates uniform shuffle
      for (let i = studentIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [studentIds[i], studentIds[j]] = [studentIds[j], studentIds[i]];
      }

      // 5. Assign shuffled students to seats
      for (let i = 0; i < studentIds.length && i < seatIds.length; i++) {
        await client.query('UPDATE seats SET student_id = $1 WHERE id = $2', [studentIds[i], seatIds[i]]);
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
