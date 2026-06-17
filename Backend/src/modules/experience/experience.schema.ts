/**
 * Experience Certificate Request (شهادة خبرة) - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating an experience certificate request
 */
export const createExperienceSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب').max(255, 'الاسم طويل جداً'),
  employeeNumber: z.string().optional().nullable(),
  position: z.string().min(2, 'الوظيفة مطلوبة').max(255, 'الوظيفة طويلة جداً'),
  department: z.string().min(2, 'القسم مطلوب').max(100, 'القسم طويل جداً'),
  nationality: z.string().min(2, 'الجنسية مطلوبة').max(100, 'الجنسية طويلة جداً'),
  serviceType: z.string().min(2, 'نوع الخدمة مطلوب').max(50, 'نوع الخدمة طويل جداً'),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  reasonForLeaving: z.string().optional().nullable(),
  requestNotes: z.string().optional().nullable(),
});

/**
 * Schema for updating experience certificate status
 */
export const updateExperienceStatusSchema = z.object({
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
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceStatusInput = z.infer<typeof updateExperienceStatusSchema>;

