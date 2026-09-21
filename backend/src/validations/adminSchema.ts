import { z } from 'zod';

export const getAuditLogsQuerySchema = z.object({
  action: z.string().optional(),
  userId: z.string().uuid('Invalid User ID format').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;