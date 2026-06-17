import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createRewardRefund,
  getUserRewardRefunds,
  getRewardRefundById,
  getAllRewardRefunds,
  updateRewardRefundStatus
} from './reward-refund.service';
import { withConnection } from '../../core/database';
import type { CreateRewardRefundInput } from './reward-refund.schema';

/**
 * Reward/Refund Module Test Suite
 * Tests all CRUD operations and business logic for End of Service Reward and Vacation Refund requests
 */

describe('Reward/Refund Module', () => {
  let testUserId: number;
  let testRequestId: number;
  let adminUserId: number;

  beforeAll(async () => {
    // Create test user
    await withConnection(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['test.reward@test.com', 'Test Reward User', 'hash123', 'EMP002', 'employee']
      );
      testUserId = (result as any).insertId;

      // Create admin user
      const [adminResult] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin.reward@test.com', 'Admin Reward User', 'hash456', 'ADM002', 'admin']
      );
      adminUserId = (adminResult as any).insertId;
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM Reward_Refund_Status_History WHERE request_id = ?', [testRequestId]);
      await conn.execute('DELETE FROM Reward_Refund_Requests WHERE employee_id IN (?, ?)', [testUserId, adminUserId]);
      await conn.execute('DELETE FROM App_Users WHERE id IN (?, ?)', [testUserId, adminUserId]);
    });
  });

  describe('Reward/Refund Creation', () => {
    it('should create a valid end of service reward request', async () => {
      const validInput: CreateRewardRefundInput = {
        name: 'Khalid Abdullah',
        nationality: 'Saudi',
        position: 'Senior Accountant',
        contract_type: 'Permanent',
        job_no: '12345',
        work_start: '2020-01-15',
        record_no: '98765',
        contract_end: '2025-12-31',
        department: 'Finance',
        request_date: '2025-11-18',
        opt_end_service: true,
        opt_vacation_refund: false,
        requested_rewards: ['End of Service Reward'],
        employee_decision: 'eligible',
        hr_decision: 'eligible'
      };

      const result = await createRewardRefund(testUserId, validInput);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.message).toContain('تم تقديم طلب المكافأة/التعويض بنجاح');
      
      testRequestId = result.id;
    });

    it('should create vacation refund request', async () => {
      const vacationInput: CreateRewardRefundInput = {
        name: 'Mohammed Salem',
        nationality: 'Yemeni',
        position: 'IT Specialist',
        contract_type: 'Contract',
        job_no: '54321',
        work_start: '2022-06-01',
        record_no: '11111',
        contract_end: '2025-06-01',
        department: 'IT Department',
        request_date: '2025-11-18',
        opt_end_service: false,
        opt_vacation_refund: true,
        requested_rewards: ['Vacation Compensation'],
        employee_decision: 'eligible',
        hr_decision: 'eligible'
      };

      const result = await createRewardRefund(testUserId, vacationInput);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      const request = await getRewardRefundById(result.id);
      expect(request.opt_vacation_refund).toBe(1); // MySQL boolean as tinyint
      expect(request.opt_end_service).toBe(0);

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Reward_Refund_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Reward_Refund_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should create request with both end service and vacation refund', async () => {
      const bothInput: CreateRewardRefundInput = {
        name: 'Fatima Hassan',
        nationality: 'Egyptian',
        position: 'Nurse',
        contract_type: 'Contract',
        job_no: '77777',
        work_start: '2019-03-15',
        record_no: '22222',
        contract_end: '2025-03-15',
        department: 'Nursing',
        request_date: '2025-11-18',
        opt_end_service: true,
        opt_vacation_refund: true,
        requested_rewards: ['End of Service Reward', 'Vacation Compensation'],
        employee_decision: 'eligible',
        hr_decision: 'eligible'
      };

      const result = await createRewardRefund(testUserId, bothInput);
      
      expect(result).toBeDefined();

      const request = await getRewardRefundById(result.id);
      expect(request.opt_end_service).toBe(1);
      expect(request.opt_vacation_refund).toBe(1);
      const rewards = typeof request.requested_rewards === 'string' 
        ? JSON.parse(request.requested_rewards) 
        : request.requested_rewards;
      expect(rewards).toHaveLength(2);

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Reward_Refund_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Reward_Refund_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should fail with invalid job number format', async () => {
      const { createRewardRefundSchema } = await import('./reward-refund.schema');
      const invalidInput = {
        name: 'Test User',
        nationality: 'Saudi',
        position: 'Engineer',
        contract_type: 'Permanent',
        job_no: 'ABC123', // Invalid: should be numeric
        work_start: '2020-01-01',
        record_no: '12345',
        contract_end: '2025-12-31',
        department: 'Engineering',
        request_date: '2025-11-18'
      };

      // Test schema validation
      expect(() => createRewardRefundSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with invalid record number format', async () => {
      const { createRewardRefundSchema } = await import('./reward-refund.schema');
      const invalidInput = {
        name: 'Test User',
        nationality: 'Saudi',
        position: 'Engineer',
        contract_type: 'Permanent',
        job_no: '12345',
        work_start: '2020-01-01',
        record_no: 'REC-001', // Invalid: should be numeric
        contract_end: '2025-12-31',
        department: 'Engineering',
        request_date: '2025-11-18'
      };

      // Test schema validation
      expect(() => createRewardRefundSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with invalid date format', async () => {
      const { createRewardRefundSchema } = await import('./reward-refund.schema');
      const invalidInput = {
        name: 'Test User',
        nationality: 'Saudi',
        position: 'Engineer',
        contract_type: 'Permanent',
        job_no: '12345',
        work_start: '01/01/2020', // Invalid format
        record_no: '12345',
        contract_end: '2025-12-31',
        department: 'Engineering',
        request_date: '2025-11-18'
      };

      // Test schema validation
      expect(() => createRewardRefundSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with non-existent user', async () => {
      const validInput: CreateRewardRefundInput = {
        name: 'Test User',
        nationality: 'Saudi',
        position: 'Engineer',
        contract_type: 'Permanent',
        job_no: '12345',
        work_start: '2020-01-01',
        record_no: '12345',
        contract_end: '2025-12-31',
        department: 'Engineering',
        request_date: '2025-11-18'
      };

      await expect(
        createRewardRefund(999999, validInput)
      ).rejects.toThrow('المستخدم غير موجود');
    });
  });

  describe('Reward/Refund Retrieval', () => {
    it('should retrieve user reward/refund requests', async () => {
      const requests = await getUserRewardRefunds(testUserId);
      
      expect(requests).toBeDefined();
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0]).toHaveProperty('name');
      expect(requests[0]).toHaveProperty('position');
      expect(requests[0]).toHaveProperty('status');
    });

    it('should retrieve reward/refund request by ID', async () => {
      const request = await getRewardRefundById(testRequestId);
      
      expect(request).toBeDefined();
      expect(request.id).toBe(testRequestId);
      expect(request.name).toBe('Khalid Abdullah');
      expect(request.position).toBe('Senior Accountant');
      expect(request.status).toBe('submitted');
    });

    it('should fail to retrieve non-existent request', async () => {
      await expect(
        getRewardRefundById(999999)
      ).rejects.toThrow('الطلب غير موجود');
    });

    it('should retrieve all reward/refund requests (admin)', async () => {
      const allRequests = await getAllRewardRefunds();
      
      expect(allRequests).toBeDefined();
      expect(Array.isArray(allRequests)).toBe(true);
      expect(allRequests.length).toBeGreaterThan(0);
      expect(allRequests[0]).toHaveProperty('employee_email');
    });
  });

  describe('Reward/Refund Status Updates', () => {
    it('should update reward/refund status to approved', async () => {
      const updateInput = {
        status: 'approved',
        admin_notes: 'Request approved by Finance'
      };

      const result = await updateRewardRefundStatus(testRequestId, updateInput, adminUserId);
      
      expect(result).toBeDefined();
      expect(result.message).toContain('تم تحديث حالة الطلب بنجاح');

      // Verify status was updated
      const request = await getRewardRefundById(testRequestId);
      expect(request.status).toBe('approved');
      expect(request.admin_notes).toBe('Request approved by Finance');
    });

    it('should update status to rejected with reason', async () => {
      const updateInput = {
        status: 'rejected',
        admin_notes: 'Request rejected',
        rejection_reason: 'Not eligible for end of service reward'
      };

      const result = await updateRewardRefundStatus(testRequestId, updateInput, adminUserId);
      
      expect(result).toBeDefined();

      const request = await getRewardRefundById(testRequestId);
      expect(request.status).toBe('rejected');
      expect(request.rejection_reason).toBe('Not eligible for end of service reward');
    });

    it('should create status history entry on update', async () => {
      await withConnection(async (conn) => {
        const [history] = await conn.execute(
          'SELECT * FROM Reward_Refund_Status_History WHERE request_id = ? ORDER BY changed_at DESC',
          [testRequestId]
        );

        expect(Array.isArray(history)).toBe(true);
        expect((history as any[]).length).toBeGreaterThan(0);
        expect((history as any[])[0]).toHaveProperty('old_status');
        expect((history as any[])[0]).toHaveProperty('new_status');
      });
    });

    it('should fail to update non-existent request', async () => {
      const updateInput = {
        status: 'approved',
        admin_notes: 'Test'
      };

      await expect(
        updateRewardRefundStatus(999999, updateInput, adminUserId)
      ).rejects.toThrow('الطلب غير موجود');
    });
  });

  describe('Reward/Refund Business Logic', () => {
    it('should handle eligibility decisions correctly', async () => {
      const notEligibleInput: CreateRewardRefundInput = {
        name: 'Test Not Eligible',
        nationality: 'Pakistani',
        position: 'Technician',
        contract_type: 'Temporary',
        job_no: '99999',
        work_start: '2024-01-01',
        record_no: '88888',
        contract_end: '2024-12-31',
        department: 'Maintenance',
        request_date: '2025-11-18',
        opt_end_service: true,
        employee_decision: 'not_eligible',
        hr_decision: 'not_eligible',
        non_eligibility_reason: 'Contract duration less than minimum required'
      };

      const result = await createRewardRefund(testUserId, notEligibleInput);
      const request = await getRewardRefundById(result.id);

      expect(request.employee_decision).toBe('not_eligible');
      expect(request.hr_decision).toBe('not_eligible');
      expect(request.non_eligibility_reason).toBe('Contract duration less than minimum required');

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Reward_Refund_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Reward_Refund_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should store requested rewards as JSON array', async () => {
      const request = await getRewardRefundById(testRequestId);
      const rewards = typeof request.requested_rewards === 'string' 
        ? JSON.parse(request.requested_rewards) 
        : request.requested_rewards;
      
      expect(Array.isArray(rewards)).toBe(true);
      expect(rewards).toContain('End of Service Reward');
    });

    it('should preserve multi-approval fields', async () => {
      const request = await getRewardRefundById(testRequestId);
      
      expect(request).toHaveProperty('status');
      expect(request).toHaveProperty('approval_stage');
      expect(request).toHaveProperty('final_decision');
      expect(request.approval_stage).toBe('Pending Review');
      expect(request.final_decision).toBe('pending');
    });

    it('should calculate service duration correctly', async () => {
      const request = await getRewardRefundById(testRequestId);
      const workStart = new Date(request.work_start);
      const contractEnd = new Date(request.contract_end);
      const yearsDiff = contractEnd.getFullYear() - workStart.getFullYear();
      
      expect(yearsDiff).toBeGreaterThan(0);
    });
  });
});

