import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../../app';
import { dbPool } from '../../../core/database';
import { hashPassword } from '../../../shared/utils/password';

const app = createApp();

let employeeToken = '';
let adminToken = '';
let onboardingId = 0;
let departmentId = 0;

async function seedRoles() {
  await dbPool.query("INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ('EMPLOYEE', '„ÊŸ›', 'Employee Role', TRUE)");
  await dbPool.query("INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ('ADMIN', '„œÌ—', 'Administrator Role', TRUE)");
}

async function seedDepartments() {
  const [result] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO Departments (name_en, name_ar, code)
     VALUES ('Training', '«· œ—Ì»', 'TRNG')`
  );
  departmentId = result.insertId;
}

async function seedEmployeeUser() {
  const [employee] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO Employees (employee_number, first_name, last_name)
     VALUES ('EMP-3001', 'New', 'Hire')`
  );
  const employeeId = employee.insertId;

  const passwordHash = await hashPassword('Employee123!');
  const [user] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
     VALUES ('Onboarding Employee', 'onboarding@test.com', ?, 'employee', ?, TRUE)` ,
    [passwordHash, employeeId]
  );

  await dbPool.execute(
    `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
     SELECT ?, r.role_id, ?, TRUE FROM roles r WHERE r.role_name = 'EMPLOYEE' LIMIT 1`,
    [user.insertId, user.insertId]
  );
}

async function seedAdminUser() {
  const passwordHash = await hashPassword('Admin123!');
  const [user] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO App_Users (name, email, password_hash, role, is_active)
     VALUES ('Onboarding Admin', 'onboarding-admin@test.com', ?, 'admin', TRUE)` ,
    [passwordHash]
  );

  await dbPool.execute(
    `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
     SELECT ?, r.role_id, ?, TRUE FROM roles r WHERE r.role_name = 'ADMIN' LIMIT 1`,
    [user.insertId, user.insertId]
  );
}

beforeAll(async () => {
  await dbPool.query('DELETE FROM Onboarding_Signatures');
  await dbPool.query('DELETE FROM onboarding_forms');
  await dbPool.query('DELETE FROM user_roles');
  await dbPool.query('DELETE FROM App_Users');
  await dbPool.query('DELETE FROM Employees');
  await dbPool.query('DELETE FROM Departments');

  await seedRoles();
  await seedDepartments();
  await seedEmployeeUser();
  await seedAdminUser();

  const employeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'onboarding@test.com', password: 'Employee123!' });
  employeeToken = employeeLogin.body.data.accessToken as string;

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'onboarding-admin@test.com', password: 'Admin123!' });
  adminToken = adminLogin.body.data.accessToken as string;
});

describe('Onboarding API', () => {
  it('creates an onboarding form for the current user', async () => {
    const response = await request(app)
      .post('/api/onboarding')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        referenceNumber: 'ONB-001',
        requestDate: '2025-04-01',
        startDate: '2025-04-15',
        positionTitle: 'Analyst',
      })
      .expect(201);

    onboardingId = response.body.data.onboardingId as number;
    expect(onboardingId).toBeGreaterThan(0);
  });

  it('lists my onboarding forms', async () => {
    const response = await request(app)
      .get('/api/onboarding')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(response.body.data[0].referenceNumber).toBe('ONB-001');
  });

  it('allows admin to list all onboardings', async () => {
    const response = await request(app)
      .get('/api/onboarding/admin/list')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('updates onboarding status', async () => {
    await request(app)
      .patch(`/api/onboarding/${onboardingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(204);
  });

  it('records onboarding signature', async () => {
    await request(app)
      .post(`/api/onboarding/${onboardingId}/signatures`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId,
        signerName: 'Training Lead',
        signerTitle: 'Training Lead',
        signatureDate: '2025-04-05',
      })
      .expect(204);
  });
});
