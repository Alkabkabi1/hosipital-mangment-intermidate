/**
 * Housing Allowance Request (بدل سكن أطباء سعوديين) - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating a housing allowance request
 */
export const createHousingAllowanceSchema = z.object({
  employeeName: z.string().min(2, 'اسم الطبيب مطلوب').max(255, 'الاسم طويل جداً'),
  employeeNumber: z.string().regex(/^\d+$/, 'رقم الموظف يجب أن يكون أرقاماً فقط'),
  jobTitle: z.string().min(2, 'الوظيفة مطلوبة').max(255, 'الوظيفة طويلة جداً'),
  department: z.string().min(2, 'جهة العمل مطلوبة').max(100, 'جهة العمل طويلة جداً'),
  nationality: z.string().min(2, 'الجنسية مطلوبة').max(100, 'الجنسية طويلة جداً').default('سعودي'),
  letterDate: z.string().min(1, 'تاريخ الخطاب مطلوب'),
  hijriDate: z.string().optional(),
  housingDirector: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  socialStatus: z.string().optional(),
  allowanceReason: z.string().optional(),
  housingManagerNote: z.string().optional(),
  financeNote: z.string().optional(),
  financeName: z.string().optional(),
  hrDirector: z.string().optional(),
  employeeNotes: z.string().optional(),
});

/**
 * Schema for updating housing allowance status
 */
export const updateHousingAllowanceStatusSchema = z.object({
  status: z.string().min(1, 'الحالة مطلوبة'),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateHousingAllowanceInput = z.infer<typeof createHousingAllowanceSchema>;
export type UpdateHousingAllowanceStatusInput = z.infer<typeof updateHousingAllowanceStatusSchema>;
