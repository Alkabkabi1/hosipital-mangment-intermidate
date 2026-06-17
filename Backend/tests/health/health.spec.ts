import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../../dist/server.js';

describe('Health endpoints', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });
});

