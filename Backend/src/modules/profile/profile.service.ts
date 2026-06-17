import type { RowDataPacket } from 'mysql2';

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { getUserProfile } from '../users/users.service';

interface UpdateProfileInput {
  name: string;
  email: string;
  phone?: string | null;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function fetchProfile(userId: number) {
  return getUserProfile(userId);
}

export async function updateProfile(userId: number, input: UpdateProfileInput) {
  await withConnection(async (conn) => {
    const [emailRows] = await conn.execute(
      'SELECT id FROM App_Users WHERE email = ? AND id <> ?',
      [input.email, userId]
    );
    if (Array.isArray(emailRows) && emailRows.length > 0) {
      throw new AppError({ statusCode: 409, message: 'Email already in use', code: 'CONFLICT' });
    }

    await conn.execute(
      'UPDATE App_Users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [input.name, input.email, userId]
    );

    if (input.phone) {
      await conn.execute(
        `UPDATE Employees
         SET phone_primary = ?
         WHERE employee_id = (SELECT employee_id FROM App_Users WHERE id = ? LIMIT 1)` ,
        [input.phone, userId]
      );
    }
  });

  return fetchProfile(userId);
}

export async function changePassword(userId: number, input: ChangePasswordInput) {
  const { currentPassword, newPassword } = input;
  const user = await withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT password_hash FROM App_Users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
    }
    return rows[0] as { password_hash: string };
  });

  const matches = await verifyPassword(currentPassword, user.password_hash);
  if (!matches) {
    throw new AppError({ statusCode: 401, message: 'Invalid current password', code: 'UNAUTHORIZED' });
  }

  const passwordHash = await hashPassword(newPassword);
  await withConnection(async (conn) => {
    await conn.execute('UPDATE App_Users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId]);
  });
}