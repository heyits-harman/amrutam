import { z } from 'zod';

export const updateProfileSchema = {
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    dateOfBirth: z.string().datetime().optional(), // ISO string e.g., "1995-05-15T00:00:00.000Z"
    gender: z.string().optional(),
    address: z.string().optional(),
  }),
};

export const enableMfaSchema = {
  body: z.object({
    code: z.string().length(6, 'MFA code must be exactly 6 digits'),
  }),
};