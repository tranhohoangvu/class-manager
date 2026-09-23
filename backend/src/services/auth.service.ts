import { UserRepo } from '../repositories/user.repo.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';
import { UserRow } from '../types/index.js';

export const AuthService = {
  async login(email: string, password?: string): Promise<{ user: UserRow; token: string }> {
    if (!email || !password) {
      throw new BadRequestError('Vui lòng nhập đầy đủ email và mật khẩu.');
    }

    const user = await UserRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Email không tồn tại trong hệ thống.');
    }

    if (user.status === 'disabled') {
      throw new UnauthorizedError('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Mật khẩu không chính xác.');
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getCurrentUser(userId: string): Promise<UserRow> {
    const user = await UserRepo.findById(userId);
    if (!user || user.status === 'disabled') {
      throw new UnauthorizedError('Phiên đăng nhập đã hết hạn hoặc tài khoản bị khóa.');
    }
    return user;
  },
};
