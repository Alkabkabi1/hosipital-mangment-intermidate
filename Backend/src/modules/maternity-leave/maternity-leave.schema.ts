/**
 * Maternity Leave Request (طلب إجازة رعاية مولود) - Validation Schemas
 */

import { z } from 'zod';

/**
 * Schema for creating a maternity leave request
 */
export const createMaternityLeaveSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب').max(255, 'الاسم طويل جداً'),
  jobTitle: z.string().min(2, 'المسمى الوظيفي مطلوب').max(255, 'المسمى الوظيفي طويل جداً'),
  employeeId: z.string().regex(/^\d{10}$/, 'رقم الهوية يجب أن يكون 10 أرقام'),
  serviceType: z.enum(['خدمة مدنية', 'تشغيل ذاتي'], {
    message: 'نوع الوظيفة غير صحيح'
  }),
  department: z.string().min(2, 'الإدارة/القسم مطلوب').max(100, 'اسم الإدارة طويل جداً'),
  appointmentDate: z.string().optional(),
  requestType: z.enum(['new', 'extension']).default('new'),
  leaveFromDate: z.string().min(1, 'تاريخ بداية الإجازة مطلوب'),
  leaveToDate: z.string().min(1, 'تاريخ نهاية الإجازة مطلوب'),
  leaveDuration: z.number().min(1, 'مدة الإجازة يجب أن تكون أكبر من صفر'),
  employeeSignature: z.string().optional(),
  pledgeDate: z.string().optional(),
  approvalOption: z.enum(['approve', 'defer']).default('approve'),
  deferPeriod: z.string().optional(),
  managerName: z.string().optional(),
  managerSignature: z.string().optional(),
  attachBirthNoticeName: z.string().optional(),
  attachBirthCertName: z.string().optional(),
});

/**
 * Schema for updating maternity leave status
 */
export const updateMaternityLeaveStatusSchema = z.object({
  status: z.string().min(1, 'الحالة مطلوبة'),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateMaternityLeaveInput = z.infer<typeof createMaternityLeaveSchema>;
export type UpdateMaternityLeaveStatusInput = z.infer<typeof updateMaternityLeaveStatusSchema>;
