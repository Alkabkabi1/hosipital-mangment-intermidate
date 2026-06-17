import { z } from 'zod';

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
});

export const createDelegationSchema = z.object({
  referenceNumber: z.string().min(3).optional().default(() => `DEL-${Date.now()}`),
  requestDate: isoDate.optional().default(() => new Date().toISOString().split('T')[0]),
  delegationType: z.string().min(2),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  reason: z.string().max(2000).optional(),
  delegatedToEmployeeId: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateDelegationInput = z.infer<typeof createDelegationSchema>;

export const updateDelegationStatusSchema = z.object({
  status: z.string().min(2),
  reason: z.string().max(2000).optional(),
});

export type UpdateDelegationStatusInput = z.infer<typeof updateDelegationStatusSchema>;

export const addDelegationSignatureSchema = z.object({
  departmentId: z.number().int().positive(),
  signerName: z.string().min(2),
  signerTitle: z.string().min(2),
  signatureDate: isoDate,
  comment: z.string().max(2000).optional(),
});

export type AddDelegationSignatureInput = z.infer<typeof addDelegationSignatureSchema>;
