import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../../app';
import { dbPool } from '../../../core/database';

const app = createApp();
let refreshToken = '';

beforeAll(async () => {
  await dbPool.query('DELETE FROM user_roles');
  await dbPool.query('DELETE FROM App_Users');
  await dbPool.query('INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ("EMPLOYEE", "ãæÙÝ", "Default Employee Role", TRUE)');
});

describe('Auth API', () => {
  it('registers a user and returns tokens', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    refreshToken = response.body.data.refreshToken;
  });

  it('logs in with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  it('refreshes tokens with a valid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });
});
