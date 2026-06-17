import { z } from 'zod';

import { passwordSchema } from '../../shared/types/validators';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
  employeeId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
