import { z } from 'zod';

/**
 * Assignment Termination Request (إنهاء تكليف) Schema
 */

export const createAssignmentTerminationSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب'),
  employeeNumber: z.string().optional(),
  nationalId: z.string().optional(),
  originalAssignmentId: z.number().optional(),
  assignmentRole: z.string().min(2, 'دور التكليف مطلوب'),
  assignmentDepartment: z.string().optional(),
  assignmentStartDate: z.string().optional(),
  terminationReason: z.string().min(5, 'سبب الإنهاء مطلوب (على الأقل 5 أحرف)'),
  terminationDate: z.string().min(1, 'تاريخ الإنهاء مطلوب'),
  earlyTermination: z.boolean().default(false),
  returnToDepartment: z.string().optional(),
  returnToPosition: z.string().optional(),
  returnDate: z.string().optional(),
  assignmentPerformance: z.string().optional(),
  lessonsLearned: z.string().optional(),
  requestNotes: z.string().optional(),
});

export const updateAssignmentTerminationStatusSchema = z.object({
  status: z.string(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateAssignmentTerminationInput = z.infer<typeof createAssignmentTerminationSchema>;
export type UpdateAssignmentTerminationStatusInput = z.infer<typeof updateAssignmentTerminationStatusSchema>;

