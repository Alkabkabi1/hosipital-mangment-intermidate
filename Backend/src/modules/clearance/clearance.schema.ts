import { z } from 'zod';

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
});

export const createClearanceSchema = z.object({
  referenceNumber: z.string().min(3),
  requestDate: isoDate,
  effectiveDate: isoDate,
  lastWorkingDay: isoDate.optional(),
  reason: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateClearanceInput = z.infer<typeof createClearanceSchema>;

export const updateClearanceStatusSchema = z.object({
  status: z.string().min(2),
  rejectionReason: z.string().max(2000).optional(),
});

export type UpdateClearanceStatusInput = z.infer<typeof updateClearanceStatusSchema>;

export const addSignatureSchema = z.object({
  departmentId: z.number().int().positive(),
  signerName: z.string().min(2),
  signerTitle: z.string().min(2),
  signatureDate: isoDate,
  comment: z.string().max(2000).optional(),
});

export type AddSignatureInput = z.infer<typeof addSignatureSchema>;
