import { z } from 'zod';

export const bookConsultationSchema = z.object({
  slotId: z.string().uuid('Invalid Slot ID format'),
  notes: z.string().optional(),
});

export const getConsultationsQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const getConsultationByIdParamsSchema = z.object({
  id: z.string().uuid('Invalid Consultation ID format'),
});

export const consultationIdParamsSchema = z.object({
  id: z.string().uuid('Invalid Consultation ID format'),
});

export const medicineItemSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., Twice daily)'),
  duration: z.string().min(1, 'Duration is required (e.g., 5 days)'),
});

export const createPrescriptionSchema = z.object({
  medicines: z.array(medicineItemSchema).min(1, 'At least one medicine must be prescribed'),
  instructions: z.string().optional(),
});

export const getPrescriptionParamsSchema = z.object({
  id: z.string().uuid('Invalid Consultation ID format'),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type GetPrescriptionParams = z.infer<typeof getPrescriptionParamsSchema>;

export type ConsultationIdParams = z.infer<typeof consultationIdParamsSchema>;

export type GetConsultationsQuery = z.infer<typeof getConsultationsQuerySchema>;

export type GetConsultationByIdParams = z.infer<typeof getConsultationByIdParamsSchema>;

export type BookConsultationInput = z.infer<typeof bookConsultationSchema>;