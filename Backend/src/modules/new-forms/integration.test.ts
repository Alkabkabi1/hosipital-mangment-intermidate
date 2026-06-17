import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { withConnection } from '../../core/database';
import { createTravelOrder, getTravelOrderById } from '../travel-order/travel-order.service';
import { createRewardRefund, getRewardRefundById } from '../reward-refund/reward-refund.service';
import { createAirlinesTicket, getAirlinesTicketById } from '../airlines-ticket/airlines-ticket.service';
import { travelOrderFixtures, rewardRefundFixtures, airlinesTicketFixtures, testUserFixtures } from './test-fixtures';

/**
 * Integration Test Suite for New Request Forms
 * Tests end-to-end workflows and cross-module interactions
 */

describe('New Request Forms - Integration Tests', () => {
  let testUserId: number;
  let adminUserId: number;
  const createdRequests = {
    travelOrders: [] as number[],
    rewardRefunds: [] as number[],
    airlinesTickets: [] as number[]
  };

  beforeAll(async () => {
    // Create test users
    await withConnection(async (conn) => {
      const [empResult] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          testUserFixtures.employee.email,
          testUserFixtures.employee.name,
          testUserFixtures.employee.password_hash,
          testUserFixtures.employee.employee_number,
          testUserFixtures.employee.role
        ]
      );
      testUserId = (empResult as any).insertId;

      const [adminResult] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          testUserFixtures.admin.email,
          testUserFixtures.admin.name,
          testUserFixtures.admin.password_hash,
          testUserFixtures.admin.employee_number,
          testUserFixtures.admin.role
        ]
      );
      adminUserId = (adminResult as any).insertId;
    });
  });

  afterAll(async () => {
    // Cleanup all test data
    await withConnection(async (conn) => {
      // Delete status histories
      for (const id of createdRequests.travelOrders) {
        await conn.execute('DELETE FROM NonSaudi_Travel_Order_Status_History WHERE request_id = ?', [id]);
      }
      for (const id of createdRequests.rewardRefunds) {
        await conn.execute('DELETE FROM Reward_Refund_Status_History WHERE request_id = ?', [id]);
      }
      for (const id of createdRequests.airlinesTickets) {
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?', [id]);
      }

      // Delete requests
      await conn.execute('DELETE FROM NonSaudi_Travel_Order_Requests WHERE employee_id = ?', [testUserId]);
      await conn.execute('DELETE FROM Reward_Refund_Requests WHERE employee_id = ?', [testUserId]);
      await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Requests WHERE employee_id = ?', [testUserId]);

      // Delete test users
      await conn.execute('DELETE FROM App_Users WHERE id IN (?, ?)', [testUserId, adminUserId]);
    });
  });

  describe('Complete Request Lifecycle', () => {
    it('should complete full lifecycle: create -> retrieve -> verify status history', async () => {
      // Create Travel Order
      const travelInput = travelOrderFixtures.valid.basic();
      const travelResult = await createTravelOrder(testUserId, travelInput);
      createdRequests.travelOrders.push(travelResult.id);

      // Create Reward/Refund
      const rewardInput = rewardRefundFixtures.valid.endOfService();
      const rewardResult = await createRewardRefund(testUserId, rewardInput);
      createdRequests.rewardRefunds.push(rewardResult.id);

      // Create Airlines Ticket
      const ticketInput = airlinesTicketFixtures.valid.single();
      const ticketResult = await createAirlinesTicket(testUserId, ticketInput);
      createdRequests.airlinesTickets.push(ticketResult.id);

      // Retrieve all requests
      const travelOrder = await getTravelOrderById(travelResult.id);
      const rewardRefund = await getRewardRefundById(rewardResult.id);
      const airlinesTicket = await getAirlinesTicketById(ticketResult.id);

      // Verify all are created
      expect(travelOrder.id).toBe(travelResult.id);
      expect(rewardRefund.id).toBe(rewardResult.id);
      expect(airlinesTicket.id).toBe(ticketResult.id);

      // Verify status history exists
      await withConnection(async (conn) => {
        const [travelHistory] = await conn.execute(
          'SELECT * FROM NonSaudi_Travel_Order_Status_History WHERE request_id = ?',
          [travelResult.id]
        );
        const [rewardHistory] = await conn.execute(
          'SELECT * FROM Reward_Refund_Status_History WHERE request_id = ?',
          [rewardResult.id]
        );
        const [ticketHistory] = await conn.execute(
          'SELECT * FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?',
          [ticketResult.id]
        );

        expect((travelHistory as any[]).length).toBeGreaterThan(0);
        expect((rewardHistory as any[]).length).toBeGreaterThan(0);
        expect((ticketHistory as any[]).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Approval Integration', () => {
    it('should initialize multi-approval workflow for all request types', async () => {
      const travelInput = travelOrderFixtures.valid.withDependents();
      const travelResult = await createTravelOrder(testUserId, travelInput);
      createdRequests.travelOrders.push(travelResult.id);

      const rewardInput = rewardRefundFixtures.valid.both();
      const rewardResult = await createRewardRefund(testUserId, rewardInput);
      createdRequests.rewardRefunds.push(rewardResult.id);

      const ticketInput = airlinesTicketFixtures.valid.family();
      const ticketResult = await createAirlinesTicket(testUserId, ticketInput);
      createdRequests.airlinesTickets.push(ticketResult.id);

      // Verify multi-approval fields are set
      const travelOrder = await getTravelOrderById(travelResult.id);
      const rewardRefund = await getRewardRefundById(rewardResult.id);
      const airlinesTicket = await getAirlinesTicketById(ticketResult.id);

      expect(travelOrder.status).toBe('submitted');
      expect(travelOrder.approval_stage).toBe('Pending Review');
      expect(travelOrder.final_decision).toBe('pending');

      expect(rewardRefund.status).toBe('submitted');
      expect(rewardRefund.approval_stage).toBe('Pending Review');
      expect(rewardRefund.final_decision).toBe('pending');

      expect(airlinesTicket.status).toBe('submitted');
      expect(airlinesTicket.approval_stage).toBe('Pending Review');
      expect(airlinesTicket.final_decision).toBe('pending');
    });
  });

  describe('Data Integrity and Relationships', () => {
    it('should maintain referential integrity with App_Users table', async () => {
      const travelInput = travelOrderFixtures.valid.withChecklist();
      const travelResult = await createTravelOrder(testUserId, travelInput);
      createdRequests.travelOrders.push(travelResult.id);

      await withConnection(async (conn) => {
        const [rows] = await conn.execute(
          `SELECT tr.*, u.email, u.name as user_name
           FROM NonSaudi_Travel_Order_Requests tr
           JOIN App_Users u ON tr.employee_id = u.id
           WHERE tr.id = ?`,
          [travelResult.id]
        );

        expect((rows as any[]).length).toBe(1);
        expect((rows as any[])[0].email).toBe(testUserFixtures.employee.email);
        expect((rows as any[])[0].user_name).toBe(testUserFixtures.employee.name);
      });
    });

    it('should properly store and retrieve JSON data', async () => {
      // Test Travel Order with dependents
      const travelInput = travelOrderFixtures.valid.withDependents();
      const travelResult = await createTravelOrder(testUserId, travelInput);
      createdRequests.travelOrders.push(travelResult.id);

      const travelOrder = await getTravelOrderById(travelResult.id);
      const dependents = typeof travelOrder.dependents === 'string' 
        ? JSON.parse(travelOrder.dependents) 
        : travelOrder.dependents;
      
      expect(Array.isArray(dependents)).toBe(true);
      expect(dependents).toHaveLength(2);
      expect(dependents[0].name).toBe('Sara Ali Hassan');

      // Test Reward/Refund with requested rewards
      const rewardInput = rewardRefundFixtures.valid.both();
      const rewardResult = await createRewardRefund(testUserId, rewardInput);
      createdRequests.rewardRefunds.push(rewardResult.id);

      const rewardRefund = await getRewardRefundById(rewardResult.id);
      const rewards = typeof rewardRefund.requested_rewards === 'string' 
        ? JSON.parse(rewardRefund.requested_rewards) 
        : rewardRefund.requested_rewards;
      
      expect(Array.isArray(rewards)).toBe(true);
      expect(rewards).toHaveLength(2);

      // Test Airlines Ticket with passengers
      const ticketInput = airlinesTicketFixtures.valid.family();
      const ticketResult = await createAirlinesTicket(testUserId, ticketInput);
      createdRequests.airlinesTickets.push(ticketResult.id);

      const airlinesTicket = await getAirlinesTicketById(ticketResult.id);
      const passengers = typeof airlinesTicket.passengers === 'string' 
        ? JSON.parse(airlinesTicket.passengers) 
        : airlinesTicket.passengers;
      
      expect(Array.isArray(passengers)).toBe(true);
      expect(passengers).toHaveLength(4);
      expect(passengers[0].name).toBe('Khalid Salem Hassan');
    });
  });

  describe('Audit Trail and Timestamps', () => {
    it('should create proper audit trails for all request types', async () => {
      const travelInput = travelOrderFixtures.valid.basic();
      const travelResult = await createTravelOrder(testUserId, travelInput);
      createdRequests.travelOrders.push(travelResult.id);

      const travelOrder = await getTravelOrderById(travelResult.id);
      
      expect(travelOrder.created_at).toBeDefined();
      expect(travelOrder.submitted_at).toBeDefined();
      expect(new Date(travelOrder.created_at)).toBeInstanceOf(Date);
      expect(new Date(travelOrder.submitted_at)).toBeInstanceOf(Date);
    });

    it('should track status changes with proper metadata', async () => {
      const rewardInput = rewardRefundFixtures.valid.vacationRefund();
      const rewardResult = await createRewardRefund(testUserId, rewardInput);
      createdRequests.rewardRefunds.push(rewardResult.id);

      await withConnection(async (conn) => {
        const [history] = await conn.execute(
          `SELECT * FROM Reward_Refund_Status_History 
           WHERE request_id = ? 
           ORDER BY changed_at DESC`,
          [rewardResult.id]
        );

        const historyEntry = (history as any[])[0];
        expect(historyEntry.request_id).toBe(rewardResult.id);
        expect(historyEntry.new_status).toBe('submitted');
        expect(historyEntry.changed_by).toBe(testUserId);
        expect(historyEntry.changed_at).toBeDefined();
        expect(historyEntry.change_notes).toBeDefined();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple concurrent request creations', async () => {
      const promises = [];

      // Create 3 travel orders
      for (let i = 0; i < 3; i++) {
        const input = travelOrderFixtures.valid.basic();
        input.contractor_name = `Contractor ${i + 1}`;
        promises.push(createTravelOrder(testUserId, input));
      }

      // Create 3 reward/refund requests
      for (let i = 0; i < 3; i++) {
        const input = rewardRefundFixtures.valid.endOfService();
        input.name = `Employee ${i + 1}`;
        promises.push(createRewardRefund(testUserId, input));
      }

      // Create 3 airlines tickets
      for (let i = 0; i < 3; i++) {
        const input = airlinesTicketFixtures.valid.single();
        input.employee_name = `Passenger ${i + 1}`;
        promises.push(createAirlinesTicket(testUserId, input));
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(9);
      results.forEach((result, index) => {
        expect(result.id).toBeDefined();
        if (index < 3) {
          createdRequests.travelOrders.push(result.id);
        } else if (index < 6) {
          createdRequests.rewardRefunds.push(result.id);
        } else {
          createdRequests.airlinesTickets.push(result.id);
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid data gracefully across all forms', async () => {
      // Test schema validation for all forms
      const { createTravelOrderSchema } = await import('../travel-order/travel-order.schema');
      const { createRewardRefundSchema } = await import('../reward-refund/reward-refund.schema');
      const { createAirlinesTicketSchema } = await import('../airlines-ticket/airlines-ticket.schema');

      // Invalid travel order (short iqama)
      const invalidTravel = travelOrderFixtures.invalid.shortIqama() as any;
      invalidTravel.sponsor_name = 'Test';
      invalidTravel.sponsor_signature = 'sig';
      invalidTravel.sponsor_signature_date = '2025-11-18';
      invalidTravel.hr_officer_name = 'HR';

      expect(() => createTravelOrderSchema.parse(invalidTravel)).toThrow();

      // Invalid reward/refund (invalid job number)
      const invalidReward = rewardRefundFixtures.invalid.invalidJobNo() as any;
      
      expect(() => createRewardRefundSchema.parse(invalidReward)).toThrow();

      // Invalid airlines ticket (no passengers)
      const invalidTicket = airlinesTicketFixtures.invalid.noPassengers() as any;
      
      expect(() => createAirlinesTicketSchema.parse(invalidTicket)).toThrow();
    });

    it('should fail requests for non-existent users', async () => {
      const travelInput = travelOrderFixtures.valid.basic();
      const rewardInput = rewardRefundFixtures.valid.endOfService();
      const ticketInput = airlinesTicketFixtures.valid.single();

      await expect(createTravelOrder(999999, travelInput)).rejects.toThrow('المستخدم غير موجود');
      await expect(createRewardRefund(999999, rewardInput)).rejects.toThrow('المستخدم غير موجود');
      await expect(createAirlinesTicket(999999, ticketInput)).rejects.toThrow('المستخدم غير موجود');
    });
  });

  describe('Performance and Scalability', () => {
    it('should efficiently retrieve large datasets', async () => {
      const startTime = Date.now();

      await withConnection(async (conn) => {
        await conn.execute('SELECT * FROM NonSaudi_Travel_Order_Requests WHERE employee_id = ?', [testUserId]);
        await conn.execute('SELECT * FROM Reward_Refund_Requests WHERE employee_id = ?', [testUserId]);
        await conn.execute('SELECT * FROM Saudi_Airlines_Ticket_Requests WHERE employee_id = ?', [testUserId]);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1000ms)
      expect(duration).toBeLessThan(1000);
    });
  });
});

