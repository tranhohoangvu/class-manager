import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { query } from '../config/database.js';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Vui lòng đăng nhập để tiếp tục.');
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new UnauthorizedError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    // Verify user is still active in database
    const result = await query(
      'SELECT id, email, name, role, status FROM users WHERE id = $1',
      [payload.id]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Tài khoản không tồn tại.');
    }

    const user = result.rows[0];
    if (user.status === 'disabled') {
      throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    next(err);
  }
}
