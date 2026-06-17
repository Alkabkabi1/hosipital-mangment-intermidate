import { z } from 'zod';

/**
 * Schema for creating a new permission
 */
export const createPermissionSchema = z.object({
  permission_name: z
    .string()
    .min(3, 'Permission name must be at least 3 characters')
    .max(100, 'Permission name must be at most 100 characters')
    .regex(/^[a-z_:]+$/, 'Permission name must be lowercase with underscores and colons only'),
  resource: z
    .string()
    .min(2, 'Resource must be at least 2 characters')
    .max(50, 'Resource must be at most 50 characters')
    .regex(/^[a-z_]+$/, 'Resource must be lowercase with underscores only'),
  action: z
    .string()
    .min(2, 'Action must be at least 2 characters')
    .max(50, 'Action must be at most 50 characters')
    .regex(/^[a-z_]+$/, 'Action must be lowercase with underscores only'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

/**
 * Schema for updating an existing permission
 */
export const updatePermissionSchema = z.object({
  permission_name: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z_:]+$/)
    .optional(),
  resource: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z_]+$/)
    .optional(),
  action: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z_]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;

