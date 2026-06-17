import type { RequestHandler } from 'express';

import { loginSchema, registerSchema } from './auth.schema';
import { authenticateUser, authenticateUserByIdentifier, refreshSession, registerUser } from './auth.service';
import { AppError } from '../../core/errors';
import { sendSuccess } from '../../shared/utils/response';

type AuthResult = Awaited<ReturnType<typeof authenticateUser>> | Awaited<ReturnType<typeof registerUser>>;

const toAuthPayload = (result: AuthResult) => ({
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
  token: result.accessToken,
  user: {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role?.toLowerCase() ?? 'employee',
    roles: result.user.roles,
  },
});

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    const payload = toAuthPayload(result);
    sendSuccess(res, payload, 201, { token: payload.token });
  } catch (error) {
    next(error);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const body = (req.body || {}) as any;
    const identifier: string | undefined = body.identifier ?? body.email ?? body.username;
    const password: string | undefined = body.password;
    if (!identifier || !password) {
      throw new AppError({ statusCode: 400, message: 'Identifier and password are required', code: 'BAD_REQUEST' });
    }
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authenticateUserByIdentifier(identifier, password, ip);
    const payload = toAuthPayload(result);
    sendSuccess(res, payload, 200, { token: payload.token });
  } catch (error) {
    next(error);
  }
};

export const refreshController: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      throw new AppError({ statusCode: 400, message: 'refreshToken is required', code: 'BAD_REQUEST' });
    }
    if (isRefreshRevoked(refreshToken)) {
      return res.status(401).json({ error: 'TOKEN_REVOKED' });
    }
    const result = await refreshSession(refreshToken);
    sendSuccess(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.accessToken,
    }, 200, { token: result.accessToken });
  } catch (error) {
    next(error);
  }
};

export const meController: RequestHandler = async (req, res) => {
  sendSuccess(res, req.auth ?? null);
};

// Simple in-memory refresh revoke list (dev/test)
const revokedRefresh = new Set<string>();
function isRefreshRevoked(token: string): boolean { return revokedRefresh.has(token); }

export const revokeController: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ error: 'BAD_REQUEST' });
    }
  revokedRefresh.add(refreshToken);
  res.json({ success: true });
};
