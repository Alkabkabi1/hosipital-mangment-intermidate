import { z } from 'zod';

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
});

export const createOnboardingSchema = z.object({
  referenceNumber: z.string().min(3),
  requestDate: isoDate,
  startDate: isoDate,
  positionTitle: z.string().max(200).optional(),
  departmentId: z.number().int().positive().optional(),
  supervisorId: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateOnboardingInput = z.infer<typeof createOnboardingSchema>;

export const updateOnboardingStatusSchema = z.object({
  status: z.string().min(2),
  notes: z.string().max(2000).optional(),
});

export type UpdateOnboardingStatusInput = z.infer<typeof updateOnboardingStatusSchema>;

export const addOnboardingSignatureSchema = z.object({
  departmentId: z.number().int().positive(),
  signerName: z.string().min(2),
  signerTitle: z.string().min(2),
  signatureDate: isoDate,
  comment: z.string().max(2000).optional(),
});

export type AddOnboardingSignatureInput = z.infer<typeof addOnboardingSignatureSchema>;
