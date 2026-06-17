import type { LoginInput, RegisterInput } from './auth.schema';
import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, type JwtPayload } from '../../shared/utils/tokens';
import { writeAudit } from '../../audit/audit.service';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  is_active: number;
  role: string | null;
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id, name, email, password_hash, is_active, role FROM App_Users WHERE email = ?',
      [email]
    );
    const [user] = rows as UserRecord[];
    return user ?? null;
  });
}

async function findUserByUsername(username: string): Promise<UserRecord | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id, name, email, password_hash, is_active, role FROM App_Users WHERE LOWER(username) = LOWER(?)',
      [username]
    );
    const [user] = rows as UserRecord[];
    return user ?? null;
  });
}

async function fetchUserRoles(userId: number): Promise<string[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT r.role_name AS role
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE`,
      [userId]
    );
    return (rows as { role: string }[]).map((row) => row.role);
  });
}

async function insertUser(input: RegisterInput, passwordHash: string): Promise<number> {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
       VALUES (?, ?, ?, 'employee', ?, TRUE)`,
      [input.name, input.email, passwordHash, input.employeeId ?? null]
    );
    const resultHeader = result as unknown as { insertId: number };
    return resultHeader.insertId;
  });
}

async function attachDefaultRole(userId: number): Promise<void> {
  await withConnection(async (conn) => {
    await conn.execute(
      `INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
       SELECT ?, role_id, ? FROM roles WHERE role_name = 'EMPLOYEE' LIMIT 1`,
      [userId, userId]
    );
  });
}

async function updateLoginActivity(userId: number, email: string, ip?: string): Promise<void> {
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE App_Users 
       SET last_login = NOW(), login_count = login_count + 1 
       WHERE id = ?`,
      [userId]
    );
  });

  // Write to audit log
  await writeAudit({
    userId,
    actorEmail: email,
    action: 'USER_LOGIN',
    resource: 'auth',
    resourceId: userId.toString(),
    ip,
    meta: { timestamp: new Date().toISOString() }
  });
}

export async function registerUser(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError({ statusCode: 409, message: 'Email already registered', code: 'CONFLICT' });
  }

  const passwordHash = await hashPassword(input.password);
  const userId = await insertUser(input, passwordHash);
  await attachDefaultRole(userId);

  const roles = await fetchUserRoles(userId);
  const payload: Omit<JwtPayload, 'type'> = {
    sub: userId,
    email: input.email,
    roles,
  };

  const primaryRole = roles[0] ?? 'EMPLOYEE';
  return {
    user: {
      id: userId,
      name: input.name,
      email: input.email,
      role: primaryRole.toLowerCase(),
      roles,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function authenticateUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user || !user.is_active) {
    throw new AppError({ statusCode: 401, message: 'Invalid credentials', code: 'UNAUTHORIZED' });
  }

  const matches = await verifyPassword(input.password, user.password_hash);
  if (!matches) {
    throw new AppError({ statusCode: 401, message: 'Invalid credentials', code: 'UNAUTHORIZED' });
  }

  const roles = await fetchUserRoles(user.id);

  const payload: Omit<JwtPayload, 'type'> = {
    sub: user.id,
    email: user.email,
    roles,
  };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (roles[0] ?? user.role ?? 'employee').toLowerCase(),
      roles,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function authenticateUserByIdentifier(identifier: string, password: string, ip?: string) {
  // Preserve existing behavior of authenticateUser (including password handling logic)
  const byEmail = looksLikeEmail(identifier);
  const user = byEmail ? await findUserByEmail(identifier) : await findUserByUsername(identifier);
  if (!user || !user.is_active) {
    throw new AppError({ statusCode: 401, message: 'Invalid credentials', code: 'UNAUTHORIZED' });
  }

  // Verify password
  const matches = await verifyPassword(password, user.password_hash);
  if (!matches) {
    throw new AppError({ statusCode: 401, message: 'Invalid credentials', code: 'UNAUTHORIZED' });
  }

  const roles = await fetchUserRoles(user.id);
  
  // Update login activity tracking
  await updateLoginActivity(user.id, user.email, ip);

  const payload: Omit<JwtPayload, 'type'> = {
    sub: user.id,
    email: user.email,
    roles,
  };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (roles[0] ?? user.role ?? 'employee').toLowerCase(),
      roles,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function refreshSession(refreshToken: string) {
  try {
    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    const roles = await fetchUserRoles(payload.sub);
    const newPayload: Omit<JwtPayload, 'type'> = {
      sub: payload.sub,
      email: payload.email,
      roles,
    };
    return {
      accessToken: generateAccessToken(newPayload),
      refreshToken: generateRefreshToken(newPayload),
    };
  } catch {
    throw new AppError({ statusCode: 401, message: 'Invalid refresh token', code: 'UNAUTHORIZED' });
  }
}

export async function refreshUserToken(userId: number) {
  const user = await withConnection(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id, name, email FROM App_Users WHERE id = ? AND is_active = TRUE',
      [userId]
    );
    const [userRow] = rows as { id: number; name: string; email: string }[];
    return userRow ?? null;
  });

  if (!user) {
    throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
  }

  const roles = await fetchUserRoles(userId);
  const payload: Omit<JwtPayload, 'type'> = {
    sub: user.id,
    email: user.email,
    roles,
  };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (roles[0] ?? 'employee').toLowerCase(),
      roles,
    },
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
