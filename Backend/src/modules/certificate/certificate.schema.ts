/**
 * Certificate Request (شهادة تعريف) - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating a certificate request
 */
export const createCertificateSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب').max(255, 'الاسم طويل جداً'),
  occupation: z.string().optional(), // Made optional to match frontend
  jobTitle: z.string().optional(), // Add jobTitle as alternative
  department: z.string().optional(), // Add missing department field
  iqamaNumber: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  nationality: z.string().min(2, 'الجنسية مطلوبة').max(100, 'الجنسية طويلة جداً'),
  educationPlace: z.string().optional().nullable(),
  requestNotes: z.string().optional().nullable(),
});

/**
 * Schema for updating certificate status
 */
export const updateCertificateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'in_progress', 
    'approved',
    'rejected',
    'completed',
    'cancelled'
  ]),
  adminNotes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type UpdateCertificateStatusInput = z.infer<typeof updateCertificateStatusSchema>;

