import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createTravelOrder,
  getUserTravelOrders,
  getTravelOrderById,
  getAllTravelOrders,
  updateTravelOrderStatus
} from './travel-order.service';
import { withConnection } from '../../core/database';
import type { CreateTravelOrderInput } from './travel-order.schema';

/**
 * Travel Order Module Test Suite
 * Tests all CRUD operations and business logic for Non-Saudi Travel Orders
 */

describe('Travel Order Module', () => {
  let testUserId: number;
  let testRequestId: number;
  let adminUserId: number;

  beforeAll(async () => {
    // Create test user
    await withConnection(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['test.travel@test.com', 'Test Travel User', 'hash123', 'EMP001', 'employee']
      );
      testUserId = (result as any).insertId;

      // Create admin user
      const [adminResult] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin.travel@test.com', 'Admin User', 'hash456', 'ADM001', 'admin']
      );
      adminUserId = (adminResult as any).insertId;
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM NonSaudi_Travel_Order_Status_History WHERE request_id = ?', [testRequestId]);
      await conn.execute('DELETE FROM NonSaudi_Travel_Order_Requests WHERE employee_id IN (?, ?)', [testUserId, adminUserId]);
      await conn.execute('DELETE FROM App_Users WHERE id IN (?, ?)', [testUserId, adminUserId]);
    });
  });

  describe('Travel Order Creation', () => {
    it('should create a valid travel order request', async () => {
      const validInput: CreateTravelOrderInput = {
        contractor_name: 'Ahmed Mohammed',
        job_title: 'Senior Engineer',
        department: 'IT Department',
        nationality: 'Egyptian',
        iqama_number: '1234567890',
        passport_number: 'AB123456',
        employee_number: 'EMP001',
        contact_number: '+966501234567',
        travel_destination: 'Cairo, Egypt',
        work_start_date: '2025-12-01',
        work_end_date: '2025-12-15',
        work_duration_days: 15,
        sponsor_name: 'Mohammed Ali',
        sponsor_signature: 'data:image/png;base64,signature',
        sponsor_signature_date: '2025-11-18',
        hr_officer_name: 'HR Officer Name'
      };

      const result = await createTravelOrder(testUserId, validInput);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.message).toContain('تم تقديم طلب أمر الإركاب بنجاح');
      
      testRequestId = result.id;
    });

    it('should create travel order with dependents', async () => {
      const inputWithDependents: CreateTravelOrderInput = {
        contractor_name: 'Ali Hassan',
        job_title: 'Project Manager',
        department: 'Engineering',
        nationality: 'Indian',
        iqama_number: '9876543210',
        passport_number: 'CD789012',
        travel_destination: 'Mumbai, India',
        work_start_date: '2025-12-10',
        work_end_date: '2025-12-20',
        dependents: [
          {
            name: 'Sara Ali Hassan',
            relation: 'Spouse',
            nationality: 'Indian',
            iqama: '1111111111',
            passport: 'EF345678',
            notes: 'Accompanying'
          },
          {
            name: 'Omar Ali Hassan',
            relation: 'Son',
            nationality: 'Indian',
            iqama: '2222222222',
            passport: 'EF345679',
            notes: 'Child'
          }
        ],
        dependents_start_date: '2025-12-10',
        dependents_end_date: '2025-12-20',
        dependents_duration_days: 10,
        sponsor_name: 'Hassan Ahmed',
        sponsor_signature: 'data:image/png;base64,signature',
        sponsor_signature_date: '2025-11-18',
        hr_officer_name: 'HR Manager'
      };

      const result = await createTravelOrder(testUserId, inputWithDependents);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Verify dependents are stored
      const request = await getTravelOrderById(result.id);
      const dependents = typeof request.dependents === 'string' 
        ? JSON.parse(request.dependents) 
        : request.dependents;
      expect(dependents).toHaveLength(2);
      expect(dependents[0].name).toBe('Sara Ali Hassan');
      expect(dependents[1].name).toBe('Omar Ali Hassan');

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM NonSaudi_Travel_Order_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM NonSaudi_Travel_Order_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should fail with invalid iqama number', async () => {
      const { createTravelOrderSchema } = await import('./travel-order.schema');
      const invalidInput = {
        contractor_name: 'Test User',
        job_title: 'Engineer',
        department: 'IT',
        nationality: 'Pakistani',
        iqama_number: '123', // Invalid: less than 10 digits
        passport_number: 'GH123456',
        travel_destination: 'Karachi',
        work_start_date: '2025-12-01',
        work_end_date: '2025-12-10',
        sponsor_name: 'Sponsor Name',
        sponsor_signature: 'signature',
        sponsor_signature_date: '2025-11-18',
        hr_officer_name: 'HR Officer'
      };

      // Test schema validation
      expect(() => createTravelOrderSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with invalid date format', async () => {
      const { createTravelOrderSchema } = await import('./travel-order.schema');
      const invalidInput = {
        contractor_name: 'Test User',
        job_title: 'Engineer',
        department: 'IT',
        nationality: 'Pakistani',
        iqama_number: '1234567890',
        passport_number: 'GH123456',
        travel_destination: 'Karachi',
        work_start_date: '01-12-2025', // Invalid format
        work_end_date: '2025-12-10',
        sponsor_name: 'Sponsor Name',
        sponsor_signature: 'signature',
        sponsor_signature_date: '2025-11-18',
        hr_officer_name: 'HR Officer'
      };

      // Test schema validation
      expect(() => createTravelOrderSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with non-existent user', async () => {
      const validInput: CreateTravelOrderInput = {
        contractor_name: 'Test User',
        job_title: 'Engineer',
        department: 'IT',
        nationality: 'Pakistani',
        iqama_number: '1234567890',
        passport_number: 'GH123456',
        travel_destination: 'Karachi',
        work_start_date: '2025-12-01',
        work_end_date: '2025-12-10',
        sponsor_name: 'Sponsor Name',
        sponsor_signature: 'signature',
        sponsor_signature_date: '2025-11-18',
        hr_officer_name: 'HR Officer'
      };

      await expect(
        createTravelOrder(999999, validInput)
      ).rejects.toThrow('المستخدم غير موجود');
    });
  });

  describe('Travel Order Retrieval', () => {
    it('should retrieve user travel orders', async () => {
      const orders = await getUserTravelOrders(testUserId);
      
      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0]).toHaveProperty('contractor_name');
      expect(orders[0]).toHaveProperty('travel_destination');
      expect(orders[0]).toHaveProperty('status');
    });

    it('should retrieve travel order by ID', async () => {
      const order = await getTravelOrderById(testRequestId);
      
      expect(order).toBeDefined();
      expect(order.id).toBe(testRequestId);
      expect(order.contractor_name).toBe('Ahmed Mohammed');
      expect(order.travel_destination).toBe('Cairo, Egypt');
      expect(order.status).toBe('submitted');
    });

    it('should fail to retrieve non-existent order', async () => {
      await expect(
        getTravelOrderById(999999)
      ).rejects.toThrow('الطلب غير موجود');
    });

    it('should retrieve all travel orders (admin)', async () => {
      const allOrders = await getAllTravelOrders();
      
      expect(allOrders).toBeDefined();
      expect(Array.isArray(allOrders)).toBe(true);
      expect(allOrders.length).toBeGreaterThan(0);
      expect(allOrders[0]).toHaveProperty('employee_email');
    });
  });

  describe('Travel Order Status Updates', () => {
    it('should update travel order status', async () => {
      const updateInput = {
        status: 'approved',
        admin_notes: 'Request approved by HR'
      };

      const result = await updateTravelOrderStatus(testRequestId, updateInput, adminUserId);
      
      expect(result).toBeDefined();
      expect(result.message).toContain('تم تحديث حالة الطلب بنجاح');

      // Verify status was updated
      const order = await getTravelOrderById(testRequestId);
      expect(order.status).toBe('approved');
      expect(order.admin_notes).toBe('Request approved by HR');
    });

    it('should update status to rejected with reason', async () => {
      const updateInput = {
        status: 'rejected',
        admin_notes: 'Request rejected',
        rejection_reason: 'Incomplete documentation'
      };

      const result = await updateTravelOrderStatus(testRequestId, updateInput, adminUserId);
      
      expect(result).toBeDefined();

      const order = await getTravelOrderById(testRequestId);
      expect(order.status).toBe('rejected');
      expect(order.rejection_reason).toBe('Incomplete documentation');
    });

    it('should create status history entry on update', async () => {
      await withConnection(async (conn) => {
        const [history] = await conn.execute(
          'SELECT * FROM NonSaudi_Travel_Order_Status_History WHERE request_id = ? ORDER BY changed_at DESC LIMIT 1',
          [testRequestId]
        );

        expect(Array.isArray(history)).toBe(true);
        expect((history as any[]).length).toBeGreaterThan(0);
        expect((history as any[])[0]).toHaveProperty('old_status');
        expect((history as any[])[0]).toHaveProperty('new_status');
        // The most recent status should be rejected
        const latestHistory = (history as any[])[0];
        expect(['rejected', 'approved']).toContain(latestHistory.new_status);
      });
    });

    it('should fail to update non-existent order', async () => {
      const updateInput = {
        status: 'approved',
        admin_notes: 'Test'
      };

      await expect(
        updateTravelOrderStatus(999999, updateInput, adminUserId)
      ).rejects.toThrow('الطلب غير موجود');
    });
  });

  describe('Travel Order Business Logic', () => {
    it('should store checklist data correctly', async () => {
      const inputWithChecklist: CreateTravelOrderInput = {
        contractor_name: 'Test Checklist User',
        job_title: 'Developer',
        department: 'IT',
        nationality: 'Filipino',
        iqama_number: '5555555555',
        passport_number: 'PH123456',
        travel_destination: 'Manila',
        work_start_date: '2025-12-01',
        work_end_date: '2025-12-10',
        checklist: {
          form_approved: true,
          residence_valid: true,
          passport_copies: true,
          housing_form: true,
          pdf_upload: true,
          other_notes: false
        },
        sponsor_name: 'Sponsor',
        sponsor_signature: 'signature',
        sponsor_signature_date: '2025-11-18',
        hr_officer_name: 'HR Officer'
      };

      const result = await createTravelOrder(testUserId, inputWithChecklist);
      const order = await getTravelOrderById(result.id);
      const checklist = typeof order.checklist === 'string' 
        ? JSON.parse(order.checklist) 
        : order.checklist;

      expect(checklist.form_approved).toBe(true);
      expect(checklist.residence_valid).toBe(true);
      expect(checklist.housing_form).toBe(true);

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM NonSaudi_Travel_Order_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM NonSaudi_Travel_Order_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should calculate work duration correctly', async () => {
      const order = await getTravelOrderById(testRequestId);
      
      expect(order.work_duration_days).toBe(15);
      expect(order.work_start_date).toBeDefined();
      expect(order.work_end_date).toBeDefined();
    });

    it('should preserve multi-approval fields', async () => {
      const order = await getTravelOrderById(testRequestId);
      
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('approval_stage');
      expect(order).toHaveProperty('final_decision');
      expect(order.approval_stage).toBe('Pending Review');
      expect(order.final_decision).toBe('pending');
    });
  });
});

