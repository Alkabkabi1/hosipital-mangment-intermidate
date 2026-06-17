import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../../app';
import { dbPool } from '../../../core/database';
import { hashPassword } from '../../../shared/utils/password';

const app = createApp();
let adminToken = '';
let targetUserId = 0;

beforeAll(async () => {
  await dbPool.query('DELETE FROM user_roles');
  await dbPool.query('DELETE FROM App_Users');
  await dbPool.query('INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ("EMPLOYEE", "„ÊŸ›", "Default Employee Role", TRUE)');
  await dbPool.query('INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ("ADMIN", "„œÌ—", "Administrator Role", TRUE)');

  const passwordHash = await hashPassword('AdminPass123!');
  const [result] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO App_Users (name, email, password_hash, role, is_active)
     VALUES ('Admin User', 'admin@example.com', ?, 'admin', TRUE)` ,
    [passwordHash]
  );
  const insertId = result.insertId;
  await dbPool.execute(
    `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
     SELECT ?, role_id, ?, TRUE FROM roles WHERE role_name = 'ADMIN' LIMIT 1`,
    [insertId, insertId]
  );

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'AdminPass123!' });
  adminToken = loginResponse.body.data.accessToken as string;

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Employee User',
      email: 'employee@example.com',
      password: 'Password123!',
    });
  targetUserId = registerResponse.body.data.user.id as number;
});

describe('Role management', () => {
  it('rejects non-admin access to role endpoints', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@example.com', password: 'Password123!' });

    const employeeToken = loginResponse.body.data.accessToken as string;

    await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(403);
  });

  it('assigns a role to a user', async () => {
    await request(app)
      .post('/api/roles/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: targetUserId, role: 'ADMIN' })
      .expect(204);

    const response = await request(app)
      .get('/api/roles/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const users = response.body.data as Array<{ id: number; roles: string[] }>;
    const targetUser = users.find((user) => user.id === targetUserId);
    expect(targetUser?.roles).toContain('ADMIN');
  });

  it('removes a role from a user', async () => {
    await request(app)
      .post('/api/roles/remove')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: targetUserId, role: 'ADMIN' })
      .expect(204);

    const response = await request(app)
      .get('/api/roles/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const users = response.body.data as Array<{ id: number; roles: string[] }>;
    const targetUser = users.find((user) => user.id === targetUserId);
    expect(targetUser?.roles).not.toContain('ADMIN');
  });
});
