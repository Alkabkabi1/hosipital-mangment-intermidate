import jwt from 'jsonwebtoken';

import { env } from '../../config';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export function generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyToken<T = JwtPayload>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
