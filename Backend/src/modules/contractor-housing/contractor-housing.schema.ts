import { z } from 'zod';

/**
 * Contractor Housing Allowance Request Schema
 */

export const createContractorHousingSchema = z.object({
  employeeName: z.string().min(2, 'اسم الموظف مطلوب'),
  employeeJob: z.string().min(2, 'الوظيفة مطلوبة'),
  employeeNumber: z.string().min(1, 'رقم الموظف مطلوب'),
  employeeIdNumber: z.string().min(1, 'رقم الهوية مطلوب'),
  employeeNationality: z.string().min(2, 'الجنسية مطلوبة'),
  contractYearStart: z.string().min(1, 'تاريخ بداية السنة التعاقدية مطلوب'),
  contractYearEnd: z.string().min(1, 'تاريخ نهاية السنة التعاقدية مطلوب'),
  familyMembers: z.number().int().min(0).default(1),
  requestDate: z.string().min(1, 'تاريخ الطلب مطلوب'),
  competentEmployeeName: z.string().optional(),
  housingHeadName: z.string().optional(),
  hrDirectorName: z.string().optional(),
  requestNotes: z.string().optional(),
});

export const updateContractorHousingStatusSchema = z.object({
  status: z.string().min(1, 'الحالة مطلوبة'),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type CreateContractorHousingDTO = z.infer<typeof createContractorHousingSchema>;
export type UpdateContractorHousingStatusDTO = z.infer<typeof updateContractorHousingStatusSchema>;

