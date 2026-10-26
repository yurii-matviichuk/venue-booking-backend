import { z } from 'zod';

export const isUuid = (value: string) => z.uuid().safeParse(value).success;

// Email is lowercased so the unique index on users.email treats "A@x.com" and "a@x.com" as the same account
const emailSchema = z.email('Invalid email address').transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters'),
  email: emailSchema,
  // bcrypt only uses the first 72 bytes of a password, so longer passwords are rejected
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= 72,
      'Password is too long (max 72 bytes; accented letters and emoji use more than one byte each)',
    ),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// The customer's name and email come from the logged-in user, not the request body
export const createBookingSchema = z.object({
  venueId: z.uuid('Venue ID must be a valid UUID'),
  slotId: z.uuid('Slot ID must be a valid UUID'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

export const venueQuerySchema = z.object({
  city: z.string().trim().min(1).max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
