import request from 'supertest';
import express from 'express';
import { validateBody } from '../../src/validation/validate';
import { Schemas } from '../../src/validation/schemas';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/t/clearance', validateBody(Schemas.clearance.create), (_req, res) => res.json({ ok: true }));
  app.post('/t/onboarding', validateBody(Schemas.onboarding.create), (_req, res) => res.json({ ok: true }));
  app.post('/t/delegation', validateBody(Schemas.delegation.create), (_req, res) => res.json({ ok: true }));
  return app;
}

describe('Contract validation', () => {
  const app = buildApp();

  it('clearance: rejects invalid payload', async () => {
    const res = await request(app).post('/t/clearance').send({});
    expect(res.status).toBe(422);
  });
  it('clearance: accepts valid payload', async () => {
    const res = await request(app).post('/t/clearance').send({ email: 'a@b.com', reason: 'x', lastWorkingDay: '2025-01-01' });
    expect(res.status).toBe(200);
  });

  it('onboarding: rejects invalid payload', async () => {
    const res = await request(app).post('/t/onboarding').send({});
    expect(res.status).toBe(422);
  });
  it('onboarding: accepts valid payload', async () => {
    const res = await request(app).post('/t/onboarding').send({ jobTitle: 'Dev', department: 'IT', startDate: '2025-01-02' });
    expect(res.status).toBe(200);
  });

  it('delegation: rejects invalid payload', async () => {
    const res = await request(app).post('/t/delegation').send({});
    expect(res.status).toBe(422);
  });
  it('delegation: accepts valid payload (emails)', async () => {
    const res = await request(app).post('/t/delegation').send({ fromEmail: 'a@b.com', toEmail: 'c@d.com', validFrom: '2025-01-01', validTo: '2025-02-01' });
    expect(res.status).toBe(200);
  });
});

