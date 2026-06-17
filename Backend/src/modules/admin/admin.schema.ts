import { z } from 'zod';

export const listAdminUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.string().trim().min(2).optional(),
  isActive: z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(['true', 'false']))
    .transform((value) => value === 'true')
    .optional(),
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

const roleArraySchema = z.array(z.string().trim().min(2)).max(10).optional();

export const createAdminUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  employeeId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  roles: roleArraySchema,
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;

export const updateAdminUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    employeeId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional(),
    roles: roleArraySchema,
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
