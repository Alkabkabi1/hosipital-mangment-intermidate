import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAirlinesTicket,
  getUserAirlinesTickets,
  getAirlinesTicketById,
  getAllAirlinesTickets,
  updateAirlinesTicketStatus
} from './airlines-ticket.service';
import { withConnection } from '../../core/database';
import type { CreateAirlinesTicketInput } from './airlines-ticket.schema';

/**
 * Airlines Ticket Module Test Suite
 * Tests all CRUD operations and business logic for Saudi Airlines Ticket Requests
 */

describe('Airlines Ticket Module', () => {
  let testUserId: number;
  let testRequestId: number;
  let adminUserId: number;

  beforeAll(async () => {
    // Create test user
    await withConnection(async (conn) => {
      const [result] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['test.airlines@test.com', 'Test Airlines User', 'hash123', 'EMP003', 'employee']
      );
      testUserId = (result as any).insertId;

      // Create admin user
      const [adminResult] = await conn.execute(
        `INSERT INTO App_Users (email, name, password_hash, employee_number, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin.airlines@test.com', 'Admin Airlines User', 'hash456', 'ADM003', 'admin']
      );
      adminUserId = (adminResult as any).insertId;
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?', [testRequestId]);
      await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Requests WHERE employee_id IN (?, ?)', [testUserId, adminUserId]);
      await conn.execute('DELETE FROM App_Users WHERE id IN (?, ?)', [testUserId, adminUserId]);
    });
  });

  describe('Airlines Ticket Creation', () => {
    it('should create a valid airlines ticket request', async () => {
      const validInput: CreateAirlinesTicketInput = {
        request_date: '2025-11-18',
        letter_hijri_date: '1447/05/17',
        department: 'Human Resources',
        employee_name: 'Abdullah Mohammed',
        employee_number: '12345',
        contact_number: '+966501234567',
        route_origin: 'Riyadh',
        route_return: 'Jeddah',
        travel_start_date: '2025-12-01',
        travel_class: 'الدرجة السياحية (المخفضة)',
        passengers: [
          {
            index: 1,
            name: 'Abdullah Mohammed',
            birth_date: '1985-05-15',
            notes: 'Employee'
          }
        ]
      };

      const result = await createAirlinesTicket(testUserId, validInput);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.message).toContain('تم تقديم طلب تذاكر الطيران بنجاح');
      
      testRequestId = result.id;
    });

    it('should create request with multiple passengers', async () => {
      const multiPassengerInput: CreateAirlinesTicketInput = {
        request_date: '2025-11-18',
        department: 'IT Department',
        employee_name: 'Khalid Salem',
        employee_number: '54321',
        route_origin: 'Dammam',
        route_stop1: 'Riyadh',
        route_stop2: 'Jeddah',
        route_return: 'Dammam',
        travel_start_date: '2025-12-15',
        passengers: [
          {
            index: 1,
            name: 'Khalid Salem',
            birth_date: '1980-03-20',
            notes: 'Employee'
          },
          {
            index: 2,
            name: 'Nora Khalid',
            birth_date: '1982-07-10',
            notes: 'Spouse'
          },
          {
            index: 3,
            name: 'Omar Khalid',
            birth_date: '2010-01-15',
            notes: 'Child'
          }
        ]
      };

      const result = await createAirlinesTicket(testUserId, multiPassengerInput);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Verify passengers are stored
      const request = await getAirlinesTicketById(result.id);
      const passengers = typeof request.passengers === 'string' 
        ? JSON.parse(request.passengers) 
        : request.passengers;
      expect(passengers).toHaveLength(3);
      expect(passengers[0].name).toBe('Khalid Salem');
      expect(passengers[1].name).toBe('Nora Khalid');
      expect(passengers[2].name).toBe('Omar Khalid');

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should create request with multi-stop route', async () => {
      const multiStopInput: CreateAirlinesTicketInput = {
        request_date: '2025-11-18',
        department: 'Finance',
        employee_name: 'Fahad Ahmed',
        employee_number: '99999',
        route_origin: 'Riyadh',
        route_stop1: 'Jeddah',
        route_stop2: 'Medina',
        route_return: 'Riyadh',
        travel_start_date: '2025-12-20',
        passengers: [
          {
            index: 1,
            name: 'Fahad Ahmed',
            birth_date: '1975-11-30'
          }
        ]
      };

      const result = await createAirlinesTicket(testUserId, multiStopInput);
      const request = await getAirlinesTicketById(result.id);

      expect(request.route_origin).toBe('Riyadh');
      expect(request.route_stop1).toBe('Jeddah');
      expect(request.route_stop2).toBe('Medina');
      expect(request.route_return).toBe('Riyadh');

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should fail with invalid employee number format', async () => {
      const { createAirlinesTicketSchema } = await import('./airlines-ticket.schema');
      const invalidInput = {
        request_date: '2025-11-18',
        department: 'HR',
        employee_name: 'Test User',
        employee_number: 'EMP-ABC', // Invalid: should be numeric
        route_origin: 'Riyadh',
        route_return: 'Jeddah',
        travel_start_date: '2025-12-01',
        passengers: [
          {
            index: 1,
            name: 'Test User',
            birth_date: '1990-01-01'
          }
        ]
      };

      // Test schema validation
      expect(() => createAirlinesTicketSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with invalid date format', async () => {
      const { createAirlinesTicketSchema } = await import('./airlines-ticket.schema');
      const invalidInput = {
        request_date: '18-11-2025', // Invalid format
        department: 'HR',
        employee_name: 'Test User',
        employee_number: '12345',
        route_origin: 'Riyadh',
        route_return: 'Jeddah',
        travel_start_date: '2025-12-01',
        passengers: [
          {
            index: 1,
            name: 'Test User'
          }
        ]
      };

      // Test schema validation
      expect(() => createAirlinesTicketSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with no passengers', async () => {
      const { createAirlinesTicketSchema } = await import('./airlines-ticket.schema');
      const invalidInput = {
        request_date: '2025-11-18',
        department: 'HR',
        employee_name: 'Test User',
        employee_number: '12345',
        route_origin: 'Riyadh',
        route_return: 'Jeddah',
        travel_start_date: '2025-12-01',
        passengers: [] // Invalid: at least one passenger required
      };

      // Test schema validation
      expect(() => createAirlinesTicketSchema.parse(invalidInput)).toThrow();
    });

    it('should fail with non-existent user', async () => {
      const validInput: CreateAirlinesTicketInput = {
        request_date: '2025-11-18',
        department: 'HR',
        employee_name: 'Test User',
        employee_number: '12345',
        route_origin: 'Riyadh',
        route_return: 'Jeddah',
        travel_start_date: '2025-12-01',
        passengers: [
          {
            index: 1,
            name: 'Test User'
          }
        ]
      };

      await expect(
        createAirlinesTicket(999999, validInput)
      ).rejects.toThrow('المستخدم غير موجود');
    });
  });

  describe('Airlines Ticket Retrieval', () => {
    it('should retrieve user airlines ticket requests', async () => {
      const requests = await getUserAirlinesTickets(testUserId);
      
      expect(requests).toBeDefined();
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0]).toHaveProperty('employee_name');
      expect(requests[0]).toHaveProperty('route_origin');
      expect(requests[0]).toHaveProperty('status');
    });

    it('should retrieve airlines ticket request by ID', async () => {
      const request = await getAirlinesTicketById(testRequestId);
      
      expect(request).toBeDefined();
      expect(request.id).toBe(testRequestId);
      expect(request.employee_name).toBe('Abdullah Mohammed');
      expect(request.route_origin).toBe('Riyadh');
      expect(request.route_return).toBe('Jeddah');
      expect(request.status).toBe('submitted');
    });

    it('should fail to retrieve non-existent request', async () => {
      await expect(
        getAirlinesTicketById(999999)
      ).rejects.toThrow('الطلب غير موجود');
    });

    it('should retrieve all airlines ticket requests (admin)', async () => {
      const allRequests = await getAllAirlinesTickets();
      
      expect(allRequests).toBeDefined();
      expect(Array.isArray(allRequests)).toBe(true);
      expect(allRequests.length).toBeGreaterThan(0);
      expect(allRequests[0]).toHaveProperty('employee_email');
    });
  });

  describe('Airlines Ticket Status Updates', () => {
    it('should update airlines ticket status to approved', async () => {
      const updateInput = {
        status: 'approved',
        admin_notes: 'Ticket request approved by HR Manager'
      };

      const result = await updateAirlinesTicketStatus(testRequestId, updateInput, adminUserId);
      
      expect(result).toBeDefined();
      expect(result.message).toContain('تم تحديث حالة الطلب بنجاح');

      // Verify status was updated
      const request = await getAirlinesTicketById(testRequestId);
      expect(request.status).toBe('approved');
      expect(request.admin_notes).toBe('Ticket request approved by HR Manager');
    });

    it('should update status to rejected with reason', async () => {
      const updateInput = {
        status: 'rejected',
        admin_notes: 'Request rejected',
        rejection_reason: 'Invalid travel dates'
      };

      const result = await updateAirlinesTicketStatus(testRequestId, updateInput, adminUserId);
      
      expect(result).toBeDefined();

      const request = await getAirlinesTicketById(testRequestId);
      expect(request.status).toBe('rejected');
      expect(request.rejection_reason).toBe('Invalid travel dates');
    });

    it('should create status history entry on update', async () => {
      await withConnection(async (conn) => {
        const [history] = await conn.execute(
          'SELECT * FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ? ORDER BY changed_at DESC LIMIT 1',
          [testRequestId]
        );

        expect(Array.isArray(history)).toBe(true);
        expect((history as any[]).length).toBeGreaterThan(0);
        expect((history as any[])[0]).toHaveProperty('old_status');
        expect((history as any[])[0]).toHaveProperty('new_status');
        // The most recent status should be rejected (from previous test)
        const latestHistory = (history as any[])[0];
        expect(['rejected', 'approved']).toContain(latestHistory.new_status);
      });
    });

    it('should fail to update non-existent request', async () => {
      const updateInput = {
        status: 'approved',
        admin_notes: 'Test'
      };

      await expect(
        updateAirlinesTicketStatus(999999, updateInput, adminUserId)
      ).rejects.toThrow('الطلب غير موجود');
    });
  });

  describe('Airlines Ticket Business Logic', () => {
    it('should use default travel class when not specified', async () => {
      const inputNoClass: CreateAirlinesTicketInput = {
        request_date: '2025-11-18',
        department: 'HR',
        employee_name: 'Test User',
        employee_number: '77777',
        route_origin: 'Riyadh',
        route_return: 'Jeddah',
        travel_start_date: '2025-12-01',
        passengers: [
          {
            index: 1,
            name: 'Test User'
          }
        ]
      };

      const result = await createAirlinesTicket(testUserId, inputNoClass);
      const request = await getAirlinesTicketById(result.id);

      expect(request.travel_class).toBe('الدرجة السياحية (المخفضة)');

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should use default closing greeting when not specified', async () => {
      const request = await getAirlinesTicketById(testRequestId);
      
      expect(request.closing_greeting).toBeDefined();
      // Default value is set in schema or service
    });

    it('should use default HR director name when not specified', async () => {
      const request = await getAirlinesTicketById(testRequestId);
      
      expect(request.hr_director_name).toBeDefined();
      // Default value: 'أ / بدر عبيد الله العازمي'
    });

    it('should store passengers as JSON array', async () => {
      const request = await getAirlinesTicketById(testRequestId);
      const passengers = typeof request.passengers === 'string' 
        ? JSON.parse(request.passengers) 
        : request.passengers;
      
      expect(Array.isArray(passengers)).toBe(true);
      expect(passengers.length).toBeGreaterThan(0);
      expect(passengers[0]).toHaveProperty('name');
      expect(passengers[0]).toHaveProperty('index');
    });

    it('should preserve multi-approval fields', async () => {
      const request = await getAirlinesTicketById(testRequestId);
      
      expect(request).toHaveProperty('status');
      expect(request).toHaveProperty('approval_stage');
      expect(request).toHaveProperty('final_decision');
      expect(request.approval_stage).toBe('Pending Review');
      expect(request.final_decision).toBe('pending');
    });

    it('should handle optional route stops correctly', async () => {
      const simpleRouteInput: CreateAirlinesTicketInput = {
        request_date: '2025-11-18',
        department: 'Engineering',
        employee_name: 'Simple Route User',
        employee_number: '11111',
        route_origin: 'Riyadh',
        route_return: 'Dammam',
        travel_start_date: '2025-12-01',
        passengers: [
          {
            index: 1,
            name: 'Simple Route User'
          }
        ]
      };

      const result = await createAirlinesTicket(testUserId, simpleRouteInput);
      const request = await getAirlinesTicketById(result.id);

      expect(request.route_origin).toBe('Riyadh');
      expect(request.route_return).toBe('Dammam');
      expect(request.route_stop1).toBeNull();
      expect(request.route_stop2).toBeNull();

      // Cleanup
      await withConnection(async (conn) => {
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Status_History WHERE request_id = ?', [result.id]);
        await conn.execute('DELETE FROM Saudi_Airlines_Ticket_Requests WHERE id = ?', [result.id]);
      });
    });

    it('should validate passenger data structure', async () => {
      const request = await getAirlinesTicketById(testRequestId);
      const passengers = typeof request.passengers === 'string' 
        ? JSON.parse(request.passengers) 
        : request.passengers;
      
      passengers.forEach((passenger: any) => {
        expect(passenger).toHaveProperty('index');
        expect(passenger).toHaveProperty('name');
        expect(passenger.name).toBeTruthy();
        expect(typeof passenger.index).toBe('number');
      });
    });
  });
});

