import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../dist/server.js';

describe('RBAC basic guards', () => {
  it('denies unauthorized role on admin route', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', 'Bearer invalid');
    expect([401,403]).toContain(res.statusCode);
  });
});

