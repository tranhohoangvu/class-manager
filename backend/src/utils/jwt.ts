import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AuthUser } from '../types/index.js';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}
