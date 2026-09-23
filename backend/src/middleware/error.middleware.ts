import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ENV } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle unique constraint violation in PostgreSQL
  const pgError = err as any;
  if (pgError.code === '23505') {
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Dữ liệu đã tồn tại trong hệ thống (vi phạm ràng buộc duy nhất).',
      },
    });
    return;
  }

  // Handle check constraint violation
  if (pgError.code === '23514') {
    res.status(400).json({
      error: {
        code: 'CHECK_VIOLATION',
        message: pgError.message || 'Dữ liệu không thỏa mãn quy chuẩn hệ thống.',
      },
    });
    return;
  }

  // Handle foreign key constraint violation
  if (pgError.code === '23503') {
    res.status(400).json({
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Tham chiếu dữ liệu không hợp lệ.',
      },
    });
    return;
  }

  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: ENV.NODE_ENV === 'production' ? 'Đã xảy ra lỗi máy chủ nội bộ.' : err.message,
    },
  });
}
