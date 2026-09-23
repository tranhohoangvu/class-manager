import { query } from '../config/database.js';
import { AnnouncementRow } from '../types/index.js';

export const AnnouncementRepo = {
  async getByClassId(classId: string): Promise<AnnouncementRow[]> {
    const res = await query<AnnouncementRow>(
      'SELECT id, class_id, title, content, is_pinned, created_at, updated_at FROM announcements WHERE class_id = $1 ORDER BY is_pinned DESC, created_at DESC',
      [classId]
    );
    return res.rows;
  },

  async create(data: { class_id: string; title: string; content?: string | null; is_pinned?: boolean }): Promise<AnnouncementRow> {
    const res = await query<AnnouncementRow>(
      `INSERT INTO announcements (id, class_id, title, content, is_pinned)
       VALUES (gen_random_uuid()::text, $1, $2, $3, COALESCE($4, false))
       RETURNING id, class_id, title, content, is_pinned, created_at, updated_at`,
      [data.class_id, data.title.trim(), data.content?.trim() || null, data.is_pinned ?? false]
    );
    return res.rows[0];
  },

  async togglePin(id: string): Promise<AnnouncementRow | null> {
    const res = await query<AnnouncementRow>(
      `UPDATE announcements
       SET is_pinned = NOT is_pinned
       WHERE id = $1
       RETURNING id, class_id, title, content, is_pinned, created_at, updated_at`,
      [id]
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM announcements WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
