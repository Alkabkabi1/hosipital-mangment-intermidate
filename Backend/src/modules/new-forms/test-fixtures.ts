/**
 * Test Fixtures for New Request Forms
 * Provides reusable test data for Travel Orders, Reward/Refund, and Airlines Tickets
 */

import type { CreateTravelOrderInput } from '../travel-order/travel-order.schema';
import type { CreateRewardRefundInput } from '../reward-refund/reward-refund.schema';
import type { CreateAirlinesTicketInput } from '../airlines-ticket/airlines-ticket.schema';

/**
 * Travel Order Test Fixtures
 */
export const travelOrderFixtures = {
  valid: {
    basic: (): CreateTravelOrderInput => ({
      contractor_name: 'Ahmed Mohammed Ali',
      job_title: 'Senior Software Engineer',
      department: 'Information Technology',
      nationality: 'Egyptian',
      iqama_number: '1234567890',
      passport_number: 'AB123456',
      employee_number: 'EMP001',
      contact_number: '+966501234567',
      travel_destination: 'Cairo, Egypt',
      work_start_date: '2025-12-01',
      work_end_date: '2025-12-15',
      work_duration_days: 15,
      sponsor_name: 'Mohammed Ali Hassan',
      sponsor_signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      sponsor_signature_date: '2025-11-18',
      hr_officer_name: 'HR Officer Name'
    }),

    withDependents: (): CreateTravelOrderInput => ({
      contractor_name: 'Ali Hassan Ibrahim',
      job_title: 'Project Manager',
      department: 'Engineering Department',
      nationality: 'Indian',
      iqama_number: '9876543210',
      passport_number: 'CD789012',
      travel_destination: 'Mumbai, India',
      work_start_date: '2025-12-10',
      work_end_date: '2025-12-25',
      work_duration_days: 16,
      dependents: [
        {
          name: 'Sara Ali Hassan',
          relation: 'Spouse',
          nationality: 'Indian',
          iqama: '1111111111',
          passport: 'EF345678',
          notes: 'Accompanying spouse'
        },
        {
          name: 'Omar Ali Hassan',
          relation: 'Son',
          nationality: 'Indian',
          iqama: '2222222222',
          passport: 'EF345679',
          notes: 'Minor child'
        }
      ],
      dependents_start_date: '2025-12-10',
      dependents_end_date: '2025-12-25',
      dependents_duration_days: 16,
      sponsor_name: 'Hassan Ahmed Mohammed',
      sponsor_signature: 'data:image/png;base64,signature',
      sponsor_signature_date: '2025-11-18',
      hr_officer_name: 'HR Manager'
    }),

    withChecklist: (): CreateTravelOrderInput => ({
      contractor_name: 'Khalid Abdullah Salem',
      job_title: 'Network Administrator',
      department: 'IT Infrastructure',
      nationality: 'Filipino',
      iqama_number: '5555555555',
      passport_number: 'PH123456',
      travel_destination: 'Manila, Philippines',
      work_start_date: '2025-12-05',
      work_end_date: '2025-12-20',
      work_duration_days: 16,
      checklist: {
        form_approved: true,
        residence_valid: true,
        passport_copies: true,
        housing_form: true,
        pdf_upload: true,
        other_notes: false
      },
      sponsor_name: 'Abdullah Salem',
      sponsor_signature: 'data:image/png;base64,signature',
      sponsor_signature_date: '2025-11-18',
      hr_officer_name: 'Senior HR Officer'
    })
  },

  invalid: {
    shortIqama: (): Partial<CreateTravelOrderInput> => ({
      contractor_name: 'Test User',
      job_title: 'Engineer',
      department: 'IT',
      nationality: 'Pakistani',
      iqama_number: '123', // Invalid: less than 10 digits
      passport_number: 'GH123456',
      travel_destination: 'Karachi',
      work_start_date: '2025-12-01',
      work_end_date: '2025-12-10'
    }),

    invalidDateFormat: (): Partial<CreateTravelOrderInput> => ({
      contractor_name: 'Test User',
      job_title: 'Engineer',
      department: 'IT',
      nationality: 'Pakistani',
      iqama_number: '1234567890',
      passport_number: 'GH123456',
      travel_destination: 'Karachi',
      work_start_date: '01-12-2025', // Invalid format
      work_end_date: '2025-12-10'
    })
  }
};

/**
 * Reward/Refund Test Fixtures
 */
export const rewardRefundFixtures = {
  valid: {
    endOfService: (): CreateRewardRefundInput => ({
      name: 'Khalid Abdullah Mohammed',
      nationality: 'Saudi',
      position: 'Senior Accountant',
      contract_type: 'Permanent',
      job_no: '12345',
      work_start: '2020-01-15',
      record_no: '98765',
      contract_end: '2025-12-31',
      department: 'Finance Department',
      request_date: '2025-11-18',
      opt_end_service: true,
      opt_vacation_refund: false,
      requested_rewards: ['End of Service Reward'],
      employee_decision: 'eligible',
      hr_decision: 'eligible'
    }),

    vacationRefund: (): CreateRewardRefundInput => ({
      name: 'Mohammed Salem Ahmed',
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
    }),

    both: (): CreateRewardRefundInput => ({
      name: 'Fatima Hassan Abdullah',
      nationality: 'Egyptian',
      position: 'Senior Nurse',
      contract_type: 'Contract',
      job_no: '77777',
      work_start: '2019-03-15',
      record_no: '22222',
      contract_end: '2025-03-15',
      department: 'Nursing Department',
      request_date: '2025-11-18',
      opt_end_service: true,
      opt_vacation_refund: true,
      requested_rewards: ['End of Service Reward', 'Vacation Compensation'],
      employee_decision: 'eligible',
      hr_decision: 'eligible'
    }),

    notEligible: (): CreateRewardRefundInput => ({
      name: 'Ahmed Ibrahim Hassan',
      nationality: 'Pakistani',
      position: 'Maintenance Technician',
      contract_type: 'Temporary',
      job_no: '99999',
      work_start: '2024-01-01',
      record_no: '88888',
      contract_end: '2024-12-31',
      department: 'Maintenance',
      request_date: '2025-11-18',
      opt_end_service: true,
      opt_vacation_refund: false,
      employee_decision: 'not_eligible',
      hr_decision: 'not_eligible',
      non_eligibility_reason: 'Contract duration less than minimum required period'
    })
  },

  invalid: {
    invalidJobNo: (): Partial<CreateRewardRefundInput> => ({
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
    }),

    invalidRecordNo: (): Partial<CreateRewardRefundInput> => ({
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
    })
  }
};

/**
 * Airlines Ticket Test Fixtures
 */
export const airlinesTicketFixtures = {
  valid: {
    single: (): CreateAirlinesTicketInput => ({
      request_date: '2025-11-18',
      letter_hijri_date: '1447/05/17',
      department: 'Human Resources',
      employee_name: 'Abdullah Mohammed Ali',
      employee_number: '12345',
      contact_number: '+966501234567',
      route_origin: 'Riyadh',
      route_return: 'Jeddah',
      travel_start_date: '2025-12-01',
      travel_class: 'الدرجة السياحية (المخفضة)',
      closing_greeting: 'وتقبلوا فائق الاحترام والتقدير',
      hr_director_name: 'د. عبدالله المحمد',
      passengers: [
        {
          index: 1,
          name: 'Abdullah Mohammed Ali',
          birth_date: '1985-05-15',
          notes: 'Employee traveling alone'
        }
      ]
    }),

    family: (): CreateAirlinesTicketInput => ({
      request_date: '2025-11-18',
      department: 'IT Department',
      employee_name: 'Khalid Salem Hassan',
      employee_number: '54321',
      route_origin: 'Dammam',
      route_return: 'Riyadh',
      travel_start_date: '2025-12-15',
      travel_class: 'الدرجة السياحية (المخفضة)',
      closing_greeting: 'وتقبلوا فائق الاحترام والتقدير',
      hr_director_name: 'د. عبدالله المحمد',
      passengers: [
        {
          index: 1,
          name: 'Khalid Salem Hassan',
          birth_date: '1980-03-20',
          notes: 'Employee'
        },
        {
          index: 2,
          name: 'Nora Khalid Salem',
          birth_date: '1982-07-10',
          notes: 'Spouse'
        },
        {
          index: 3,
          name: 'Omar Khalid Salem',
          birth_date: '2010-01-15',
          notes: 'Child'
        },
        {
          index: 4,
          name: 'Sara Khalid Salem',
          birth_date: '2012-05-20',
          notes: 'Child'
        }
      ]
    }),

    multiStop: (): CreateAirlinesTicketInput => ({
      request_date: '2025-11-18',
      department: 'Finance Department',
      employee_name: 'Fahad Ahmed Ibrahim',
      employee_number: '99999',
      route_origin: 'Riyadh',
      route_stop1: 'Jeddah',
      route_stop2: 'Medina',
      route_return: 'Riyadh',
      travel_start_date: '2025-12-20',
      travel_class: 'الدرجة الأولى',
      closing_greeting: 'وتقبلوا فائق الاحترام والتقدير',
      hr_director_name: 'د. عبدالله المحمد',
      passengers: [
        {
          index: 1,
          name: 'Fahad Ahmed Ibrahim',
          birth_date: '1975-11-30',
          notes: 'Business trip'
        }
      ]
    })
  },

  invalid: {
    noPassengers: (): Partial<CreateAirlinesTicketInput> => ({
      request_date: '2025-11-18',
      department: 'HR',
      employee_name: 'Test User',
      employee_number: '12345',
      route_origin: 'Riyadh',
      route_return: 'Jeddah',
      travel_start_date: '2025-12-01',
      passengers: [] // Invalid: at least one passenger required
    }),

    invalidEmployeeNo: (): Partial<CreateAirlinesTicketInput> => ({
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
          name: 'Test User'
        }
      ]
    })
  }
};

/**
 * Test User Fixtures
 */
export const testUserFixtures = {
  employee: {
    email: 'test.employee@hospital.test',
    name: 'Test Employee User',
    password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    employee_number: 'TEST001',
    role: 'employee'
  },

  admin: {
    email: 'test.admin@hospital.test',
    name: 'Test Admin User',
    password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    employee_number: 'ADM001',
    role: 'admin'
  },

  hrManager: {
    email: 'test.hrmanager@hospital.test',
    name: 'Test HR Manager',
    password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    employee_number: 'HRM001',
    role: 'hr_manager'
  }
};

