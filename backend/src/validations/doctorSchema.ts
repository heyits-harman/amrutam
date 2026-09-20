import { z } from 'zod';

export const getDoctorsQuerySchema = z.object({
  specialization: z.string().optional(),
  minExperience: z.coerce.number().int().min(0).optional(),
  maxFee: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const getDoctorByIdParamsSchema = z.object({
  id: z.string().uuid('Invalid Doctor Profile ID format'),
});

export const createSlotSchema = z.object({
  startTime: z.string().datetime({ message: 'Invalid ISO date string for startTime' }),
  endTime: z.string().datetime({ message: 'Invalid ISO date string for endTime' }),
});

export const createBulkSlotsSchema = z.object({
  slots: z.array(createSlotSchema).min(1, 'At least one slot must be provided'),
});

export const deleteSlotParamsSchema = z.object({
  id: z.string().uuid('Invalid Slot ID format'),
});

export const getAvailableSlotsQuerySchema = z.object({
  specialization: z.string().optional(),
  doctorId: z.string().uuid('Invalid Doctor ID format').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type GetAvailableSlotsQuery = z.infer<typeof getAvailableSlotsQuerySchema>;

export type DeleteSlotParams = z.infer<typeof deleteSlotParamsSchema>;

export type CreateBulkSlotsInput = z.infer<typeof createBulkSlotsSchema>;

export type GetDoctorByIdParams = z.infer<typeof getDoctorByIdParamsSchema>;

export type GetDoctorsQuery = z.infer<typeof getDoctorsQuerySchema>;