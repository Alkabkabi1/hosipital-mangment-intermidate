import request from 'supertest';
import { createApp } from './dist/app.js';
import { dbPool } from './dist/core/database.js';

const app = createApp();
await dbPool.query('DELETE FROM user_roles');
await dbPool.query('DELETE FROM App_Users');

const response = await request(app)
  .post('/api/auth/register')
  .send({ name: 'Demo User', email: 'demo@example.com', password: 'Password123!' });

console.log('status', response.status);
console.log('body', response.body);
await dbPool.end();
