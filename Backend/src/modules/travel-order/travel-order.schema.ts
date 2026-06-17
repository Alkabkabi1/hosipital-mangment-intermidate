import { z } from 'zod';

/**
 * Non-Saudi Travel Order Request Schema
 */

export const createTravelOrderSchema = z.object({
  contractor_name: z.string().min(2, 'اسم المتعاقد مطلوب'),
  job_title: z.string().min(2, 'المسمى الوظيفي مطلوب'),
  department: z.string().min(2, 'القسم مطلوب'),
  nationality: z.string().min(2, 'الجنسية مطلوبة'),
  iqama_number: z.string().regex(/^\d{10,}$/, 'رقم الإقامة يجب أن يكون 10 أرقام على الأقل'),
  passport_number: z.string().min(5, 'رقم الجواز مطلوب'),
  employee_number: z.string().optional(),
  contact_number: z.string().optional(),
  travel_destination: z.string().min(2, 'الوجهة مطلوبة'),
  
  work_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  work_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  work_duration_days: z.number().int().min(1).optional(),
  
  dependents_start_date: z.string().optional(),
  dependents_end_date: z.string().optional(),
  dependents_duration_days: z.number().int().optional(),
  
  dependents: z.array(z.object({
    name: z.string(),
    relation: z.string(),
    nationality: z.string(),
    iqama: z.string(),
    passport: z.string(),
    notes: z.string().optional()
  })).optional(),
  
  sponsor_name: z.string().min(2, 'اسم المتعهد مطلوب'),
  sponsor_id: z.string().optional(),
  sponsor_commitment: z.string().optional(),
  sponsor_signature: z.string().min(1, 'التوقيع مطلوب'),
  sponsor_signature_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  
  director_signature: z.string().optional(),
  director_notes: z.string().optional(),
  
  checklist: z.object({
    form_approved: z.boolean().optional(),
    residence_valid: z.boolean().optional(),
    passport_copies: z.boolean().optional(),
    housing_form: z.boolean().optional(),
    pdf_upload: z.boolean().optional(),
    other_notes: z.boolean().optional()
  }).optional(),
  
  hr_officer_name: z.string().min(1, 'اسم الموظف المختص مطلوب'),
  hr_officer_signature: z.string().optional(),
  hr_officer_stamp: z.string().optional(),
  
  hr_manager_name: z.string().optional(),
  hr_manager_signature: z.string().optional(),
  hr_manager_stamp: z.string().optional()
});

export const updateTravelOrderStatusSchema = z.object({
  status: z.string(),
  admin_notes: z.string().optional(),
  rejection_reason: z.string().optional()
});

export type CreateTravelOrderInput = z.infer<typeof createTravelOrderSchema>;
export type UpdateTravelOrderStatusInput = z.infer<typeof updateTravelOrderStatusSchema>;

