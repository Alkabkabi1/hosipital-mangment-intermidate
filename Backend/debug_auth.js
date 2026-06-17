const request = require('supertest');
const { createApp } = require('./dist/app');
const { dbPool } = require('./dist/core/database');
(async () => {
  await dbPool.query('DELETE FROM user_roles');
  await dbPool.query('DELETE FROM App_Users');
  const response = await request(createApp())
    .post('/api/auth/register')
    .send({ name: 'Demo User', email: 'demo@example.com', password: 'Password123!' });
  console.log('status', response.status);
  console.log('body', response.body);
  await dbPool.end();
})();
