import { z } from 'zod';

export const createRewardRefundSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  nationality: z.string().min(2, 'الجنسية مطلوبة'),
  position: z.string().min(2, 'المسمى الوظيفي مطلوب'),
  contract_type: z.string().min(2, 'نوع العقد مطلوب'),
  job_no: z.string().regex(/^\d+$/, 'الرقم الوظيفي يجب أن يكون أرقاماً فقط'),
  work_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  record_no: z.string().regex(/^\d+$/, 'رقم السجل يجب أن يكون أرقاماً فقط'),
  contract_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  department: z.string().min(2, 'القسم مطلوب'),
  request_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  
  opt_end_service: z.boolean().optional().default(false),
  opt_vacation_refund: z.boolean().optional().default(false),
  requested_rewards: z.array(z.string()).optional(),
  
  employee_signature: z.string().optional(),
  employee_sign_date: z.string().optional(),
  
  employee_decision: z.enum(['eligible', 'not_eligible']).optional().default('eligible'),
  hr_decision: z.enum(['eligible', 'not_eligible']).optional().default('eligible'),
  non_eligibility_reason: z.string().optional()
});

export const updateRewardRefundStatusSchema = z.object({
  status: z.string(),
  admin_notes: z.string().optional(),
  rejection_reason: z.string().optional()
});

export type CreateRewardRefundInput = z.infer<typeof createRewardRefundSchema>;
export type UpdateRewardRefundStatusInput = z.infer<typeof updateRewardRefundStatusSchema>;

