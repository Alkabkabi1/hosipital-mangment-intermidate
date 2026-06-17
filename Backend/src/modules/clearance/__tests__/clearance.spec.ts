import type { ResultSetHeader } from 'mysql2';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../../app';
import { dbPool } from '../../../core/database';
import { hashPassword } from '../../../shared/utils/password';

const app = createApp();

let employeeToken = '';
let adminToken = '';
let clearanceId = 0;
let departmentId = 0;

async function seedRoles() {
  await dbPool.query("INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ('EMPLOYEE', '„ÊŸ›', 'Employee Role', TRUE)");
  await dbPool.query("INSERT IGNORE INTO roles (role_name, role_name_ar, description, is_active) VALUES ('ADMIN', '„œÌ—', 'Administrator Role', TRUE)");
}

async function seedClearanceStatuses() {
  await dbPool.query("INSERT IGNORE INTO ClearanceStatuses (name_en, name_ar) VALUES ('Pending', 'ﬁÌœ «·«‰ Ÿ«—')");
  await dbPool.query("INSERT IGNORE INTO ClearanceStatuses (name_en, name_ar) VALUES ('Approved', '„⁄ „œ')");
  await dbPool.query("INSERT IGNORE INTO ClearanceStatuses (name_en, name_ar) VALUES ('Rejected', '„—›Ê÷')");
}

async function seedDepartments() {
  const [result] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO Departments (name_en, name_ar, code)
     VALUES ('Human Resources', '«·„Ê«—œ «·»‘—Ì…', 'HR')`
  );
  departmentId = result.insertId;
}

async function seedEmployeeUser() {
  const [employee] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO Employees (employee_number, first_name, last_name)
     VALUES ('EMP-1001', 'Test', 'Employee')`
  );
  const employeeId = employee.insertId;

  const passwordHash = await hashPassword('Employee123!');
  const [user] = await dbPool.execute<ResultSetHeader>(
    `INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
     VALUES ('Employee User', 'employee@test.com', ?, 'employee', ?, TRUE)` ,
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
     VALUES ('Admin User', 'admin@test.com', ?, 'admin', TRUE)` ,
    [passwordHash]
  );

  await dbPool.execute(
    `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
     SELECT ?, r.role_id, ?, TRUE FROM roles r WHERE r.role_name = 'ADMIN' LIMIT 1`,
    [user.insertId, user.insertId]
  );
}

beforeAll(async () => {
  await dbPool.query('DELETE FROM Clearance_Signatures');
  await dbPool.query('DELETE FROM Clearance_Forms');
  await dbPool.query('DELETE FROM user_roles');
  await dbPool.query('DELETE FROM App_Users');
  await dbPool.query('DELETE FROM Employees');
  await dbPool.query('DELETE FROM Departments');

  await seedRoles();
  await seedClearanceStatuses();
  await seedDepartments();
  await seedEmployeeUser();
  await seedAdminUser();

  const employeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee@test.com', password: 'Employee123!' });
  employeeToken = employeeLogin.body.data.accessToken as string;

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin123!' });
  adminToken = adminLogin.body.data.accessToken as string;
});

describe('Clearance API', () => {
  it('creates a clearance request for the current user', async () => {
    const response = await request(app)
      .post('/api/clearance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        referenceNumber: 'CLR-001',
        requestDate: '2025-01-01',
        effectiveDate: '2025-02-01',
        reason: 'Leaving company',
      })
      .expect(201);

    clearanceId = response.body.data.clearanceId as number;
    expect(clearanceId).toBeGreaterThan(0);
  });

  it('lists the current user clearances', async () => {
    const response = await request(app)
      .get('/api/clearance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0].referenceNumber).toBe('CLR-001');
  });

  it('allows admin to list all clearances', async () => {
    const response = await request(app)
      .get('/api/clearance/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('allows admin to update clearance status', async () => {
    await request(app)
      .patch(`/api/clearance/${clearanceId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' })
      .expect(204);
  });

  it('adds a department signature', async () => {
    await request(app)
      .post(`/api/clearance/${clearanceId}/signatures`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId,
        signerName: 'HR Manager',
        signerTitle: 'HR Manager',
        signatureDate: '2025-02-05',
      })
      .expect(204);
  });
});
