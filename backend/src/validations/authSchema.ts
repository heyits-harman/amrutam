import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phoneNumber: z.string().optional(),
    role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).default('PATIENT'),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const verifyMfaSchema = {
  body: z.object({
    mfaToken: z.string().min(1, 'mfaToken is required'),
    code: z.string().length(6, 'MFA code must be exactly 6 digits'),
  }),
};