import { z } from 'zod';

export const assignRoleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().trim().min(2),
  notes: z.string().max(500).nullish().or(z.literal('')).transform(val => val || undefined),
});

export const removeRoleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().trim().min(2),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>;
