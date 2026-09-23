import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { query } from '../config/database.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Bạn không có quyền thực hiện thao tác này.'));
    }
    next();
  };
}

export async function requireClassAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const classId = req.params.classId || req.params.id;
    if (!classId) {
      return next();
    }

    // Check if user is homeroom teacher OR has class membership OR subject assignment
    const accessQuery = `
      SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2
      UNION
      SELECT 1 FROM class_memberships WHERE class_id = $1 AND teacher_id = $2
      UNION
      SELECT 1 FROM subject_assignments WHERE class_id = $1 AND teacher_id = $2
    `;

    const result = await query(accessQuery, [classId, req.user.id]);
    if (result.rows.length === 0) {
      throw new ForbiddenError('Bạn không được phân công giảng dạy hoặc quản lý lớp này.');
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function requireHomeroomOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const classId = req.params.classId || req.params.id;
    if (!classId) {
      return next(new ForbiddenError('Thiếu thông tin lớp học để kiểm tra quyền hạn.'));
    }

    const result = await query('SELECT teacher_id FROM classes WHERE id = $1', [classId]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Không tìm thấy lớp học.');
    }

    if (result.rows[0].teacher_id !== req.user.id) {
      throw new ForbiddenError('Chỉ Giáo viên chủ nhiệm (GVCN) hoặc Quản trị viên mới có quyền thực hiện thao tác này.');
    }

    next();
  } catch (err) {
    next(err);
  }
}
