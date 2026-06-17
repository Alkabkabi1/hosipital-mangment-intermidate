/**
 * Exit Request (طلب إنهاء العمل) - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating an exit request
 */
export const createExitSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب').max(255, 'الاسم طويل جداً'),
  employeeNumber: z.string().optional().nullable(),
  employeeIdNumber: z.string().optional().nullable(),
  jobTitle: z.string().min(2, 'الوظيفة مطلوبة').max(255, 'الوظيفة طويلة جداً'),
  department: z.string().min(2, 'القسم مطلوب').max(100, 'القسم طويل جداً'),
  supervisorName: z.string().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().nullable(),
  
  // Open-ended questions
  exitReasons: z.string().optional().nullable(),
  workEnvironment: z.string().optional().nullable(),
  managerRelationship: z.string().optional().nullable(),
  coworkerRelationship: z.string().optional().nullable(),
  suggestions: z.string().optional().nullable(),
});

/**
 * Schema for updating exit request status
 */
export const updateExitStatusSchema = z.object({
  status: z.enum(['submitted', 'approved', 'rejected']),
  adminNotes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export type CreateExitInput = z.infer<typeof createExitSchema>;
export type UpdateExitStatusInput = z.infer<typeof updateExitStatusSchema>;

