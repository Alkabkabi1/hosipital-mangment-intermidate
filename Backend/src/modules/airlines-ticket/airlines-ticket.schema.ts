import { z } from 'zod';

export const createAirlinesTicketSchema = z.object({
  request_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  letter_hijri_date: z.string().optional(),
  department: z.string().min(2, 'القسم/الإدارة مطلوب'),
  employee_name: z.string().min(2, 'اسم الموظف مطلوب'),
  employee_number: z.string().regex(/^\d+$/, 'الرقم الوظيفي يجب أن يكون أرقاماً فقط'),
  contact_number: z.string().optional(),
  
  route_origin: z.string().min(2, 'المدينة الأولى مطلوبة'),
  route_stop1: z.string().optional(),
  route_stop2: z.string().optional(),
  route_return: z.string().min(2, 'المدينة الأخيرة مطلوبة'),
  travel_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  travel_class: z.string().optional().default('الدرجة السياحية (المخفضة)'),
  
  passengers: z.array(z.object({
    index: z.number(),
    name: z.string().min(1, 'اسم المسافر مطلوب'),
    birth_date: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'يجب إضافة مسافر واحد على الأقل'),
  
  closing_greeting: z.string().optional().default('مع أطيب تحياتي،'),
  hr_director_name: z.string().optional().default('أ / بدر عبيد الله العازمي'),
  additional_notes: z.string().optional()
});

export const updateAirlinesTicketStatusSchema = z.object({
  status: z.string(),
  admin_notes: z.string().optional(),
  rejection_reason: z.string().optional()
});

export type CreateAirlinesTicketInput = z.infer<typeof createAirlinesTicketSchema>;
export type UpdateAirlinesTicketStatusInput = z.infer<typeof updateAirlinesTicketStatusSchema>;

