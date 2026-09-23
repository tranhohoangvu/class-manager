import { query } from '../config/database.js';
import { UserRow, UserRole, UserStatus } from '../types/index.js';

export const UserRepo = {
  async findByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> {
    const res = await query<UserRow & { password_hash: string }>(
      'SELECT id, name, email, phone, role, status, avatar_url, password_hash, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const res = await query<UserRow>(
      'SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async getAll(): Promise<UserRow[]> {
    const res = await query<UserRow>(
      'SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM users ORDER BY name ASC'
    );
    return res.rows;
  },

  async getAllTeachers(): Promise<UserRow[]> {
    const res = await query<UserRow>(
      "SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM users WHERE role = 'TEACHER' ORDER BY name ASC"
    );
    return res.rows;
  },

  async create(user: {
    id?: string;
    name: string;
    email: string;
    phone?: string | null;
    role?: UserRole;
    status?: UserStatus;
    password_hash: string;
    avatar_url?: string | null;
  }): Promise<UserRow> {
    const res = await query<UserRow>(
      `INSERT INTO users (id, name, email, phone, role, status, password_hash, avatar_url)
       VALUES (COALESCE($1, gen_random_uuid()::text), $2, $3, $4, COALESCE($5, 'TEACHER'), COALESCE($6, 'active'), $7, $8)
       RETURNING id, name, email, phone, role, status, avatar_url, created_at, updated_at`,
      [
        user.id || null,
        user.name,
        user.email.trim().toLowerCase(),
        user.phone || null,
        user.role || 'TEACHER',
        user.status || 'active',
        user.password_hash,
        user.avatar_url || null,
      ]
    );
    return res.rows[0];
  },

  async update(id: string, updates: Partial<{ name: string; phone: string | null; status: UserStatus; avatar_url: string | null }>): Promise<UserRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(updates.phone);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.avatar_url !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(updates.avatar_url);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const res = await query<UserRow>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role, status, avatar_url, created_at, updated_at`,
      values
    );
    return res.rows[0] || null;
  },

  async toggleStatus(id: string): Promise<UserRow | null> {
    const res = await query<UserRow>(
      `UPDATE users
       SET status = CASE WHEN status = 'active' THEN 'disabled' ELSE 'active' END
       WHERE id = $1
       RETURNING id, name, email, phone, role, status, avatar_url, created_at, updated_at`,
      [id]
    );
    return res.rows[0] || null;
  },
};
