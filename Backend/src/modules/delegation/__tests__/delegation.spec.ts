import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../../app';
import { dbPool } from '../../../core/database';
import { hashPassword } from '../../../shared/utils/password';

const app = createApp();

let employeeToken = '';
let adminToken = '';
let delegationId = 0;
let departmentId = 0;

async function seedRoles() {
  await dbPool.query("INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ('EMPLOYEE', '„ÊŸ›', 'Employee Role', TRUE)");
  await dbPool.query("INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ('ADMIN', '„œÌ—', 'Administrator Role', TRUE)");
}

async function seedDepartments() {
  const [result] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO Departments (name_en, name_ar, code)
     VALUES ('Operations', '«·⁄„·Ì« ', 'OPS')`
  );
  departmentId = result.insertId;
}

async function seedEmployeeUser() {
  const [employee] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO Employees (employee_number, first_name, last_name)
     VALUES ('EMP-2001', 'Delegator', 'User')`
  );
  const employeeId = employee.insertId;

  const passwordHash = await hashPassword('Employee123!');
  const [user] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
     VALUES ('Delegation Employee', 'delegator@test.com', ?, 'employee', ?, TRUE)` ,
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
     VALUES ('Delegation Admin', 'delegation-admin@test.com', ?, 'admin', TRUE)` ,
    [passwordHash]
  );

  await dbPool.execute(
    `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
     SELECT ?, r.role_id, ?, TRUE FROM roles r WHERE r.role_name = 'ADMIN' LIMIT 1`,
    [user.insertId, user.insertId]
  );
}

beforeAll(async () => {
  await dbPool.query('DELETE FROM Delegation_Signatures');
  await dbPool.query('DELETE FROM delegation_forms');
  await dbPool.query('DELETE FROM DelegationStatuses');
  await dbPool.query('DELETE FROM Clearance_Forms');
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
    .send({ email: 'delegator@test.com', password: 'Employee123!' });
  employeeToken = employeeLogin.body.data.accessToken as string;

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'delegation-admin@test.com', password: 'Admin123!' });
  adminToken = adminLogin.body.data.accessToken as string;
});

describe('Delegation API', () => {
  it('creates a delegation request for the current user', async () => {
    const response = await request(app)
      .post('/api/delegation')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        referenceNumber: 'DEL-001',
        requestDate: '2025-03-01',
        delegationType: 'Travel',
        startDate: '2025-03-10',
        endDate: '2025-03-20',
        reason: 'Conference attendance',
      })
      .expect(201);

    delegationId = response.body.data.delegationId as number;
    expect(delegationId).toBeGreaterThan(0);
  });

  it('lists employee delegations', async () => {
    const response = await request(app)
      .get('/api/delegation')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(response.body.data[0].referenceNumber).toBe('DEL-001');
  });

  it('allows admin to list delegations', async () => {
    const response = await request(app)
      .get('/api/delegation/admin/list')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('updates delegation status', async () => {
    await request(app)
      .patch(`/api/delegation/${delegationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(204);
  });

  it('adds a delegation signature', async () => {
    await request(app)
      .post(`/api/delegation/${delegationId}/signatures`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId,
        signerName: 'Ops Manager',
        signerTitle: 'Operations Manager',
        signatureDate: '2025-03-05',
      })
      .expect(204);
  });
});
