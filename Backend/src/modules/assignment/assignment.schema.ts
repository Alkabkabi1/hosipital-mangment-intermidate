import { z } from 'zod';

/**
 * Assignment Request (قرار تكليف) Schema
 */

export const createAssignmentSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب'),
  employeeNumber: z.string().optional(),
  nationalId: z.string().optional(),
  currentDepartment: z.string().optional(),
  currentPosition: z.string().optional(),
  currentLocation: z.string().optional(),
  assignmentType: z.enum(['temporary', 'permanent', 'project_based', 'acting']),
  newRole: z.string().min(2, 'الدور الجديد مطلوب'),
  newDepartment: z.string().optional(),
  assignmentReason: z.string().min(5, 'سبب التكليف مطلوب (على الأقل 5 أحرف)'),
  startDate: z.string().min(1, 'تاريخ البدء مطلوب'),
  endDate: z.string().optional(),
  expectedDuration: z.string().optional(),
  additionalBenefits: z.string().optional(),
  financialImpact: z.string().optional(),
  requiresRelocation: z.boolean().default(false),
  requestNotes: z.string().optional(),
});

export const updateAssignmentStatusSchema = z.object({
  status: z.string(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;

