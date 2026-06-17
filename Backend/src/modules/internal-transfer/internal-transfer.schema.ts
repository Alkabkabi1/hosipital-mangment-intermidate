import { z } from 'zod';

/**
 * Internal Transfer Request (نقل داخلي) Schema
 */

export const createInternalTransferSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب'),
  employeeNumber: z.string().optional(),
  nationalId: z.string().optional(),
  currentDepartment: z.string().min(2, 'القسم الحالي مطلوب'),
  currentPosition: z.string().min(2, 'المنصب الحالي مطلوب').optional(),
  currentLocation: z.string().optional(),
  hireDate: z.string().optional(),
  yearsOfService: z.string().optional(),
  targetDepartment: z.string().min(2, 'القسم المستهدف مطلوب'),
  targetPosition: z.string().min(2, 'المنصب المستهدف مطلوب').optional(),
  targetLocation: z.string().optional(),
  transferType: z.enum(['permanent', 'temporary', 'secondment']).default('permanent'),
  transferReason: z.string().min(5, 'سبب النقل مطلوب (على الأقل 5 أحرف)'),
  effectiveDate: z.string().min(1, 'تاريخ السريان مطلوب'),
  returnDate: z.string().optional(),
  skillsMatch: z.string().optional(),
  trainingNeeded: z.string().optional(),
  budgetImpact: z.string().optional(),
  requiresRelocation: z.boolean().default(false),
  relocationSupportNeeded: z.boolean().default(false),
  currentManagerApproved: z.boolean().default(false),
  targetManagerApproved: z.boolean().default(false),
  requestNotes: z.string().optional(),
});

export const updateInternalTransferStatusSchema = z.object({
  status: z.string(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateInternalTransferInput = z.infer<typeof createInternalTransferSchema>;
export type UpdateInternalTransferStatusInput = z.infer<typeof updateInternalTransferStatusSchema>;

